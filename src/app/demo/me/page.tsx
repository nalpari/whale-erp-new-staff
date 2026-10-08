"use client";

// 직원 근무 앱 데모 · 내 정보(/demo/me). 기준 목업: docs/mockup/app/me.html — 상태 9개(내 정보 · 번호 변경 · 번호 변경 완료 ·
// 이미 인증된 번호 · 비밀번호 변경 · 이메일 변경 · 새 이메일 인증 · 주소 검색 · 소속 근무지)와 시트 8개(변경 이력 · 약관 보기 · 잠시 멈춤 ·
// 일시 중지 동안의 카드 · 본사 제공 동의 내용 · 본사 제공 동의 철회 · 위치정보 동의 철회 · 로그아웃), 화면 문구·가짜 값·이동(data-go)·알림(data-toast)을 옮겼다.
// 이름·생년월일은 본인인증으로 확정된 값이고 소속 근무지·고용 형태는 근로계약으로만 바뀌어 읽기 전용이다. 직원이 고치는 건 휴대전화번호·이메일·주소·비밀번호뿐이다.
// 위치정보 동의 카드: 동의 상태·일시·버전, 약관 보기 · 잠시 멈춤 · 동의 철회(운영 정책 ATT-23·26). 일시 중지 중이면 같은 카드가 「다시 켜기」로 바뀐다.
// 본사 제공 동의 카드: 가맹 점포 직원의 선택 동의, 내용 보기 · 동의 철회(운영 정책 ATT-30). 동의 문구는 법무 검토 중(ATT-8).
// 확정 쟁점: ME-1 재설정 핀 10분(로그인 화면) · ME-2 주소는 주소 검색으로 도로명을 고르고 상세주소만 적는다 · ME-3 이메일은 새 이메일 인증 뒤에 바뀐다 ·
// ME-4 비밀번호 규칙(세 가지 8자 · 두 가지 10자 · 최대 20자 · 이메일 아이디와 겹치지 않기). 로그아웃은 맨 아래(S-PHHICH 확정).
// 목업과 다른 점: 목업의 「일시 중지 동안의 카드」 시트는 카드 자체를 일시 중지 모양으로 바꾼 상태(paused)로 그린다.
// 이메일 변경·새 이메일 인증·주소 검색은 목업에 머리줄이 없어 같은 뒤로 가기 머리줄을 붙였다. 출퇴근 등록 화면으로 가는 버튼 둘은 데모용으로 더했다.
// 탈퇴 화면은 목업에도 아직 없고 이번 데모 범위 밖이다.
// Figma 없음 — DESIGN.md 기준 초안.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Badge, BottomNav, BottomSheet, Button, Card, MaskIcon, Notice, TextField } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { DEMO_NAV_ITEMS, DemoStates, useDemoState } from "../_components";

// 목업 오른쪽 상태 목록 순서 그대로. 뒤의 둘은 목업의 「시트 열기」라 내 정보 화면을 뒤에 깐다.
const STATES = [
  { id: "view", label: "내 정보", note: "기본 화면" },
  { id: "phone", label: "번호 변경", note: "본인인증 재실행" },
  { id: "phone-done", label: "번호 변경 완료", note: "성공" },
  { id: "phone-taken", label: "이미 인증된 번호", note: "막힘" },
  { id: "password", label: "비밀번호 변경", note: "본인이 직접" },
  { id: "email", label: "이메일 변경", note: "아이디가 바뀐다" },
  { id: "email-pin", label: "새 이메일 인증", note: "10분 · 5회" },
  { id: "addr", label: "주소 검색", note: "도로명 고르기" },
  { id: "sites", label: "소속 근무지", note: "조회만" },
  { id: "history", label: "변경 이력", note: "항목·일시·전후" },
  { id: "paused", label: "위치 수집 일시 중지", note: "다시 켜기" },
];

type Sheet = "history" | "terms" | "pause" | "revoke" | "bpshare" | "bprevoke" | "logout";

const TITLE: Record<string, string> = {
  phone: "휴대전화번호 변경",
  "phone-done": "휴대전화번호 변경",
  "phone-taken": "휴대전화번호 변경",
  password: "비밀번호 변경",
  email: "이메일 변경",
  "email-pin": "새 이메일 인증",
  addr: "주소 검색",
  sites: "소속 근무지",
};
// 머리줄 뒤로 가기가 돌아가는 곳. 새 이메일 인증만 이메일 입력으로, 나머지는 내 정보로.
const BACK: Record<string, string> = { "email-pin": "email" };

const ME = "/demo/me";
const ADDRESSES = ["서울 마포구 양화로 12", "서울 마포구 양화로 12-1"];

