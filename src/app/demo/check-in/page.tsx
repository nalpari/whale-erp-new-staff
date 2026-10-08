"use client";

// 출퇴근 등록 데모. 기준 목업: docs/mockup/app/attendance.html — 상태 13개(매장 안 · 근무 중 · 퇴근 완료 · 근무 중·범위 밖 ·
// 매장 범위 밖 · 위치 권한 없음 · 위치 흐림 · 근무지 여럿 · 위치 조작 감지 출근·퇴근 · 위치 수집 일시 중지 · 위치정보 동의 없음 ·
// 근무지 없음)와 시트 9개(퇴근 확인 · 범위 밖 퇴근 확인 · 위치정보 동의 · 위치 조작 퇴근 확인 · 확인 필요 등록 확인 · 이미 출근함 ·
// 출근 기록 없음 · 계약 미체결 · 근무지 고르기), 화면 문구·가짜 값·버튼의 이동(data-go)·알림(data-toast)을 옮겼다.
// 확정 쟁점: GPS 판정 — 휴대전화에서 판정하고 좌표는 보내지 않는다(ATT-1·5) · 근무지 반경 100m(ATT-2) · 위치 권한 꺼짐은 등록 불가(ATT-3) ·
// 오차가 반경보다 크면 확인 필요로 받는다(ATT-4) · 근무지 여럿이면 가장 가까운 곳 자동 선택, 바꿀 수 있음(ATT-6) · 퇴근만 확인 시트(ATT-9) ·
// 퇴근 되돌리기 없음(ATT-10) · 반경 밖은 퇴근만, 확인 필요로(ATT-11) · 위치 조작 감지는 출근 막고 퇴근은 확인 필요(운영 정책 ATT-21) ·
// 위치정보 동의는 첫 출근 등록 때 필수, 거부·철회 시 「근무지 관리자에게 문의」(운영 정책 ATT-06·20) · 일시 중지 중엔 대신 등록 안내,
// 「다시 켜기」로 재동의 없이 복귀(운영 정책 ATT-26) · 등록 화면의 「○○점 관리자가 확인합니다」 한 줄(운영 정책 ATT-25).
// 동의 문구는 법무 검토 중이라(ATT-8) 시트에 그대로 적었다.
// 모양: 매장 안(ready)은 Figma 04.출퇴근(node 12:756, /design/check-in)을 따른다. 나머지 상태와 시트는 Figma 없음 — DESIGN.md 기준 초안.
// 목업과 다른 점: 퇴근하기는 목업의 테두리 버튼 대신 DESIGN.md 의 주 버튼(primary — 「출근하기·퇴근하기」)이다. 하단 탭바는 Figma·DESIGN.md 대로 두지 않고
// 하단 메뉴 「출퇴근」 칸 화면이다(2026-10-08 다섯 칸). 머리줄(PageHeader) 뒤로 가기는 근무 화면처럼 홈으로 간다.
import Image from "next/image";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { BottomNav, BottomSheet, Button, MaskIcon, PageHeader, SheetOption, WorkTimeBar } from "@/components/common";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { Alert, Body, DEMO_NAV_ITEMS, DemoStates, Dock, Seal, Sunken, useDemoState, useToast, Values } from "../_components";
import { GeoBlank, GeoMap } from "./geo-map";

