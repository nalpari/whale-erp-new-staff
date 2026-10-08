"use client";

// 진입·가입 데모. 기준 목업: docs/mockup/app/join.html — 상태 10개(초대 확인 · 계정 등록 · 본인인증 · 연결 완료 ·
// 만 19세 미만 · 연결 보류 · 소속 추가 확인 · 소속 추가 완료 · 초대 만료 · 로그인)와 시트 2개(본사 제공 동의 · 소속 추가 거절),
// 화면 문구·가짜 값·하단 버튼의 이동(data-go)을 그대로 옮겼다. 쟁점 JOIN-1~5 는 모두 확정이고 목업이 그린 그대로다.
// Figma 없음 — DESIGN.md 기준 초안.
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { Badge, BottomSheet, Button, Card, MaskIcon, Notice, PageHeader, TextField } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DemoStates, useDemoState } from "../_components";

// 목업 오른쪽 상태 목록 순서 그대로. bpshare·reject 는 목업의 「시트 열기」라 소속 추가 확인 위에 시트를 띄운다.
const STATES = [
  { id: "invite", label: "초대 확인", note: "시작 전" },
  { id: "signup", label: "계정 등록", note: "이메일·비밀번호·주소" },
  { id: "verify", label: "본인인증", note: "번호 확인" },
  { id: "linked", label: "연결 완료", note: "계약서 자동발송" },
  { id: "bpshare", label: "본사 제공 동의", note: "가맹 점포 · 선택" },
  { id: "minor", label: "만 19세 미만", note: "가입 중단" },
  { id: "held", label: "연결 보류", note: "번호 불일치" },
  { id: "addsite", label: "소속 추가 확인", note: "수락 전" },
  { id: "addsite-done", label: "소속 추가 완료", note: "수락 후" },
  { id: "expired", label: "초대 만료", note: "30일 경과" },
  { id: "login", label: "로그인", note: "가입 완료된 초대" },
  { id: "reject", label: "소속 추가 거절", note: "사유 입력(선택)" },
];
type Sheet = "bpshare" | "reject";
const isSheet = (id: string): id is Sheet => id === "bpshare" || id === "reject";

// 아직 없는 화면(2·3장)은 데모 입구로 건다.
const HOME = "/demo"; // 2장에서 /demo/home 으로
const CONTRACT = "/demo"; // 3장에서 /demo/contract#detail 로

