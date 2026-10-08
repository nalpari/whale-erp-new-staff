"use client";

// 신고 정보 데모. 기준 목업: docs/mockup/app/tax.html — 상태 4개(안내 · 입력 · 완료 · 등록된 값)와 시트 1개(계약서에는 왜 없나요),
// 화면 문구·가짜 값·하단 버튼의 이동(data-go)·알림(data-toast)을 그대로 옮겼다.
// 신고 정보는 날인을 마친 직원이 직접 넣는 4대보험 취득 신고·원천징수용 값이고 계약서와 따로 받는다(STAFF-16).
// 확정 쟁점: 주민등록번호는 계약서에 넣지 않는다(TAX-1) · 날인 직후 본인이 넣는다, 관리자가 대신 받는 길 없음(TAX-2) ·
// 동의 체크 없이 수집 목적을 적는다(TAX-3) · 건너뛸 수 없다(TAX-4) · 급여 계좌를 같은 화면에서 받는다(TAX-5) ·
// 신고 서류를 누가 만드는지는 2차로 미룸(TAX-6). 안내는 근거별로 나눈다 — 주민등록번호는 법령, 급여 계좌는 계약 이행(운영 정책 TAX-08).
// 처리방침 문구는 우리 초안 · 법무 확인 대기(TAX-7)라 화면 문구도 목업 그대로 두었다.
// 목업과 다른 점: 주민등록번호 입력칸은 앞 6자리와 뒤 7자리로 나누고 뒷자리를 가려 보인다(목업은 한 칸에 그대로 보임).
// Figma 없음 — DESIGN.md 기준 초안.
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { BottomSheet, Button, Card, MaskIcon, Notice, PageHeader, TextField } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DemoStates, useDemoState } from "../_components";

// 목업 오른쪽 상태 목록 순서 그대로. why 는 목업의 안내 화면 시트라 안내 위에 띄운다.
const STATES = [
  { id: "intro", label: "안내", note: "날인 직후" },
  { id: "form", label: "입력", note: "동의 체크 없음" },
  { id: "done", label: "완료", note: "수집 일시·목적" },
  { id: "view", label: "등록된 값", note: "내 정보에서" },
  { id: "why", label: "계약서에는 왜 없나요", note: "안내 시트" },
];

const HOME = "/demo/home";
const CONTRACT = "/demo/contract#signed";
const ME = "/demo/me";

// 두 값의 받은 근거(운영 정책 TAX-08). 입력 화면과 등록된 값 화면이 같은 문장을 쓴다.
const RRN_BASIS = (
  <>
    4대보험 취득 신고와 근로소득 원천징수를 위해 <b>법령에 따라</b> 받습니다. 동의 없이 받으며, 신고 서류를 만들 때만 씁니다.
  </>
);
const ACCOUNT_BASIS = (
  <>
    <b>근로계약에 따라</b> 급여를 보내기 위해 받습니다. 급여 지급 외에는 쓰지 않습니다.
  </>
);

