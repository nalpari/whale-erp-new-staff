"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { Alert, BottomSheet, Button, DangerButton, Dock, PageHeader } from "@/components/common";
import { INITIAL_ANSWER_STATE, employmentLine, type AffiliationRequest, type AnswerState } from "@/lib/affiliation-requests";
import { kstDateTimeLabel } from "@/lib/profile";
import { Accent, BODY, BigTitle, InfoPill, ShareLine } from "./screen-parts";
import { ConsentCard } from "./consent-card";

// 근무지 추가 확인(WHALEERP-144). 기준: 데모 docs/demo/join 의 addsite · addsite-done · reject(시트 — 사유 없이 확인만, WHALEERP-635).
// 수락하기 전에는 초대한 사업자 · 점포와 고용 형태만 보인다 — 기존 계정 정보와 직원 레코드 값은 api 가 주지 않는다.
// 데모와 다른 점: 점포 주소는 api 가 주지 않아 사업자 이름을 대신 둔다. 거절 확정은 근로계약서 거부와 같이 오류색 버튼이다.
// 정돈 시안 C안(2026-11-20 사용자 지정): 큰 제목 → 둥근 정보 행(근무지 · 고용 형태 · 답변 기한) → 공유되는 · 공유되지 않는 정보 →
// 회색 덧붙임. 전엔 카드 · 아이콘 안내 상자 둘이었다. 하단 [거절 | 수락]은 그대로다.
// 답한 뒤의 화면(근무지 추가 완료 · 거절 · 더 답할 수 없음)은 액션이 결과 경로(done/page.tsx)로 보낸다.

const subscribeNothing = () => () => {};

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
      <PageHeader title="근무지 추가 확인" backHref={backHref} />
      <form action={acceptAction} className="flex flex-1 flex-col">
        <div className={BODY}>
          <BigTitle eyebrow={returning ? "복귀 요청" : "새 근무지 초대"}>
            <Accent>{request.storeName}</Accent>에서
            <br />
            {returning ? "다시 함께 일하자고 요청했습니다" : "근무지 초대를 보냈습니다"}
          </BigTitle>
          <div className="flex flex-col gap-[10px]">
            <InfoPill icon="store" label="근무지" sub={`사업자 · ${request.bpName}`}>
              {request.storeName}
            </InfoPill>
            <InfoPill icon="contract" label="고용 형태">
              {employmentLine(request)}
            </InfoPill>
            <InfoPill icon="clock" label="답변 기한">
              {kstDateTimeLabel(request.expiresAt)}까지
            </InfoPill>
          </div>
          <div className="flex flex-col gap-[10px] px-[4px] pt-[4px]">
            <ShareLine shared title="공유되는 정보">
              이름 · 휴대전화번호 · 생년월일 · 성별 · 외국인 여부
            </ShareLine>
            <ShareLine shared={false} title="공유되지 않는 정보">
              기존 근무지의 계약 · 급여 · 출퇴근 기록
            </ShareLine>
          </div>
          <p className="px-[4px] text-[13px] break-keep text-staff-text-muted">
            시급 · 근무 시간 등 근무 조건은 수락한 뒤 받는 근로계약서에서 확인할 수 있습니다.
          </p>
          {/* 가맹 점포이고 아직 동의하지 않았을 때만(ATT-30). 계정 등록의 동의 칸과 같다. */}
          {request.asksHqSharingConsent && <ConsentCard checked={hqSharing} onChange={setHqSharing} />}
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
        title="근무지 추가를 거절하시겠습니까?"
        description="거절해도 기존 근무지와 계정은 유지됩니다. 이 요청과 함께 온 근로계약서는 거절로 닫힙니다."
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
