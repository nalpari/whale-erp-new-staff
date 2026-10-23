// node --test src/lib/tax-profile.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import { CONNECTION_FAILED, RATE_LIMITED, RETRY_LATER } from "./action-errors.ts";
import {
  ACCOUNT_INCOMPLETE,
  ACCOUNT_SHAPE,
  NOTHING_TO_CHANGE,
  RRN_BIRTH_MISMATCH,
  RRN_SHAPE,
  TAX_PROFILE_MISSING,
  taxProfileEditBlocked,
  parseStaffMemberId,
  readTaxProfileForm,
  rrnBirthMismatch,
  taxProfileSaveFailure,
  validateTaxProfileEdit,
} from "./tax-profile.ts";

const input = (over: Partial<Record<"rrnFront" | "rrnBack" | "bankCode" | "payrollAccountNumber", string>> = {}) => ({
  rrnFront: "",
  rrnBack: "",
  bankCode: "",
  payrollAccountNumber: "",
  ...over,
});
const problemOf = (result: ReturnType<typeof validateTaxProfileEdit>) => ("problem" in result ? result.problem : null);

test("parseStaffMemberId 는 int4 양의 정수만", () => {
  assert.equal(parseStaffMemberId("1"), 1);
  assert.equal(parseStaffMemberId("2147483647"), 2_147_483_647);
  for (const bad of ["0", "01", "-1", "1.5", "2147483648", "", "abc", undefined, 3]) assert.equal(parseStaffMemberId(bad), null);
});

test("rrnBirthMismatch — 세기는 뒷자리 첫 자리로, 덜 넣었으면 판단하지 않는다", () => {
  assert.equal(rrnBirthMismatch("900101", "1234567", "1990-01-01"), false);
  assert.equal(rrnBirthMismatch("900101", "2", "1990-01-01"), false);
  assert.equal(rrnBirthMismatch("050302", "3", "2005-03-02"), false);
  assert.equal(rrnBirthMismatch("050302", "7", "2005-03-02"), false); // 외국인등록번호
  assert.equal(rrnBirthMismatch("990101", "9", "1899-01-01"), false);
  assert.equal(rrnBirthMismatch("950101", "1", "1990-01-01"), true);
  assert.equal(rrnBirthMismatch("900101", "3", "1990-01-01"), true); // 2090
  assert.equal(rrnBirthMismatch("90010", "1", "1990-01-01"), false);
  assert.equal(rrnBirthMismatch("900101", "", "1990-01-01"), false);
});

test("readTaxProfileForm 은 앞뒤 공백을 지우고 없는 칸은 빈 글자", () => {
  const form = new FormData();
  form.set("rrnFront", " 900101 ");
  form.set("bankCode", "KB");
  assert.deepEqual(readTaxProfileForm(form), { rrnFront: "900101", rrnBack: "", bankCode: "KB", payrollAccountNumber: "" });
});

test("validateTaxProfileEdit — 주민등록번호만 · 계좌만 · 둘 다", () => {
  assert.deepEqual(validateTaxProfileEdit(input({ rrnFront: "900101", rrnBack: "1234567" })), { body: { rrn: "9001011234567" } });
  assert.deepEqual(validateTaxProfileEdit(input({ bankCode: "KB", payrollAccountNumber: "123456-01-234567" })), {
    body: { bankCode: "KB", payrollAccountNumber: "12345601234567" },
  });
  assert.deepEqual(validateTaxProfileEdit(input({ rrnFront: "900101", rrnBack: "1234567", bankCode: "KB", payrollAccountNumber: "1234567890" })), {
    body: { rrn: "9001011234567", bankCode: "KB", payrollAccountNumber: "1234567890" },
  });
});

test("validateTaxProfileEdit — 막는 경우", () => {
  assert.deepEqual(problemOf(validateTaxProfileEdit(input())), { field: "form", message: NOTHING_TO_CHANGE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ rrnFront: "900101" }))), { field: "rrn", message: RRN_SHAPE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ rrnFront: "9001a1", rrnBack: "1234567" }))), { field: "rrn", message: RRN_SHAPE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ bankCode: "KB" }))), { field: "account", message: ACCOUNT_INCOMPLETE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ payrollAccountNumber: "1234567890" }))), { field: "bank", message: ACCOUNT_INCOMPLETE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ bankCode: "KB", payrollAccountNumber: "123456789" }))), { field: "account", message: ACCOUNT_SHAPE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ bankCode: "KB", payrollAccountNumber: "1".repeat(17) }))), { field: "account", message: ACCOUNT_SHAPE });
  // 주민등록번호가 맞아도 계좌가 한쪽만이면 아무것도 보내지 않는다.
  assert.equal(problemOf(validateTaxProfileEdit(input({ rrnFront: "900101", rrnBack: "1234567", bankCode: "KB" })))?.field, "account");
});

