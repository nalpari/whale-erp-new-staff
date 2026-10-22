// node --test src/lib/join.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clipChars,
  formatPhone,
  invitationProblemOf,
  isInviteCode,
  kstToday,
  needsBirthDateCheck,
  normalizeInviteCode,
  parseInvitationLookup,
  signupFieldOf,
  signupFieldProblem,
} from "./join.ts";

const TOKEN = "A".repeat(42) + "_";

test("formatPhone 은 숫자만 남겨 하이픈을 넣는다", () => {
  assert.equal(formatPhone(""), "");
  assert.equal(formatPhone("010"), "010");
  assert.equal(formatPhone("0101"), "010-1");
  assert.equal(formatPhone("010123"), "010-123");
  assert.equal(formatPhone("0101234"), "010-123-4");
  assert.equal(formatPhone("0111234567"), "011-123-4567");
  assert.equal(formatPhone("01012345678"), "010-1234-5678");
  assert.equal(formatPhone("010-1234-5678"), "010-1234-5678");
  assert.equal(formatPhone("010 1234 5678 9"), "010-1234-5678");
});

test("normalizeInviteCode 는 공백을 빼고 대문자로 맞춘다", () => {
  assert.equal(normalizeInviteCode(" k7q2 m9px "), "K7Q2M9PX");
});

test("isInviteCode 는 8자리 · 0 O 1 I 없음만 받는다", () => {
  assert.equal(isInviteCode("K7Q2M9PX"), true);
  for (const code of ["K7Q2M9P", "K7Q2M9PXX", "K7Q2M9P0", "K7Q2M9PO", "K7Q2M9P1", "K7Q2M9PI", "k7q2m9px"]) {
    assert.equal(isInviteCode(code), false, code);
  }
});

test("parseInvitationLookup 은 토큰이나 번호 + 코드만 받는다", () => {
  assert.deepEqual(parseInvitationLookup(JSON.stringify({ token: TOKEN })), { token: TOKEN });
  assert.deepEqual(parseInvitationLookup(JSON.stringify({ phone: "01012345678", code: "K7Q2M9PX" })), {
    phone: "01012345678",
    code: "K7Q2M9PX",
  });
  assert.equal(parseInvitationLookup(undefined), null);
  assert.equal(parseInvitationLookup("not json"), null);
  assert.equal(parseInvitationLookup("null"), null);
  assert.equal(parseInvitationLookup(JSON.stringify({ token: "short" })), null);
  assert.equal(parseInvitationLookup(JSON.stringify({ phone: "010-1234-5678", code: "K7Q2M9PX" })), null);
  assert.equal(parseInvitationLookup(JSON.stringify({ phone: "01012345678", code: "K7Q2M9P0" })), null);
});

test("invitationProblemOf 는 본문의 code 로 가른다", () => {
  const of = (status: number, code?: string, extra: object = {}) => invitationProblemOf({ status, body: { code, ...extra } }).kind;
  assert.equal(of(404, "INVITATION_NOT_FOUND"), "not-found");
  assert.equal(of(404, "INVITATION_ENDED"), "ended");
  assert.equal(of(409, "INVITATION_ALREADY_JOINED"), "joined");
  assert.equal(of(409, "ACCOUNT_EXISTS"), "has-account");
  assert.equal(of(409, "ACCOUNT_EMAIL_TAKEN"), "email-taken");
  assert.equal(of(400, "SIGNUP_UNDER_AGE"), "under-age");
  assert.equal(of(400, "BIRTH_DATE_IN_FUTURE"), "birth-date-in-future");
  // 형식 검증 400 · 코드 없는 404 · 5xx 는 부른 쪽이 다룬다
  assert.equal(of(400), "unknown");
  assert.equal(of(404), "unknown");
  assert.equal(of(500), "unknown");
  assert.equal(invitationProblemOf({ status: 404, body: null }).kind, "unknown");
});

test("invitationProblemOf 는 잠금의 429 와 요청 제한의 429 를 가른다", () => {
  const lockExpiresAt = "2026-10-22T03:00:00.000Z";
  assert.deepEqual(invitationProblemOf({ status: 429, body: { code: "INVITATION_CODE_LOCKED", lockExpiresAt } }, 1000), {
    kind: "locked",
    attemptLock: { lockExpiresAt: Date.parse(lockExpiresAt), serverNow: 1000 },
  });
  assert.equal(invitationProblemOf({ status: 429, body: { message: "ThrottlerException: Too Many Requests" } }).kind, "rate-limited");
  // 잠금인데 해제 시각을 읽지 못하면 계약이 어긋난 것이다
  assert.equal(invitationProblemOf({ status: 429, body: { code: "INVITATION_CODE_LOCKED", lockExpiresAt: "x" } }).kind, "unknown");
});

