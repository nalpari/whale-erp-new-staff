"use client";

import { Button, Notice } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { useFocusedTitle } from "@/app/(auth)/_components/use-focused-title";
import { CheckFailed, CodeLocked, EndedInvitation } from "@/app/(auth)/join/screens";
import type { AttemptLock } from "@/lib/attempt-lock";
import { ADD_WORKPLACE_PATH } from "@/lib/join";
import { HOME_PATH } from "@/lib/login-return";

// 근무지 추가(WHALEERP-604)의 갈래 화면. 끝난 초대 · 잠김 · 확인 실패는 가입 첫 단계의 화면을 그대로 쓰고(안내가 같다, Plane 604)
// 「로그인으로 돌아가기」 자리만 소속 근무지로 바꾼다. 이미 가입을 마친 초대 · 남의 번호로 온 링크는 로그인한 직원에 맞게 따로 그린다.

const MEMBERSHIPS_PATH = "/me/memberships";

export const BackToMemberships = () => (
  <Button variant="ghost" href={MEMBERSHIPS_PATH} transitionTypes={["nav-back"]}>
    소속 근무지로 돌아가기
  </Button>
);

/** 이 초대의 근무지는 이미 이 계정에 이어졌다(먼저 더했거나 같은 초대로 동시에 눌렀다). */
export function AlreadyJoined() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="이미 가입을 마친 초대입니다"
      description="이 초대의 근무지는 이미 계정에 이어졌습니다. 근로계약을 체결하면 소속 근무지에 보입니다."
      dock={
        <>
          <Button href={HOME_PATH} transitionTypes={["nav-forward"]}>
            홈으로
          </Button>
          <BackToMemberships />
        </>
      }
    />
  );
}

/**
 * 로그인한 채 연 초대 링크가 이 계정의 휴대전화번호로 온 초대가 아니다(다른 사람의 링크 · 계약서 번호가 다름). api 는 모양만 맞고
 * 망가진 토큰도 같은 404 로 답해 가르지 못한다 — 안내에 둘 다 적는다.
 */
export function NotForThisAccount() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="이 계정으로 받을 수 없는 초대입니다"
      description="초대는 근로계약서에 적힌 휴대전화번호로 갑니다. 로그인한 계정의 번호로 온 초대만 더할 수 있습니다."
      dock={
        <>
          <Button href={ADD_WORKPLACE_PATH} transitionTypes={["nav-forward"]}>
            초대 코드 넣기
          </Button>
          <BackToMemberships />
        </>
      }
    >
      <Notice>
        링크가 잘렸을 수도 있습니다. 같이 받은 초대 코드로 다시 해 보고, 그래도 이 안내가 보이면 근무지 관리자에게 근로계약서의
        휴대전화번호를 확인해 달라고 요청해 주세요.
      </Notice>
    </AuthScreen>
  );
}

/** 초대 쿠키(30분)가 지났다 — 확인한 초대를 다시 찾을 수 없어 코드를 다시 넣는다. */
export function AddExpired() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="처음부터 다시 해 주세요"
      description="확인한 초대를 찾을 수 없습니다. 초대를 확인한 지 30분이 지났을 수 있습니다. 초대 코드를 다시 넣어 주세요."
      dock={
        <>
          <Button href={ADD_WORKPLACE_PATH} transitionTypes={["nav-back"]}>
            초대 코드 넣기
          </Button>
          <BackToMemberships />
        </>
      }
    />
  );
}

export type MyInvitationProblemKind =
  | { kind: "ended" | "joined" | "not-mine" | "expired" }
  | { kind: "locked"; lock: AttemptLock }
  | { kind: "failed"; message: string };

/** 확인 화면을 그리거나 「근무지 추가」를 눌렀더니 이어 갈 수 없을 때. */
export function MyInvitationProblem({ problem }: { problem: MyInvitationProblemKind }) {
  switch (problem.kind) {
    case "ended":
      return <EndedInvitation retryHref={ADD_WORKPLACE_PATH} leave={<BackToMemberships />} />;
    case "joined":
      return <AlreadyJoined />;
    case "not-mine":
      return <NotForThisAccount />;
    case "expired":
      return <AddExpired />;
    case "locked":
      return <CodeLocked lock={problem.lock} retryHref={ADD_WORKPLACE_PATH} leave={<BackToMemberships />} />;
    case "failed":
      return <CheckFailed message={problem.message} leave={<BackToMemberships />} />;
  }
}
