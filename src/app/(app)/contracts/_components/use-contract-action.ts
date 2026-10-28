"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { OUTCOME_UNKNOWN, type ContractActionState } from "@/lib/contract-actions";

/**
 * 날인 · 거절 · 수정 요청 버튼(WHALEERP-147). 보내는 동안 pending 으로 버튼을 잠그고, 액션이 돌려준 상태(실패 문구)를 들고 있다.
 * 성공하면 액션이 redirect 한다. 액션 호출 자체가 던지면 Next 내부 오류(redirect 등)는 다시 던지고, 서버에서 난 오류(digest)는 오류
 * 번호와 함께, 휴대전화가 서버에 닿지 못했으면 「처리됐는지 모름」 문구다 — 다시 누르면 api 가 지금 상태로 알려 준다.
 */
export function useContractAction() {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ContractActionState>({});
  const run = (call: () => Promise<ContractActionState>) =>
    startTransition(async () => {
      setState({});
      try {
        // redirect 로 끝나면 값이 없을 수 있다
        setState((await call()) ?? {});
      } catch (thrown) {
        unstable_rethrow(thrown);
        console.error("[contract] 액션 호출 실패", thrown);
        const digest = (thrown as { digest?: unknown } | null)?.digest;
        setState({
          message:
            typeof digest === "string"
              ? `처리하지 못했습니다. 계속되면 근무지 점포에 알려 주세요 (오류 번호 ${digest})`
              : `서버에 연결하지 못했습니다. ${OUTCOME_UNKNOWN}`,
        });
      }
    });
  return { pending, state, run, reset: () => setState({}) };
}
