"use client";

// 근로계약 데모. 기준 목업: docs/mockup/app/contract.html — 상태 11개(목록 · 상세 · 서명란 · 서명 뒤 · 처리 중 · 날인 완료 · 다시 보기 ·
// 종이 계약 · 거부 완료 · 빈 상태 · 만료)와 시트 1개(거부 사유), 화면 문구·가짜 값·계약서 본문·버튼의 이동(data-go)·알림(data-toast)을 옮겼다.
// 확정 쟁점: 계약서를 앱 글꼴(Pretendard)로 화면에 직접 그리고 체결 완료만 완료본 내보내기(CON-1) · 날인은 필기 서명 — 서명란에 그려야 날인 확정이 살아나고
// 다시 그리기로 지운다(CON-2, 실제로 그리는 캔버스) · 거부 사유는 선택(CON-3) · 남은 기한 7일 이내만 강조색, 임박 알림 없음(CON-4) ·
// 날인 기한 30일 · 근로계약 상태 6종, 발송 대기는 이 화면에 나오지 않는다(CON-5) · 종이 계약은 조항 없이 올라온 날인본 파일만, 임금계약서는 선택(CON-8).
// 노무사 검토 중: 제4조 휴일(CON-6) · 제7조 연차유급휴가(CON-7)는 「문구 확정 전」, 제6조·제8조는 「문구는 노무사 검토 중(PAY-5)」 그대로.
// Figma 없음 — DESIGN.md 기준 초안.
// 목업과 다른 점: 목업 btn--quiet(완료본 내보내기 등)는 홈 데모처럼 outline 버튼이다. 종이 계약에도 목업에 없는 뒤로 가기를 둬 목록으로 간다.
// 목업 seal(인주색 도장)은 다른 데모처럼 날인 완료는 정상·완료 색, 거부 완료는 거부 배지와 같은 오류 색이다.
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { Badge, BottomSheet, Button, MaskIcon, Notice, PageHeader, type BadgeTone } from "@/components/common";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DemoStates, useDemoState } from "../_components";
import { SignaturePad } from "./signature-pad";

// 목업 오른쪽 목록 순서 그대로. 마지막은 목업의 「시트 열기」라 상세 위에 시트를 띄운다.
const STATES = [
  { id: "list", label: "목록", note: "처리할 것과 지난 것" },
  { id: "detail", label: "상세", note: "서명 대기" },
  { id: "sign", label: "서명란", note: "비어 있음" },
  { id: "sign-drawn", label: "서명 뒤", note: "날인 확정 가능" },
  { id: "signing", label: "처리 중", note: "버튼 비활성" },
  { id: "signed", label: "날인 완료", note: "확정" },
  { id: "readonly", label: "다시 보기", note: "읽기 전용" },
  { id: "paper", label: "종이 계약", note: "관리자가 올린 날인본" },
  { id: "rejected", label: "거부 완료", note: "재발송 대기" },
  { id: "empty", label: "빈 상태", note: "계약 없음" },
  { id: "expired", label: "만료", note: "기한 지남" },
  { id: "reject", label: "거부 사유", note: "선택 입력" },
];

// 머리줄 뒤로 가기(목업 data-go-back = 직전 상태). 목록·빈 상태는 홈으로, 날인 완료·거부 완료는 머리줄이 없다.
const BACK: Record<string, string> = {
  detail: "list",
  sign: "detail",
  "sign-drawn": "detail",
  signing: "detail",
  readonly: "list",
  paper: "list",
  expired: "list",
};

const HOME = "/demo/home";
const TAX = "/demo/tax#intro"; // 목업 tax.html 첫 상태 「안내 · 날인 직후」