test("signupFieldOf 는 가입 400 사유를 붙일 칸을 고른다", () => {
  assert.equal(signupFieldOf("아이디로 쓰는 이메일이나 그 앞부분은 비밀번호로 쓸 수 없습니다"), "newPassword");
  assert.equal(signupFieldOf("비밀번호는 20자까지 쓸 수 있습니다"), "newPassword");
  assert.equal(signupFieldOf("생년월일은 YYYY-MM-DD 형식의 날짜입니다"), "birthDate");
  assert.equal(signupFieldOf("이메일 형식으로 입력해 주세요"), "email");
  assert.equal(signupFieldOf("메일을 보낼 수 없는 형식의 이메일입니다"), "email");
  assert.equal(signupFieldOf("우편번호는 숫자 5자리입니다"), "form");
  // api 가 여러 사유를 이어 붙이면(", ") 비밀번호 → 생년월일 → 이메일 순으로 먼저 걸리는 칸이다
  assert.equal(signupFieldOf("이메일 형식으로 입력해 주세요, 생년월일은 YYYY-MM-DD 형식의 날짜입니다"), "birthDate");
});

const FIELDS = {
  name: "김민서",
  birthDate: "1998-04-12",
  gender: "FEMALE",
  email: "minseo@whale.test",
  newPassword: "Whale#cafe25",
  newPasswordConfirmation: "Whale#cafe25",
  zipCode: "04001",
  address: "서울 마포구 양화로 12",
};

test("signupFieldProblem 은 다 맞으면 null 이다", () => {
  assert.equal(signupFieldProblem(FIELDS), null);
});

test("signupFieldProblem 은 화면 위에서 아래 순서로 처음 하나를 고른다", () => {
  const field = (overrides: Partial<typeof FIELDS>) => signupFieldProblem({ ...FIELDS, ...overrides })?.field;
  assert.equal(field({ name: "", birthDate: "", email: "" }), "name");
  assert.equal(field({ birthDate: "19980412", gender: "" }), "birthDate");
  assert.equal(field({ gender: "OTHER", email: "" }), "gender");
  assert.equal(field({ email: "", newPassword: "" }), "email");
  assert.equal(field({ newPassword: "short", newPasswordConfirmation: "x" }), "newPassword");
  assert.equal(field({ newPasswordConfirmation: "Whale#cafe26", zipCode: "" }), "newPasswordConfirmation");
  assert.equal(field({ zipCode: "" }), "address");
  assert.equal(field({ address: "" }), "address");
});

test("signupFieldProblem 의 이름 길이는 NFC 로 센다", () => {
  // 한글 50자를 자모로 풀어 넣어도(NFD) 50자로 센다
  assert.equal(signupFieldProblem({ ...FIELDS, name: "가".repeat(50).normalize("NFD") }), null);
  assert.equal(signupFieldProblem({ ...FIELDS, name: "가".repeat(51) })?.field, "name");
});

test("signupFieldProblem 은 이메일 아이디와 같은 비밀번호를 비밀번호 칸에서 막는다", () => {
  assert.equal(signupFieldProblem({ ...FIELDS, email: "whale#cafe25@x.test", newPassword: "Whale#cafe25", newPasswordConfirmation: "Whale#cafe25" })?.field, "newPassword");
});

test("clipChars 는 이모지를 반쪽으로 자르지 않는다", () => {
  assert.equal(clipChars("가나다", 2), "가나");
  const clipped = clipChars("a".repeat(99) + "🐳🐳", 100);
  assert.equal(clipped, "a".repeat(99) + "🐳");
  assert.doesNotThrow(() => encodeURIComponent(clipped));
});

test("needsBirthDateCheck 는 만 19세 미만일 때만 다시 묻는다", () => {
  const today = "2026-10-22";
  assert.equal(needsBirthDateCheck("2007-10-22", today), false, "오늘 만 19세");
  assert.equal(needsBirthDateCheck("2007-10-23", today), true, "내일 만 19세");
  assert.equal(needsBirthDateCheck("2019-04-12", today), true);
  assert.equal(needsBirthDateCheck("1999-04-12", today), false);
  assert.equal(needsBirthDateCheck("2026-10-23", today), false, "오늘 뒤 날짜는 api 가 돌려보낸다");
  assert.equal(needsBirthDateCheck("20190412", today), false, "형식이 아니면 묻지 않는다");
});

test("kstToday 는 한국 날짜다", () => {
  assert.equal(kstToday(Date.parse("2026-10-21T15:00:00Z")), "2026-10-22");
  assert.equal(kstToday(Date.parse("2026-10-21T14:59:59Z")), "2026-10-21");
});
