"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, Card, Notice } from "@/components/common";
import { useNow } from "@/app/_components/countdown";
import { type AttemptLock, lockCountdown } from "@/lib/attempt-lock";
import { AuthScreen } from "../_components/auth-screen";
import { useFocusedTitle } from "../_components/use-focused-title";
import type { LoadedInvitation } from "./load-invitation";

// 진입 · 가입(WHALEERP-141 · 142) 화면이 같이 쓰는 조각 — 단계 막대, 초대 확인(가이드 ②), 끝난 초대 · 계정 있음 · 잠김 같은 갈래 화면.
// 기준: 목업 docs/mockup/app/join.html 의 code · code-locked · invite · has-account · minor · expired.
// 갈래 화면은 같은 주소에서 바뀌기도 해(초대 코드 입력의 결과) 붙을 때 제목으로 초점을 옮긴다.

/** 어떻게 들어왔는지 — 초대 코드(앱을 직접 열기, 4단계)나 초대 링크(코드 입력이 없어 3단계). */
export type JoinVia = "code" | "link";

const STEPS = {
  code: ["초대 코드", "초대 확인", "계정 등록", "가입 완료"],
  link: ["초대 확인", "계정 등록", "가입 완료"],
} as const;

/** 단계 막대(목업 lab + steps). 「3 / 4 · 계정 등록」과 그 아래 칸. */
export function JoinSteps({ via, step }: { via: JoinVia; step: "초대 코드" | "초대 확인" | "계정 등록" }) {
  const names: readonly string[] = STEPS[via];
  const current = names.indexOf(step) + 1;
  return (
    <div className="flex flex-col gap-[8px] pb-[6px]">
      <p className="text-[12px] font-semibold text-staff-text-sub tabular-nums">
        {current} / {names.length} · {step}
      </p>
      <div aria-hidden className="flex gap-[4px]">
        {names.map((name, index) => (
          <span key={name} className={`h-[4px] flex-1 rounded-full ${index < current ? "bg-staff-primary" : "bg-staff-primary-inactive"}`} />
        ))}
      </div>
    </div>
  );
}

/** 초대 확인(가이드 ②). 근무지 · 고용 형태 · 기한만 보인다 — 직원 레코드 값과 기존 계정 정보는 api 가 주지 않는다. */
export function InvitationScreen({
  via,
  storeName,
  employmentType,
  expiresOn,
}: {
  via: JoinVia;
  storeName: string;
  employmentType: string;
  /** 초대를 쓸 수 있는 마지막 날(「2026년 11월 18일」). */
  expiresOn: string;
}) {
  return (
    <AuthScreen
      eyebrow={<JoinSteps via={via} step="초대 확인" />}
      title="초대를 확인해 주세요"
      description={
        <>
          <strong>{storeName}</strong>에서 함께 일하자고 초대를 보냈습니다.
        </>
      }
      dock={
        <>
          <Button href="/join/signup" transitionTypes={["nav-forward"]}>
            가입 시작
          </Button>
          <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
            로그인으로 돌아가기
          </Button>
        </>
      }
    >
      <Card>
        <dl className="flex flex-col text-[14px]">
          <div className="flex gap-[12px] border-b border-staff-border-light py-[10px]">
            <dt className="shrink-0 text-staff-text-sub">근무지</dt>
            <dd className="min-w-0 flex-1 text-right font-semibold break-keep">{storeName}</dd>
          </div>
          <div className="flex gap-[12px] py-[10px]">
            <dt className="shrink-0 text-staff-text-sub">고용 형태</dt>
            <dd className="min-w-0 flex-1 text-right font-semibold">{employmentType}</dd>
          </div>
        </dl>
      </Card>
      <Notice>
        초대는 받은 날부터 <strong>30일</strong> 동안 쓸 수 있습니다. 이 초대는 <strong>{expiresOn}까지</strong> 쓸 수 있습니다.
      </Notice>
    </AuthScreen>
  );
}

const ToLogin = ({ primary = false }: { primary?: boolean }) => (
  <Button variant={primary ? "primary" : "ghost"} href="/login" transitionTypes={["nav-back"]}>
    {primary ? "로그인하러 가기" : "로그인으로 돌아가기"}
  </Button>
);

/** 기한이 지났거나 · 다시 보냄 · 번호 변경 · 퇴직 · 가입 불가로 끝난 초대. 링크와 코드가 똑같이 무효다. */
export function EndedInvitation() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="쓸 수 없는 초대입니다"
      description="초대가 만료되었거나 새 초대로 바뀌었습니다. 근무지에 다시 초대해 달라고 요청해 주세요."
      dock={
        <>
          <Button href="/join" transitionTypes={["nav-back"]}>
            새 초대 코드 넣기
          </Button>
          <ToLogin />
        </>
      }
    >
      <Notice>다시 초대를 받으면 알림톡 · 문자로 새 링크와 초대 코드가 갑니다. 앞서 받은 링크와 코드는 쓸 수 없습니다.</Notice>
    </AuthScreen>
  );
}

/** 이 초대로 이미 가입을 마쳤다. */
export function JoinedInvitation() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="이미 가입을 마친 초대입니다"
      description="가입할 때 정한 이메일과 비밀번호로 로그인해 주세요."
      dock={
        <>
          <ToLogin primary />
          <Button variant="ghost" href="/email-find" transitionTypes={["nav-forward"]}>
            이메일 찾기
          </Button>
        </>
      }
    />
  );
}