export default function DemoJoinPage() {
  const [state, move] = useDemoState(STATES);

  const [openedSheet, setOpenedSheet] = useState<Sheet | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  const sheet = openedSheet ?? (isSheet(state) ? state : null);
  const view = isSheet(state) ? "addsite" : state;

  const go = (id: string, message?: string) => {
    move(id);
    if (message) setToast(message);
  };
  const handleSheetClose = () => {
    setOpenedSheet(null);
    if (isSheet(state)) move("addsite", "nav-back");
  };
  const handleRejectClick = () => {
    handleSheetClose();
    setToast("확인을 거절했습니다");
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <PageSlide key={view}>
        <main className="flex flex-1 flex-col leading-[1.5]">
          {view === "addsite" && <PageHeader title="소속 추가 확인" backHref={HOME} />}
          {view === "addsite-done" && <PageHeader title="소속 추가 완료" backHref={HOME} />}

          {view === "invite" && (
            <>
              <Body>
                <Lead title="초대를 확인해 주세요" large>
                  웨일카페 강남역점에서 함께 일하자고 초대를 보냈습니다.
                </Lead>
                <Card>
                  <Rows>
                    <IconRow icon="/icons/store-small.svg" title="웨일카페 · 강남역점" sub="서울 강남구 테헤란로 1길" />
                    <IconRow icon="/icons/contract.svg" title="고용 형태" sub="아르바이트 · 시급제" />
                  </Rows>
                </Card>
                <Notice>
                  이 초대는 <strong>2026년 9월 3일 발송</strong>되어 <strong>10월 3일까지</strong> (30일간) 유효합니다.
                </Notice>
              </Body>
              <Dock>
                <Button onClick={() => go("signup")}>
                  시작하기
                  <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
                </Button>
              </Dock>
            </>
          )}

          {view === "signup" && (
            <>
              <Body>
                <Steps label="2 / 4 · 계정 등록" step={2} />
                <Lead title="계정을 등록해 주세요" align="left">
                  웨일카페 강남역점 근무를 위한 계정입니다.
                </Lead>
                <TextField
                  label="이메일*"
                  type="email"
                  required
                  defaultValue="minseo.kim@gmail.com"
                  help="로그인할 때 쓰는 아이디입니다. 비밀번호를 잊으면 이 주소로 인증번호가 갑니다."
                />
                <TextField label="비밀번호*" type="password" required defaultValue="Whale#cafe25" />
                <TextField
                  label="비밀번호 확인*"
                  type="password"
                  required
                  defaultValue="Whale#cafe25"
                  help="두 번 넣은 값이 같아야 다음으로 넘어갑니다."
                />
                <Sunken>
                  <p className="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p>
                  <ul className="flex flex-col gap-[6px] pt-[8px] text-[13px] [&_b]:font-bold">
                    <Met>
                      영문 대소문자·숫자·기호 중 <b>세 가지</b>를 섞었습니다
                    </Met>
                    <Met>8자 이상 20자 이하</Met>
                    <Met>이메일 아이디와 겹치지 않습니다</Met>
                  </ul>
                  <p className="pt-[8px] text-[12px] text-staff-text-muted">두 가지만 섞으면 10자 이상이어야 합니다.</p>
                </Sunken>

                <hr className="border-staff-border-light" />

                <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
                  <strong>인적사항은 이제 여기서 직접 입력합니다.</strong> 근로계약서에 들어갈 주소 항목이 관리자 작성 화면에서 빠지고,
                  가입하는 직원이 적는 것으로 바뀌었습니다. 도로명 주소는 검색해서 고르고 상세주소만 직접 적습니다(ME-2).
                </Notice>
                <div className="flex flex-col gap-[8px]">
                  <label htmlFor="join-address" className="text-[13px] font-semibold text-staff-text-sub">
                    주소*
                  </label>
                  <div className="flex gap-[8px]">
                    <input id="join-address" readOnly required value="서울 마포구 양화로 12" aria-describedby="join-address-help" className={FIELD} />
                    {/* 검색 버튼은 입력칸 높이(52)에 맞춘다. outline 은 44px 라 직접 그린다. */}
                    <button
                      type="button"
                      onClick={() => setToast("주소 검색을 엽니다")}
                      className="h-[52px] shrink-0 rounded-[12px] border border-staff-border bg-white px-[18px] text-[14px] font-semibold transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
                    >
                      검색
                    </button>
                  </div>
                  <p id="join-address-help" className="text-[12px] text-staff-text-muted">
                    도로명 주소는 검색해서 고릅니다.
                  </p>
                </div>
                <TextField label="상세주소" placeholder="상세주소" defaultValue="3층 302호" help="상세주소만 직접 적습니다." />
              </Body>
              <Dock>
                <Button onClick={() => go("verify")}>다음</Button>
              </Dock>
            </>
          )}

          {view === "verify" && (
            <>
              <Body>
                <Steps label="3 / 4 · 본인인증" step={3} />
                <Lead title="본인인증을 해 주세요" align="left">
                  이름과 생년월일은 이 인증으로 확정되며, 이후에는 직원이 직접 고칠 수 없습니다.
                </Lead>
                <TextField label="휴대전화번호*" type="tel" inputMode="numeric" required defaultValue="010-9284-5521" />
                <Button variant="outline">인증번호 받기</Button>
                <TextField
                  label="인증번호*"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  defaultValue="284955"
                  help="인증번호는 3분 안에 입력해 주세요."
                />
                <Sunken>
                  <p className="text-[13px] text-staff-text-sub">
                    인증된 번호는 초대에 등록된 번호와 자동으로 비교됩니다. 같으면 바로 연결되고, 다르면 계정만 만들어지고 관리자 확인을
                    기다립니다.
                  </p>
                </Sunken>
              </Body>
              <Dock>
                <Button onClick={() => go("linked", "본인인증을 완료했습니다")}>
                  <MaskIcon src="/icons/shield.svg" size={14} flipY />
                  인증 확인
                </Button>
                <Button variant="ghost" onClick={() => go("held", "계정을 만들고 확인 요청을 보냈습니다")}>
                  번호가 초대 대상과 다르면?
                </Button>
                <Button variant="ghost" onClick={() => go("minor")}>
                  만 19세 미만이면?
                </Button>
              </Dock>
            </>
          )}

          {view === "minor" && (
            <>
              <Body center>
                <Lead title="가입을 진행할 수 없습니다">
                  만 19세 미만은 WHALE ERP 로 근로계약과 출퇴근을 관리하지 않습니다. 근무지 관리자에게 알려 주세요.
                </Lead>
                <Sunken>
                  <p className="text-[13px] text-staff-text-sub">
                    계정은 만들지 않았습니다. 본인인증으로 확인한 생년월일은 남기지 않습니다. 근로계약과 출퇴근은 근무지에서 따로 관리합니다.
                  </p>
                </Sunken>
              </Body>
              <Dock>
                <Button variant="ghost" href="/demo/login" transitionTypes={["nav-back"]}>
                  닫기
                </Button>
              </Dock>
            </>
          )}

          {view === "linked" && (
            <>
              <Body center>
                <Seal>
                  가입
                  <br />
                  완료
                </Seal>
                <Lead title="웨일카페 강남역점과 연결되었습니다">초대 토큰과 본인인증 번호가 모두 일치해 자동으로 연결됐습니다.</Lead>
                <Sunken>
                  <Values
                    rows={[
                      ["이름", "김민서"],
                      ["생년월일", "1998.04.12"],
                      ["소속", "웨일카페 강남역점"],
                    ]}
                  />
                </Sunken>
                <p className="text-[12px] text-staff-text-muted">이름과 생년월일은 본인인증으로 확정되어 이후에는 고칠 수 없습니다.</p>
                <Card>
                  <IconRow icon="/icons/contract.svg" title="근로계약서가 자동 발송되었습니다" sub="날인 대기 · 지금 확인할 수 있습니다" />
                </Card>
                <div className="text-left">
                <Notice>
                  <strong>종이로 계약을 맺었다면</strong> 날인할 것이 없습니다. 관리자가 올린 날인본이 계약서 화면에 체결 완료로 보이고, 여기서
                  바로 신고 정보 입력으로 넘어갑니다.
                </Notice>
                </div>
              </Body>
              <Dock>
                <Button href={CONTRACT} transitionTypes={["nav-forward"]}>
                  <MaskIcon src="/icons/contract.svg" size={14} />
                  계약서 날인하러 가기
                </Button>
                <Button variant="ghost" href={HOME} transitionTypes={["nav-forward"]}>
                  홈으로
                </Button>
              </Dock>
            </>
          )}

          {view === "held" && (
            <>
              <Body>
                {/* JOIN-3 최소 안내 — 계약서에 적힌 휴대전화번호는 끝자리도 보이지 않는다. */}
                <Lead title="계정을 만들었습니다">본인인증 번호가 초대에 등록된 번호와 달라 자동으로 연결하지 못했습니다.</Lead>
                {/* 경고 안내: 상태 칩의 지각·긴급 색(#FFF6E5 · #956013)을 빌린다. 이 화면에만 나와 토큰으로 두지 않는다. */}
                <p className="rounded-[12px] bg-[#fff6e5] p-[14px] text-[13px] text-[#956013]">
                  관리자가 확인한 뒤 연결합니다. 연결되면 근로계약서가 그때 자동으로 발송됩니다.
                </p>
                <Sunken>
                  <p className="text-[13px] font-semibold text-staff-text-sub">지금 할 수 있는 일</p>
                  <p className="pt-[6px] text-[13px] text-staff-text-sub">
                    가입을 요청한 관리자에게 등록해 둔 번호가 맞는지 다시 확인해 달라고 알려 주세요. 연결되면 홈에서 바로 알 수 있습니다.
                  </p>
                </Sunken>
              </Body>
              <Dock>
                <Button variant="ghost" href={HOME} transitionTypes={["nav-forward"]}>
                  홈으로
                </Button>
              </Dock>
            </>
          )}

          {view === "addsite" && (
            <>
              <Body>
                {/* 수락 전에는 초대한 사업자·점포와 고용 형태만 보이고 기존 계정 정보는 보이지 않는다. */}
                <Lead title="새 소속 추가 요청" heading="h2">웨일카페 홍대점에서 함께 일해 달라고 요청했습니다.</Lead>
                <Card>
                  <Rows>
                    <IconRow icon="/icons/store-small.svg" title="웨일카페 · 홍대점" sub="서울 마포구 양화로" />
                    <IconRow icon="/icons/contract.svg" title="고용 형태" sub="파트타이머 · 주 20시간" />
                  </Rows>
                </Card>
                <Notice icon={<MaskIcon src="/icons/shield.svg" size={14} flipY />}>
                  수락하면 <strong>이름·생년월일·연락처만</strong> 새 소속에 복사됩니다. 다른 소속의 계약·급여·출퇴근 기록은 넘어가지 않습니다.
                </Notice>
                <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
                  <strong>여기서 수락하는 것은 소속 연결까지입니다.</strong> 시급·근무 시간대를 포함한 근무 조건은 수락한 뒤 도착하는
                  근로계약서에서 확인하고 날인합니다.
                </Notice>
                <BpShareConsent onOpen={() => setOpenedSheet("bpshare")} />
              </Body>
              <Dock>
                <div className="grid grid-cols-2 gap-[8px]">
                  <Button variant="ghost" onClick={() => setOpenedSheet("reject")}>
                    거절
                  </Button>
                  <Button onClick={() => go("addsite-done", "소속을 추가했습니다")}>수락</Button>
                </div>
              </Dock>
            </>
          )}

          {view === "addsite-done" && (
            <>
              <Body center>
                <Seal>
                  연결
                  <br />
                  완료
                </Seal>
                <Lead title="웨일카페 홍대점 소속이 추가되었습니다" heading="h2">
                  기존 계정은 그대로이고, 본인인증 정보만 이 소속의 새 레코드에 연결됐습니다.
                </Lead>
                <Sunken>
                  <Values
                    rows={[
                      ["넘어간 것", "이름 · 생년월일 · 연락처"],
                      ["넘어가지 않은 것", "계약 · 급여 · 출퇴근"],
                    ]}
                  />
                </Sunken>
                <div className="text-left">
                <Notice icon={<MaskIcon src="/icons/contract.svg" size={14} />}>
                  이 소속의 <strong>근로계약서가 발송되었습니다.</strong> 날인해야 근무가 시작됩니다.
                </Notice>
                </div>
              </Body>
              <Dock>
                <Button href={CONTRACT} transitionTypes={["nav-forward"]}>
                  <MaskIcon src="/icons/contract.svg" size={14} />
                  홍대점 계약서 날인하러 가기
                </Button>
                <Button variant="ghost" href={HOME} transitionTypes={["nav-forward"]}>
                  홈으로
                </Button>
              </Dock>
            </>
          )}

          {view === "expired" && (
            <>
              <Body>
                <Lead title="초대가 만료되었습니다">이 초대는 2026년 8월 4일에 발송되어 30일이 지나 더 이상 사용할 수 없습니다.</Lead>
                <Notice>
                  가입 초대와 재초대는 <strong>발송일로부터 30일</strong> 유효합니다.
                </Notice>
                <Sunken>
                  <p className="text-[13px] font-semibold text-staff-text-sub">이제 할 일</p>
                  <p className="pt-[6px] text-[13px] text-staff-text-sub">
                    가입을 요청한 관리자에게 다시 초대해 달라고 알려 주세요. 근로계약 초안은 그대로 남아 있어 재초대만 하면 이어서 진행됩니다.
                  </p>
                </Sunken>
              </Body>
              <Dock>
                <p className="py-[6px] text-center text-[12px] text-staff-text-muted">관리자가 다시 초대해야 이어서 진행할 수 있습니다.</p>
              </Dock>
            </>
          )}

          {view === "login" && (
            <>
              <Body>
                <Lead title="이미 가입을 마친 초대입니다">로그인하면 이어서 확인할 수 있습니다.</Lead>
                <TextField label="이메일" type="email" defaultValue="minseo.kim@gmail.com" />
                <TextField label="비밀번호" type="password" defaultValue="Whale#cafe25" />
                <BpShareConsent onOpen={() => setOpenedSheet("bpshare")} />
              </Body>
              <Dock>
                <Button href={HOME} transitionTypes={["nav-forward"]}>
                  로그인
                </Button>
              </Dock>
            </>
          )}
        </main>
      </PageSlide>

      <BottomSheet open={sheet === "bpshare"} onClose={handleSheetClose} title="본사 제공 동의">
        <p className="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">
          가맹 점포에서 일하는 직원의 근무 정보를 <b>가맹본부가 개인 단위로</b> 보는 것에 대한 <b>선택 동의</b>입니다.
        </p>
        <Sunken>
          <Values
            rows={[
              ["받는 자", "가맹본부 · 웨일카페"],
              ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
              ["목적", "가맹점 운영 지원과 점검"],
              ["보유 기간", "철회 또는 가맹 관계 종료까지"],
            ]}
          />
        </Sunken>
        <p className="text-[12px] text-staff-text-sub [&_b]:font-bold">
          동의하지 않아도 가입과 근무는 그대로 됩니다. 이때 본사에는 <b>점포별 숫자로만</b> 보입니다. 동의는 내 정보에서 언제든 철회할 수
          있고, <b>항목이나 목적이 넓어지면</b> 새 버전으로 다시 동의를 받습니다.{" "}
          <span className="text-staff-text-muted">본사 제공 동의 v1.0</span>
        </p>
        <p className="text-[12px] text-staff-text-muted">동의 문구는 법무 검토 중(ATT-8)</p>
      </BottomSheet>

      <BottomSheet
        open={sheet === "reject"}
        onClose={handleSheetClose}
        title="소속 추가를 거절하시겠어요?"
        description="거절해도 기존 소속과 계정에는 영향이 없습니다."
        closeLabel="취소"
      >
        <TextField label="거절 사유 (선택)" placeholder="예: 다른 곳에서 일하고 있어요" />
        <Button onClick={handleRejectClick}>거절하기</Button>
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

// 본문: 좌우 24 · 위 30 · 줄 사이 16. center 면 가운데 정렬(연결 완료·가입 중단 같은 결과 화면). 카드·안내 글은 왼쪽 정렬로 되돌린다.
function Body({ center = false, children }: { center?: boolean; children: ReactNode }) {
  return <div className={`flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] ${center ? "text-center" : ""}`}>{children}</div>;
}

// 하단 버튼 줄: login 데모·/design/login 과 같은 흰 띠. 본문이 짧으면 mt-auto 로 맨 아래에 붙는다.
function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto flex flex-col gap-[8px] bg-white px-[24px] pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>
  );
}

