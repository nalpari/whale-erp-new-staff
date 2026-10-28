"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert, BottomSheet, Button, DangerButton, Dock } from "@/components/common";
import { REJECT_REASON_MAX, type ContractActionState } from "@/lib/contract-actions";
import { useContractAction } from "../_components/use-contract-action";

type Sheet = "reject" | "correction" | null;

/**
 * 상세 아래 버튼 줄(WHALEERP-147, 데모 contract 의 detail · reject). 본인 대조가 맞으면 「날인하기」(서명란 화면으로)와 「거절하기」,
 * 다르면(signable 이 아님) 날인 대신 「수정 요청하기」를 주 버튼으로 둔다. 수정 요청은 대조와 상관없이 서명 대기면 낼 수 있어(WHALEERP-145 ⑦)
 * 맞을 때도 보조 버튼으로 둔다. 거절(사유 선택, 500자)과 수정 요청은 확인 시트에서 보낸다. 보내는 동안 시트 버튼을 잠근다.
 * 실패가 stale(그사이 계약이 바뀜)이면 「계약서 다시 보기」로 화면을 다시 받는다.
 */
export function ContractDecision({
  signHref,
  signable,
  rejectAction,
  correctionAction,
}: {
  signHref: string;
  signable: boolean;
  rejectAction: (previous: ContractActionState, formData: FormData) => Promise<ContractActionState>;
  correctionAction: () => Promise<ContractActionState>;
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const reject = useContractAction();
  const correction = useContractAction();
  const pending = reject.pending || correction.pending;
  // 시트를 닫으면 지난 실패 문구를 지운다 — 다시 열 때 새로 시작한다
  const close = () => {
    if (pending) return;
    setSheet(null);
    reject.reset();
    correction.reset();
  };
  const router = useRouter();
  // 계약이 그사이 바뀌었다 — 시트를 닫고 화면을 다시 받는다
  const reload = () => {
    setSheet(null);
    reject.reset();
    correction.reset();
    router.refresh();
  };
  const handleReject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    reject.run(() => rejectAction({}, formData));
  };

  return (
    <>
      <Dock inset={30}>
        {signable ? (
          <Button href={signHref}>날인하기</Button>
        ) : (
          <Button onClick={() => setSheet("correction")}>수정 요청하기</Button>
        )}
        <div className="flex gap-[8px]">
          {signable && (
            <Button variant="ghost" onClick={() => setSheet("correction")}>
              수정 요청
            </Button>
          )}
          <Button variant="ghost" onClick={() => setSheet("reject")}>
            거절하기
          </Button>
        </div>
      </Dock>

      {/* 데모 reject 시트. 사유는 선택이다(CON-3). 되돌릴 수 없는 확정이라 오류색 버튼이다. */}
      <BottomSheet
        open={sheet === "reject"}
        onClose={close}
        title="근로계약서를 거절하시겠습니까?"
        description="거절한 뒤에는 되돌릴 수 없습니다. 다시 진행하려면 관리자가 계약서를 다시 보내야 합니다."
        closeLabel="취소"
      >
        {/* 시트는 하이드레이션 뒤 JS 로만 열려 이 폼은 늘 onSubmit 이 막고 서버 액션을 직접 부른다(연결 실패까지 문구로 받으려고).
            action 이 없어도 하이드레이션 전 GET 제출은 일어나지 않고, 실었더라도 거절 사유뿐이라 민감한 값이 아니다. */}
        <form onSubmit={handleReject} className="flex flex-col gap-[13px]">
          <label className="flex flex-col gap-[8px]">
            <span className="text-[13px] font-semibold text-staff-text-sub">
              거절 사유 <span className="font-medium text-staff-placeholder">(선택)</span>
            </span>
            <textarea
              name="reason"
              rows={3}
              maxLength={REJECT_REASON_MAX}
              placeholder="예: 근무 요일이 안내받은 내용과 다릅니다"
              aria-invalid={reject.state.field === "reason" || undefined}
              aria-describedby="reject-reason-help"
              className="min-h-[76px] w-full resize-y rounded-[12px] border border-staff-border bg-white px-[14px] py-[12px] text-[16px] text-staff-text outline-none! transition-[border-color] duration-150 ease-out placeholder:text-staff-placeholder focus:border-staff-primary aria-invalid:border-staff-error"
            />
            <span id="reject-reason-help" className="text-[12px] text-staff-text-muted">
              입력한 사유는 근무지 관리자에게 전달됩니다.
            </span>
          </label>
          <Failure state={reject.state} />
          {reject.state.stale ? <Reload onClick={reload} /> : <DangerButton type="submit" disabled={pending}>거절하기</DangerButton>}
        </form>
      </BottomSheet>

      <BottomSheet
        open={sheet === "correction"}
        onClose={close}
        title="계약서 수정을 요청하시겠습니까?"
        description="근무지 관리자에게 수정 요청이 전달됩니다. 관리자가 고쳐 다시 보내면 날인할 수 있습니다."
        closeLabel="취소"
      >
        <Failure state={correction.state} />
        {correction.state.stale ? (
          <Reload onClick={reload} />
        ) : (
          <Button disabled={pending} onClick={() => correction.run(correctionAction)}>
            수정 요청하기
          </Button>
        )}
      </BottomSheet>
    </>
  );
}

function Failure({ state }: { state: ContractActionState }) {
  if (!state.message) return null;
  return (
    <Alert tone="danger">
      <p>{state.message}</p>
    </Alert>
  );
}

function Reload({ onClick }: { onClick: () => void }) {
  return <Button onClick={onClick}>계약서 다시 보기</Button>;
}
