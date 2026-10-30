"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { RedirectType, notFound, redirect } from "next/navigation";
import { ApiError, failureOf, logFailure, type RequestBody } from "@/lib/api";
import { clientIpFrom } from "@/lib/client-ip";
import { getEnumOrEmpty } from "@/lib/enums";
import {
  contractActionFailure,
  isSentAt,
  readCorrectionReason,
  signatureProblem,
  type ContractAction,
  type ContractActionState,
} from "@/lib/contract-actions";
import { parseId } from "@/lib/contract-rules";
import { authedRequest } from "@/lib/session";

// 근로계약 날인 · 거절 · 수정 요청(WHALEERP-147, api `POST /me/contracts/:contractId/sign | reject | correction-request` WHALEERP-145).
// 계약 id(와 날인의 발송 일시)는 서버 화면이 bind 로 붙이지만, 서버 액션은 누구나 직접 부를 수 있어 다시 거른다(내 계약인지는 api 가 본다).
// 성공하면 날인 · 거절은 완료 화면(`done`)으로, 수정 요청은 상세로 replace 하고 주소의 `?done=` 으로 알림을 띄운다. 소속 근무지에서
// 그 근무지 목록으로 왔으면(storeId, 146 의 `?store=`) 돌아갈 주소에도 이어 준다.

/** `?store=<id>&` 또는 빈 글자 — bind 로 온 값이라 다시 거른다. */
const storePart = (rawStoreId: number | null) => {
  const storeId = rawStoreId === null ? null : parseId(String(rawStoreId));
  return storeId === null ? "" : `store=${storeId}&`;
};
// 실패를 화면 상태로 바꾸는 것은 lib/contract-actions.ts. 서명 이미지는 api 로만 보내고 상태 · 로그에 싣지 않는다.

/** 날인 — 화면이 그린 서명 PNG(`signature`)와 상세가 그릴 때 받은 발송 일시(bind)를 multipart 로 넘긴다. */
export async function signContractAction(
  rawContractId: number,
  rawStoreId: number | null,
  sentAt: string,
  _previous: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = parseId(String(rawContractId));
  if (contractId === null) notFound();
  if (!isSentAt(sentAt)) return { stale: true, message: "계약서를 다시 열어 서명해 주세요" };
  const signature = formData.get("signature");
  if (!(signature instanceof Blob)) return { message: "서명을 받지 못했습니다. 다시 그려 주세요" };
  // 서버 액션 요청 본문은 Next 기본 1MB 까지라 여기서 통째로 읽어도 그보다 크지 않다. 검사한 Blob 을 그대로 넘긴다.
  const invalid = signatureProblem(new Uint8Array(await signature.arrayBuffer()));
  if (invalid) return { message: invalid };
  const form = new FormData();
  form.set("signature", signature, "signature.png");
  form.set("sentAt", sentAt);
  // 저장소에 서명을 올린 뒤 커밋까지 기다린다 — 기본 10초보다 길게
  return run("sign", `/me/contracts/${contractId}/sign`, { form, timeoutMs: 30_000 }, `/contracts/${contractId}/done?${storePart(rawStoreId)}done=signed`);
}

/**
 * 거절 — 받는 내용은 없다(WHALEERP-635). 확인 시트에서 한 번 더 묻는다. 본문은 빈 JSON 으로 둔다 — 사유 DTO 를 아직 받는 옛 api 가
 * 본문 없는 요청을 400 으로 막지 않게(앱이 api 보다 먼저 나간다).
 */
export async function rejectContractAction(rawContractId: number, rawStoreId: number | null): Promise<ContractActionState> {
  const contractId = parseId(String(rawContractId));
  if (contractId === null) notFound();
  return run("reject", `/me/contracts/${contractId}/reject`, { json: {} }, `/contracts/${contractId}/done?${storePart(rawStoreId)}done=rejected`);
}

/**
 * 수정 요청 — 사유는 필수(NFC · 앞뒤 공백 뺀 100자, WHALEERP-635). 본인 대조와 상관없이 서명 대기 · 기한 안이면 받는다(WHALEERP-145 ⑦).
 * 사유를 읽지 않는 옛 api 에 보내도 본문을 무시해 400 이 나지 않는다(api 배포 전에는 사유가 저장되지 않는다).
 */
export async function requestContractCorrectionAction(
  rawContractId: number,
  rawStoreId: number | null,
  _previous: ContractActionState,
  formData: FormData,
): Promise<ContractActionState> {
  const contractId = parseId(String(rawContractId));
  if (contractId === null) notFound();
  const read = readCorrectionReason(formData.get("reason"));
  if ("error" in read) return { field: "reason", message: read.error };
  return run("correction", `/me/contracts/${contractId}/correction-request`, { json: read }, `/contracts/${contractId}?${storePart(rawStoreId)}done=correction`);
}

/**
 * api 를 부르고 성공(또는 이미 그 결과인 409)이면 to 로 replace, 실패면 화면 상태. 직원의 실제 IP 를 넘겨 api 의 IP 한도를
 * 사람마다 센다. 응답 본문(결과 상태 · 날인 시각)은 쓰지 않는다 — 완료 화면이 계약을 다시 읽는다.
 */
async function run(
  action: ContractAction,
  path: string,
  options: RequestBody & { timeoutMs?: number },
  to: string,
): Promise<ContractActionState> {
  try {
    await authedRequest(path, { ...options, method: "POST", clientIp: clientIpFrom(await headers()) });
  } catch (error) {
    const failure = failureOf(error);
    // 401 의 만료 안내 redirect 와 코드 결함은 그대로 던진다.
    if (!failure) throw error;
    // 본인 대조가 다르면 다른 항목을 한글로 적는다 — 그때만 enum 을 받는다. 못 받으면(404 · 이름 없음 포함 — 상세와 같다) 남기고
    // 빈 목록으로, 문구에서 항목만 빼고 「수정을 요청해 주세요」 안내는 그대로 보인다.
    const identityLabels =
      failure !== "network" && failure.code === "IDENTITY_MISMATCH"
        ? await getEnumOrEmpty("IdentityField").catch((enumError: unknown) => {
            console.error("[contract] IdentityField enum 을 받지 못했습니다", enumError);
            return [];
          })
        : [];
    const outcome = contractActionFailure(action, failure, error instanceof ApiError ? error.body : null, identityLabels);
    if ("state" in outcome) {
      if (outcome.log) logFailure(`contract-${action}`, failure);
      return outcome.state;
    }
  }
  // 처리한 계약이 남은 화면(홈 서명 요청 팝업 · 목록 · 상세)을 한꺼번에 무효화한다 — 뒤로 가기 라우터 캐시에 서명 전 화면이 남아
  // 지난 팝업 · 버튼이 보이지 않게(소속 추가 답하기와 같다). replace — 뒤로 가기로 날인 · 거절 화면에 다시 들르지 않게 한다.
  revalidatePath("/", "layout");
  redirect(to, RedirectType.replace);
}
