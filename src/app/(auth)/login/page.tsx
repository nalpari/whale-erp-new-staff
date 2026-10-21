import type { Metadata } from "next";
import { NEXT_PARAM, safeNextPath } from "@/lib/login-return";
import { getSavedLoginEmail } from "@/lib/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Whale ERP" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const { expired, reset, unavailable } = params;
  // 돌아갈 곳(WHALEERP-166). 받을 수 없는 값은 여기서 버리고, 액션이 한 번 더 거른다(폼 값은 고쳐 보낼 수 있다).
  const next = params[NEXT_PARAM];
  return (
    <LoginForm
      expired={expired !== undefined}
      reset={reset !== undefined}
      unavailable={unavailable !== undefined}
      next={safeNextPath(typeof next === "string" ? next : undefined)}
      savedEmail={await getSavedLoginEmail()}
    />
  );
}
