// 근로계약서 화면 규칙과 문구(WHALEERP-146). 상태 없는 순수 함수만 둔다 — 가져오기는 contracts.ts 다.
// node --test 가 직접 읽으므로 값 import 는 같은 폴더의 순수 모듈(.ts 확장자)만 둔다.
import { KST_OFFSET_MS, kstDateLabel, kstDateTimeLabel } from "./profile.ts";
import type { ContractArticle, ContractBlock, ContractDetail, ContractDocument, ContractListItem, ContractStatus } from "./contracts";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_ID = 2_147_483_647;

/** 남은 날인 기한이 이 날수 이내면 강조색으로 보인다(CON-4). 임박 알림은 없다. */
export const URGENT_DAYS = 7;

/** ISO 시각의 한국 달력 날짜(UTC 자정 ms). 한국은 서머타임이 없어 9시간만 민다. */
const kstDay = (ms: number) => Math.floor((ms + KST_OFFSET_MS) / DAY_MS);

const pad = (n: number) => String(n).padStart(2, "0");
/** ISO 시각 → 한국 날짜 「2026.09.12」(데모 contract 의 점 표기). */
const kstDot = (iso: string) => {
  const k = new Date(Date.parse(iso) + KST_OFFSET_MS);
  return `${k.getUTCFullYear()}.${pad(k.getUTCMonth() + 1)}.${pad(k.getUTCDate())}`;
};
/** ISO 시각 → 한국 시각 「2026.09.12 10:23」. */
const kstDotTime = (iso: string) => {
  const k = new Date(Date.parse(iso) + KST_OFFSET_MS);
  return `${kstDot(iso)} ${pad(k.getUTCHours())}:${pad(k.getUTCMinutes())}`;
};
/** YYYY-MM-DD → 「2026.09.15」. 달력 날짜라 시간대를 따지지 않는다. */
const dotDate = (date: string) => date.replaceAll("-", ".");

/**
 * 화면이 보이는 계약 단계. api 상태 그대로이되, 서명 대기인데 api 가 지금 날인할 수 없다고 하면(awaitingSignature=false — 서명 대기 ·
 * 기한 안 · 재직 중 셋 중 하나가 아님) 서명 대기로 보이지 않는다. 날인할 수 있는지는 api 의 awaitingSignature 로만 정하고, 서버 시계는
 * 그 까닭을 문구로 고를 때만 본다 — 기한이 지났으면 만료(하루 배치가 만료로 바꾸기 전), 아니면 퇴직 등으로 서명할 수 없음(UNSIGNABLE).
 */
export type ContractPhase = ContractStatus | "UNSIGNABLE";

type PhaseFields = Pick<ContractListItem, "status" | "awaitingSignature" | "signDeadlineAt">;

export function phaseOf(c: PhaseFields, now: Date): ContractPhase {
  if (c.status !== "PENDING_SIGNATURE" || c.awaitingSignature) return c.status;
  return c.signDeadlineAt && Date.parse(c.signDeadlineAt) <= now.getTime() ? "EXPIRED" : "UNSIGNABLE";
}

/**
 * 화면 단계의 한글. 보통은 api enum 한글(enumLabel, ContractStatus)을 그대로 쓴다. 예외만 값을 코드에 적는다:
 * 서명 불가(UNSIGNABLE)는 enum 값이 아닌 화면 단계이고, 서명 거절(REJECTED)은 용어집(2026-10-28 재영)이 직원 앱 화면에서 「거절」로
 * 부르기로 해서다. 직원 서명 대기 · 직원 수정 요청은 직원 본인 화면이라 「직원」을 떼고 부른다(WHALEERP-659). enum 한글은 관리자 웹이 쓴다.
 */
export function phaseLabel(phase: ContractPhase, enumLabel: string): string {
  if (phase === "UNSIGNABLE") return "서명 불가";
  if (phase === "REJECTED") return "거절";
  if (phase === "PENDING_SIGNATURE") return "서명 대기";
  if (phase === "CORRECTION_REQUESTED") return "수정 요청";
  return enumLabel;
}

export type Deadline = {
  /** api 의 기한(ISO 8601) */
  at: string;
  /** 「2026년 9월 12일」(한국 날짜) */
  date: string;
  /** 「2026년 9월 12일 10:23」(한국 시각) — api 의 기한은 발송 시각 + 30일 그 시각이라 하루 끝이 아니다 */
  dateTime: string;
  /** 기한 날짜 − 오늘(한국 달력), 0 아래로 내리지 않는다 */
  daysLeft: number;
  /** 남은 날이 URGENT_DAYS 이내 */
  urgent: boolean;
};