test("taxProfileSaveFailure — 400 은 code 로 가른다", () => {
  const of = (code: string) => taxProfileSaveFailure({ status: 400, message: "사유", code });
  assert.deepEqual(of("RRN_BIRTH_MISMATCH"), { state: { problem: { field: "rrn", message: RRN_BIRTH_MISMATCH } }, log: false });
  assert.equal(of("BANK_CODE_UNKNOWN").state.problem?.field, "bank");
  assert.deepEqual([of("TAX_PROFILE_ACCOUNT_INCOMPLETE").state.problem?.field, of("TAX_PROFILE_ACCOUNT_INCOMPLETE").log], ["account", true]);
  assert.deepEqual([of("TAX_PROFILE_EMPTY").state.problem?.field, of("TAX_PROFILE_EMPTY").log], ["form", true]);
  assert.deepEqual([of("TAX_PROFILE_INCOMPLETE").state.problem?.field, of("TAX_PROFILE_INCOMPLETE").log], ["form", true]);
  assert.equal(taxProfileSaveFailure({ status: 400, message: "주민등록번호는 숫자 13자리입니다" }).state.problem?.field, "rrn");
  assert.equal(taxProfileSaveFailure({ status: 400, message: "계좌번호는 숫자 10~16자리입니다" }).state.problem?.field, "account");
  const english = taxProfileSaveFailure({ status: 400, message: "property foo should not exist" });
  assert.deepEqual([english.state.problem?.field, english.log], ["form", true]);
});

test("taxProfileSaveFailure — 404 · 429 · 503 · 500 · 연결 실패", () => {
  assert.deepEqual([taxProfileSaveFailure({ status: 404, message: "소속을 찾을 수 없습니다" }).log], [false]);
  assert.equal(taxProfileSaveFailure({ status: 429, message: "ThrottlerException" }).state.problem?.field, "form");
  const key = "신고 정보를 지금 다룰 수 없습니다. 잠시 뒤 다시 시도해 주세요";
  // 저장 전 조회의 503 사유(「볼 수 없습니다」)를 그대로 쓰지 않는다
  assert.equal(taxProfileSaveFailure({ status: 503, message: key }).state.problem?.message, `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}`);
  assert.equal(
    taxProfileSaveFailure({ status: 503, message: "신고 정보를 지금 볼 수 없습니다. 잠시 뒤 다시 시도해 주세요" }).state.problem?.message,
    `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}`,
  );
  assert.match(taxProfileSaveFailure({ status: 503, message: "Service Unavailable" }).state.problem?.message ?? "", /저장하지 못했습니다/);
  assert.match(taxProfileSaveFailure({ status: 500, message: "신고 정보를 읽을 수 없습니다" }).state.problem?.message ?? "", /근무지 점포에 알려/);
  assert.equal(taxProfileSaveFailure({ status: 403, message: "Forbidden" }).log, true);
  assert.equal(taxProfileSaveFailure("network").state.problem?.field, "form");
});

test("taxProfileEditBlocked — 신고 정보가 없으면 고치지 않는다(첫 입력은 150)", () => {
  assert.deepEqual(taxProfileEditBlocked({ taxProfile: null }), { problem: { field: "form", message: TAX_PROFILE_MISSING } });
  assert.equal(taxProfileEditBlocked({ taxProfile: { rrnMasked: "900101-1******" } }), null);
  // 그사이 없어져 api 가 처음 작성으로 본 경우(TAX_PROFILE_INCOMPLETE)도 같은 문구다.
  assert.equal(taxProfileSaveFailure({ status: 400, message: "사유", code: "TAX_PROFILE_INCOMPLETE" }).state.problem?.message, TAX_PROFILE_MISSING);
});

test("validateTaxProfileEdit — 실패 상태에 넣은 숫자(원문)가 남지 않는다", () => {
  const cases: [Parameters<typeof validateTaxProfileEdit>[0], RegExp][] = [
    [input({ rrnFront: "900101", rrnBack: "234567" }), /900101|234567/], // 앞 6 + 뒤 6
    [input({ rrnFront: "900101", rrnBack: "23456789" }), /900101|23456789/], // 뒤 8
    [input({ rrnFront: "900101", rrnBack: "2345678", bankCode: "B004" }), /900101|2345678/], // 맞는 주민번호 + 은행만
    [input({ rrnFront: "900101", rrnBack: "2345678", bankCode: "B004", payrollAccountNumber: "987654321" }), /900101|2345678|987654321/], // 9자리 계좌
  ];
  for (const [value, digits] of cases) {
    const result = validateTaxProfileEdit(value);
    assert.ok(!("body" in result));
    assert.doesNotMatch(JSON.stringify(result), digits);
  }
});