// 목록. 서명 대기를 위로, 그중 기한이 급한 순. 남은 기한 7일 이내만 강조색(CON-4).
const CONTRACTS = [
  { title: "웨일카페 강남역점 · 파트타이머", sub: "날인 기한 2026-09-12 · D-2", status: "서명 대기", to: "detail", urgent: true },
  { title: "웨일카페 홍대점 · 파트타이머", sub: "날인 기한 2026-10-11 · D-30", status: "서명 대기", to: "detail" },
  { title: "웨일카페 홍대점 · 정직원", sub: "날인 2026-08-23", status: "체결 완료", to: "readonly" },
  { title: "웨일카페 홍대점 · 파트타이머", sub: "종이 계약 · 관리자 등록 2026-04-02", status: "체결 완료", to: "paper" },
  { title: "웨일카페 강남역점 · 파트타이머", sub: "거부 2026-06-25", status: "거부", to: "rejected" },
  { title: "웨일카페 홍대점 · 파트타이머", sub: "기한 2026-07-31 지남", status: "만료", to: "expired" },
  { title: "웨일카페 강남역점 · 파트타이머", sub: "2025-03-01 ~ 2026-08-31", status: "종료", to: "readonly" },
];
// 서명 대기만 강조, 거부·만료는 오류 색, 체결 완료는 정상, 종료는 중립(목업 해설 「이 화면이 하는 일」).
const STATUS_TONE: Record<string, BadgeTone> = { "서명 대기": "warning", "체결 완료": "success", 거부: "danger", 만료: "danger", 종료: "waiting" };

const REJECT_SAMPLE = "근무 요일이 채용 공고 내용과 달라 다시 확인을 요청합니다.";