export default function DemoTaxPage() {
  const [state, move] = useDemoState(STATES);

  const [sheetOpen, setSheetOpen] = useState(false);
  // 입력 화면의 뒤로 가기는 들어온 곳(안내 또는 등록된 값)으로 돌아간다(목업 data-go-back).
  const [formFrom, setFormFrom] = useState<"intro" | "view">("intro");
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const view = state === "why" ? "intro" : state;

  const handleSheetClose = () => {
    setSheetOpen(false);
    if (state === "why") move("intro", "nav-back");
  };
  const handleFormOpen = (from: "intro" | "view") => {
    setFormFrom(from);
    move("form");
  };
  const handleSubmit = () => {
    move("done");
    setToast("신고 정보를 받았습니다");
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <PageSlide key={view}>
        <main className="flex flex-1 flex-col leading-[1.5]">
          {view === "intro" && <PageHeader title="신고 정보" backHref={CONTRACT} />}
          {view === "form" && <BackHeader title="신고 정보" onBack={() => move(formFrom, "nav-back")} />}
          {view === "view" && <PageHeader title="등록된 신고 정보" backHref={ME} />}

          {view === "intro" && (
            <>
              <Body>
                <div className="flex flex-col items-center gap-[8px] text-center">
                  <span className="text-staff-text-sub">
                    <MaskIcon src="/icons/contract.svg" size={28} />
                  </span>
                  <h2 className="text-[22px] font-bold">한 가지만 더 받습니다</h2>
                  <p className="text-[14px] text-staff-text-sub">계약이 체결되었습니다. 신고와 급여에 쓸 정보를 넣어야 앱을 쓸 수 있습니다.</p>
                </div>
                <Card>
                  <Label>이 값들을 쓰는 곳</Label>
                  <div className="flex flex-col divide-y divide-staff-border-light pt-[2px]">
                    <IconRow icon="/icons/shield.svg" flipY title="4대보험 자격취득 신고" sub="국민연금 · 건강보험 · 고용보험 · 산재보험" />
                    <IconRow icon="/icons/contract.svg" title="근로소득 원천징수" sub="급여에서 떼는 세금을 신고할 때" />
                    <IconRow icon="/icons/nav-pay.svg" title="급여 지급" sub="달마다 급여가 들어갈 계좌" />
                  </div>
                </Card>
                <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
                  넣은 값은 <strong>암호화해 보관</strong>합니다. 관리자 화면에는 가려진 형태로만 보이고, 원본은 신고 서류를 만들 때만 씁니다.
                </Notice>
                <Button variant="ghost" onClick={() => setSheetOpen(true)}>
                  왜 계약서가 아니라 여기서 받나요
                </Button>
              </Body>
              <Dock>
                {/* 건너뛰는 길을 두지 않는다(TAX-4). */}
                <Button onClick={() => handleFormOpen("intro")}>
                  <MaskIcon src="/icons/pencil.svg" size={14} />
                  넣기
                </Button>
                <p className="py-[2px] text-center text-[12px] text-staff-text-muted">이 단계를 마쳐야 앱을 쓸 수 있습니다</p>
              </Dock>
            </>
          )}

          {view === "form" && (
            <>
              <Body>
                <div className="flex flex-col gap-[6px]">
                  <h2 className="text-[22px] font-bold">주민등록번호와 급여 계좌</h2>
                  <p className="text-[14px] text-staff-text-sub">신고 서류와 급여 이체에 그대로 쓰입니다. 다시 한 번 확인해 주세요.</p>
                </div>

                {/* 동의 체크 없이 칸마다 받은 근거를 적는다(TAX-3 · 운영 정책 TAX-08). */}
                <div className="flex flex-col gap-[8px]">
                  <Basis>{RRN_BASIS}</Basis>
                  <RrnField />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <Basis>{ACCOUNT_BASIS}</Basis>
                  <TextField
                    label="급여 계좌*"
                    required
                    defaultValue="국민은행 123456-01-234567"
                    help="예금주가 본인이어야 합니다. 급여는 이 계좌로 들어갑니다."
                  />
                </div>

                <Sunken>
                  <Values
                    rows={[
                      ["이름", "김민서"],
                      ["생년월일", "1990-01-01"],
                    ]}
                  />
                  <p className="pt-[8px] text-[12px] text-staff-text-muted">본인인증으로 확정된 값입니다. 앞자리가 다르면 넣을 수 없습니다.</p>
                </Sunken>

                <Notice>
                  이 정보는 <strong>강남역점(사업주)</strong>이 받으며, WHALE ERP 는 강남역점의 위탁을 받아 암호화해 보관합니다. 둘 다 동의로 받고
                  말고를 정하는 값이 아니라 <strong>동의 항목이 없습니다.</strong>
                </Notice>
              </Body>
              <Dock>
                <Button onClick={handleSubmit}>등록하기</Button>
              </Dock>
            </>
          )}

          {view === "done" && (
            <>
              <Body center>
                <Seal>
                  등록
                  <br />
                  완료
                </Seal>
                <div className="flex flex-col gap-[6px]">
                  <h1 className="text-[22px] font-bold">신고 정보를 받았습니다</h1>
                  <p className="text-[14px] text-staff-text-sub">4대보험 취득 신고가 진행됩니다. 이제 근무를 시작할 수 있습니다.</p>
                </div>
                <Sunken>
                  <Values
                    rows={[
                      ["주민등록번호", "900101-1******"],
                      ["급여 계좌", "국민 ******-01-234567"],
                      ["받은 목적", "취득 신고 · 원천징수"],
                      ["받은 때", "2026-09-14 14:08"],
                    ]}
                  />
                </Sunken>
                <p className="text-[12px] text-staff-text-muted">내 정보에서 언제든 다시 확인하고 고칠 수 있습니다.</p>
              </Body>
              <Dock>
                <Button href={HOME} transitionTypes={["nav-forward"]}>
                  근무 시작하기
                </Button>
              </Dock>
            </>
          )}

          {view === "view" && (
            <>
              <Body>
                <Card>
                  <Label>주민등록번호</Label>
                  <p className="pt-[4px] text-[18px] font-bold">900101-1******</p>
                  <p className="pt-[6px] text-[12px] text-staff-text-muted">뒷자리는 본인에게도 다시 보여주지 않습니다. 고치려면 새로 넣습니다.</p>
                </Card>
                <Card>
                  <Label>급여 계좌</Label>
                  <p className="pt-[4px] text-[18px] font-bold">국민 ******-01-234567</p>
                  <p className="pt-[6px] text-[12px] text-staff-text-muted">계좌를 바꾸면 다음 급여부터 새 계좌로 들어갑니다.</p>
                </Card>
                <Sunken>
                  <Label>기록</Label>
                  <div className="pt-[8px]">
                    <Values
                      rows={[
                        ["받은 때", "2026-09-14 14:08"],
                        ["쓰는 곳", "취득 신고 · 원천징수"],
                      ]}
                    />
                  </div>
                </Sunken>
                <Sunken>
                  <Label>받은 근거</Label>
                  <Basis>
                    <b>주민등록번호</b> — {RRN_BASIS}
                  </Basis>
                  <Basis>
                    <b>급여 계좌</b> — {ACCOUNT_BASIS}
                  </Basis>
                </Sunken>
                <Notice>
                  이 정보는 <strong>강남역점(사업주)</strong>이 받으며, WHALE ERP 는 강남역점의 위탁을 받아 암호화해 보관합니다.
                </Notice>
                <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
                  관리자 화면에도 <strong>가려진 형태로만</strong> 보입니다. 원본은 신고 서류를 만들 때만 꺼내 씁니다.
                </Notice>
              </Body>
              <Dock>
                <Button variant="ghost" onClick={() => handleFormOpen("view")}>
                  새로 넣기
                </Button>
              </Dock>
            </>
          )}
        </main>
      </PageSlide>

      <BottomSheet open={sheetOpen || state === "why"} onClose={handleSheetClose} title="계약서에는 왜 없나요">
        <p className="text-[14px] text-staff-text-sub">
          근로계약서가 적어야 하는 것은 근무 조건입니다. 임금·근로시간·휴일·연차 같은 것들이고, 사람을 특정하는 데는 이름과 생년월일이면 됩니다.
        </p>
        <p className="text-[14px] text-staff-text-sub">
          주민등록번호는 법이 허용한 목적에만 쓸 수 있습니다. 여기서는 4대보험 취득 신고와 원천징수가 그 목적입니다. 계약서에 넣어 두면 그 목적
          밖으로 번지기 때문에 받는 자리를 따로 두었습니다.
        </p>
        <Notice>관리자는 어느 화면에서도 직원의 주민등록번호를 입력하지 않습니다.</Notice>
      </BottomSheet>

      {/* 목업의 data-toast. 화면을 옮겨도 남도록 슬라이드 밖에 둔다. 떠 있는 것이라 짙은 남색 바탕. */}
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

// 주민등록번호: 앞 6자리는 보이고 뒤 7자리는 가린다(type=password). TextField 는 한 칸이라 join 의 주소 칸처럼 FIELD 로 두 칸을 그린다.
function RrnField() {
  return (
    <fieldset className="flex flex-col gap-[8px]">
      <legend className="pb-[8px] text-[13px] font-semibold text-staff-text-sub">주민등록번호*</legend>
      <div className="flex items-center gap-[8px]">
        <input aria-label="주민등록번호 앞 6자리" inputMode="numeric" maxLength={6} required defaultValue="900101" className={FIELD} />
        <span aria-hidden className="text-staff-text-muted">
          –
        </span>
        <input
          aria-label="주민등록번호 뒤 7자리"
          type="password"
          inputMode="numeric"
          maxLength={7}
          autoComplete="off"
          required
          defaultValue="1234567"
          aria-describedby="tax-rrn-help"
          className={FIELD}
        />
      </div>
      <p id="tax-rrn-help" className="text-[12px] text-staff-text-muted">
        본인의 번호만 넣을 수 있습니다.
      </p>
    </fieldset>
  );
}

// 입력 화면 머리줄. PageHeader 와 같은 모양이고, 뒤로 가기가 링크가 아니라 화면 안 상태를 되돌리는 버튼이다.
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

// 본문: 좌우 24 · 위 30 · 줄 사이 16(join 데모와 같다). center 면 가운데 정렬 결과 화면.
function Body({ center = false, children }: { center?: boolean; children: ReactNode }) {
  return <div className={`flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] ${center ? "text-center" : ""}`}>{children}</div>;
}

// 하단 버튼 줄: 흰 띠. 본문이 짧으면 mt-auto 로 맨 아래에 붙는다.
function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto flex flex-col gap-[8px] bg-white px-[24px] pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>
  );
}