/**
 * 날인 기한 — api 가 지금 날인할 수 있다고 할 때(awaitingSignature)만. 남은 날은 한국 달력 날짜로 센다(기한이 오늘이면 0).
 * 기한 안인지는 api 가 이미 판정했으므로 서버 시계로 다시 「지남」을 가리지 않는다. 그 밖이면 null.
 */
export function deadlineOf(c: PhaseFields, now: Date): Deadline | null {
  if (c.status !== "PENDING_SIGNATURE" || !c.awaitingSignature || !c.signDeadlineAt) return null;
  const daysLeft = Math.max(0, kstDay(Date.parse(c.signDeadlineAt)) - kstDay(now.getTime()));
  return { at: c.signDeadlineAt, date: kstDateLabel(c.signDeadlineAt), dateTime: kstDateTimeLabel(c.signDeadlineAt), daysLeft, urgent: daysLeft <= URGENT_DAYS };
}

/**
 * 목록 줄 「서명 기한 2026.09.12 · D-2」, 상세 머리 카드 「서명 기한 2026.09.12 · 2일 남음」(당일은 「오늘 마감」, 데모 contract).
 * 기한이 오늘 · 내일이면 둘 다 시각까지 「서명 기한 2026.09.12 10:23 · D-1」 — 기한은 하루 끝이 아니라 발송 시각 + 30일 그
 * 시각이라(api) 날짜만 보이면 그날 저녁까지 남은 줄 안다 — 내일 이른 시각이면 남은 시간이 한 시간일 수도 있다.
 */
export function deadlineText(d: Deadline, style: "list" | "detail"): string {
  return `서명 기한 ${isDeadlineNear(d) ? kstDotTime(d.at) : kstDot(d.at)} · ${leftText(d, style)}`;
}

const leftText = (d: Deadline, style: "list" | "detail") =>
  style === "list" ? (d.daysLeft === 0 ? "D-day" : `D-${d.daysLeft}`) : d.daysLeft === 0 ? "오늘 마감" : `${d.daysLeft}일 남음`;

/** 기한까지 남은 날(한국 달력) — 「5일 남음」, 당일은 「오늘 마감」. 근무지 추가 요청 시트의 답변 기한 꺾은선 줄이 쓴다. */
export function daysLeftText(atIso: string, now: Date): string {
  const days = Math.max(0, kstDay(Date.parse(atIso)) - kstDay(now.getTime()));
  return days === 0 ? "오늘 마감" : `${days}일 남음`;
}

/** 기한을 시각까지 보일 만큼 가까운지 — 오늘 · 내일(위 deadlineText 의 까닭). 목록 · 홈 서명 대기 카드가 같이 쓴다. */
export const isDeadlineNear = (d: Deadline): boolean => d.daysLeft <= 1;

/**
 * 홈 서명 요청 팝업의 「서명 기한」 — 값 「2026년 9월 12일 10:23까지」와 그 아래 꺾은선 줄 「2일 남음」(당일은 「오늘 마감」).
 * 홈 화면 문구라 계약 화면(deadlineText)과 따로 둔다.
 */
export function popupDeadline(d: Deadline): { until: string; left: string } {
  return { until: `${d.dateTime}까지`, left: leftText(d, "detail") };
}

/** 「2026.09.15 – 2027.03.14」, 끝이 없으면 「2026.03.01부터 · 기간 정함 없음」(데모 contract 의 점 표기). */
export function periodText(startDate: string | null, endDate: string | null): string {
  if (!startDate) return "-";
  return endDate ? `${dotDate(startDate)} – ${dotDate(endDate)}` : `${dotDate(startDate)}부터 · 기간 정함 없음`;
}

/**
 * 목록 줄 · 상세 머리 카드의 둘째 줄(날짜는 점 표기, 데모 contract). 날인할 수 있는 서명 대기는 기한, 체결 완료는 서명한 날(종이 계약은
 * 관리자가 올린 날), 거부 · 수정 요청은 그날(processedAt), 만료(기한이 지난 서명 대기 포함)는 지난 기한, 서명 불가는 그 까닭, 종료는 계약 기간.
 * 상세는 전자계약 체결 완료 · 만료에 받은 날(sentAt — 마지막 발송)을 더한다 「서명 2026.08.23 · 받은 날 2026.08.01」 ·
 * 「받은 날 2026.07.01 · 서명 기한 2026.07.31」. statusLabel 은 화면 단계의 한글(phaseLabel).
 */