export default function DemoContractPage() {
  const [state, move] = useDemoState(STATES);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submittedReason, setSubmittedReason] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const view = state === "reject" ? "detail" : state;
  const back = BACK[view];

  const go = (id: string, message?: string, direction: "nav-forward" | "nav-back" = "nav-forward") => {
    setSheetOpen(false);
    move(id, direction);
    if (message) setToast(message);
  };
  const handleSheetClose = () => {
    setSheetOpen(false);
    if (state === "reject") move("detail", "nav-back");
  };
  const handleRejectConfirm = () => {
    setSubmittedReason(reason.trim());
    go("rejected", "거부를 등록했습니다");
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      {/* 서명란과 서명 뒤는 같은 화면이라 한 key 로 둔다 — 그린 선이 남고 슬라이드가 일지 않는다. */}
      <PageSlide key={view === "sign-drawn" ? "sign" : view}>
        <main className="flex flex-1 flex-col leading-[1.5]">
          {(view === "list" || view === "empty") && <PageHeader title="근로계약" backHref={HOME} />}
          {back && <BackHeader title="근로계약" onBack={() => go(back, undefined, "nav-back")} />}

          {view === "list" && (
            <Body>
              <ul className="flex flex-col divide-y divide-staff-border-light overflow-hidden rounded-[16px] border border-staff-border-light bg-white">
                {CONTRACTS.map((c, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => go(c.to)}
                      className="flex min-h-[44px] w-full items-center gap-[12px] p-[16px] text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                        <span className="truncate text-[15px] font-semibold">{c.title}</span>
                        {/* 기한 7일 이내: 상태 칩 지각·긴급 글자색(#956013) */}
                        <span className={`text-[12px] ${c.urgent ? "font-semibold text-[#956013]" : "text-staff-text-muted"}`}>{c.sub}</span>
                      </span>
                      <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                      <span className="flex text-staff-placeholder">
                        <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <Tiny>
                날인 기한은 발송일로부터 30일입니다. 서명 대기를 위로 올리고 그중 기한이 급한 것을 먼저 보여줍니다. 남은 기한이 7일 이내면 강조색으로
                표시합니다.
              </Tiny>
            </Body>
          )}

          {view === "detail" && (
            <>
              <Body>
                {/* 남은 기한 7일 이내라 머리 카드가 강조색이다(CON-4). 상태 칩 지각·긴급 색(#FFF6E5 · #956013). */}
                <section className="flex items-center gap-[12px] rounded-[16px] bg-[#fff6e5] p-[16px]">
                  <span className="flex text-[#956013]">
                    <MaskIcon src="/icons/contract.svg" size={18} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <p className="text-[15px] font-bold">웨일카페 강남역점 · 파트타이머</p>
                    <p className="text-[12px] font-semibold text-[#956013]">날인 기한 2026-09-12 · 남은 기한 2일</p>
                  </div>
                  <Badge tone="warning">서명 대기</Badge>
                </section>

                <ContractDocument {...PART_TIME} />
                <Tiny>
                  연장·야간·휴일 가산을 적용할지는 계약서가 아니라 <b>급여명세서마다 관리자가 정합니다.</b> 상시근로자 5인 미만 여부는 직원이 아니라
                  사업장의 사실이고 달마다 바뀔 수 있기 때문입니다. 계약서에는 법에 따라 가산한다는 일반 문구만 둡니다.
                </Tiny>

                <Sunken label="본인인증으로 확인된 정보">
                  <Values
                    rows={[
                      ["성명", "김민서"],
                      ["생년월일", "1999-04-12"],
                      ["휴대전화", "010-****-5521"],
                      ["주소", "서울 강남구 역삼로 12 (가입 시 입력)"],
                    ]}
                  />
                </Sunken>
                <Tiny>날인 또는 거부하면 담당 관리자에게 이메일과 운영 알림함 알림이 함께 생성됩니다.</Tiny>
              </Body>
              <Dock>
                <Button onClick={() => go("sign")}>날인하기</Button>
                <Button variant="ghost" onClick={() => setSheetOpen(true)}>
                  거부하기
                </Button>
              </Dock>
            </>
          )}

          {(view === "sign" || view === "sign-drawn") && (
            <>
              <Body>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="text-[22px] font-bold">서명란에 서명해 주세요</h2>
                  <p className="text-[14px] text-staff-text-sub">손가락으로 서명하면 날인이 됩니다. 확정한 뒤에는 되돌릴 수 없습니다.</p>
                </div>
                <SignaturePad drawn={view === "sign-drawn"} onDraw={() => view === "sign" && move("sign-drawn")} />
                <Sunken>
                  <Values
                    rows={[
                      ["대상 계약", "웨일카페 강남역점 · 파트타이머"],
                      ["서명하는 사람", "김민서"],
                    ]}
                  />
                </Sunken>
              </Body>
              {/* 그리기와 확정을 두 번에 나눈다(CON-2). 그리기 전에는 날인 확정이 꺼져 있다. */}
              <Dock>
                {view === "sign" ? (
                  <>
                    <Button disabled>날인 확정</Button>
                    <Button variant="ghost" onClick={() => go("detail", undefined, "nav-back")}>
                      계약서로 돌아가기
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => go("signed", "날인을 등록했습니다")}>날인 확정</Button>
                    <Button variant="ghost" onClick={() => move("sign", "nav-back")}>
                      다시 그리기
                    </Button>
                  </>
                )}
              </Dock>
            </>
          )}

          {view === "signing" && (
            <>
              <Body center>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="text-[22px] font-bold">요청을 처리하는 중입니다</h2>
                  <p className="text-[14px] text-staff-text-sub">처리가 끝날 때까지 화면을 벗어나지 마세요. 처리하는 동안 날인과 거부 버튼은 눌리지 않습니다.</p>
                </div>
                <Sunken>
                  <Values rows={[["대상 계약", "웨일카페 강남역점 · 파트타이머"]]} />
                </Sunken>
              </Body>
              <Dock>
                <Button disabled>날인하기</Button>
                <Button variant="ghost" disabled>
                  거부하기
                </Button>
              </Dock>
            </>
          )}

          {view === "signed" && (
            <>
              <Body center>
                <Seal tone="success">
                  날인
                  <br />
                  완료
                </Seal>
                <Clock label="날인 기록" time="14:07" />
                <Sunken>
                  <Values
                    rows={[
                      ["근무지", "웨일카페 강남역점"],
                      ["고용 형태", "파트타이머"],
                      ["계약 기간", "2026-09-15 ~ 2027-03-14"],
                    ]}
                  />
                </Sunken>
                <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
                  이제 <strong>신고 정보</strong>를 넣을 차례입니다. 4대보험·원천징수에 쓸 주민등록번호와 급여가 들어갈 계좌를 받습니다.
                </Notice>
                <Tiny>담당 관리자에게 이메일과 운영 알림함 알림이 함께 생성됩니다. 계약 내용을 바꾸려면 관리자에게 재발송을 요청해야 합니다.</Tiny>
              </Body>
              <Dock>
                <Button href={TAX} transitionTypes={["nav-forward"]}>
                  신고 정보 넣기
                </Button>
                <Button variant="outline" onClick={() => setToast("처리 완료본 PDF 를 공유합니다")}>
                  완료본 내보내기
                </Button>
                <p className="py-[2px] text-center text-[12px] text-staff-text-muted">이 단계를 마쳐야 앱을 쓸 수 있습니다</p>
              </Dock>
            </>
          )}

          {view === "readonly" && (
            <>
              <Body>
                <Notice>
                  <strong>이미 처리가 끝난 계약서입니다.</strong>
                  <br />
                  다시 날인하거나 거부할 수 없습니다. 계약 내용을 바꾸려면 관리자가 새 계약을 발송해야 합니다.
                </Notice>
                <section className="flex items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-white p-[16px]">
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <p className="text-[15px] font-bold">웨일카페 홍대점 · 정직원</p>
                    <p className="text-[12px] text-staff-text-muted">날인 2026-08-23 · 발송 2026-08-01</p>
                  </div>
                  <Badge tone="success">체결 완료</Badge>
                </section>
                <ContractDocument {...FULL_TIME} />
              </Body>
              <Dock>
                <Button variant="outline" onClick={() => setToast("처리 완료본 PDF 를 공유합니다")}>
                  완료본 내보내기
                </Button>
                <Button variant="ghost" onClick={() => go("list", undefined, "nav-back")}>
                  목록으로
                </Button>
              </Dock>
            </>
          )}

          {view === "paper" && (
            <>
              <Body>
                <Notice>
                  <strong>종이로 맺은 계약입니다.</strong>
                  <br />
                  이미 종이에 날인한 계약서를 관리자가 올렸습니다. 앱에서 날인할 것은 없습니다.
                </Notice>
                <Sunken>
                  <Values
                    rows={[
                      ["근무지", "웨일카페 홍대점"],
                      ["고용 형태", "파트타이머"],
                      ["계약 기간", "2026-04-01 ~ 2027-03-31"],
                      ["등록", "2026-04-02 · 관리자"],
                    ]}
                  />
                </Sunken>
                <section className="flex flex-col gap-[8px] rounded-[16px] border border-staff-border-light bg-white p-[16px]">
                  <h2 className="text-[13px] font-semibold text-staff-text-sub">올라온 파일</h2>
                  <FileRow
                    name="근로계약서 날인본"
                    tag="필수"
                    meta="근로계약서_홍대점_김하은.pdf · PDF · 2장 · 1.4MB"
                    onDownload={() => setToast("근로계약서 날인본을 내려받습니다")}
                  />
                  <FileRow
                    name="임금계약서"
                    tag="선택"
                    meta="임금계약서_홍대점_김하은.pdf · PDF · 1장 · 0.6MB"
                    onDownload={() => setToast("임금계약서를 내려받습니다")}
                  />
                  <Tiny>임금계약서는 관리자가 따로 날인받아 첨부한 경우에만 보입니다. 파일을 누르면 원본을 봅니다.</Tiny>
                  <Tiny>조항은 앱에서 그리지 않습니다. 관리자가 올린 파일이 원본입니다.</Tiny>
                </section>
              </Body>
              <Dock>
                <Button variant="outline" onClick={() => setToast("올라온 파일 두 개를 함께 공유합니다")}>
                  파일 모두 내보내기
                </Button>
                <Button variant="ghost" onClick={() => go("list", undefined, "nav-back")}>
                  목록으로
                </Button>
              </Dock>
            </>
          )}

          {view === "rejected" && (
            <>
              <Body center>
                <Seal tone="danger">
                  거부
                  <br />
                  완료
                </Seal>
                <Clock label="거부 처리" time="14:11" />
                <Sunken label="거부 사유">{submittedReason === null ? REJECT_SAMPLE : submittedReason || "사유를 남기지 않았습니다."}</Sunken>
                <Tiny>담당 관리자에게 이메일과 운영 알림함 알림이 함께 생성됩니다. 관리자가 계약서를 다시 보내야 새로 처리할 수 있습니다.</Tiny>
              </Body>
              <Dock>
                <Button variant="ghost" href={HOME} transitionTypes={["nav-back"]}>
                  홈으로
                </Button>
              </Dock>
            </>
          )}

          {view === "empty" && (
            <>
              <Body center>
                <div className="flex flex-col items-center gap-[8px] pt-[52px]">
                  <span className="flex text-staff-placeholder">
                    <MaskIcon src="/icons/contract.svg" size={30} />
                  </span>
                  <h2 className="pt-[6px] text-[18px] font-bold">받은 근로계약서가 없습니다</h2>
                  <p className="text-[14px] text-staff-text-muted">
                    계약서가 발송되면 이 화면과 알림함에서 확인할 수 있습니다.
                    <br />
                    계약서를 받지 못했다면 담당 관리자에게 문의해 주세요.
                  </p>
                </div>
              </Body>
              <Dock>
                <Button variant="outline" onClick={() => setToast("관리자에게 문의를 보냈습니다")}>
                  관리자에게 문의하기
                </Button>
              </Dock>
            </>
          )}

          {view === "expired" && (
            <>
              <Body>
                {/* 목업 note--amber. 상태 칩 지각·긴급 색(#FFF6E5 · #956013). */}
                <p className="rounded-[12px] bg-[#fff6e5] p-[14px] text-[13px] text-[#956013] [&_strong]:font-bold">
                  <strong>날인 기한이 지나 계약이 만료되었습니다.</strong>
                  <br />
                  발송일로부터 30일 안에 날인해야 합니다.
                </p>
                <section className="flex items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-white p-[16px]">
                  <span className="flex text-staff-placeholder">
                    <MaskIcon src="/icons/contract.svg" size={18} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
                    <p className="text-[15px] font-bold">웨일카페 홍대점 · 파트타이머</p>
                    <p className="text-[12px] text-staff-text-muted">발송 2026-07-01 · 기한 2026-07-31</p>
                  </div>
                  <Badge tone="danger">만료</Badge>
                </section>
                <Sunken>다시 처리하려면 관리자가 계약서를 재발송해야 합니다. 재발송되면 새 날인 기한을 알림으로 안내받습니다.</Sunken>
              </Body>
              <Dock>
                <Button variant="ghost" onClick={() => go("list", undefined, "nav-back")}>
                  목록으로
                </Button>
              </Dock>
            </>
          )}
        </main>
      </PageSlide>

      {/* 거부 사유는 선택이다(CON-3). 사유 없이도 거부 확정을 누를 수 있다. */}
      <BottomSheet
        open={sheetOpen || state === "reject"}
        onClose={handleSheetClose}
        title="근로계약서 거부"
        description="거부하면 이 계약은 거부 상태로 확정됩니다. 다시 처리하려면 관리자가 계약서를 재발송해야 합니다."
      >
        <label className="flex flex-col gap-[8px]">
          <span className="text-[13px] font-semibold text-staff-text-sub">
            거부 사유 <span className="font-medium text-staff-placeholder">(선택)</span>
          </span>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예: 근무 요일이 안내받은 내용과 다릅니다"
            className="min-h-[76px] w-full resize-y rounded-[12px] border border-staff-border bg-white px-[14px] py-[12px] text-[16px] text-staff-text outline-none! transition-[border-color] duration-150 ease-out placeholder:text-staff-placeholder focus:border-staff-primary"
          />
          <span className="text-[12px] text-staff-text-muted">사유를 남기면 관리자가 재발송 여부를 판단하는 데 참고합니다.</span>
        </label>
        {/* 목업 btn--seal(빨강). 되돌릴 수 없는 확정이라 로그인 데모의 로그아웃처럼 오류색으로 여기서만 그린다. */}
        <button
          type="button"
          onClick={handleRejectConfirm}
          className="flex h-[52px] items-center justify-center rounded-[12px] bg-staff-error text-[15px] font-bold text-white transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-[#dc2626]"
        >
          거부 확정
        </button>
      </BottomSheet>

      {/* 목업의 data-toast. 화면을 옮겨도 남도록 슬라이드 밖에 둔다(다른 데모와 같다). */}
      {toast && (
        <p
          role="status"
          className="fixed bottom-[120px] left-1/2 z-40 -translate-x-1/2 rounded-[12px] bg-staff-navy/90 px-[16px] py-[10px] text-[13px] font-semibold whitespace-nowrap text-white"
        >
          {toast}
        </p>
      )}
    </>
  );
}