test("validateTaxProfileEdit — 주민등록번호 뒷자리 · 공백 · 하이픈", () => {
  for (const back of ["234567", "23456789"]) assert.deepEqual(problemOf(validateTaxProfileEdit(input({ rrnFront: "900101", rrnBack: back }))), { field: "rrn", message: RRN_SHAPE });
  assert.deepEqual(problemOf(validateTaxProfileEdit(input({ rrnBack: "2345678" }))), { field: "rrn", message: RRN_SHAPE });
  assert.deepEqual(validateTaxProfileEdit(input({ rrnFront: "90-01 01", rrnBack: "234 56-78" })), { body: { rrn: "9001012345678" } });
  assert.deepEqual(validateTaxProfileEdit(input({ bankCode: "B004", payrollAccountNumber: " 123 456-7890 " })), {
    body: { bankCode: "B004", payrollAccountNumber: "1234567890" },
  });
});

test("rrnBirthMismatch — 세기 표 각 자리와 2000년 경계", () => {
  assert.equal(rrnBirthMismatch("990101", "0", "1899-01-01"), false);
  assert.equal(rrnBirthMismatch("050302", "4", "2005-03-02"), false);
  assert.equal(rrnBirthMismatch("900101", "5", "1990-01-01"), false);
  assert.equal(rrnBirthMismatch("900101", "6", "1990-01-01"), false);
  assert.equal(rrnBirthMismatch("050302", "8", "2005-03-02"), false);
  assert.equal(rrnBirthMismatch("000101", "3", "2000-01-01"), false);
  assert.equal(rrnBirthMismatch("000101", "1", "2000-01-01"), true);
});

test("validateTaxProfileEdit — 계좌 16자리 · 은행 코드 20자 경계", () => {
  assert.deepEqual(validateTaxProfileEdit(input({ bankCode: "B004", payrollAccountNumber: "1".repeat(16) })), {
    body: { bankCode: "B004", payrollAccountNumber: "1".repeat(16) },
  });
  assert.deepEqual(validateTaxProfileEdit(input({ bankCode: "B".repeat(20), payrollAccountNumber: "1234567890" })), {
    body: { bankCode: "B".repeat(20), payrollAccountNumber: "1234567890" },
  });
  assert.equal(problemOf(validateTaxProfileEdit(input({ bankCode: "B".repeat(21), payrollAccountNumber: "1234567890" })))?.field, "bank");
});

test("taxProfileSaveFailure — 문구 · 남기기까지 확인", () => {
  assert.deepEqual(taxProfileSaveFailure({ status: 404, message: "소속을 찾을 수 없습니다" }), {
    state: { problem: { field: "form", message: "이 근무지의 신고 정보를 고칠 수 없습니다. 소속 근무지에서 다시 열어 주세요" } },
    log: false,
  });
  assert.deepEqual(taxProfileSaveFailure({ status: 429, message: "ThrottlerException" }), { state: { problem: { field: "form", message: RATE_LIMITED } }, log: false });
  assert.deepEqual(taxProfileSaveFailure({ status: 502, message: "Bad Gateway" }), {
    state: { problem: { field: "form", message: `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}` } },
    log: false,
  });
  assert.deepEqual(taxProfileSaveFailure({ status: 409, message: "Conflict" }), {
    state: { problem: { field: "form", message: `신고 정보를 저장하지 못했습니다. ${RETRY_LATER}` } },
    log: true,
  });
  assert.deepEqual(taxProfileSaveFailure({ status: 400, message: "바꿀 값을 보내 주세요", code: "TAX_PROFILE_EMPTY" }), {
    state: { problem: { field: "form", message: NOTHING_TO_CHANGE } },
    log: true,
  });
  assert.deepEqual(taxProfileSaveFailure({ status: 400, message: "급여 계좌는 은행과 계좌번호를 함께 보내 주세요", code: "TAX_PROFILE_ACCOUNT_INCOMPLETE" }), {
    state: { problem: { field: "account", message: ACCOUNT_INCOMPLETE } },
    log: true,
  });
  assert.deepEqual(taxProfileSaveFailure("network"), { state: { problem: { field: "form", message: CONNECTION_FAILED } }, log: false });
});