export function contractSubText(
  c: PhaseFields & Pick<ContractListItem, "contractMethod" | "processedAt" | "startDate" | "endDate" | "sentAt">,
  now: Date,
  statusLabel: string,
  style: "list" | "detail" = "list",
): string {
  const deadline = deadlineOf(c, now);
  if (deadline) return deadlineText(deadline, style);
  const on = (iso: string | null) => (iso ? ` ${kstDot(iso)}` : "");
  const received = style === "detail" && c.sentAt ? `받은 날 ${kstDot(c.sentAt)}` : null;
  switch (phaseOf(c, now)) {
    case "SIGNED":
      if (c.contractMethod === "PAPER") return `종이 계약 ·${on(c.processedAt)} 등록`;
      return [`서명${on(c.processedAt)}`, received].filter(Boolean).join(" · ");
    case "EXPIRED":
      if (!c.signDeadlineAt) return received ?? statusLabel;
      return received ? `${received} · 서명 기한 ${kstDot(c.signDeadlineAt)}` : `서명 기한 ${kstDot(c.signDeadlineAt)} 지남`;
    case "UNSIGNABLE":
      return "지금은 서명할 수 없습니다";
    case "ENDED":
      return periodText(c.startDate, c.endDate);
    default:
      return `${statusLabel}${on(c.processedAt)}`;
  }
}

/** 상태 배지 색. 서명 대기만 강조, 거부 · 만료는 오류 색, 체결 완료는 정상, 종료 · 서명 불가는 중립(데모 contract). */
export function statusTone(phase: ContractPhase): "warning" | "success" | "danger" | "waiting" | "progress" {
  switch (phase) {
    case "PENDING_SIGNATURE":
      return "warning";
    case "SIGNED":
      return "success";
    case "REJECTED":
    case "EXPIRED":
      return "danger";
    case "CORRECTION_REQUESTED":
      return "progress";
    default:
      return "waiting";
  }
}

/** 처리가 끝난 계약 — 다시 서명 · 거부할 수 없고 읽기만 한다. 날인할 수 있는 서명 대기 · 수정 요청만 아직 진행 중이다. */
export const isFinished = (phase: ContractPhase) => phase !== "PENDING_SIGNATURE" && phase !== "CORRECTION_REQUESTED";

/**
 * 목록 묶음: 진행 중(날인할 수 있는 서명 대기 · 수정 요청)과 처리가 끝난 것. 기한이 지났거나 퇴직 등으로 날인할 수 없는 서명 대기는
 * 상세와 같게 처리가 끝난 쪽이다. 각 묶음 안은 api 순서(날인 대기는 기한이 급한 순, 그다음 최근 것) 그대로.
 */
export function groupContracts<T extends PhaseFields>(items: readonly T[], now: Date): { open: T[]; finished: T[] } {
  const done = (c: T) => isFinished(phaseOf(c, now));
  return { open: items.filter((c) => !done(c)), finished: items.filter(done) };
}

/** 경로의 계약 번호 · 주소의 점포 번호. api 의 id 는 integer 라 1..2147483647 밖은 없는 것으로 본다. */
export function parseId(raw: string | string[] | undefined): number | null {
  if (typeof raw !== "string" || !/^[1-9][0-9]*$/.test(raw)) return null;
  const id = Number(raw);
  return id <= MAX_ID ? id : null;
}

/**
 * 계약서 조항 하나를 화면에 놓는 모양(WHALEERP-661). 첫 블록이 TEXT 면 제목 뒤에 잇는 문장(lead)이고, 나머지 블록은 받은 순서대로
 * 아래에 둔다 — api 조항 템플릿(WHALEERP-131)이 정한 규칙이고 보낸 원본 · 처리 완료본 PDF 도 이렇게 그린다.
 */
/**
 * 전자계약인데 조항(articles)이 비었다 — api 가 조항을 늘 열 개 보내므로 api 오류일 때만이다. 본문 없는 계약서에 서명하지 않게
 * 상세는 서명 · 거절 · 수정 요청을 열지 않고 안내만 보이며, 서명 화면은 상세로 돌려보낸다. 종이 계약은 본문을 그리지 않아 해당 없다.
 */
export const bodyMissing = (c: Pick<ContractDetail, "contractMethod" | "articles">) => c.contractMethod !== "PAPER" && c.articles.length === 0;

export function articleLayout(article: ContractArticle): { lead: string | null; rest: ContractBlock[] } {
  const [first, ...rest] = article.blocks;
  if (first?.type === "TEXT") return { lead: first.text ?? "", rest };
  return { lead: null, rest: article.blocks };
}

/** 「010-****-5521」 — 가운데를 가린다. 휴대전화번호 모양(01 로 시작하는 10~11자리)이 아니면 끝 4자리만 남긴다 「****-1234」. */
export function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^01\d{8,9}$/.test(digits)) return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  return digits.length >= 4 ? `****-${digits.slice(-4)}` : "****";
}

