// node --test src/lib/staff-terms.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_FAILED } from "./action-errors.ts";
import {
  NO_TERMS_CHECKED,
  REQUIRED_TERMS_MISSING,
  STAFF_TERMS,
  allTermsChecked,
  checkAllTerms,
  requiredTermsAgreed,
  shownTermsVersionsOf,
  signupTermsBody,
  termsLoadOf,
  termsVersionKey,
  termsAgreementBody,
  termsAgreementFailure,
} from "./staff-terms.ts";

test("STAFF_TERMS — 필수 둘 · 선택 하나, api 약관 유형 코드와 화면 이름(ACC-23)", () => {
  assert.deepEqual(
    STAFF_TERMS.map((t) => [t.code, t.required]),
    [
      ["STAFF_TERMS_SERVICE", true],
      ["STAFF_PRIVACY", true],
      ["MARKETING", false],
    ],
  );
});

test("requiredTermsAgreed — 필수 둘이 모두 켜져야 한다, 마케팅은 보지 않는다", () => {
  assert.equal(requiredTermsAgreed(NO_TERMS_CHECKED), false);
  assert.equal(requiredTermsAgreed({ termsService: true, privacy: false, marketing: true }), false);
  assert.equal(requiredTermsAgreed({ termsService: true, privacy: true, marketing: false }), true);
});

test("모두 동의 — 켜면 셋 다, 끄면 셋 다. 셋이 다 켜져야 모두 동의로 보인다", () => {
  assert.deepEqual(checkAllTerms(true), { termsService: true, privacy: true, marketing: true });
  assert.deepEqual(checkAllTerms(false), NO_TERMS_CHECKED);
  assert.equal(allTermsChecked({ termsService: true, privacy: true, marketing: false }), false);
  assert.equal(allTermsChecked(checkAllTerms(true)), true);
});

test("signupTermsBody — 켠 칸(on)만 true, 빠진 칸은 false 로 늘 셋을 싣고, 화면이 보인 버전 셋을 함께 싣는다", () => {
  const form = new FormData();
  form.set("termsServiceAgreed", "on");
  form.set("privacyAgreed", "on");
  form.set("termsServiceVersion", "v1.0");
  form.set("privacyVersion", "v1.1");
  form.set("marketingVersion", "v1.0");
  assert.deepEqual(signupTermsBody(form), {
    termsServiceAgreed: true,
    privacyAgreed: true,
    marketingAgreed: false,
    termsServiceVersion: "v1.0",
    privacyVersion: "v1.1",
    marketingVersion: "v1.0",
  });
  // 마케팅 약관이 보이지 않았으면(시행 중인 것이 없음) 빈 값 → null
  assert.deepEqual(signupTermsBody(new FormData()), {
    termsServiceAgreed: false,
    privacyAgreed: false,
    marketingAgreed: false,
    termsServiceVersion: "",
    privacyVersion: "",
    marketingVersion: null,
  });
});

test("termsAgreementBody — 보인 버전 셋 · 마케팅. 버전이 비었거나 길면 null", () => {
  const versions = { termsServiceVersion: "v1.0", privacyVersion: "v1.1", marketingVersion: "v1.0" };
  assert.deepEqual(termsAgreementBody(versions, true), { ...versions, marketingAgreed: true });
  // 선택 약관(마케팅)은 시행 중인 것이 없을 수 있다 — 보인 것이 없으면 null
  assert.deepEqual(termsAgreementBody({ ...versions, marketingVersion: null }, false), {
    ...versions,
    marketingVersion: null,
    marketingAgreed: false,
  });
  assert.equal(termsAgreementBody({ ...versions, privacyVersion: "" }, false), null);
  assert.equal(termsAgreementBody({ ...versions, marketingVersion: "v".repeat(65) }, false), null);
  assert.equal(termsAgreementBody({ ...versions, termsServiceVersion: 3 as unknown as string }, false), null);
  // 서버 액션은 누구나 아무 값으로 부를 수 있다 — 객체가 아니면 던지지 않고 null
  assert.equal(termsAgreementBody(null as unknown as typeof versions, false), null);
  assert.equal(termsAgreementBody("v1.0" as unknown as typeof versions, false), null);
});