export default function DemoMePage() {
  const [state, move] = useDemoState(STATES);
  const back = (id: string) => move(id, "nav-back");

  const [openedSheet, setOpenedSheet] = useState<Sheet | null>(null);
  const [address, setAddress] = useState(ADDRESSES[0]);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  // 변경 이력·일시 중지는 내 정보 화면 위의 모습이라 슬라이드 열쇠를 view 로 둔다(카드만 바뀌고 화면은 움직이지 않는다).
  const view = state === "history" || state === "paused" ? "view" : state;
  const paused = state === "paused";
  const sheet = openedSheet ?? (state === "history" ? "history" : null);

  const closeSheet = () => {
    setOpenedSheet(null);
    if (state === "history") back("view");
  };
  const handleSheetAction = (message: string) => {
    setOpenedSheet(null);
    setToast(message);
  };
  const handlePause = () => {
    handleSheetAction("위치 수집을 멈췄습니다");
    move("paused");
  };
  const handleAddressPick = (picked: string) => {
    setAddress(picked);
    back("view");
    setToast("주소를 골랐습니다. 상세주소를 적어 주세요");
  };
  const goWithToast = (id: string, message: string, direction: "nav-forward" | "nav-back" = "nav-forward") => {
    move(id, direction);
    setToast(message);
  };

  return (
    <>
      <DemoStates states={STATES} current={state} onChange={move} />

      <PageSlide key={view}>
        <div className="flex flex-1 flex-col leading-[1.5]">
          {view === "view" ? (
            <header className="flex min-h-[72px] w-full items-center bg-white px-[22px] py-[14px]">
              <h1 className="min-w-0 flex-1 text-[18px] font-bold">내 정보</h1>
              <button
                type="button"
                onClick={() => setOpenedSheet("history")}
                className="-mr-[10px] flex min-h-[44px] items-center rounded-[10px] px-[10px] text-[13px] font-semibold text-staff-text-sub transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
              >
                변경 이력
              </button>
            </header>
          ) : (
            <BackHeader title={TITLE[view]} onBack={() => back(BACK[view] ?? "view")} />
          )}

          {view === "view" && (
            <>
              <main className="flex flex-col gap-[14px] px-[16px] pt-[16px] pb-[24px]">
                <Card>
                  <Label>기본 정보</Label>
                  <div className="flex flex-col gap-[10px] pt-[8px]">
                    <ReadOnlyField label="이름" value="이하은" />
                    <ReadOnlyField label="생년월일" value="1998-04-12" />
                    <ReadOnlyField label="입사일" value="2025-11-03" />
                  </div>
                  <Tiny>이름과 생년월일은 본인인증으로 확정된 값이라 앱에서 고칠 수 없습니다.</Tiny>
                </Card>

                <div className="flex flex-col gap-[6px]">
                  <button
                    type="button"
                    onClick={() => move("sites")}
                    className="flex w-full items-center gap-[12px] rounded-[16px] border border-staff-border-light bg-staff-info-bg p-[16px] text-left transition-colors duration-150 ease-out active:bg-staff-primary-inactive"
                  >
                    <span className="min-w-0 flex-1">
                      <Label>소속 근무지</Label>
                      <span className="block pt-[4px] text-[15px] font-bold">웨일카페 강남역점 외 1곳</span>
                    </span>
                    <Badge tone="plain">파트타이머</Badge>
                    <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
                  </button>
                  <p className="px-[4px] text-[12px] text-staff-text-muted">소속 근무지와 고용 형태는 근로계약으로만 바뀝니다.</p>
                </div>

                {/* 위치정보 동의(운영 정책 ATT-23·26). 일시 중지 중이면 같은 자리에서 「다시 켜기」로 돌아온다 — 다시 켤 때 동의 절차가 없다. */}
                {paused ? (
                  <Card>
                    <CardHead title="위치정보 동의">
                      <Badge tone="warning">일시 중지</Badge>
                    </CardHead>
                    <Tiny>2026년 9월 29일 14:20 부터 일시 중지 · 동의는 2026년 3월 15일 09:04 그대로</Tiny>
                    <div className="flex flex-col gap-[8px] pt-[10px]">
                      <Button onClick={() => move("view")}>다시 켜기</Button>
                      <div className="flex gap-[8px]">
                        <SmallButton onClick={() => setOpenedSheet("terms")}>약관 보기</SmallButton>
                        <SmallButton onClick={() => setOpenedSheet("revoke")}>동의 철회</SmallButton>
                      </div>
                    </div>
                    <Tiny muted>일시 중지 동안 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다시 켜면 새로 동의하지 않아도 됩니다.</Tiny>
                    {/* 데모용: 일시 중지 동안의 출퇴근 등록 화면 */}
                    <div className="pt-[10px]">
                      <Button variant="outline" href="/demo/check-in#paused" transitionTypes={["nav-forward"]}>
                        출퇴근 등록 화면 보기
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <CardHead title="위치정보 동의">
                      <Badge tone="success">동의함</Badge>
                    </CardHead>
                    <Tiny>2026년 3월 15일 09:04 동의 · 위치정보 수집·이용 동의 v1.2</Tiny>
                    <div className="flex gap-[8px] pt-[10px]">
                      <SmallButton onClick={() => setOpenedSheet("terms")}>약관 보기</SmallButton>
                      <SmallButton onClick={() => setOpenedSheet("pause")}>잠시 멈춤</SmallButton>
                      <SmallButton onClick={() => setOpenedSheet("revoke")}>동의 철회</SmallButton>
                    </div>
                    <Tiny muted>동의하지 않으면 앱으로 출퇴근을 등록할 수 없고, 다음 출퇴근 등록 때 다시 동의할 수 있습니다.</Tiny>
                  </Card>
                )}

                {/* 본사 제공 동의(운영 정책 ATT-30). 가맹 점포 직원에게만 묻는 선택 동의라 철회해도 가입과 근무는 그대로다. */}
                <Card>
                  <CardHead title="본사 제공 동의">
                    <Badge tone="success">동의함</Badge>
                  </CardHead>
                  <Tiny>2026년 3월 15일 09:04 동의 · 가맹본부 웨일카페 · 본사 제공 동의 v1.0</Tiny>
                  <div className="flex gap-[8px] pt-[10px]">
                    <SmallButton onClick={() => setOpenedSheet("bpshare")}>내용 보기</SmallButton>
                    <SmallButton onClick={() => setOpenedSheet("bprevoke")}>동의 철회</SmallButton>
                  </div>
                  <Tiny muted>철회해도 가입과 근무는 그대로입니다. 본사에는 점포별 숫자로만 보입니다.</Tiny>
                </Card>

                <Card>
                  <Label>연락처</Label>
                  <div className="flex flex-col gap-[10px] pt-[8px]">
                    <ReadOnlyField
                      label="휴대전화번호"
                      value="010-4821-7736"
                      help="번호를 바꾸려면 새 번호로 본인인증을 다시 거칩니다."
                      action={<SmallButton onClick={() => move("phone")}>번호 변경</SmallButton>}
                    />
                    <ReadOnlyField
                      label="이메일 · 로그인 아이디"
                      value="haeun.lee@gmail.com"
                      help="로그인할 때 쓰는 아이디라 새 이메일로 인증번호를 받아 확인한 뒤에 바뀝니다."
                      action={<SmallButton onClick={() => move("email")}>변경</SmallButton>}
                    />
                    {/* 주소는 검색으로 도로명을 고르고 상세주소만 적는다(ME-2). 이미 쓴 계약서에는 반영하지 않는다는 안내를 빼지 않는다. */}
                    <div className="flex flex-col gap-[6px]">
                      <ReadOnlyField label="주소" value={address} action={<SmallButton onClick={() => move("addr")}>검색</SmallButton>} />
                      <input aria-label="상세주소" placeholder="상세주소" defaultValue="3층 302호" className={FIELD} />
                      <p className="pt-[2px] text-[12px] text-staff-text-muted">
                        도로명 주소는 검색해서 고르고 상세주소만 직접 적습니다. 주소를 바꾸면 지금 계약서에는 반영되지 않고 다음에 새로 쓰는 계약부터
                        적용됩니다.
                      </p>
                    </div>
                  </div>
                  <div className="pt-[12px]">
                    <Button onClick={() => setToast("변경사항을 저장했습니다")}>변경사항 저장</Button>
                  </div>
                </Card>

                <Card>
                  <div className="flex flex-col divide-y divide-staff-border-light">
                    <IconLine icon="/icons/shield.svg" flipY title="비밀번호" sub="마지막 변경 2026년 6월 2일">
                      <SmallButton onClick={() => move("password")}>변경</SmallButton>
                    </IconLine>
                    <IconLine icon="/icons/contract.svg" title="신고 정보" sub="900101-1****** · 국민 ******-01-234567">
                      <Button variant="outline" href="/demo/tax#view" transitionTypes={["nav-forward"]}>
                        보기
                      </Button>
                    </IconLine>
                  </div>
                </Card>

                {/* 로그아웃은 내 정보 맨 아래(S-PHHICH 확정). 자주 누를 것이 아니고 실수로 눌리면 곤란해서 가장 아래다. */}
                <hr className="my-[4px] border-staff-border-light" />
                <Button variant="ghost" onClick={() => setOpenedSheet("logout")}>
                  로그아웃
                </Button>
              </main>

              <div className="sticky bottom-0 mt-auto">
                <BottomNav current={ME} items={DEMO_NAV_ITEMS} />
              </div>
            </>
          )}

          {view === "phone" && (
            <>
              <Body>
                <Sunken>
                  <Label>현재 번호</Label>
                  <p className="pt-[4px] text-[16px] font-bold tabular-nums">010-4821-7736</p>
                </Sunken>
                <TextField label="새 번호" type="tel" inputMode="tel" defaultValue="010-9938-2015" />
                <div className="flex flex-col gap-[8px]">
                  <label htmlFor="me-phone-pin" className="text-[13px] font-semibold text-staff-text-sub">
                    인증번호
                  </label>
                  <div className="flex items-center gap-[8px]">
                    <input id="me-phone-pin" inputMode="numeric" defaultValue="482913" className={FIELD} />
                    <div className="w-[96px] shrink-0">
                      <Button variant="outline" onClick={() => setToast("인증번호를 다시 보냈습니다")}>
                        재전송
                      </Button>
                    </div>
                  </div>
                </div>
                <Notice>본인인증에 성공해야 번호가 바뀝니다. 인증된 번호만 초대 연결과 소속 확인의 매칭 키로 쓰입니다.</Notice>
              </Body>
              <Dock>
                <Button onClick={() => goWithToast("phone-done", "번호를 변경했습니다")}>인증 확인</Button>
                <Button variant="ghost" onClick={() => move("phone-taken")}>
                  이미 인증된 번호로 시도해 보기
                </Button>
                <Button variant="ghost" onClick={() => back("view")}>
                  취소
                </Button>
              </Dock>
            </>
          )}

          {view === "phone-done" && (
            <>
              <Body center>
                <Seal>
                  인증
                  <br />
                  완료
                </Seal>
                <div className="flex flex-col gap-[6px]">
                  <Label>변경된 번호</Label>
                  <p className="text-[28px] font-bold tabular-nums">010-9938-2015</p>
                </div>
                <p className="text-[12px] text-staff-text-muted">이 번호가 앞으로 본인 확인과 알림에 쓰입니다.</p>
              </Body>
              <Dock>
                <Button variant="ghost" onClick={() => back("view")}>
                  내 정보로 돌아가기
                </Button>
              </Dock>
            </>
          )}

          {view === "phone-taken" && (
            <>
              <Body>
                <Alert tone="danger">
                  <strong>이미 다른 계정에 인증된 번호입니다.</strong>
                  <br />
                  본인 명의라면 그 계정에서 먼저 번호를 해지한 뒤 다시 시도해 주세요.
                </Alert>
                <Sunken>
                  <Label>시도한 번호</Label>
                  <p className="pt-[4px] text-[16px] font-bold tabular-nums">010-7788-3210</p>
                </Sunken>
                <p className="text-[12px] text-staff-text-muted">기존 번호 010-4821-7736 은 그대로 유지됩니다.</p>
              </Body>
              <Dock>
                <Button onClick={() => back("phone")}>다른 번호로 다시 시도</Button>
                <Button variant="ghost" onClick={() => back("view")}>
                  취소
                </Button>
              </Dock>
            </>
          )}

          {view === "password" && (
            <>
              <Body>
                <TextField label="현재 비밀번호" type="password" autoComplete="current-password" defaultValue="********" />
                <TextField label="새 비밀번호" type="password" autoComplete="new-password" defaultValue="••••••••••" />
                <TextField label="새 비밀번호 확인" type="password" autoComplete="new-password" defaultValue="••••••••••" />
                {/* 비밀번호 규칙(ME-4). 가입·재설정·관리자 초기화 뒤의 변경에도 같이 적용한다. */}
                <Sunken>
                  <Label>비밀번호 조건</Label>
                  <ul className="flex flex-col pt-[2px]">
                    <Rule ok>
                      영문 대소문자·숫자·기호 중 <b>세 가지</b>를 섞었습니다
                    </Rule>
                    <Rule ok>8자 이상 20자 이하</Rule>
                    <Rule ok={false}>이메일 아이디와 겹치지 않기</Rule>
                  </ul>
                  <p className="pt-[7px] text-[12px] text-staff-text-muted">두 가지만 섞으면 10자 이상이어야 합니다.</p>
                </Sunken>
              </Body>
              <Dock>
                <Button onClick={() => goWithToast("view", "비밀번호를 변경했습니다", "nav-back")}>변경하기</Button>
                <Button variant="ghost" onClick={() => back("view")}>
                  취소
                </Button>
              </Dock>
            </>
          )}

          {/* 이메일이 로그인 아이디라 새 이메일로 인증번호를 받아 확인한 뒤에만 바뀐다(ME-3). */}
          {view === "email" && (
            <>
              <Body>
                <Lead title="이메일을 바꾸면 아이디가 바뀝니다">새 이메일로 인증번호를 보냅니다. 확인이 끝나면 다음 로그인부터 새 이메일을 씁니다.</Lead>
                <Sunken>
                  <div className="flex items-center gap-[12px]">
                    <Label>지금 아이디</Label>
                    <span className="min-w-0 flex-1 truncate text-right text-[13px]">haeun.lee@gmail.com</span>
                  </div>
                </Sunken>
                <TextField label="새 이메일" type="email" autoComplete="email" placeholder="새로 쓸 이메일" />
                <Alert tone="warning">
                  비밀번호를 잊었을 때 인증번호가 이 주소로 갑니다. <strong>받을 수 있는 주소</strong>인지 확인해 주세요.
                </Alert>
              </Body>
              <Dock>
                <Button onClick={() => goWithToast("email-pin", "새 이메일로 인증번호를 보냈습니다")}>인증번호 받기</Button>
                <Button variant="ghost" onClick={() => back("view")}>
                  그대로 두기
                </Button>
              </Dock>
            </>
          )}

          {view === "email-pin" && (
            <>
              <Body>
                <Lead title="새 이메일로 보낸 번호를 넣어 주세요">haeun.new****@gmail.com 으로 보냈습니다.</Lead>
                <TextField label="인증번호" autoComplete="one-time-code" defaultValue="9T4X1P" />
                <div className="flex items-center justify-between text-[12px] text-staff-text-sub">
                  <span>
                    남은 시간 <b className="font-bold text-staff-text tabular-nums">09:12</b>
                  </span>
                  <span>
                    남은 시도 <b className="font-bold text-staff-text tabular-nums">5</b>회
                  </span>
                </div>
                <Notice>확인이 끝날 때까지 아이디는 그대로 이전 이메일입니다.</Notice>
              </Body>
              <Dock>
                <Button onClick={() => goWithToast("view", "아이디를 새 이메일로 바꿨습니다", "nav-back")}>확인</Button>
                <Button variant="ghost" onClick={() => back("email")}>
                  이메일 다시 입력
                </Button>
              </Dock>
            </>
          )}

          {/* 주소 검색(ME-2). 고른 도로명은 그대로 저장되고 상세주소만 내 정보에서 적는다. 어느 API 를 붙일지는 개발에서 정한다. */}
          {view === "addr" && (
            <Body>
              <div className="flex flex-col gap-[8px]">
                <label htmlFor="me-addr-q" className="text-[13px] font-semibold text-staff-text-sub">
                  도로명 주소 검색
                </label>
                <div className="flex items-center gap-[8px]">
                  <input id="me-addr-q" defaultValue="양화로 12" aria-describedby="me-addr-help" className={FIELD} />
                  <div className="w-[88px] shrink-0">
                    <Button onClick={() => setToast("주소를 찾았습니다")}>검색</Button>
                  </div>
                </div>
                <p id="me-addr-help" className="text-[12px] text-staff-text-muted">
                  도로명이나 건물 이름으로 찾습니다.
                </p>
              </div>
              <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
                {ADDRESSES.map((a) => (
                  <li key={a}>
                    <button type="button" onClick={() => handleAddressPick(a)} className="flex w-full items-center gap-[12px] py-[13px] text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{a}</span>
                        <span className="block text-[12px] text-staff-text-sub">서교동 · 우편번호 04044</span>
                      </span>
                      <Image src="/icons/chevron-right-muted.svg" alt="" width={12} height={12} className="-scale-y-100" />
                    </button>
                  </li>
                ))}
              </ul>
              <Notice>
                고른 주소는 <strong>그대로 저장</strong>되고 상세주소만 직접 적습니다. 오타나 형식이 어긋나는 일을 막기 위해서입니다.
              </Notice>
            </Body>
          )}

          {view === "sites" && (
            <Body>
              <ul className="flex flex-col divide-y divide-staff-border-light rounded-[16px] border border-staff-border-light bg-white px-[16px]">
                {[
                  ["웨일카페 강남역점", "파트타이머 · 2025년 11월 3일부터"],
                  ["웨일카페 홍대점", "파트타이머 · 2026년 3월 16일부터"],
                ].map(([name, sub]) => (
                  <li key={name} className="flex items-start gap-[12px] py-[14px]">
                    <span className="flex pt-[3px] text-staff-text-sub">
                      <MaskIcon src="/icons/store-small.svg" size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15px] font-semibold">{name}</span>
                      <span className="block text-[12px] text-staff-text-sub">{sub}</span>
                    </span>
                    <Badge tone="working">근무 중</Badge>
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-staff-text-muted">소속과 고용 형태는 근로계약이 새로 체결되어야 바뀝니다. 여기서는 고칠 수 없습니다.</p>
            </Body>
          )}
        </div>
      </PageSlide>

      <BottomSheet
        open={sheet === "history"}
        onClose={closeSheet}
        title="변경 이력"
        description="연락처·주소·비밀번호를 바꾼 기록입니다. 비밀번호는 바뀐 사실만 남고 값은 남지 않습니다."
      >
        <ul className="flex flex-col divide-y divide-staff-border-light">
          {[
            ["이메일 변경", "haeun98@gmail.com → haeun.lee@gmail.com", "2026-07-02"],
            ["휴대전화번호 변경", "010-2231-9944 → 010-4821-7736", "2026-05-14"],
            ["비밀번호 변경", "본인이 직접 변경", "2026-06-02"],
            ["주소 변경", "서울 마포구 동교로 5 → 서울 마포구 양화로 12", "2026-04-18"],
          ].map(([title, sub, date]) => (
            <li key={title} className="flex items-start gap-[12px] py-[12px]">
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold">{title}</span>
                <span className="block text-[12px] text-staff-text-sub">{sub}</span>
              </span>
              <span className="shrink-0 text-[12px] text-staff-text-muted tabular-nums">{date}</span>
            </li>
          ))}
        </ul>
        <Button variant="outline" onClick={() => setToast("20건을 더 불러왔습니다")}>
          더 보기
        </Button>
      </BottomSheet>

      <BottomSheet open={sheet === "terms"} onClose={closeSheet} title="위치정보 수집·이용 동의">
        <p className="-mt-[12px] text-[12px] text-staff-text-muted">v1.2 · 2026년 3월 1일부터</p>
        <Sunken>
          <p className="text-[14px] text-staff-text-sub [&_b]:font-bold [&_b]:text-staff-text">
            출퇴근을 등록할 때 근무지 반경 안인지를 확인하는 데만 씁니다. <b>위치는 휴대전화 안에서만 확인하고 서버로 보내지 않으며</b> 기록에는
            출퇴근 시각만 남습니다. 동의는 내 정보에서 언제든 철회할 수 있고, 철회하면 앱으로 등록할 수 없습니다.
          </p>
        </Sunken>
        <p className="text-[12px] text-staff-text-muted">약관 버전이 바뀌면 다음 출퇴근 등록 때 새 버전으로 다시 동의를 받습니다.</p>
      </BottomSheet>

      {/* 일시 중지(운영 정책 ATT-26). 버튼 이름은 「잠시 멈춤」「다시 켜기」. 동의는 남고 수집만 멎어 다시 켤 때 동의 절차가 없다. */}
      <BottomSheet open={sheet === "pause"} onClose={closeSheet} title="위치 수집을 잠시 멈출까요" closeLabel="그대로 두기">
        <p className="text-[14px] font-bold text-staff-text">
          잠시 멈춘 동안에는 앱으로 출퇴근을 등록할 수 없습니다. 출퇴근 기록은 근무지 관리자에게 문의해 주세요. 다시 켜면 새로 동의하지 않아도
          됩니다.
        </p>
        <Sunken>
          <p className="text-[14px] text-staff-text-sub">동의는 그대로 남고 수집만 멎습니다. 철회와 달리 다시 켤 때 동의 절차가 없습니다.</p>
        </Sunken>
        <Button onClick={handlePause}>잠시 멈춤</Button>
      </BottomSheet>

      <BottomSheet open={sheet === "revoke"} onClose={closeSheet} title="위치정보 동의를 철회할까요" closeLabel="그대로 두기">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          철회하면 <strong>앱으로 출퇴근을 등록할 수 없습니다. 출퇴근 기록은 근무지 관리자에게 문의해 주세요.</strong>
        </p>
        <Sunken>
          <p className="text-[14px] text-staff-text-sub">다시 등록하려면 다음 출퇴근 등록 때 새로 동의하면 됩니다. 이미 남은 기록은 그대로 보존됩니다.</p>
        </Sunken>
        <Button onClick={() => handleSheetAction("위치정보 동의를 철회했습니다")}>철회합니다</Button>
        {/* 데모용: 철회 뒤의 출퇴근 등록 화면(「위치정보 동의 없음」, 운영 정책 ATT-20) */}
        <Button variant="outline" href="/demo/check-in#no-consent" transitionTypes={["nav-forward"]}>
          출퇴근 등록 화면 보기
        </Button>
      </BottomSheet>

      <BottomSheet open={sheet === "bpshare"} onClose={closeSheet} title="본사 제공 동의">
        <Sunken>
          <dl className="flex flex-col divide-y divide-staff-border-light">
            {[
              ["받는 자", "가맹본부 · 웨일카페"],
              ["항목", "근로계약 · 근무스케줄 · 출퇴근 기록과 확인 필요 사유 · 급여명세서"],
              ["목적", "가맹점 운영 지원과 점검"],
              ["보유 기간", "철회 또는 가맹 관계 종료까지"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-[12px] py-[8px] first:pt-0 last:pb-0">
                <dt className="shrink-0 text-[13px] font-medium text-staff-text-sub">{k}</dt>
                <dd className="min-w-0 flex-1 text-right text-[13px]">{v}</dd>
              </div>
            ))}
          </dl>
        </Sunken>
        <p className="text-[12px] text-staff-text-muted [&_b]:font-bold [&_b]:text-staff-text">
          선택 동의입니다. 철회해도 가입과 근무는 그대로이고, 본사에는 점포별 숫자로만 보입니다. <b>항목이나 목적이 넓어지면</b> 새 버전으로 다시
          동의를 받습니다.
        </p>
        <p className="text-[12px] text-staff-placeholder">동의 문구는 법무 검토 중(ATT-8)</p>
      </BottomSheet>

      <BottomSheet open={sheet === "bprevoke"} onClose={closeSheet} title="본사 제공 동의를 철회할까요" closeLabel="그대로 두기">
        <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">
          철회하면 가맹본부가 <strong>내 근무 정보를 개인 단위로 보지 않습니다.</strong> 점포별 숫자로만 보입니다.
        </p>
        <Sunken>
          <p className="text-[14px] text-staff-text-sub">가입과 근무, 급여명세서 수령은 그대로입니다. 다시 동의하려면 이 화면에서 켜면 됩니다.</p>
        </Sunken>
        <Button onClick={() => handleSheetAction("본사 제공 동의를 철회했습니다")}>철회합니다</Button>
      </BottomSheet>

      <BottomSheet
        open={sheet === "logout"}
        onClose={closeSheet}
        title="로그아웃할까요"
        description="다시 들어오려면 이메일과 비밀번호가 필요합니다. 출퇴근을 찍어야 할 때 번거로울 수 있습니다."
        closeLabel="그대로 두기"
      >
        {/* 목업 btn--seal(빨강). 로그인 데모의 로그아웃 시트와 같은 모양이고, 여기서는 로그인 화면으로 가는 링크다. */}
        <Link
          href="/demo/login"
          transitionTypes={["nav-back"]}
          className="flex h-[52px] items-center justify-center rounded-[12px] bg-staff-error text-[15px] font-bold text-white transition-[background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:bg-[#dc2626]"
        >
          로그아웃
        </Link>
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

// 하위 화면 머리줄. PageHeader 와 같은 모양이고, 뒤로 가기가 링크가 아니라 화면 안 상태를 되돌리는 버튼이다(tax 데모와 같다).
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

// 읽기 전용 칸(목업 input--ro): 입력칸과 같은 52px · radius 12 지만 안내 바탕·옅은 테두리·보조 글자로 고칠 수 없음을 보인다.
// action 이 있으면 오른쪽에 44px 외곽선 버튼(96px 폭)을 둔다.
function ReadOnlyField({ label, value, help, action }: { label: string; value: string; help?: string; action?: ReactNode }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-[8px]">
      <label htmlFor={id} className="text-[13px] font-semibold text-staff-text-sub">
        {label}
      </label>
      <div className="flex items-center gap-[8px]">
        <input
          id={id}
          readOnly
          value={value}
          aria-describedby={help ? `${id}-help` : undefined}
          className="h-[52px] w-full min-w-0 rounded-[12px] border border-staff-border-light bg-staff-info-bg px-[14px] text-[16px] text-staff-text-sub outline-none!"
        />
        {action && <div className="w-[96px] shrink-0">{action}</div>}
      </div>
      {help && (
        <p id={`${id}-help`} className="text-[12px] text-staff-text-muted">
          {help}
        </p>
      )}
    </div>
  );
}

// 카드 안 작은 버튼(목업 btn--sm): 44px 외곽선 버튼. 줄에 여럿이면 칸을 나눠 갖는다.
function SmallButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <div className="min-w-0 flex-1">
      <Button variant="outline" onClick={onClick}>
        {children}
      </Button>
    </div>
  );
}

function CardHead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-[12px]">
      <Label>{title}</Label>
      {children}
    </div>
  );
}

