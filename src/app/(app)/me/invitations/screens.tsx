"use client";

import { Button } from "@/components/common";
import { AuthScreen } from "@/app/(auth)/_components/auth-screen";
import { useFocusedTitle } from "@/app/(auth)/_components/use-focused-title";
import { MEMBERSHIPS_PATH } from "@/lib/join";
import { HOME_PATH } from "@/lib/login-return";

// 받은 초대(WHALEERP-604)의 갈래 화면. 안내 문구는 가입 첫 단계와 같고(Plane 604), 버튼만 로그인한 직원에 맞게 소속 근무지 · 홈이다.

export const BackToMemberships = () => (
  <Button variant="ghost" href={MEMBERSHIPS_PATH} transitionTypes={["nav-back"]}>
    소속 근무지로 돌아가기
  </Button>
);

/**
 * 받은 초대 목록에 없다 — 이미 더했거나(다른 탭 · 기기) 끝났다. 목록만으로는 둘을 가를 수 없어 「쓸 수 없는 초대」라고 단정하지
 * 않는다(PR #40 리뷰 — 이미 더한 직원이 다시 초대를 요청하지 않게).
 */
export function InvitationNotListed() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="이 초대를 찾을 수 없습니다"
      description="이미 더한 근무지이거나 만료 · 새 초대로 바뀐 초대입니다. 소속 근무지에서 다시 확인해 주세요."
      dock={<BackToMemberships />}
    />
  );
}

/** 쓸 수 없는 초대(기한 · 다시 보냄 · 퇴직 · 가입 불가) — 수락했더니 api 가 404 로 답했다. */
export function InvitationEnded() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="쓸 수 없는 초대입니다"
      description="초대가 만료되었거나 새 초대로 바뀌었습니다. 근무지에 다시 초대해 달라고 요청해 주세요."
      dock={<BackToMemberships />}
    />
  );
}

/** 이 초대로 이미 근무지를 더했다(먼저 더했거나 같은 초대로 동시에 눌렀다). */
export function InvitationJoined() {
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
