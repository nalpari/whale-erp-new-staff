// node --test src/lib/contract-actions.test.ts
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  OUTCOME_UNKNOWN,
  SIGN_DEADLINE_PASSED,
  REJECT_REASON_MAX,
  SIGNATURE_MAX_BYTES,
  contractActionFailure,
  isSentAt,
  mismatchText,
  readRejectReason,
  signatureProblem,
} from "./contract-actions.ts";

const IDENTITY_LABELS = [
  { value: "name", label: "이름" },
  { value: "phone", label: "휴대전화번호" },
  { value: "birthDate", label: "생년월일" },
  { value: "gender", label: "성별" },
  { value: "isForeigner", label: "외국인 여부" },
];

test("mismatchText — api 순서대로 enum 한글, 한글이 없는 값이 있거나 비면 null", () => {
  assert.equal(mismatchText(["name", "birthDate", "isForeigner"], IDENTITY_LABELS), "이름 · 생년월일 · 외국인 여부");
  assert.equal(mismatchText(["phone", "gender"], IDENTITY_LABELS), "휴대전화번호 · 성별");
  assert.equal(mismatchText(["name", "nationality"], IDENTITY_LABELS), null);
  assert.equal(mismatchText(["name"], []), null);
  assert.equal(mismatchText([], IDENTITY_LABELS), null);
});

test("readRejectReason — 비면 보내지 않고, NFC · 앞뒤 공백을 지운 뒤 500자까지", () => {
  assert.deepEqual(readRejectReason(null), {});
  assert.deepEqual(readRejectReason("   "), {});
  assert.deepEqual(readRejectReason("  근무 요일이 다릅니다 "), { reason: "근무 요일이 다릅니다" });
  assert.deepEqual(readRejectReason(`  ${"가".repeat(REJECT_REASON_MAX)}  `), { reason: "가".repeat(REJECT_REASON_MAX) });
  assert.ok("error" in readRejectReason("가".repeat(REJECT_REASON_MAX + 1)));
  // 풀어 쓴 한글(NFD)은 합친 뒤 센다
  assert.deepEqual(readRejectReason("가".normalize("NFD").repeat(REJECT_REASON_MAX)), { reason: "가".repeat(REJECT_REASON_MAX) });
});

test("signatureProblem — 비었거나 1MB 초과 · PNG 가 아니면 문구", () => {
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
  assert.equal(signatureProblem(png), null);
  assert.match(signatureProblem(new Uint8Array()) ?? "", /받지 못했습니다/);
  assert.match(signatureProblem(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0])) ?? "", /읽을 수 없습니다/);
  const big = new Uint8Array(SIGNATURE_MAX_BYTES + 1);
  big.set(png);
  assert.match(signatureProblem(big) ?? "", /너무 큽니다/);
  const exact = new Uint8Array(SIGNATURE_MAX_BYTES);
  exact.set(png);
  assert.equal(signatureProblem(exact), null);
});

test("isSentAt — 시간대가 있는 ISO 시각만", () => {
  assert.equal(isSentAt("2026-10-21T01:00:00.000Z"), true);
  assert.equal(isSentAt("2026-10-21T10:00:00+09:00"), true);
  assert.equal(isSentAt("2026-10-21T10:00:00"), false);
  assert.equal(isSentAt("2026-10-21"), false);
  assert.equal(isSentAt("xT00Z"), false);
  assert.equal(isSentAt(undefined), false);
});

const conflict = (code: string, message: string) => ({ status: 409, code, message });

test("contractActionFailure — 이미 그 결과인 409 는 성공으로", () => {
  const msg = "이미 체결 완료된 근로계약입니다. 화면을 새로 고쳐 지금 상태를 확인해 주세요";
  assert.deepEqual(contractActionFailure("sign", conflict("CONTRACT_STATUS_CONFLICT", msg), { status: "SIGNED" }), { done: true });
  assert.deepEqual(contractActionFailure("reject", conflict("CONTRACT_STATUS_CONFLICT", "이미 거부된"), { status: "REJECTED" }), { done: true });
  assert.deepEqual(contractActionFailure("correction", conflict("CONTRACT_STATUS_CONFLICT", "직원이"), { status: "CORRECTION_REQUESTED" }), {
    done: true,
  });
  // 다른 결과면 stale 과 api 문구
  assert.deepEqual(contractActionFailure("reject", conflict("CONTRACT_STATUS_CONFLICT", msg), { status: "SIGNED" }), {
    state: { stale: true, message: msg },
    log: false,
  });
});

