"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, TextField } from "@/components/common";
import { checkPasswordRules } from "@/lib/password-rules";

// 새 비밀번호 두 칸 + 조건 목록. 핀으로 들어온 새 비밀번호(데모 newpw), 관리자 재설정 링크(temp), 내 정보의 비밀번호 변경(194),
// 가입의 계정 등록(142, 칸 이름만 「비밀번호」 · 「비밀번호 확인」)이 같이 쓴다.
// email 이 null 이면(링크 흐름, 이메일을 모른다) 「이메일 아이디와 겹치지 않기」는 맞음 · 아직을 보이지 않고 안내로만 둔다 — 판정은 api 의 400 사유다.
export function NewPasswordFields({
  email,
  newPasswordError,
  confirmationError,
  labels = ["새 비밀번호", "새 비밀번호 확인"],
}: {
  /** 빠뜨리지 못하게 필수로 둔다 — 핀 흐름에서 빠지면 이메일 조건 줄이 소리 없이 사라진다. */
  email: string | null;
  newPasswordError?: string;
  confirmationError?: string;
  /** 두 칸의 이름(첫 칸 · 확인 칸). */
  labels?: readonly [string, string];
}) {
  // 400 뒤에도 입력한 새 비밀번호가 남고 조건 목록이 바로 반응하도록 첫 칸은 상태로 든다
  // (React 19 폼 액션은 제출 뒤 비제어 칸을 비운다).
  const [password, setPassword] = useState("");
  const check = checkPasswordRules(password, email ?? "");
  const rules = [
    {
      ok: check.kinds,
      text: (
        <>
          영문 대문자 · 소문자 · 숫자 · 기호 중 <b>두 가지 이상</b>을 섞었습니다
        </>
      ),
    },
    { ok: check.length, text: "세 가지 이상이면 8자, 두 가지면 10자 이상 · 20자 이하" },
    ...(email === null ? [] : [{ ok: check.notEmail, text: "이메일 아이디와 겹치지 않기" }]),
  ];

  return (
    <>
      <div className="flex flex-col gap-[16px]">
        <TextField
          label={labels[0]}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={newPasswordError}
        />
        <TextField
          label={labels[1]}
          name="newPasswordConfirmation"
          type="password"
          autoComplete="new-password"
          required
          maxLength={128}
          error={confirmationError}
        />
      </div>
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p>
        <ul className="flex flex-col pt-[2px]">
          {rules.map((rule, index) => (
            <li
              key={index}
              className={`flex items-center gap-[8px] py-[6px] text-[13px] ${rule.ok ? "font-medium" : "text-staff-text-muted"}`}
            >
              {rule.ok ? (
                // 맞은 조건은 초록 체크(#16a34a, 배지 「정상」 글자색)
                <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
                  <Image src="/icons/check.svg" alt="" width={10} height={10} />
                </span>
              ) : (
                <span className="size-[16px] shrink-0 rounded-full border border-staff-border" />
              )}
              <span>
                {rule.text}
                <span className="sr-only">{rule.ok ? " · 맞음" : " · 아직"}</span>
              </span>
            </li>
          ))}
        </ul>
        {email === null && (
          <p className="pt-[6px] text-[12px] text-staff-text-muted">로그인 이메일이나 그 아이디와 같은 비밀번호는 쓸 수 없습니다.</p>
        )}
      </Card>
    </>
  );
}