// ── 계약서 본문 ── 조항 열 가지, 정직원용·파트타이머용이 같은 구성이고 값만 다르다(목업 그대로).
type ContractText = { kind: string; term: string; place: string; hours: string[][]; wage: string };

const PART_TIME: ContractText = {
  kind: "근로계약서 · 파트타이머용",
  term: "2026년 9월 15일부터 2027년 3월 14일까지로 한다.",
  place: "웨일카페 강남역점에서 매장 판매 및 음료 제조 업무를 한다.",
  hours: [
    ["수요일", "10:00", "15:30", "30분", "5시간"],
    ["금요일", "10:00", "15:30", "30분", "5시간"],
    ["토요일", "10:00", "15:30", "30분", "5시간"],
  ],
  wage: "시급 10,320원으로 한다. 임금은 매월 10일에 본인 명의 계좌로 지급하고, 지급일이 휴일이면 전날 지급한다. 주 15시간 이상 근무한 주에는 주휴수당을 지급한다.",
};

const FULL_TIME: ContractText = {
  kind: "근로계약서 · 정직원용",
  term: "2026년 3월 1일부터 기간의 정함이 없는 것으로 한다.",
  place: "웨일카페 홍대점에서 매장 운영 및 재고관리 업무를 한다.",
  hours: [
    ["월–금", "09:00", "18:00", "60분", "8시간"],
    ["토·일", "—", "—", "—", "휴무"],
  ],
  wage: "월급 2,400,000원으로 한다. 임금은 매월 25일에 본인 명의 계좌로 지급하고, 지급일이 휴일이면 전날 지급한다.",
};