/** 그 번호로 가입한 계정이 있다(운영 정책 JOI-02) — 새로 가입하지 않고 로그인한다. 기존 계정의 이메일은 보이지 않는다. */
export function AccountExists() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="이미 계정이 있습니다"
      description="이 휴대전화번호로 가입한 계정이 있습니다. 새로 가입하지 않고 로그인해 주세요."
      dock={
        <>
          <ToLogin primary />
          <Button variant="ghost" href="/email-find" transitionTypes={["nav-forward"]}>
            이메일 찾기
          </Button>
        </>
      }
    />
  );
}

/**
 * 같은 번호로 초대 코드를 5번 틀려 30분 잠겼다(JOIN-7). 재발송하면 api 가 그 번호의 잠금을 푼다. onRetry 가 있으면(초대 코드 입력)
 * 「다시 넣기」로 입력 화면에 돌아가고, 없으면(계정 등록 중 잠김) 초대 코드 입력으로 간다.
 */
export function CodeLocked({ lock, onRetry }: { lock: AttemptLock; onRetry?: () => void }) {
  const titleRef = useFocusedTitle();
  // 「다시 넣기」를 언제 여는지는 lockCountdown 이 정한다. 일찍 넣어도 api 가 다시 잠김으로 답할 뿐이다.
  const { text, waiting } = lockCountdown(lock, useNow(lock.serverNow));
  const label = waiting ? `다시 넣기 · ${text} 뒤` : "다시 넣기";
  return (
    <AuthScreen
      titleRef={titleRef}
      title="잠시 뒤 다시 시도해 주세요"
      description="휴대전화번호나 초대 코드를 여러 번 잘못 넣어 입력을 잠갔습니다."
      dock={
        <>
          {onRetry ? (
            <Button disabled={waiting} onClick={onRetry}>
              {label}
            </Button>
          ) : (
            <Button href="/join" transitionTypes={["nav-back"]}>
              {label}
            </Button>
          )}
          <ToLogin />
        </>
      }
    >
      <Card>
        <div className="flex flex-col items-center text-center">
          <p className="text-[13px] font-semibold text-staff-text-sub">다시 시도까지</p>
          <p className="pt-[4px] text-[32px] font-bold tabular-nums">{text}</p>
          <p className="pt-[6px] text-[12px] text-staff-text-muted">같은 번호로 다섯 번 틀리면 30분 동안 잠급니다.</p>
        </div>
      </Card>
      <Notice>
        30분 뒤 다시 시도하거나, <strong>근무지 관리자에게 재발송을 요청해 주세요.</strong> 다시 보내면 잠금이 바로 풀리고 새 초대
        코드가 갑니다.
      </Notice>
    </AuthScreen>
  );
}

/** 만 19세 미만(운영 정책 ACC-22). 계정을 만들지 않았고 초대는 가입 불가가 됐다 — 다시 시도하는 길을 두지 않는다. */
export function UnderAge() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="가입을 진행할 수 없습니다"
      description="만 19세 미만은 WHALE ERP로 근로계약과 출퇴근을 관리하지 않습니다. 근무지 관리자에게 알려 주세요."
      dock={
        <Button variant="ghost" href="/login" transitionTypes={["nav-back"]}>
          닫기
        </Button>
      }
    >
      <Card>
        <p className="text-[13px] text-staff-text-sub">
          계정은 만들지 않았습니다. 가입 때 넣은 생년월일은 남기지 않습니다. 근로계약과 출퇴근은 근무지에서 따로 관리합니다.
        </p>
      </Card>
    </AuthScreen>
  );
}

/** 초대 쿠키(30분)가 지났거나 없다 — 확인한 초대를 다시 찾을 수 없어 처음부터 다시 한다. */
export function InvitationExpired() {
  const titleRef = useFocusedTitle();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="처음부터 다시 해 주세요"
      description="초대를 확인한 지 30분이 지났습니다. 받은 초대 링크를 다시 누르거나 초대 코드를 넣어 주세요."
      dock={
        <>
          <Button href="/join" transitionTypes={["nav-back"]}>
            초대 코드 넣기
          </Button>
          <ToLogin />
        </>
      }
    />
  );
}

/** 초대를 확인하지 못했다(연결 실패 · 5xx · 요청 제한). 「다시 시도」는 이 화면을 서버에서 다시 그려 다시 확인한다. */
export function CheckFailed({ message }: { message: string }) {
  const titleRef = useFocusedTitle();
  const router = useRouter();
  const [retrying, startRetry] = useTransition();
  return (
    <AuthScreen
      titleRef={titleRef}
      title="초대를 확인하지 못했습니다"
      description={message}
      dock={
        <>
          <Button disabled={retrying} onClick={() => startRetry(() => router.refresh())}>
            다시 시도
          </Button>
          <ToLogin />
        </>
      }
    />
  );
}

/** 그리면서 초대를 다시 확인했더니 가입을 이어 갈 수 없을 때(초대 확인 · 계정 등록 화면). */
export function InvitationProblem({ loaded }: { loaded: Exclude<LoadedInvitation, { kind: "ready" | "none" }> }) {
  switch (loaded.kind) {
    case "ended":
      return <EndedInvitation />;
    case "joined":
      return <JoinedInvitation />;
    case "has-account":
      return <AccountExists />;
    case "locked":
      return <CodeLocked lock={loaded.lock} />;
    case "failed":
      return <CheckFailed message={loaded.message} />;
  }
}