test("termsAgreementFailure — 약관이 바뀐 409 는 사유와 다시 받기, 이미 동의한 409 는 다시 받기만", () => {
  assert.deepEqual(termsAgreementFailure({ status: 409, code: "TERMS_CHANGED", message: "그사이 약관이 바뀌었습니다. 바뀐 약관을 확인하고 다시 동의해 주세요." }), {
    error: "그사이 약관이 바뀌었습니다. 바뀐 약관을 확인하고 다시 동의해 주세요.",
    refresh: true,
    log: false,
  });
  assert.deepEqual(termsAgreementFailure({ status: 409, message: "이미 약관에 동의했습니다." }), { refresh: true, log: false });
});

test("termsAgreementFailure — 연결 실패 · 한글 500 · 영어 400", () => {
  assert.deepEqual(termsAgreementFailure("network"), { error: CONNECTION_FAILED, refresh: false, log: false });
  assert.deepEqual(termsAgreementFailure({ status: 500, message: "지금은 약관 동의를 받을 수 없습니다. 관리자에게 문의해 주세요." }), {
    error: "지금은 약관 동의를 받을 수 없습니다. 관리자에게 문의해 주세요.",
    refresh: false,
    log: false,
  });
  const english = termsAgreementFailure({ status: 400, message: "privacyVersion must be a string" });
  assert.equal(english.log, true);
  assert.equal(english.refresh, false);
  assert.match(english.error ?? "", /약관 동의를 남기지 못했습니다/);
});

test("REQUIRED_TERMS_MISSING — api 문구와 같은 뜻", () => {
  assert.equal(REQUIRED_TERMS_MISSING, "필수 약관에 동의해 주세요");
});

test("shownTermsVersionsOf — 필수 둘을 받아야 팝업을 띄운다, 마케팅이 없으면(404) null · 잠시 못 받으면 띄우지 않는다", () => {
  const ok = (version: string) => ({ status: "ok" as const, terms: { version } });
  const items = (marketing: { status: "ok"; terms: { version: string } } | { status: "missing" | "unavailable" }) => [
    { key: "termsService" as const, current: ok("v1.0") },
    { key: "privacy" as const, current: ok("v1.1") },
    { key: "marketing" as const, current: marketing },
  ];
  assert.deepEqual(shownTermsVersionsOf(items(ok("v2.0"))), { termsServiceVersion: "v1.0", privacyVersion: "v1.1", marketingVersion: "v2.0" });
  assert.deepEqual(shownTermsVersionsOf(items({ status: "missing" })), { termsServiceVersion: "v1.0", privacyVersion: "v1.1", marketingVersion: null });
  assert.equal(shownTermsVersionsOf(items({ status: "unavailable" })), null);
  assert.equal(shownTermsVersionsOf([{ key: "termsService", current: { status: "missing" } }, ...items(ok("v2.0")).slice(1)]), null);
});

test("termsVersionKey — 보인 버전이 하나라도 바뀌면 키가 바뀐다(체크를 처음으로)", () => {
  const ok = (version: string) => ({ status: "ok" as const, terms: { version } });
  const before = termsVersionKey([
    { key: "termsService", current: ok("v1.0") },
    { key: "privacy", current: ok("v1.0") },
    { key: "marketing", current: { status: "missing" } },
  ]);
  assert.equal(before, "termsService:v1.0|privacy:v1.0|marketing:-");
  assert.notEqual(
    termsVersionKey([
      { key: "termsService", current: ok("v1.0") },
      { key: "privacy", current: ok("v1.1") },
      { key: "marketing", current: { status: "missing" } },
    ]),
    before,
  );
});

test("termsLoadOf — 필수 약관이 없으면 missing, 무엇이든 잠시 못 받으면 unavailable, 마케팅만 없으면 ok", () => {
  const ok = { status: "ok" as const, terms: { version: "v1.0" } };
  const of = (privacy: LoadedLike, marketing: LoadedLike) =>
    termsLoadOf([
      { key: "termsService", current: ok },
      { key: "privacy", current: privacy },
      { key: "marketing", current: marketing },
    ]);
  assert.equal(of(ok, ok), "ok");
  assert.equal(of(ok, { status: "missing" }), "ok");
  assert.equal(of(ok, { status: "unavailable" }), "unavailable");
  assert.equal(of({ status: "unavailable" }, ok), "unavailable");
  assert.equal(of({ status: "missing" }, { status: "unavailable" }), "missing");
});

type LoadedLike = { status: "ok"; terms: { version: string } } | { status: "missing" | "unavailable" };
