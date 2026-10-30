"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Alert, BottomSheet, Button, Card, CheckBox, DangerButton, Dock, MaskIcon, Notice, PageHeader } from "@/components/common";
import { INITIAL_ANSWER_STATE, employmentLine, type AffiliationRequest, type AnswerState } from "@/lib/affiliation-requests";
import { kstDateTimeLabel } from "@/lib/profile";
import { BODY, Lead } from "./screen-parts";
import { HQ_SHARING_TERMS_VERSION, hqSharingSummary } from "@/lib/hq-sharing-terms";

// 소속 추가 확인(WHALEERP-144). 기준: 데모 docs/demo/join 의 addsite · addsite-done · reject(시트 — 사유 없이 확인만, WHALEERP-635).
// 수락하기 전에는 초대한 사업자 · 점포와 고용 형태만 보인다 — 기존 계정 정보와 직원 레코드 값은 api 가 주지 않는다.
// 데모와 다른 점: 점포 주소는 api 가 주지 않아 사업자 이름을 대신 둔다. 거절 확정은 근로계약서 거부와 같이 오류색 버튼이다.
// 답한 뒤의 화면(소속 추가 완료 · 거절 · 더 답할 수 없음)은 액션이 결과 경로(done/page.tsx)로 보낸다.

const subscribeNothing = () => () => {};

/** 카드 안 한 줄(데모 iconRow): 20px 칸의 아이콘 · 제목 14px semibold · 설명 12px. */
function IconRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-[12px] py-[8px] first:pt-0 last:pb-0">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold break-keep">{title}</p>
        <p className="text-[12px] text-staff-text-sub">{sub}</p>
      </div>
    </div>
  );
}

/** 요청 id 를 묶은 서버 액션 — 하이드레이션 전 제출도 POST 로 닿게 서버 화면이 bind 해 넘긴다(신고 정보 고치기와 같다). */
type AnswerAction = (previous: AnswerState, formData: FormData) => Promise<AnswerState>;

export function AnswerScreen({
  request,
  acceptAction: accept,
  rejectAction: reject,
  backHref,
}: {
  request: AffiliationRequest;
  acceptAction: AnswerAction;
  rejectAction: AnswerAction;
  backHref: string;
}) {
  const [accepted, acceptAction, accepting] = useActionState(accept, INITIAL_ANSWER_STATE);
  const [rejected, rejectAction, rejecting] = useActionState(reject, INITIAL_ANSWER_STATE);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [hqSharing, setHqSharing] = useState(false);
  // 동의 칸은 상태로 들고 켰을 때만 숨은 칸으로 싣는다(CheckBox). 하이드레이션 전에 체크하고 수락하면 동의가 빠지므로, 동의를 묻는
  // 요청은 하이드레이션 전에는 수락을 막는다(서버 그림은 막힌 버튼이다).
  const hydrated = useSyncExternalStore(subscribeNothing, () => true, () => false);

  const pending = accepting || rejecting;
  // 이 점포에 이미 재직 중(409) — 수락은 막고 거절로 닫게 한다.
  const acceptBlocked = accepted.acceptBlocked === true;
  const returning = request.invitationType === "RETURN_CONFIRM";
  return (
    <>
      <PageHeader title="소속 추가 확인" backHref={backHref} />
      <form action={acceptAction} className="flex flex-1 flex-col">
        <div className={BODY}>
          <Lead title={returning ? "다시 함께 일하자는 요청" : "새 소속 추가 요청"}>
            <strong>{request.storeName}</strong>
            {returning ? "에서 다시 함께 일해 달라고 요청했습니다." : "에서 함께 일해 달라고 요청했습니다."}
          </Lead>
          <Card>
            <div className="flex flex-col divide-y divide-staff-border-light">
              <IconRow icon="/icons/store-small.svg" title={request.storeName} sub={`사업자 · ${request.bpName}`} />
              <IconRow icon="/icons/contract.svg" title="고용 형태" sub={employmentLine(request)} />
            </div>
          </Card>
          <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
            수락하면 <strong>이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부만</strong> 새 소속에 복사됩니다. 다른 소속의 계약 · 급여 ·
            출퇴근 기록은 넘어가지 않습니다.
          </Notice>
          <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
            <strong>여기서 수락하는 것은 소속 연결까지입니다.</strong> 시급 · 근무 시간대를 포함한 근무 조건은 수락한 뒤 도착하는
            근로계약서에서 확인하고 날인합니다.
          </Notice>
          {/* 가맹 점포이고 아직 동의하지 않았을 때만(ATT-30). 계정 등록의 동의 칸과 같다. */}
          {request.asksHqSharingConsent && (
            <div className="flex flex-col gap-[4px]">
              <CheckBox name="hqSharingConsented" checked={hqSharing} onChange={setHqSharing}>
                본사 제공 동의 (선택)
              </CheckBox>
              {/* 이 화면이 보인 문구의 버전(ATT-30 v252) — 계정 등록의 동의 칸과 같다 */}
              <input type="hidden" name="hqSharingConsentVersion" value={HQ_SHARING_TERMS_VERSION} />
              <p className="text-[12px] text-staff-text-muted">{hqSharingSummary("affiliation")}</p>
            </div>
          )}
          <p className="text-[12px] text-staff-text-muted">
            이 요청은 {kstDateTimeLabel(request.expiresAt)}까지 답할 수 있습니다. 거절해도 기존 소속과 계정에는 영향이 없습니다.
          </p>
          {accepted.error && <Alert tone={acceptBlocked ? "warning" : "danger"}>{accepted.error}</Alert>}
        </div>
        <Dock>
          <div className="grid grid-cols-2 gap-[8px]">
            <Button variant="ghost" disabled={pending} onClick={() => setRejectOpen(true)}>
              거절
            </Button>
            <Button type="submit" disabled={pending || acceptBlocked || (request.asksHqSharingConsent && !hydrated)}>
              수락
            </Button>
          </div>
        </Dock>
      </form>
      {/* 시트 안에 거절 폼이 있어 수락 폼 밖에 둔다(폼 안의 폼은 안 된다). 사유는 받지 않고 확인만 한다 — 근로계약서 거절과 같다. */}
      <BottomSheet
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="소속 추가를 거절하시겠어요?"
        description="거절해도 기존 소속과 계정에는 영향이 없습니다. 이 요청과 함께 온 근로계약서는 거부로 닫힙니다."
        closeLabel="취소"
      >
        <form action={rejectAction} className="flex flex-col gap-[13px]">
          {rejected.error && <Alert tone="danger">{rejected.error}</Alert>}
          <DangerButton type="submit" disabled={pending}>
            거절하기
          </DangerButton>
        </form>
      </BottomSheet>
    </>
  );
}