// 목업 오른쪽 목록 순서 그대로. 뒤 여덟은 목업의 「시트 열기」라 SHEET_BASE 의 화면 위에 시트를 띄운다.
const STATES = [
  { id: "ready", label: "매장 안", note: "출근 가능" },
  { id: "working", label: "근무 중", note: "퇴근 가능" },
  { id: "done", label: "퇴근 완료", note: "기록 확정" },
  { id: "far-out", label: "근무 중 · 범위 밖", note: "퇴근만 가능" },
  { id: "far", label: "매장 범위 밖", note: "240m" },
  { id: "denied", label: "위치 권한 없음", note: "등록 불가" },
  { id: "vague", label: "위치 흐림", note: "오차 ±180m" },
  { id: "multi", label: "근무지 여럿", note: "자동 판정" },
  { id: "spoof", label: "위치 조작 감지 · 출근", note: "막음" },
  { id: "spoof-out", label: "위치 조작 감지 · 퇴근", note: "확인 필요로 받음" },
  { id: "paused", label: "위치 수집 일시 중지", note: "다시 켜기로 복귀" },
  { id: "no-consent", label: "위치정보 동의 없음", note: "관리자에게 문의" },
  { id: "nosite", label: "근무지 없음", note: "퇴직 후" },
  { id: "consent", label: "위치정보 동의", note: "첫 등록 때 · v1.2" },
  { id: "byespoof", label: "위치 조작 퇴근 확인", note: "확인 필요" },
  { id: "bye", label: "퇴근 확인", note: "한 번 더 묻기" },
  { id: "byefar", label: "범위 밖 퇴근 확인", note: "240m" },
  { id: "byeflag", label: "확인 필요 등록 확인", note: "위치 흐림" },
  { id: "dup", label: "이미 출근함", note: "열린 출근이 있을 때" },
  { id: "nopunch", label: "출근 기록 없음", note: "퇴근만 찍을 때" },
  { id: "nocontract", label: "계약 미체결", note: "출근 막음" },
];
const SHEET_BASE = {
  consent: "ready",
  byespoof: "spoof-out",
  bye: "working",
  byefar: "far-out",
  byeflag: "vague",
  dup: "ready",
  nopunch: "ready",
  nocontract: "ready",
} as const;
type Sheet = keyof typeof SHEET_BASE;
const isSheet = (id: string): id is Sheet => id in SHEET_BASE;

// 근무지 여럿(ATT-6): 가까운 순서. 첫 줄이 자동으로 고른 곳이다.
const SITES = [
  { name: "웨일카페 홍대점", address: "서울 마포구 양화로", distance: "6m" },
  { name: "웨일베이커리 합정점", address: "서울 마포구 독막로", distance: "1.4km" },
  { name: "웨일카페 강남역점", address: "서울 강남구 테헤란로", distance: "7.2km" },
];

const HOME = "/demo/home";
const HISTORY = "/demo/attendance";
const ME = "/demo/me";
const CONTRACT = "/demo/contract"; // 3장

// 운영 정책 ATT-25: 등록 화면마다 받는 사람·목적을 알리는 한 줄.
const ADMIN_NOTE = "출퇴근 기록은 근태 확인을 위해 강남역점 관리자가 확인합니다.";

