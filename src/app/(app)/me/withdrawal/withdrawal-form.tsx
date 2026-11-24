"use client";

import { useActionState, useState } from "react";
import { Alert, BottomSheet, Button, DangerButton, Dock, Notice, TextField } from "@/components/common";
import { useFieldCheck } from "@/app/_components/use-field-check";
import { dateLabel } from "@/lib/profile";
import { EMPLOYED_NOTICE, type EmployedStore, type WithdrawalState } from "@/lib/withdrawal";
import { withdrawAction } from "./actions";

// 정책(2026-11-24 노영주): 재직(퇴직 예정 포함) 중이면 탈퇴 불가 · 대기 계약은 종료 · 근로 기록 · 신고 정보는 근무지 보관 · 유예기간 없음 ·
// 사유는 받지 않는다. 탈퇴하면 로그인 화면(?withdrawn=1)으로 간다. 재직이면(들어올 때 · 제출 때 409) 근무지 목록만 보이고 [탈퇴] 는 없다.
export function WithdrawalForm({
  canWithdraw,
  employedStores,
  pendingContractCount,
}: {
  canWithdraw: boolean;
  employedStores: EmployedStore[];
  pendingContractCount: number;
}) {
  const [state, formAction, pending] = useActionState<WithdrawalState, FormData>(withdrawAction, {});
  // React 19 폼 액션은 제출 뒤 비제어 칸을 비운다. 실패한 뒤에도 비밀번호를 다시 넣지 않게 상태로 든다.
  const [currentPassword, setCurrentPassword] = useState("");
  // 비밀번호를 넣고 [탈퇴] 를 누르면 바로 처리하지 않고 확인 시트를 띄운다. 시트의 [탈퇴](name=confirm)가 서버 액션을 제출한다.
  const [confirming, setConfirming] = useState(false);
  const fields = useFieldCheck((data) => ({ currentPassword: data.get("currentPassword") ? undefined : "현재 비밀번호를 입력해 주세요" }));

  const employed = state.employed ?? (canWithdraw ? null : employedStores);
  if (employed) return <EmployedGuide stores={employed} />;

  const { problem } = state;
  return (
    <form action={formAction} noValidate onSubmit={(event) => {
        if (!fields.check(event)) return;
        const submitter = (event.nativeEvent as SubmitEvent).submitter;
        if (submitter?.getAttribute("name") !== "confirm") {
          event.preventDefault();
          setConfirming(true);
          return;
        }
        // 서버 실패(400 등)는 시트 밖 원래 자리에 보인다.
        setConfirming(false);
      }}
      onChange={fields.clear} className="flex flex-1 flex-col">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]">
        <Alert tone="danger">
          <p>
            <strong>탈퇴하면 이 계정으로 다시 로그인할 수 없습니다.</strong> 근로계약서 · 급여명세서 · 출퇴근 기록은 근무지가 법정 보존 기간 동안
            보관합니다.
          </p>
        </Alert>
        <GuideList title="지워지는 것" items={["로그인 계정 · 이메일", "주소", "위치정보 동의", "알림 설정"]} />
        <GuideList title="근무지가 보관하는 것(법정 보존 기간)" items={["근로계약서", "급여명세서", "출퇴근 기록", "신고 정보"]} />
        <GuideList title="탈퇴하면 할 수 없는 것" items={["앱 로그인", "출퇴근 등록", "급여명세서 · 근로계약서 보기", "근로계약 서명"]} />
        {pendingContractCount > 0 && <Notice>대기 중인 근로계약 {pendingContractCount}건은 종료됩니다.</Notice>}
        <TextField
          label="현재 비밀번호"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="현재 비밀번호 입력"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={fields.messageOf("currentPassword", problem?.field === "currentPassword" ? problem.message : undefined)}
        />
        {problem?.field === "form" && <Alert tone="danger">{problem.message}</Alert>}
      </div>
      <Dock>
        <DangerButton type="submit" disabled={pending}>
          탈퇴
        </DangerButton>
        <Button variant="ghost" href="/me" transitionTypes={["nav-back"]}>
          취소
        </Button>
      </Dock>
      <BottomSheet
        open={confirming}
        onClose={() => setConfirming(false)}
        title="탈퇴하면 되돌릴 수 없습니다"
        description={
          pendingContractCount > 0
            ? `이 계정으로 다시 로그인할 수 없고, 탈퇴는 바로 처리됩니다.\n대기 중인 근로계약 ${pendingContractCount}건도 종료됩니다.`
            : "이 계정으로 다시 로그인할 수 없고, 탈퇴는 바로 처리됩니다."
        }
        closeLabel="취소"
        initialFocus="close"
      >
        {/* 키를 누르고 있어 반복되는 엔터는 무시한다 — 확인 없이 탈퇴되지 않게 */}
        <DangerButton type="submit" name="confirm" value="1" disabled={pending} onKeyDown={(event) => event.repeat && event.preventDefault()}>
          탈퇴
        </DangerButton>
      </BottomSheet>
    </form>
  );
}

function GuideList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="text-[13px]">
      <h2 className="font-bold">{title}</h2>
      <ul className="mt-[4px] list-disc pl-[18px] text-staff-text-sub">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/** 재직(퇴직 예정 포함) 근무지가 있어 탈퇴할 수 없을 때 — 퇴직 처리 요청 안내와 근무지 목록. */
function EmployedGuide({ stores }: { stores: EmployedStore[] }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[24px] leading-[1.5]">
        <Alert tone="warning">
          <p>
            <strong>{EMPLOYED_NOTICE}</strong> 재직 중인 근무지가 있으면 탈퇴할 수 없습니다. 퇴직 처리가 끝난 뒤에 다시 탈퇴해 주세요.
          </p>
        </Alert>
        {stores.length > 0 && (
          <ul className="flex flex-col gap-[8px]">
            {stores.map((store, index) => (
              <li key={index} className="flex items-center justify-between gap-[8px] rounded-[12px] border border-staff-border bg-white px-[16px] py-[12px] text-[14px]">
                <span className="min-w-0 font-semibold break-keep">{store.storeName}</span>
                <span className="shrink-0 text-[12px] text-staff-text-sub">
                  {store.retiredDate ? `${dateLabel(store.retiredDate)} 퇴직 예정` : "재직 중"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Dock>
        <Button href="/me" transitionTypes={["nav-back"]}>
          내 정보로 돌아가기
        </Button>
      </Dock>
    </div>
  );
}