// CON-1: 화면에 직접 그린다. 글꼴은 앱 글꼴(Pretendard) 그대로다(2026-10-08 명조체에서 바꿈). 줄 간격만 읽기용으로 넓힌다.
function ContractDocument({ kind, term, place, hours, wage }: ContractText) {
  return (
    <section className="rounded-[16px] border border-staff-border-light bg-white p-[16px]">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">{kind}</h2>
      <div className="flex flex-col gap-[6px] pt-[8px] text-[14px] leading-[1.85] [&_strong]:font-bold">
        <p>
          <strong>제1조(근로계약기간)</strong> {term}
        </p>
        <p>
          <strong>제2조(근무장소와 업무)</strong> {place}
        </p>
        <p>
          <strong>제3조(소정근로시간)</strong> 요일별 근로시간은 아래와 같다.
        </p>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-staff-border-light text-staff-text-muted">
              {["요일", "시업", "종업", "휴게"].map((h) => (
                <th key={h} className="py-[4px] text-left font-medium">
                  {h}
                </th>
              ))}
              <th className="py-[4px] text-right font-medium">근로</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, i) => (
                  <td key={i} className={`py-[5px] ${i === 4 ? "text-right" : ""}`}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p>세부 근무일정은 근무스케줄로 정한다.</p>
        <Pending article="제4조(휴일)" />
        <p>
          <strong>제5조(임금)</strong> {wage}
        </p>
        <p>
          <strong>제6조(연장·야간·휴일 가산)</strong> 연장·야간·휴일근로에 대해서는 근로기준법에서 정한 바에 따라 가산하여 지급한다.{" "}
          <span className="text-staff-text-muted">— 문구는 노무사 검토 중(PAY-5)</span>
        </p>
        <Pending article="제7조(연차유급휴가)" />
        <p>
          <strong>제8조(사회보험)</strong> 사회보험 가입은 다음과 같다. 국민연금·건강보험 — 가입 / 고용보험·산재보험 — 가입.{" "}
          <span className="text-staff-text-muted">— 문구는 노무사 검토 중(PAY-5)</span>
        </p>
        <p>
          <strong>제9조(계약서 교부)</strong> 사용자는 계약을 체결하면 곧바로 계약서를 근로자에게 교부한다. 근로자는 직원 근무 앱에서 처리 완료본을
          내려받을 수 있다.
        </p>
        <p>
          <strong>제10조(기타)</strong> 이 계약에 정하지 않은 사항은 근로기준법령에 따른다.
        </p>
      </div>
    </section>
  );
}