export default function DemoCheckInPage() {
  const [state, move] = useDemoState(STATES);

  const [openedSheet, setOpenedSheet] = useState<Sheet | null>(null);
  const [picking, setPicking] = useState(false);
  const [site, setSite] = useState(0);
  const [toast, setToast] = useToast();

  const sheet = openedSheet ?? (isSheet(state) ? state : null);
  const view: string = isSheet(state) ? SHEET_BASE[state] : state;

  const go = (id: string, message?: string) => {
    setOpenedSheet(null);
    move(id);
    if (message) setToast(message);
  };
  const handleSheetClose = () => {
    setOpenedSheet(null);
    if (isSheet(state)) move(SHEET_BASE[state], "nav-back");
  };
  const handleToastClick = (message: string) => {
    handleSheetClose();
    setToast(message);
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <PageSlide key={view}>
        <main className="flex flex-1 flex-col leading-[1.5]">
          {view !== "done" && (
            <PageHeader
              title="출퇴근"
              backHref={HOME}
              action={
                <Link href={HISTORY} transitionTypes={["nav-forward"]} aria-label="출퇴근 현황" className="m-[-10px] flex size-[44px] shrink-0 items-center justify-center">
                  <Image src="/icons/history.svg" alt="" width={21} height={21} className="-scale-y-100" />
                </Link>
              }
            />
          )}

          {view === "ready" && (
            <>
              <Body variant="detail">
                <GeoMap tone="in" caption="오차 ±12m · 매장까지 18m" />
                <SiteCard title="웨일카페 강남역점" sub="매장 범위 안에 있습니다" />
                {/* 오늘 예정 근무(Figma node 12:957 아래 카드) */}
                <section className="flex flex-col gap-[7px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
                  <h2 className="text-[13px] font-semibold text-staff-text-sub">오늘 예정 근무</h2>
                  <div className="flex items-center gap-[8px]">
                    <p className="min-w-0 flex-1 text-[20px] font-bold tracking-[-0.42px]">09:00 – 18:00</p>
                    <span className="rounded-[8px] bg-staff-info-bg px-[10px] py-[4px] text-[12px] font-semibold text-staff-text-sub">휴게 60분</span>
                  </div>
                </section>
                <Clock label="현재 시각" time="08:52" note="기록 시각은 서버가 요청을 받은 때로 정해집니다" />
              </Body>
              <Dock inset={30}>
                {/* 출근은 확인 없이 바로 기록한다(ATT-9 · 운영 정책 ATT-13). */}
                <Button onClick={() => go("working", "출근을 등록했습니다")}>
                  출근하기
                  <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
                </Button>
                <Button variant="ghost" onClick={() => setOpenedSheet("dup")}>
                  이미 출근한 상태로 눌러 보기
                </Button>
              </Dock>
            </>
          )}

          {view === "working" && (
            <>
              <Body variant="detail">
                <SiteCard title="근무 중" sub="09:02에 출근했습니다" />
                <section className="flex flex-col gap-[9px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
                  <h2 className="text-[13px] font-semibold text-staff-text-sub">오늘</h2>
                  <WorkTimeBar schedule={{ start: "09:00", end: "18:00" }} worked={{ start: "09:02", end: "15:43" }} ongoing />
                  <p className="text-[12px] text-staff-text-muted">점선은 예정, 채운 칠은 실제 기록입니다</p>
                </section>
                <Elapsed />
                <p className="text-center text-[12px] text-staff-text-muted">{ADMIN_NOTE}</p>
              </Body>
              <Dock inset={30}>
                <Button onClick={() => setOpenedSheet("bye")}>퇴근하기</Button>
              </Dock>
            </>
          )}

          {view === "done" && (
            <>
              <Body variant="detail" center>
                <Seal>
                  퇴근
                  <br />
                  완료
                </Seal>
                <Clock label="퇴근 기록" time="18:04" />
                <Sunken>
                  <Values
                    rows={[
                      ["근무지", "웨일카페 강남역점"],
                      ["출근", "09:02"],
                      ["근무 시간", "9시간 02분"],
                    ]}
                  />
                </Sunken>
                <p className="text-[12px] text-staff-text-muted">기록이 저장되었습니다. {ADMIN_NOTE}</p>
              </Body>
              <Dock inset={30}>
                <Button variant="ghost" href={HOME} transitionTypes={["nav-back"]}>
                  홈으로
                </Button>
              </Dock>
            </>
          )}

          {view === "far" && (
            <>
              <Body variant="detail">
                <GeoMap tone="out" caption="오차 ±14m · 매장까지 240m" />
                <Alert tone="warning">
                  <strong>매장에서 240m 떨어져 있습니다.</strong>
                  <br />
                  출근은 매장 안이나 바로 앞에서 등록해 주세요. <strong>퇴근은 범위 밖에서도 등록할 수 있습니다</strong> — 근무 중일 때 나타납니다.
                </Alert>
                <section className="flex flex-col rounded-[18px] border border-staff-border-light bg-white p-[20px]">
                  <h2 className="text-[13px] font-semibold text-staff-text-sub">근무지</h2>
                  <p className="pt-[6px] text-[16px] font-bold">웨일카페 강남역점</p>
                  <p className="pt-[3px] text-[12px] text-staff-text-muted">서울 강남구 테헤란로 1길</p>
                </section>
                <Clock label="현재 시각" time="08:47" dim />
              </Body>
              <Dock inset={30}>
                <Button disabled>출근하기</Button>
                <Button variant="ghost" onClick={() => go("ready", "매장 범위 안입니다")}>
                  위치 다시 확인
                </Button>
              </Dock>
            </>
          )}

          {view === "far-out" && (
            <>
              <Body variant="detail">
                <GeoMap tone="out" caption="오차 ±14m · 매장까지 240m" />
                <SiteCard title="근무 중" sub="09:02에 출근했습니다" />
                <Alert tone="warning">
                  <strong>매장 범위 밖입니다.</strong>
                  <br />
                  퇴근은 여기서도 등록할 수 있습니다. 다만 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다.
                </Alert>
                <Elapsed />
              </Body>
              <Dock inset={30}>
                <Button onClick={() => setOpenedSheet("byefar")}>퇴근하기</Button>
                <Button variant="ghost" onClick={() => go("working", "매장 범위 안입니다")}>
                  위치 다시 확인
                </Button>
              </Dock>
            </>
          )}

          {view === "denied" && (
            <>
              <Body variant="detail">
                <GeoBlank icon="/icons/pin.svg" iconClass="text-staff-placeholder">
                  위치를 확인할 수 없습니다
                </GeoBlank>
                <Alert tone="danger">
                  <strong>위치 권한이 꺼져 있습니다.</strong>
                  <br />
                  출퇴근은 매장에 있는지를 위치로 확인합니다. 설정에서 위치 접근을 허용해 주세요.
                </Alert>
                <Sunken prose label="권한이 필요한 이유">
                  매장에 있는지를 위치로만 확인하기 때문에, 권한이 없으면 출퇴근을 등록할 수 없습니다. 설정에서 위치 접근을 허용한 뒤 다시 시도해 주세요.
                </Sunken>
              </Body>
              <Dock inset={30}>
                <Button onClick={() => go("ready", "위치 권한을 켰습니다")}>설정 열기</Button>
              </Dock>
            </>
          )}

          {view === "spoof" && (
            <>
              <Body variant="detail">
                <GeoBlank icon="/icons/pin.svg" iconClass="text-staff-error">
                  위치를 믿을 수 없습니다
                </GeoBlank>
                <Alert tone="danger">
                  <strong>모의 위치가 켜져 있습니다.</strong>
                  <br />
                  모의 위치 설정이나 가상 위치 앱을 끄고 다시 시도하세요.
                </Alert>
                <Sunken prose label="왜 막나요">
                  출근은 매장에 실제로 왔는지를 위치로만 확인합니다. 기기가 꾸며 낸 위치로는 그것을 확인할 수 없어 등록을 받지 않습니다.{" "}
                  <b>퇴근은 막지 않습니다</b> — 이미 일한 사실이 있어 기록을 남기는 편이 낫고, 대신 확인 필요가 붙습니다.
                </Sunken>
              </Body>
              <Dock inset={30}>
                <Button disabled>출근하기</Button>
                <Button variant="ghost" onClick={() => go("ready", "모의 위치를 껐습니다")}>
                  껐습니다 · 다시 확인
                </Button>
              </Dock>
            </>
          )}

          {view === "spoof-out" && (
            <>
              <Body variant="detail">
                <GeoBlank icon="/icons/pin.svg" iconClass="text-staff-warning">
                  위치를 믿을 수 없습니다
                </GeoBlank>
                <SiteCard title="근무 중" sub="09:02에 출근했습니다" />
                <Alert tone="warning">
                  <strong>모의 위치가 켜져 있습니다.</strong>
                  <br />
                  퇴근은 등록할 수 있습니다. 다만 기록에 <strong>확인 필요</strong>가 붙고 관리자가 확인합니다.
                </Alert>
                <Elapsed />
              </Body>
              <Dock inset={30}>
                <Button onClick={() => setOpenedSheet("byespoof")}>퇴근하기</Button>
              </Dock>
            </>
          )}

          {view === "paused" && (
            <>
              <Body variant="detail">
                <GeoBlank icon="/icons/pin.svg" iconClass="text-staff-warning">
                  위치를 읽지 않습니다
                </GeoBlank>
                <Alert tone="warning">
                  <strong>잠시 멈춘 동안에는 앱으로 출퇴근을 등록할 수 없습니다.</strong>
                  <br />
                  출퇴근 기록은 근무지 관리자에게 문의해 주세요.
                </Alert>
                <Sunken prose label="다시 켜면 바로 등록할 수 있습니다">
                  동의는 그대로 남아 있어 <b>새로 동의하지 않아도 됩니다.</b> 내 정보에서도 켤 수 있습니다. 2026년 9월 29일 14:20 부터 일시 중지
                  상태입니다.
                </Sunken>
              </Body>
              <Dock inset={30}>
                <Button onClick={() => go("ready", "위치 수집을 다시 켰습니다")}>다시 켜기</Button>
                {/* 목업 본문의 「내 정보에서도 켤 수 있습니다」를 눌러 가는 길. 위치정보 동의 관리는 내 정보(4장)에 있다. */}
                <Button variant="ghost" href={ME} transitionTypes={["nav-forward"]}>
                  내 정보에서 관리
                </Button>
              </Dock>
            </>
          )}

          {view === "no-consent" && (
            <Body variant="detail">
              <GeoBlank icon="/icons/pin.svg" iconClass="text-staff-placeholder">
                위치정보 동의가 없습니다
              </GeoBlank>
              <Alert tone="danger">
                <strong>위치정보 이용에 동의하지 않으면 앱으로 출퇴근을 등록할 수 없습니다.</strong>
                <br />
                출퇴근 기록은 근무지 관리자에게 문의해 주세요.
              </Alert>
              <Sunken prose label="권한을 끈 것과 다릅니다">
                휴대전화 위치 권한은 설정에서 켜면 바로 등록할 수 있습니다. 여기는 <b>위치정보 수집 동의 자체를 하지 않았거나 철회한</b> 경우라,
                설정을 바꿔도 앱에서는 등록되지 않습니다. 다시 동의하려면 근무지 관리자에게 말씀해 주세요.
              </Sunken>
              <section className="flex flex-col gap-[8px] rounded-[18px] border border-staff-border-light bg-white p-[20px]">
                <h2 className="text-[13px] font-semibold text-staff-text-sub">기록은 이렇게 남습니다</h2>
                <div className="flex gap-[8px] text-[13px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">
                  <span className="flex pt-[3px]">
                    <MaskIcon src="/icons/pencil.svg" size={14} />
                  </span>
                  <p className="min-w-0 flex-1">
                    문의를 받은 관리자가 <b>대신 등록</b>하면 출퇴근 현황에 연필 표시로 보이고, 누르면 누가 언제 왜 등록했는지 볼 수 있습니다.
                  </p>
                </div>
              </section>
            </Body>
          )}

          {view === "vague" && (
            <>
              <Body variant="detail">
                <GeoMap tone="vague" caption="오차 ±180m" />
                <Alert tone="warning">
                  <strong>위치가 흐릿합니다.</strong>
                  <br />
                  지하나 건물 안에서는 오차가 커집니다. 오차가 매장 범위보다 넓어 매장 안인지 확인하지 못했습니다.
                </Alert>
                <Alert tone="warning">
                  그대로 등록하면 <strong>확인 필요</strong>로 표시되어 관리자가 검토합니다.
                </Alert>
              </Body>
              <Dock inset={30}>
                <Button onClick={() => go("ready", "위치를 다시 잡았습니다")}>다시 확인</Button>
                <Button variant="ghost" onClick={() => setOpenedSheet("byeflag")}>
                  확인 필요로 등록하기
                </Button>
              </Dock>
            </>
          )}

          {view === "multi" && (
            <>
              <Body variant="detail">
                <GeoMap tone="in" caption="오차 ±9m · 매장까지 6m" />
                <SiteCard
                  title={SITES[site].name}
                  sub={site === 0 ? "가장 가까운 근무지로 골랐습니다" : "직접 고른 근무지입니다"}
                  action={
                    <button
                      type="button"
                      onClick={() => setPicking(true)}
                      className="-my-[10px] h-[44px] shrink-0 rounded-[12px] px-[12px] text-[14px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
                    >
                      변경
                    </button>
                  }
                />
                <Sunken prose label="내 근무지 3곳">
                  <ul className="flex flex-col divide-y divide-staff-border-light pt-[4px]">
                    {SITES.map((s, i) => (
                      <li key={s.name} className="flex items-center gap-[10px] py-[8px] last:pb-0">
                        <Picked on={i === site} />
                        <span className={`min-w-0 flex-1 text-[14px] ${i === site ? "font-semibold text-staff-text" : "text-staff-text-muted"}`}>{s.name}</span>
                        <span className="text-[12px] text-staff-text-muted">{s.distance}</span>
                      </li>
                    ))}
                  </ul>
                </Sunken>
                <Clock label="현재 시각" time="13:58" />
              </Body>
              <Dock inset={30}>
                <Button onClick={() => go("working", `${SITES[site].name.split(" ")[1]}으로 출근했습니다`)}>
                  출근하기
                  <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
                </Button>
              </Dock>
            </>
          )}

          {view === "nosite" && (
            <Body variant="detail" center>
              <div className="flex flex-1 flex-col items-center justify-center gap-[8px] pt-[76px]">
                <span className="flex text-staff-placeholder">
                  <MaskIcon src="/icons/store.svg" size={30} flipY />
                </span>
                <h2 className="pt-[6px] text-[18px] font-bold">근무지가 없습니다</h2>
                <p className="max-w-[250px] text-[14px] text-staff-text-sub">
                  연결된 근무지가 없어 출퇴근을 등록할 수 없습니다. 받은 급여명세서는 급여 탭에서 볼 수 있습니다.
                </p>
              </div>
            </Body>
          )}
        </main>
      </PageSlide>

      {/* 하단 메뉴 다섯 칸(2026-10-08 재영 결정)의 출퇴근 칸 화면이라 다른 칸 화면처럼 아래에 붙인다. */}
      <div className="sticky bottom-0 mt-auto">
        <BottomNav current="/demo/check-in" items={DEMO_NAV_ITEMS} />
      </div>

      {/* ── 시트 ── 퇴근은 확인 시트를 한 번 거친다(ATT-9). 버튼 이름은 「퇴근 확정」과 「아직 아닙니다」. */}
      <BottomSheet
        open={sheet === "bye"}
        onClose={handleSheetClose}
        title="퇴근할까요"
        description="퇴근을 등록하면 오늘 근무가 끝납니다. 뒤에 다시 출근하려면 새로 등록해야 합니다."
        closeLabel="아직 아닙니다"
      >
        <PunchSummary />
        <Button onClick={() => go("done", "퇴근을 등록했습니다")}>퇴근 확정</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "byefar"}
        onClose={handleSheetClose}
        title="매장 범위 밖에서 퇴근할까요"
        description="이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다. 퇴근을 등록하면 오늘 근무가 끝납니다."
        closeLabel="아직 아닙니다"
      >
        <PunchSummary />
        <Alert tone="warning">매장까지 240m · 범위 100m 밖입니다</Alert>
        <Button onClick={() => go("done", "확인 필요로 퇴근을 등록했습니다")}>퇴근 확정</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "byespoof"}
        onClose={handleSheetClose}
        title="확인 필요로 퇴근할까요"
        description="모의 위치가 켜져 있어 지금 위치를 믿을 수 없습니다. 이대로 등록하면 기록에 확인 필요가 붙고 관리자가 확인합니다. 퇴근을 등록하면 오늘 근무가 끝납니다."
        closeLabel="아직 아닙니다"
      >
        <PunchSummary />
        <Alert tone="warning">확인 필요 사유 · 위치 조작 감지</Alert>
        <Button onClick={() => go("done", "확인 필요로 퇴근을 등록했습니다")}>퇴근 확정</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "byeflag"}
        onClose={handleSheetClose}
        title="확인 필요로 등록할까요"
        description="매장 안인지 확인하지 못한 채로 출근을 등록합니다. 기록에 확인 필요가 붙고 관리자가 검토합니다."
      >
        <Alert tone="warning">위치 오차 ±180m · 매장 범위 100m 보다 넓습니다</Alert>
        <Button onClick={() => go("working", "확인 필요로 등록했습니다")}>이대로 등록</Button>
      </BottomSheet>

      {/* 위치정보 동의(운영 정책 ATT-06): 서비스 약관과 따로, 첫 출근 등록 때 필수. 닫기는 다음에 정하는 것이고 거부는 「동의하지 않음」이다. */}
      <BottomSheet open={sheet === "consent"} onClose={handleSheetClose} title="위치정보 수집에 동의해 주세요">
        <p className="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">
          출퇴근을 등록할 때 <b>매장 안인지</b>를 위치로 확인합니다. <b>위치는 휴대전화 안에서만 확인하고 서버로 보내지 않습니다.</b> 기록에는{" "}
          <b>출퇴근 시각만</b> 남고 위치와 판정 결과는 남지 않습니다.
        </p>
        <Sunken>
          <Values
            rows={[
              ["쓰는 곳", "출퇴근 등록 판정"],
              ["남기는 것", "출퇴근 시각만 · 위치와 판정 결과는 남기지 않음"],
              ["동의 철회", "내 정보에서 언제든"],
            ]}
          />
        </Sunken>
        <p className="text-[12px] font-bold text-staff-text-sub">동의해야 앱으로 출퇴근을 등록할 수 있습니다.</p>
        <p className="text-[12px] text-staff-text-sub">
          서비스 약관과 따로 받는 동의입니다. 동의하지 않으면 출퇴근 기록을 근무지 관리자에게 문의해야 합니다.{" "}
          <span className="text-staff-text-muted">위치정보 수집·이용 동의 v1.2</span>
        </p>
        <p className="text-[12px] text-staff-text-muted">동의서 항목·문구는 법무 검토 중(ATT-8)</p>
        <Button onClick={() => handleToastClick("위치정보 수집에 동의했습니다")}>동의합니다</Button>
        <Button variant="ghost" onClick={() => go("no-consent")}>
          동의하지 않음
        </Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "dup"}
        onClose={handleSheetClose}
        title="이미 출근해 있습니다"
        description="오늘 09:02에 웨일카페 강남역점으로 출근한 기록이 열려 있습니다. 퇴근을 먼저 등록해 주세요."
      >
        <Sunken>
          <Values rows={[["열린 출근", "09:02"]]} />
        </Sunken>
        <Button onClick={() => go("working")}>퇴근하러 가기</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "nopunch"}
        onClose={handleSheetClose}
        title="출근 기록이 없습니다"
        description="퇴근은 열려 있는 출근 기록이 있어야 등록할 수 있습니다. 오늘 출근을 찍지 않았다면 관리자에게 알려 주세요."
      >
        <Sunken prose>관리자는 최근 3개월 안의 기록을 수정할 수 있습니다.</Sunken>
        <Button onClick={() => handleToastClick("관리자에게 알렸습니다")}>관리자에게 알리기</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "nocontract"}
        onClose={handleSheetClose}
        title="근로계약을 체결해야 출근할 수 있습니다"
        description="오늘 날짜가 들어간 체결 완료 근로계약이 있어야 출퇴근을 등록할 수 있습니다. 받은 계약서를 날인하면 바로 출근할 수 있습니다."
      >
        {/* 경고 판: 상태 칩의 지각·긴급 색(#FFF6E5 · #956013). 카드 전체가 계약서로 가는 링크. */}
        <Link
          href={CONTRACT}
          transitionTypes={["nav-forward"]}
          className="flex min-h-[52px] items-center gap-[12px] rounded-[12px] bg-[#fff6e5] p-[14px] text-[#956013]"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold">근로계약서 1건 대기</span>
            <span className="block text-[12px]">남은 기한 26일</span>
          </span>
          <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
        </Link>
        <Button href={CONTRACT} transitionTypes={["nav-forward"]}>
          계약서 보기
        </Button>
      </BottomSheet>

      {/* 근무지 고르기(ATT-6): 목업 상태 목록에는 없고 근무지 여럿의 「변경」으로만 연다. */}
      <BottomSheet
        open={picking}
        onClose={() => setPicking(false)}
        title="근무지 고르기"
        description="가까운 순서로 보여 줍니다. 자동 판정이 틀렸으면 직접 고르세요."
        closeLabel="고르기"
      >
        {SITES.map((s, i) => (
          <SheetOption key={s.name} selected={i === site} onClick={() => setSite(i)}>
            <span className="flex flex-col">
              <span>{s.name}</span>
              <span className="text-[12px] font-normal text-staff-text-muted">
                {s.address} · {s.distance}
              </span>
            </span>
          </SheetOption>
        ))}
      </BottomSheet>

      {toast}
    </>
  );
}