// 카드 안 항목 이름(Label 13px semibold, 보조 글자).
function Label({ children }: { children: ReactNode }) {
  return <p className="text-[13px] font-semibold text-staff-text-sub">{children}</p>;
}

// 카드 안 안내 한 줄(Caption 12px). muted 는 한 단계 더 흐린 끝줄.
function Tiny({ muted = false, children }: { muted?: boolean; children: ReactNode }) {
  return <p className={`pt-[8px] text-[12px] ${muted ? "text-staff-placeholder" : "text-staff-text-muted"}`}>{children}</p>;
}

// 비밀번호·신고 정보 줄: 아이콘 · 제목 14px semibold · 설명 12px · 오른쪽 버튼(96px).
function IconLine({ icon, title, sub, flipY = false, children }: { icon: string; title: string; sub: string; flipY?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center gap-[12px] py-[12px] first:pt-0 last:pb-0">
      <span className="flex size-[20px] shrink-0 items-center justify-center text-staff-text-sub">
        <MaskIcon src={icon} size={18} flipY={flipY} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="truncate text-[12px] text-staff-text-muted">{sub}</p>
      </div>
      <div className="w-[96px] shrink-0">{children}</div>
    </div>
  );
}

// 하위 화면 첫 줄: 제목 Title 1 + 설명 14px.
function Lead({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h2 className="text-[22px] font-bold">{title}</h2>
      <p className="text-[14px] text-staff-text-sub">{children}</p>
    </div>
  );
}

