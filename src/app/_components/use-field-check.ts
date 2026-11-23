"use client";

import { useState, type FormEvent } from "react";

/** 칸 이름(name) → 그 칸 아래 오류 문구. */
export type FieldErrors = Partial<Record<string, string>>;

/**
 * 브라우저 기본 검증 말풍선(「이 입력란을 작성하세요.」 등)을 띄우지 않고 칸 아래 빨간 문구로 알린다(2026-11-23 사용자 결정).
 * 폼에 noValidate 를 달고, onSubmit 에서 check 를 부른다 — 걸린 칸이 있으면 제출(서버 액션)을 막고 첫 칸으로 초점을 옮긴다.
 * required · type="email" 같은 속성은 화면 낭독기(필수 · 입력 종류)를 위해 남겨 둔다. noValidate 라 말풍선은 뜨지 않는다.
 * 폼의 onChange 에 clear 를 달면 값을 고친 칸의 오류를 내린다.
 * validate 는 폼 값(누른 버튼의 name · value 포함)을 받아 걸린 칸만 돌려준다. 누른 버튼에 formNoValidate 가 있으면(다시 받기 ·
 * 다시 입력하기처럼 칸을 보지 않는 버튼) 브라우저처럼 거르지 않는다.
 */
export function useFieldCheck(validate: (data: FormData) => FieldErrors) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const blocked = Object.values(errors).some(Boolean);

  /** 걸린 칸이 없으면 true. 있으면 제출을 막고(preventDefault) 첫 칸에 초점을 옮긴다. */
  const check = (event: FormEvent<HTMLFormElement>): boolean => {
    const form = event.currentTarget;
    const submitter = (event.nativeEvent as SubmitEvent).submitter ?? null;
    if (submitter?.hasAttribute("formnovalidate")) {
      setErrors({});
      return true;
    }
    const found = validate(new FormData(form, submitter));
    const names = Object.keys(found).filter((name) => found[name]);
    setErrors(found);
    if (names.length === 0) return true;
    event.preventDefault();
    focusFirstField(form, names);
    return false;
  };

  /** 그 칸의 오류를 내린다 — 입력 이벤트가 없는 칸(나눔 단추 · 검색으로 고른 값)은 값을 바꿀 때 직접 부른다. */
  const dismiss = (name: string) => {
    if (!errors[name]) return;
    setErrors((previous) => {
      const next = { ...previous };
      delete next[name];
      return next;
    });
  };

  /** 폼 onChange — 값을 고친 칸의 오류를 내린다. */
  const clear = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as { name?: string }).name;
    if (name) dismiss(name);
  };

  /**
   * 칸 아래에 보일 문구 — 화면이 거른 오류가 먼저다. 화면이 걸러 막은 동안에는 지난 서버 오류를 다른 칸에 함께 보이지 않는다
   * (그 서버 오류는 이번 제출의 결과가 아니다).
   */
  const messageOf = (name: string, server?: string) => errors[name] ?? (blocked ? undefined : server);

  return { errors, check, clear, dismiss, messageOf, blocked };
}

/**
 * 폼 칸 순서(DOM)대로 보아 names 중 처음 나오는 칸에 초점을 옮긴다. 막힌 칸은 건너뛴다. 값을 숨은 칸(type="hidden")에 담는 고르기
 * (성별 · 주소 검색)는 그 칸 대신 `data-field-anchor="이름"` 을 단 묶음 안 첫 버튼에 초점을 주고 화면에 보이게 옮긴다 — 안 그러면
 * 막힌 제출이 아무 일도 안 한 것처럼 보였다.
 */
export function focusFirstField(form: HTMLFormElement, names: readonly string[]) {
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) continue;
    if (!names.includes(element.name) || element.matches(":disabled")) continue;
    if (element.type === "hidden" || element.hidden) {
      const anchor = form.querySelector<HTMLElement>(`[data-field-anchor="${element.name}"]`);
      if (!anchor) continue;
      anchor.scrollIntoView({ block: "center" });
      anchor.querySelector<HTMLElement>("button:not(:disabled), input:not([type=hidden]):not(:disabled)")?.focus({ preventScroll: true });
      return;
    }
    element.focus();
    return;
  }
}