// 화면 첫 제목 + 설명. large 는 Display(28), 나머지는 Title 1(22).
function Lead({
  title,
  large = false,
  align = "center",
  heading: Heading = "h1",
  children,
}: {
  title: string;
  heading?: "h1" | "h2"; // PageHeader 가 h1 을 그린 화면에서는 h2
  large?: boolean;
  align?: "center" | "left";
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-[6px] ${align === "center" ? "items-center text-center" : ""}`}>
      <Heading className={`font-bold ${large ? "text-[28px]" : "text-[22px]"}`}>{title}</Heading>
      <p className="text-[14px] text-staff-text-sub">{children}</p>
    </div>
  );
}

// 4단계 막대. 지난 단계·지금 단계는 남보라(지금 진행 중), 남은 단계는 탭 판 회색(#EDF0F6).
function Steps({ label, step }: { label: string; step: number }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[13px] font-semibold text-staff-text-sub">{label}</p>
      <div className="flex gap-[6px]" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-[4px] flex-1 rounded-full ${n <= step ? "bg-staff-primary" : "bg-[#edf0f6]"}`} />
        ))}
      </div>
    </div>
  );
}

// 목업의 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14(Notice 와 같은 판). 결과 화면 안에서도 왼쪽 정렬.
function Sunken({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-left">{children}</div>;
}

function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-staff-border-light">{children}</div>;
}