// 노무사 검토 중인 조항(CON-6 · CON-7). 경고색 점선 밑줄로 「문구 확정 전」을 표시한다.
function Pending({ article }: { article: string }) {
  return (
    <p className="text-staff-text-muted">
      <strong>{article}</strong> <span className="border-b border-dashed border-staff-warning">문구 확정 전</span> — 노무사 검토 중입니다.
    </p>
  );
}

// 종이 계약의 올라온 파일 한 줄. 「받기」는 누르는 칸 44px.
function FileRow({ name, tag, meta, onDownload }: { name: string; tag: string; meta: string; onDownload: () => void }) {
  return (
    <div className="flex items-center gap-[12px]">
      <span className="flex text-staff-error">
        <MaskIcon src="/icons/contract.svg" size={22} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="flex items-center gap-[6px] text-[14px] font-semibold">
          {name}
          <Badge tone="plain">{tag}</Badge>
        </p>
        <p className="text-[12px] break-all text-staff-text-muted">{meta}</p>
      </div>
      <button
        type="button"
        onClick={onDownload}
        className="h-[44px] shrink-0 rounded-[12px] px-[12px] text-[14px] font-semibold text-staff-text-sub transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-staff-primary-inactive"
      >
        받기
      </button>
    </div>
  );
}

