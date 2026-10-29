"use client";

import { useRef, useState, type ReactNode } from "react";
import { Alert, Button, Dock } from "@/components/common";
import { SIGNATURE_TARGET_BYTES, type ContractActionState } from "@/lib/contract-actions";
import { ContractFrame, Sunken, Values } from "../../_components/parts";
import { SignaturePad, type SignaturePadHandle } from "../../_components/signature-pad";
import { useContractAction } from "../../_components/use-contract-action";

/**
 * 서명란 → 날인 확정(데모 contract 의 sign · sign-drawn · signing). 그리기와 확정을 두 번에 나눈다(CON-2) — 그리기 전에는 「서명 완료」이
 * 꺼져 있고, 그린 뒤에는 「다시 그리기」로 지운다. 보내는 동안 버튼을 모두 잠근다. 계약이 그사이 바뀌었으면(stale) 계약서로 돌아가게 한다.
 * 서명은 PNG 로 만들어 FormData 의 `signature` 로 서버 액션에 넘긴다(action 은 서버 화면이 계약 id · 발송 일시를 bind 한 것).
 */
export function SignForm({
  action,
  header,
  title,
  signerName,
  detailHref,
}: {
  action: (previous: ContractActionState, formData: FormData) => Promise<ContractActionState>;
  header: ReactNode;
  title: string;
  signerName: string;
  detailHref: string;
}) {
  const pad = useRef<SignaturePadHandle>(null);
  const [drawn, setDrawn] = useState(false);
  const { pending, state, run } = useContractAction();

  const handleConfirm = () =>
    run(async () => {
      let png: Blob;
      try {
        png = await pad.current!.toPng();
      } catch (error) {
        console.error("[contract-sign] 서명 이미지 만들기 실패", error);
        return { message: "서명 이미지를 만들지 못했습니다. 다시 그려 주세요" };
      }
      // 줄여도 크면 보내지 않는다 — 서버 액션 본문 한도(1MB)에 걸리면 연결 실패처럼 보인다
      if (png.size > SIGNATURE_TARGET_BYTES) return { message: "서명이 너무 큽니다. 다시 그려 주세요" };
      const formData = new FormData();
      formData.set("signature", png, "signature.png");
      return action({}, formData);
    });

  return (
    <>
      <ContractFrame header={header}>
        <div className="flex flex-col gap-[6px]" aria-live="polite">
          <h2 className="text-[22px] font-bold">{pending ? "서명을 처리하고 있습니다" : "서명란에 서명해 주세요"}</h2>
          <p className="text-[14px] text-staff-text-sub">
            {pending ? "처리가 끝날 때까지 화면을 닫지 마세요." : "서명을 완료하면 되돌릴 수 없습니다."}
          </p>
        </div>
        <SignaturePad ref={pad} drawn={drawn} disabled={pending || state.stale} onDrawnChange={setDrawn} />
        <Sunken>
          <Values
            rows={[
              ["계약서", title],
              ["서명하는 사람", signerName],
            ]}
          />
        </Sunken>
        {state.message && (
          <Alert tone="danger">
            <p>{state.message}</p>
          </Alert>
        )}
      </ContractFrame>
      <Dock inset={30}>
        {state.stale ? (
          <Button href={detailHref} replace>
            계약서 다시 보기
          </Button>
        ) : (
          <>
            <Button disabled={!drawn || pending} onClick={handleConfirm}>
              서명 완료
            </Button>
            {drawn ? (
              <Button variant="ghost" disabled={pending} onClick={() => pad.current?.clear()}>
                다시 그리기
              </Button>
            ) : (
              <Button variant="ghost" href={detailHref} transitionTypes={["nav-back"]}>
                계약서로 돌아가기
              </Button>
            )}
            {/* 연결이 끊겨 결과를 모를 때 — 다시 누르거나 계약서를 다시 열어 확인한다 */}
            {state.message && drawn && (
              <Button variant="ghost" href={detailHref}>
                계약서 다시 보기
              </Button>
            )}
          </>
        )}
      </Dock>
    </>
  );
}
