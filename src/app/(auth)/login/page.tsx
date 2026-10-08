import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "로그인 · Whale ERP" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { expired, reset } = await searchParams;
  return <LoginForm expired={expired !== undefined} reset={reset !== undefined} />;
}