function IconRow({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-[12px] py-[8px] text-left first:pt-0 last:pb-0">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="text-[12px] text-staff-text-sub">{sub}</p>
      </div>
    </div>
  );
}

// 이름·값 줄. 값이 길면 오른쪽 정렬로 접힌다.
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

// 비밀번호 조건 충족 줄: 성공색(#22C55E) 원 안에 흰 체크.
function Met({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-center gap-[8px]">
      <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#22c55e]">
        <Image src="/icons/check.svg" alt="" width={10} height={10} />
      </span>
      <span>{children}</span>
    </li>
  );
}

// 결과 도장(목업 .seal). 상태를 말하는 것이라 정상·완료 칩 색(#EAF8F2 · #13785E)을 쓴다.
function Seal({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex size-[88px] items-center justify-center rounded-full border-2 border-[#13785e] bg-[#eaf8f2] text-[15px] leading-[1.3] font-bold text-[#13785e]">
      {children}
    </div>
  );
}

// 본사 제공 동의(가맹 점포 · 선택). 체크칸은 TO-DO 체크칸과 같은 모양(28px, 누르는 칸 44px).
// 선택 동의가 필수처럼 읽히지 않도록 「동의하지 않아도 가입과 근무는 그대로」를 체크 옆에 같이 둔다.
function BpShareConsent({ onOpen }: { onOpen: () => void }) {
  const [agreed, setAgreed] = useState(false);
  return (
    <Sunken>
      <div className="flex items-start gap-[10px]">
        <label
          className={`relative mt-[2px] flex size-[28px] shrink-0 items-center justify-center rounded-[2px] transition-colors duration-150 ease-out ${
            agreed ? "bg-staff-primary" : "bg-staff-primary-inactive"
          }`}
        >
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            aria-label="본사 제공 동의"
            className="absolute -inset-[8px] appearance-none rounded-[10px]"
          />
          <Image src={agreed ? "/icons/todo-check-on.svg" : "/icons/todo-check-off.svg"} alt="" width={12} height={9} className="pointer-events-none" />
        </label>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-[6px] text-[14px] font-semibold">
            본사 제공 동의 <Badge tone="plain">선택</Badge>
          </p>
          <p className="pt-[3px] text-[12px] text-staff-text-sub">가맹본부(웨일카페)가 내 근무 정보를 개인 단위로 보는 것에 동의합니다.</p>
          <button
            type="button"
            onClick={onOpen}
            className="-ml-[10px] h-[44px] rounded-[12px] px-[10px] text-[13px] font-semibold text-staff-text-sub underline underline-offset-2 transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
          >
            내용 보기
          </button>
        </div>
      </div>
      <p className="pt-[4px] text-[12px] text-staff-text-muted">동의하지 않아도 가입과 근무는 그대로 됩니다. 이때 본사에는 점포별 숫자로만 보입니다.</p>
    </Sunken>
  );
}