// 카드 안 항목 이름(Label 13px semibold, 보조 글자).
function Label({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold text-staff-text-sub">{children}</p>;
}

// 받은 근거 한 줄(Caption 12px). 강조는 <b>.
function Basis({ children }: { children: ReactNode }) {
  return <p className="pt-[6px] text-[12px] text-staff-text-sub first:pt-0 [&_b]:font-bold [&_b]:text-staff-text">{children}</p>;
}

// 목업의 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. 결과 화면 안에서도 왼쪽 정렬.
function Sunken({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-left">{children}</div>;
}

function IconRow({ icon, title, sub, flipY = false }: { icon: string; title: string; sub: string; flipY?: boolean }) {
  return (
    <div className="flex items-center gap-[12px] py-[8px] last:pb-0">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={16} flipY={flipY} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[12px] text-staff-text-sub">{sub}</p>
      </div>
    </div>
  );
}

// 이름·값 줄. 값은 오른쪽 정렬.
function Values({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col divide-y divide-staff-border-light">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-start gap-[12px] py-[9px] first:pt-0 last:pb-0">
          <dt className="shrink-0 text-[13px] font-medium text-staff-text-sub">{k}</dt>
          <dd className="min-w-0 flex-1 text-right text-[13px]">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

// 결과 도장(목업 .seal). 정상·완료 칩 색(#EAF8F2 · #13785E).
function Seal({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex size-[88px] items-center justify-center rounded-full border-2 border-[#13785e] bg-[#eaf8f2] text-[15px] leading-[1.3] font-bold text-[#13785e]">
      {children}
    </div>
  );
}
