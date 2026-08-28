"use client";

import Image from "next/image";
import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="grid min-h-[100dvh] grid-rows-[13rem_1fr] lg:grid-cols-[3fr_2fr] lg:grid-rows-1">
      {/* 취급하는 물건이 먼저 보인다. 좁은 화면에서는 상단 띠로 접힌다. */}
      <div className="relative overflow-hidden border-b border-seam lg:border-b-0 lg:border-r">
        <Image
          src="/brand/coil-yard.webp"
          alt="야드에 적재된 열연 코일"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
          className="object-cover"
        />
      </div>

      <div className="settle flex flex-col px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
        <header>
          <h1 className="font-sans text-[2rem] font-semibold leading-none tracking-[0.16em] text-plate sm:text-[2.5rem]">
            WHALE ERP
          </h1>
          <p className="mt-3 font-sans text-sm text-plate-dim">직원 콘솔</p>
          <hr className="mt-7 border-seam" />
        </header>

        <form action={formAction} className="flex w-full max-w-md flex-1 flex-col justify-center gap-7 py-12">
          <div>
            <label
              htmlFor="email"
              className="block font-sans text-[0.82rem] tracking-[0.02em] text-plate-dim"
            >
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              defaultValue={state?.email ?? ""}
              className="slot mt-3 h-12 w-full px-4 font-mono text-[0.95rem] text-plate outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block font-sans text-[0.82rem] tracking-[0.02em] text-plate-dim"
            >
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="slot mt-3 h-12 w-full px-4 font-mono text-[0.95rem] text-plate outline-none"
            />
          </div>

          {state ? (
            <p
              role="alert"
              className="border-l border-alarm pl-4 font-sans text-sm leading-relaxed text-alarm"
            >
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="h-14 w-full bg-start font-sans text-[0.95rem] font-semibold tracking-[0.02em] text-panel transition-[opacity,transform] duration-150 hover:opacity-90 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending ? "확인 중" : "로그인"}
          </button>
        </form>

        <p className="max-w-md border-t border-seam pt-6 font-sans text-sm leading-relaxed text-plate-dim">
          계정은 운영자가 발급합니다. 비밀번호를 잊었다면 운영자에게 재발급을
          요청하세요.
        </p>
      </div>
    </div>
  );
}