// 비밀번호 조건 한 줄. 맞으면 성공색 체크, 아직이면 빈 동그라미와 흐린 글자.
function Rule({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <li className={`flex items-center gap-[8px] py-[6px] text-[13px] [&_b]:font-bold ${ok ? "font-medium text-staff-text" : "text-staff-text-muted"}`}>
      {ok ? (
        <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-white">
          <MaskIcon src="/icons/check.svg" size={10} />
        </span>
      ) : (
        <span aria-hidden className="size-[16px] shrink-0 rounded-full border-[1.5px] border-staff-placeholder" />
      )}
      <span className="sr-only">{ok ? "충족" : "미충족"}</span>
      <span>{children}</span>
    </li>
  );
}

// 막힘·주의 안내(목업 note--seal · note--amber). Notice 와 같은 크기에 색만 Badge 의 지각·긴급 짝을 빌린다.
function Alert({ tone, children }: { tone: "danger" | "warning"; children: ReactNode }) {
  const color = tone === "danger" ? "bg-[#fee2e2] text-[#b91c1c]" : "bg-[#fef3c7] text-[#92400e]";
  return <p className={`w-full rounded-[12px] p-[14px] text-[13px] leading-[1.5] [&_strong]:font-bold ${color}`}>{children}</p>;
}