/** 종이 계약(CTR-23)에서 보이는 파일 — 관리자가 올린 날인본(필수)과 임금계약서(선택). 날인본이 먼저. */
export function paperDocuments(documents: readonly ContractDocument[]): ContractDocument[] {
  const order = (d: ContractDocument) => (d.kind === "PAPER_EMPLOYMENT_CONTRACT" ? 0 : 1);
  return documents.filter((d) => d.kind === "PAPER_EMPLOYMENT_CONTRACT" || d.kind === "WAGE_CONTRACT").sort((a, b) => order(a) - order(b));
}

/**
 * 내보낼 처리 완료본(WHALEERP-149) — 체결이 끝난 전자계약(체결 완료 · 종료)의 SIGNED_COPY. 서명 대기 · 수정 요청 · 거절 · 만료와
 * 종이 계약은 null. 처리 완료본은 파일 생성(WHALEERP-131)이 만들어야 생기므로 없으면 null. 여럿이면 가장 나중 것.
 * api(#182)는 체결 완료와 체결 완료에서 종료된 계약만 받고 그 밖은 409 — 받기 라우트가 상세의 「지금은 받을 수 없음」 안내로 돌린다.
 */
export function signedCopyOf(c: Pick<ContractDetail, "status" | "contractMethod" | "documents">): ContractDocument | null {
  if (c.contractMethod === "PAPER" || (c.status !== "SIGNED" && c.status !== "ENDED")) return null;
  return c.documents.reduce<ContractDocument | null>(
    (last, d) => (d.kind === "SIGNED_COPY" && (!last || d.contractDocumentId > last.contractDocumentId) ? d : last),
    null,
  );
}

/**
 * 서명 대기인데 서명할 수 없는 까닭 — 상세 머리 안내 · 버튼 줄을 고른다. 본인 대조가 다르면 「IDENTITY」(api 가 대조를 먼저 보아
 * 409 IDENTITY_MISMATCH), 대조는 맞는데 근무지가 운영 중이 아니면 「STORE」(api #301 `storeNotOperating` — 미운영 · 폐점 ·
 * 사업주 정보(대표자 · 사업자등록번호) 없음, 날인 409 STORE_NOT_OPERATING), 둘 다 아닌데 서명할 수 없다고 하면 「OTHER」(모르는
 * 까닭 — 대조 안내로 잘못 보이지 않게), 서명할 수 있거나 서명 대기가 아니면 null. `storeNotOperating` 이 없는 옛 응답(api 배포
 * 전)은 `=== true` 가 아니라 운영 중인 것으로 본다.
 */
export function signBlockOf(
  c: Pick<ContractDetail, "awaitingSignature" | "signable" | "mismatches" | "storeNotOperating">,
): "IDENTITY" | "STORE" | "OTHER" | null {
  if (!c.awaitingSignature || c.signable) return null;
  if (c.mismatches.length > 0) return "IDENTITY";
  return c.storeNotOperating === true ? "STORE" : "OTHER";
}

/**
 * 상세 아래 버튼 줄(서명 · 수정 요청 · 거절)을 둘까 — 서명 대기이고 본문이 있으며, 서명할 수 있거나 본인 대조만 다를 때(수정 요청이
 * 고치는 길이다). 근무지가 운영 중이 아니거나(STORE) 까닭을 모르면(OTHER) 두지 않는다 — 수정 요청 · 거절을 누르면 관리자가 고쳐도
 * 다시 보내기 전까지 서명할 수 없다(사용자 결정 2026-11-18). 고쳐지면 다시 열어 서명한다.
 */
export function canDecideOf(
  awaitingSignature: boolean,
  noBody: boolean,
  signBlock: ReturnType<typeof signBlockOf>,
): boolean {
  return awaitingSignature && !noBody && (signBlock === null || signBlock === "IDENTITY");
}

/**
 * 사업주 전화번호를 화면에 보일 모양 — api 는 숫자만 준다. 계약서 PDF 처럼 하이픈을 넣는다(2026-11-20 사용자 지정).
 * 02(서울)는 2-3/4-4, 15XX · 16XX · 18XX 대표번호(8자리)는 4-4, 그 밖(010 · 031 · 070 등)은 3-3/4-4. 모양이 맞지 않으면 받은 그대로.
 */
export function formatTelephone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  if (/^02\d{7,8}$/.test(d)) return `02-${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
  if (/^1[5-9]\d{6}$/.test(d)) return `${d.slice(0, 4)}-${d.slice(4)}`;
  if (/^0\d{9,10}$/.test(d)) return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  return raw;
}

/** 사업자등록번호 「105-87-63602」 — 10자리 숫자일 때만 3-2-5 로 나눈다. 아니면 받은 그대로. */
export function formatBizNumber(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, "");
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : raw;
}
