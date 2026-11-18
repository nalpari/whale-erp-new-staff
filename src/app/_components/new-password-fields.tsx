"use client";

import Image from "next/image";
import { type ReactNode, useState } from "react";
import { Card, TextField } from "@/components/common";
import { checkPasswordRules } from "@/lib/password-rules";

// 새 비밀번호 두 칸 + 조건 목록. 핀으로 들어온 새 비밀번호(데모 newpw), 관리자 재설정 링크(temp), 내 정보의 비밀번호 변경(194),
// 가입의 계정 등록(142, 칸 이름 「비밀번호」 · 「비밀번호 확인」과 자리표시 「비밀번호를 …」)이 같이 쓴다.
// 조건 줄 문구는 데모 login newpw · join signup 그대로다. 실제 규칙(lib/password-rules)은 「3가지 이상이면 8자↑, 2가지면 10자↑, 20자↓」라
// 첫 줄은 3가지이거나 2가지 + 10자 이상이면 맞음으로 보인다(아래 안내 줄이 그 예외를 말한다). 모든 줄이 맞음이면 규칙을 통과한다.
// email 이 null 이면(링크 흐름, 이메일을 모른다) 「이메일 아이디와 중복 불가」는 맞음 · 아직을 보이지 않고 점으로만 둔다 — 판정은 api 의 400 사유다.
export function NewPasswordFields({
  email,
  newPasswordError,
  confirmationError,
  labels = ["새 비밀번호", "새 비밀번호 확인"],
  placeholders = ["새 비밀번호를 입력해 주세요", "새 비밀번호를 한 번 더 입력해 주세요"],
}: {
  /** 빠뜨리지 못하게 필수로 둔다 — 핀 흐름에서 빠지면 이메일 조건 줄이 소리 없이 사라진다. */
  email: string | null;
  newPasswordError?: string;
  confirmationError?: string;
  /** 두 칸의 이름(첫 칸 · 확인 칸). */
  labels?: readonly [string, string];
  /** 두 칸의 자리표시(첫 칸 · 확인 칸). */
  placeholders?: readonly [string, string];
}) {
  // 400 뒤에도 입력한 새 비밀번호가 남고 조건 목록이 바로 반응하도록 첫 칸은 상태로 든다
  // (React 19 폼 액션은 제출 뒤 비제어 칸을 비운다).
  const [password, setPassword] = useState("");
  const check = checkPasswordRules(password, email ?? "");
  // 종류 수와 글자 수는 lib/password-rules 의 checkPasswordRules 와 같은 방법으로 센다.
  const kinds = [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((kind) => kind.test(password)).length;
  const length = [...password].length;
  // ok 가 null 이면 맞음 · 아직을 보이지 않는 줄이다.
  const rules: { ok: boolean | null; text: ReactNode }[] = [
    {
      ok: kinds >= 3 || (kinds === 2 && length >= 10),
      text: (
        <>
          영문 대소문자·숫자·특수문자 중 <b>3가지</b> 이상
        </>
      ),
    },
    { ok: length >= 8 && length <= 20, text: "8자 이상 20자 이하" },
    { ok: email === null ? null : check.notEmail, text: "이메일 아이디와 중복 불가" },
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
          placeholder={placeholders[0]}
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
          placeholder={placeholders[1]}
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
              {rule.ok === null ? (
                <span className="flex size-[16px] shrink-0 items-center justify-center">
                  <span className="size-[4px] rounded-full bg-staff-text-muted" />
                </span>
              ) : rule.ok ? (
                // 맞은 조건은 초록 체크(#16a34a, 배지 「정상」 글자색)
                <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
                  <Image src="/icons/check.svg" alt="" width={10} height={10} />
                </span>
              ) : (
                <span className="size-[16px] shrink-0 rounded-full border border-staff-border" />
              )}
              <span>
                {rule.text}
                {rule.ok !== null && <span className="sr-only">{rule.ok ? " · 맞음" : " · 아직"}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="pt-[6px] text-[12px] text-staff-text-muted">2가지만 사용하면 10자 이상 입력해 주세요.</p>
      </Card>
    </>
  );
}