// 본문: 좌우 24 · 위 30 · 줄 사이 16(tax 데모와 같다). center 면 가운데 정렬 결과 화면.
function Body({ center = false, children }: { center?: boolean; children: ReactNode }) {
  return <div className={`flex flex-col gap-[16px] px-[24px] pt-[30px] pb-[24px] ${center ? "text-center" : ""}`}>{children}</div>;
}

// 하단 버튼 줄: 흰 띠. 본문이 짧으면 mt-auto 로 맨 아래에 붙는다.
function Dock({ children }: { children: ReactNode }) {
  return (
    <div className="mt-auto flex flex-col gap-[8px] bg-white px-[24px] pt-[14px] pb-[max(24px,env(safe-area-inset-bottom))]">{children}</div>
  );
}

// 목업의 card--sunken: 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14.
function Sunken({ children }: { children: ReactNode }) {
  return <div className="w-full rounded-[12px] border border-staff-border-light bg-staff-info-bg p-[14px] text-left">{children}</div>;
}

// 결과 도장(목업 .seal). 정상·완료 칩 색(#EAF8F2 · #13785E).
function Seal({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex size-[88px] items-center justify-center rounded-full border-2 border-[#13785e] bg-[#eaf8f2] text-[15px] leading-[1.3] font-bold text-[#13785e]">
      {children}
    </div>
  );
}