// 근무지 카드(Figma node 12:957): 연한 남보라(#EEF2FF · #DCE4FF 테두리). 근무 중 카드도 같은 판을 쓴다 — 남보라는 「지금 근무 중」이다.
function SiteCard({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <section className="flex items-center gap-[8px] rounded-[18px] border border-[#dce4ff] bg-[#eef2ff] p-[20px]">
      <Image src="/icons/pin.svg" alt="" width={14} height={16} className="-scale-y-100" />
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <p className="truncate text-[16px] font-bold">{title}</p>
        <p className="text-[12px] text-staff-primary">{sub}</p>
      </div>
      {action}
    </section>
  );
}

// 시각 블록(Figma 현재 시각): 라벨 13px semibold · Clock 42px bold. dim 은 출근할 수 없는 상태(범위 밖)라 흐린 글자.
function Clock({ label, time, note, dim = false }: { label: string; time: string; note?: string; dim?: boolean }) {
  return (
    <section className="flex flex-col items-center py-[14px] text-center">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">{label}</h2>
      <p className={`text-[42px] leading-[1.1] font-bold ${dim ? "text-staff-placeholder" : ""}`}>{time}</p>
      {note && <p className="pt-[30px] text-[12px] text-staff-text-sub">{note}</p>}
    </section>
  );
}

// 근무 경과: Clock 크기에 단위만 17px(Pay Unit 과 같은 비율).
function Elapsed() {
  return (
    <section className="flex flex-col items-center py-[14px] text-center">
      <h2 className="text-[13px] font-semibold text-staff-text-sub">근무 경과</h2>
      <p className="text-[42px] leading-[1.1] font-bold">
        6<span className="text-[17px]">시간 </span>41<span className="text-[17px]">분</span>
      </p>
      <p className="pt-[4px] text-[12px] text-staff-text-sub">현재 시각 15:43</p>
    </section>
  );
}

// 퇴근 시트의 출근 시각 · 지금까지.
function PunchSummary() {
  return (
    <Sunken>
      <Values
        rows={[
          ["출근", "09:02"],
          ["지금까지", "6시간 41분"],
        ]}
      />
    </Sunken>
  );
}

// 근무지 목록의 고름 표시: 고른 곳은 남보라 원에 흰 체크, 나머지는 빈 원.
function Picked({ on }: { on: boolean }) {
  return on ? (
    <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-staff-primary">
      <Image src="/icons/check.svg" alt="" width={10} height={10} />
    </span>
  ) : (
    <span className="size-[16px] shrink-0 rounded-full border border-staff-placeholder" />
  );
}
