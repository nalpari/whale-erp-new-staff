"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Alert, BottomSheet, Button, DangerButton, Dock, TextField } from "@/components/common";
import type { ContractActionState } from "@/lib/contract-actions";
import { useContractAction } from "../_components/use-contract-action";

type Sheet = "reject" | "correction" | null;

/**
 * 상세 아래 버튼 줄(WHALEERP-147, 데모 contract 의 detail · reject). 본인 대조가 맞으면 「서명하기」(서명란 화면으로)와 「거절하기」,
 * 다르면(signable 이 아님) 날인 대신 「수정 요청하기」를 주 버튼으로 둔다. 수정 요청은 대조와 상관없이 서명 대기면 낼 수 있어(WHALEERP-145 ⑦)
 * 맞을 때도 보조 버튼으로 둔다. 거절은 사유 없이 확인 시트에서, 수정 요청은 사유(필수, 100자)를 받는 시트에서 보낸다(WHALEERP-635).
 * 보내는 동안 시트 버튼을 잠근다.
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
  rejectAction: () => Promise<ContractActionState>;
  correctionAction: (previous: ContractActionState, formData: FormData) => Promise<ContractActionState>;
}) {
  const [sheet, setSheet] = useState<Sheet>(null);
  const reject = useContractAction();
  const correction = useContractAction();
  const pending = reject.pending || correction.pending;
  // 시트를 닫고 지난 실패 문구를 지운다. 적던 수정 요청 사유는 남겨 다시 열면 이어 쓴다
  const closeSheet = () => {
    setSheet(null);
    reject.reset();
    correction.reset();
  };
  const close = () => {
    if (!pending) closeSheet();
  };
  const router = useRouter();
  const correctionForm = useRef<HTMLFormElement>(null);
  // 계약이 그사이 바뀌었다 — 시트를 닫고 화면을 다시 받는다. 지난 계약에 쓴 수정 요청 사유는 비운다
  const reload = () => {
    closeSheet();
    correctionForm.current?.reset();
    router.refresh();
  };
  const handleCorrection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 계약이 그사이 바뀌었으면(「계약서 다시 보기」만 남음) 칸에서 Enter 를 눌러도 다시 보내지 않는다
    if (correction.state.stale) return;
    const formData = new FormData(event.currentTarget);
    correction.run(() => correctionAction({}, formData));
  };
  // 사유 칸 오류는 칸 아래에, 그 밖의 실패는 시트 안 알림으로
  const reasonError = correction.state.field === "reason" ? correction.state.message : undefined;

  return (
    <>
      <Dock inset={30}>
        {signable ? (
          <Button href={signHref}>서명하기</Button>
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

      {/* 데모 reject 시트. 사유는 받지 않는다(WHALEERP-635). 되돌릴 수 없는 확정이라 오류색 버튼이다. */}
      <BottomSheet
        open={sheet === "reject"}
        onClose={close}
        title="근로계약서를 거절하시겠습니까?"
        description="거절한 뒤에는 되돌릴 수 없습니다. 다시 진행하려면 관리자가 계약서를 다시 보내야 합니다."
        closeLabel="취소"
      >
        <Failure state={reject.state} />
        {reject.state.stale ? (
          <Reload onClick={reload} />
        ) : (
          <DangerButton disabled={pending} onClick={() => reject.run(rejectAction)}>
            거절하기
          </DangerButton>
        )}
      </BottomSheet>

      <BottomSheet
        open={sheet === "correction"}
        onClose={close}
        title="계약서 수정을 요청하시겠습니까?"
        description="근무지 관리자에게 수정 요청이 전달됩니다. 관리자가 고쳐 다시 보내면 서명할 수 있습니다."
        closeLabel="취소"
      >
        {/* 시트는 하이드레이션 뒤 JS 로만 열려 이 폼은 늘 onSubmit 이 막고 서버 액션을 직접 부른다(연결 실패까지 문구로 받으려고).
            action 이 없어도 하이드레이션 전 GET 제출은 일어나지 않고, 실었더라도 수정 요청 사유뿐이라 민감한 값이 아니다.
            비었는지 · 길이는 서버 액션이 거르고 칸 아래에 문구를 보인다 — 브라우저 기본 말풍선(required)은 쓰지 않는다.
            maxLength 도 두지 않는다 — 브라우저는 공백을 지우고 NFC 로 맞추기 전 길이로 잘라, 서버라면 받을 사유를 말없이 자른다. */}
        <form ref={correctionForm} onSubmit={handleCorrection} noValidate className="flex flex-col gap-[13px]">
          <TextField
            label="수정 요청 사유"
            name="reason"
            placeholder="예: 시급이 안내받은 금액과 다릅니다"
            help="입력한 사유는 근무지 관리자에게 전달됩니다."
            error={reasonError}
            autoComplete="off"
          />
          {!reasonError && <Failure state={correction.state} />}
          {correction.state.stale ? (
            <Reload onClick={reload} />
          ) : (
            <Button type="submit" disabled={pending}>
              수정 요청하기
            </Button>
          )}
        </form>
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