// 같은 화면 안에서 앞 상태로 돌아가는 머리줄. PageHeader 와 같은 모양이지만 뒤로 가기가 링크가 아니라 상태 이동이다.
function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <header className="flex min-h-[72px] w-full items-center gap-[20px] bg-white px-[22px] py-[14px]">
      <button type="button" onClick={onBack} aria-label="뒤로" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
        <Image src="/icons/back.svg" alt="" width={19} height={19} className="-scale-y-100" />
      </button>
      <h1 className="min-w-0 flex-1 truncate text-[18px] leading-[1.5] font-bold">{title}</h1>
    </header>
  );
}

// 본문: 좌우 22 · 위 22 · 사이 20(출퇴근 데모와 같다). center 면 가운데 정렬(처리 중·날인 완료·거부 완료·빈 상태).
function Body({ center = false, children }: { center?: boolean; children: ReactNode }) {
  return (
    <div className={`flex flex-1 flex-col gap-[20px] px-[22px] pb-[14px] ${center ? "pt-[52px] text-center" : "pt-[22px]"}`}>{children}</div>
  );
}

// 하단 버튼 줄: 흰 띠 · 좌우 30 · 위 14. 본문이 짧으면 맨 아래에 붙는다. 날인·거부는 본문을 다 지나야 닿는 자리다.
function Dock({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-[8px] bg-white px-[30px] pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>;
}

// 목업 tiny: 12px 흐린 글자.
function Tiny({ children }: { children: ReactNode }) {
  return <p className="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text-sub">{children}</p>;
}

// 목업의 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. label 이 있으면 13px 소제목.
function Sunken({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-left text-[13px] text-staff-text-sub">
      {label && <p className="pb-[6px] font-semibold">{label}</p>}
      {children}
    </div>
  );
}

// 이름·값 줄. 값이 길면 오른쪽 정렬로 접힌다.
function Values({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col divide-y divide-staff-border-light">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start gap-[12px] py-[8px] first:pt-0 last:pb-0">
          <dt className="shrink-0 font-medium text-staff-text-sub">{k}</dt>
          <dd className="min-w-0 flex-1 text-right text-staff-text">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// 시각 블록: 라벨 13px semibold · Clock 42px bold.
function Clock({ label, time }: { label: string; time: string }) {
  return (
    <section className="flex flex-col items-center text-center">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">{label}</h2>
      <p className="text-[42px] leading-[1.1] font-bold">{time}</p>
    </section>
  );
}

// 결과 도장. 날인 완료는 정상·완료 칩 색(#EAF8F2 · #13785E), 거부 완료는 거부 배지 색(#FEE2E2 · #DC2626).
const SEAL = { success: "border-[#13785e] bg-[#eaf8f2] text-[#13785e]", danger: "border-[#dc2626] bg-[#fee2e2] text-[#dc2626]" };
function Seal({ tone, children }: { tone: keyof typeof SEAL; children: ReactNode }) {
  return (
    <div className={`mx-auto flex size-[88px] items-center justify-center rounded-full border-2 text-[15px] leading-[1.3] font-bold ${SEAL[tone]}`}>
      {children}
    </div>
  );
}