test("contractActionFailure — 409 사유별", () => {
  const mismatchConflict = conflict("IDENTITY_MISMATCH", "계약서의 직원 정보가 가입한 정보와 다릅니다. 수정을 요청해 주세요");
  assert.deepEqual(contractActionFailure("sign", mismatchConflict, { mismatches: ["name", "gender"] }, IDENTITY_LABELS), {
    state: { stale: true, message: "계약서의 직원 정보(이름 · 성별)가 가입한 정보와 다릅니다. 계약서로 돌아가 수정을 요청해 주세요" },
    log: false,
  });
  // enum 을 못 받으면 항목 없이
  assert.deepEqual(contractActionFailure("sign", mismatchConflict, { mismatches: ["name"] }, []), {
    state: { stale: true, message: "계약서의 직원 정보가 가입한 정보와 다릅니다. 계약서로 돌아가 수정을 요청해 주세요" },
    log: false,
  });
  for (const [code, message] of [
    ["CONTRACT_RESENT", "근로계약서가 다시 발송됐습니다. 새로 고쳐 바뀐 계약서를 확인해 주세요"],
    ["STAFF_RETIRED", "퇴직한 직원은 근로계약을 처리할 수 없습니다"],
  ])
    assert.deepEqual(contractActionFailure("sign", conflict(code, message), {}), { state: { stale: true, message }, log: false });
  // 서명 기한 지남은 api 문구(「날인 기한」) 대신 화면 문구
  assert.deepEqual(contractActionFailure("reject", conflict("SIGN_DEADLINE_PASSED", "날인 기한이 지났습니다. 관리자에게 재발송을 요청해 주세요"), {}), {
    state: { stale: true, message: SIGN_DEADLINE_PASSED },
    log: false,
  });
  // 코드 없는 영어 409 는 대체 문구와 기록
  assert.deepEqual(contractActionFailure("sign", { status: 409, message: "Conflict" }, null), {
    state: { stale: true, message: "계약서 상태가 바뀌었습니다. 계약서를 다시 열어 확인해 주세요" },
    log: true,
  });
});

test("contractActionFailure — 404 · 429 · 400 · 5xx · 연결 실패", () => {
  assert.deepEqual(contractActionFailure("sign", { status: 404, message: "근로계약을 찾을 수 없습니다" }, null), {
    state: { stale: true, message: "계약서를 찾을 수 없습니다. 목록에서 다시 열어 주세요" },
    log: false,
  });
  const limited = contractActionFailure("reject", { status: 429, message: "ThrottlerException: Too Many Requests" }, null);
  assert.ok("state" in limited && !limited.state.stale && /잠시 막았습니다/.test(limited.state.message ?? ""));
  assert.deepEqual(contractActionFailure("sign", { status: 400, message: "PNG 파일만 올릴 수 있습니다." }, null), {
    state: { message: "PNG 파일만 올릴 수 있습니다." },
    log: false,
  });
  assert.deepEqual(contractActionFailure("sign", { status: 400, message: "sentAt must be a valid ISO 8601 date string" }, null), {
    state: { message: "서명 이미지를 보내지 못했습니다. 다시 그려 주세요" },
    log: true,
  });
  assert.deepEqual(contractActionFailure("reject", { status: 400, message: "거부 사유는 500자 이하로 입력해 주세요" }, null), {
    state: { field: "reason", message: "거부 사유는 500자 이하로 입력해 주세요" },
    log: false,
  });
  assert.deepEqual(contractActionFailure("sign", { status: 503, message: "서명을 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요" }, null), {
    state: { message: "서명을 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요" },
    log: false,
  });
  assert.deepEqual(contractActionFailure("sign", { status: 500, message: "Internal server error" }, null), {
    state: { message: OUTCOME_UNKNOWN },
    log: false,
  });
  const network = contractActionFailure("correction", "network", null);
  assert.ok("state" in network && !network.state.stale && network.state.message?.endsWith(OUTCOME_UNKNOWN));
  assert.deepEqual(contractActionFailure("correction", { status: 403, message: "Forbidden" }, null), {
    state: { message: "처리하지 못했습니다. 계약서를 다시 열어 확인해 주세요" },
    log: true,
  });
});
