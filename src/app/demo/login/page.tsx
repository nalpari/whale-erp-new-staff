"use client";

// 직원 근무 앱 데모 · 로그인(/demo/login). 기준 목업: docs/mockup/app/login.html (상태 17개 + 로그아웃 확인 시트, 쟁점 LOGIN-1~11 모두 확정).
// 목업의 data-when 뷰·dock 버튼(data-go)·화면 문구·가짜 값을 그대로 옮겼다. 남은 시간 같은 숫자는 목업의 고정 값이다.
// 기본 로그인(login)은 Figma 01.Login(node 3:1965)을 따른다. 그 밖 상태는 Figma 없음 — DESIGN.md 기준 초안.
// 목업의 토스트(data-toast)는 옮기지 않았다.

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BottomSheet, BrandLogo, Button, Card, Notice, TextField } from "@/components/common";
import { PageSlide } from "@/app/design/(mockup)/page-slide";
import { Alert, DangerButton, DemoStates, Dock, useDemoState, type DemoDirection, type DemoState } from "../_components";

const STATES: DemoState[] = [
  { id: "login", label: "로그인", note: "평상시" },
  { id: "fail", label: "로그인 실패", note: "남은 횟수" },
  { id: "locked", label: "계정 잠김", note: "5회 실패" },
  { id: "find", label: "이메일 찾기", note: "이름·번호·생년월일" },
  { id: "found", label: "이메일 찾음", note: "목록 · 가려서 표시" },
  { id: "find-fail", label: "이메일 못 찾음", note: "남은 시도 2번" },
  { id: "find-lock", label: "이메일 찾기 막힘", note: "5분 · 점포 문의" },
  { id: "forgot", label: "비밀번호 찾기", note: "이메일 입력" },
  { id: "pin", label: "인증번호 입력", note: "10분 · 5회" },
  { id: "pin-closed", label: "인증번호 닫힘", note: "5회 틀림" },
  { id: "pin-out", label: "인증번호 만료", note: "10분 지남" },
  { id: "newpw", label: "새 비밀번호 설정", note: "본인 재설정" },
  { id: "newpw-out", label: "새 비밀번호 저장 실패", note: "10분 지남·핀 닫힘" },
  { id: "temp", label: "관리자 초기화 링크", note: "24시간" },
  { id: "link-used", label: "쓸 수 없는 링크", note: "사유 구분 없음" },
  { id: "expired", label: "세션 만료", note: "30일 지남" },
  { id: "splash", label: "앱 시작", note: "자동 로그인" },
  // 목업에서는 상태가 아니라 시트(data-sheet="logout")다. 데모 도구에서 열 수 있게 상태로 두고, 뒤에는 로그인 화면을 깐다.
  { id: "logout", label: "로그아웃", note: "내 정보 맨 아래에 둔다" },
];

const HOME = "/demo/home";

type Dir = DemoDirection;

export default function DemoLoginPage() {
  const [view, go] = useDemoState(STATES);
  const router = useRouter();
  const back = (id: string) => go(id, "nav-back");

  return (
    <main className="flex flex-1 flex-col">
      <PageSlide key={view === "logout" ? "login" : view}>
        <div className="flex flex-1 flex-col">{renderView(view, go, back)}</div>
      </PageSlide>

      <BottomSheet
        open={view === "logout"}
        onClose={() => router.push("/demo/me")}
        title="로그아웃할까요"
        description="다시 들어오려면 이메일과 비밀번호가 필요합니다. 출퇴근을 찍어야 할 때 번거로울 수 있습니다."
        closeLabel="그대로 두기"
      >
        {/* 목업 btn--seal(빨강). 되돌리기 어려운 동작이라 남보라 대신 오류색을 쓴다. 「그대로 두기」는 들어온 곳인 내 정보로 돌아간다. */}
        <DangerButton onClick={() => back("login")}>로그아웃</DangerButton>
      </BottomSheet>

      <DemoStates states={STATES} current={view} onChange={go} />
    </main>
  );
}

function renderView(view: string, go: (id: string, dir?: Dir) => void, back: (id: string) => void) {
  switch (view) {
    case "splash":
      return (
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center justify-center gap-[14px]">
            <BrandLogo />
            <p className="text-[13px] font-semibold text-staff-text-sub">직원 근무 앱</p>
          </div>
          <p className="pb-[14px] text-center text-[12px] text-staff-text-muted">저장된 로그인을 확인하는 중입니다</p>
          <Dock inset={30}>
            <Button variant="ghost" href={HOME} transitionTypes={["nav-forward"]}>
              홈으로 들어가기
            </Button>
          </Dock>
        </div>
      );

    case "fail":
    case "login":
    case "logout": {
      const fail = view === "fail";
      return (
        <Screen
          top={<BrandLogo />}
          title="다시 오셨네요"
          desc="근무 정보와 출퇴근을 확인하려면 로그인하세요."
          dock={
            <>
              <Button onClick={() => go("splash")}>
                로그인
                <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
              </Button>
              <Button variant="ghost" onClick={() => go("forgot")}>
                비밀번호를 잊으셨나요
              </Button>
              <Button variant="ghost" onClick={() => go("find")}>
                이메일이 기억나지 않나요
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-[16px]">
            <TextField
              label="이메일"
              type="email"
              autoComplete="username"
              defaultValue="haeun.lee@gmail.com"
              help={fail ? undefined : "가입할 때 정한 아이디입니다"}
            />
            <TextField
              label="비밀번호"
              type="password"
              autoComplete="current-password"
              defaultValue="haeun2026"
              error={fail ? "이메일이나 비밀번호가 맞지 않습니다" : undefined}
            />
          </div>
          {fail ? (
            <Notice>
              연속 <strong>5</strong>회 틀리면 5분 동안 잠깁니다. 남은 횟수 <strong>3</strong>회.
            </Notice>
          ) : (
            <Notice icon={<Image src="/icons/shield.svg" alt="" width={12} height={12.5} className="-scale-y-100" />}>
              한 번 로그인하면 <strong>30일</strong> 동안 다시 묻지 않습니다.
            </Notice>
          )}
        </Screen>
      );
    }

    // LOGIN-5: 연속 5회 · 5분 고정, 잠금 안내와 비밀번호 재설정 버튼.
    case "locked":
      return (
        <Screen
          title="잠시 잠겼습니다"
          desc={
            <>
              비밀번호를 연속 다섯 번 틀려 계정이 잠겼습니다. <strong>5분 뒤에 다시 시도하거나 비밀번호를 재설정하세요.</strong>
            </>
          }
          dock={
            <>
              <Button onClick={() => go("forgot")}>비밀번호 재설정</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                5분 뒤 다시 시도
              </Button>
            </>
          }
        >
          <Alert tone="warning">
            <p className="text-[14px] font-semibold">남은 시간</p>
            <p className="text-[28px] font-bold tabular-nums">04:12</p>
          </Alert>
          <Notice>
            기다리기 어려우면 <strong>비밀번호를 다시 정하면</strong> 바로 들어올 수 있습니다. 새로 정하면 잠금도 함께 풀립니다. 잠긴
            동안에는 비밀번호가 맞아도 들어갈 수 없습니다.
          </Notice>
        </Screen>
      );

    // LOGIN-8: 이름·휴대전화번호·생년월일로 찾는다.
    case "find":
      return (
        <Screen
          title="로그인 이메일을 찾습니다"
          desc={
            <>
              가입할 때 <strong>본인인증으로 확인된 세 가지</strong>를 넣으면 그 이메일을 찾아 드립니다.
            </>
          }
          dock={
            <>
              <Button onClick={() => go("found")}>이메일 찾기</Button>
              <Button variant="ghost" onClick={() => go("find-fail")}>
                맞지 않는 경우 보기
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-[16px]">
            <TextField label="이름" type="text" autoComplete="name" defaultValue="김민서" />
            <TextField label="휴대전화번호" type="tel" autoComplete="tel" defaultValue="010-2841-5521" />
            <TextField label="생년월일" type="text" defaultValue="1999-04-12" help="가입 때 본인인증으로 확정된 값과 같아야 합니다." />
          </div>
          <Notice>세 값이 모두 맞아야 알려 드립니다. 하나라도 다르면 어느 값이 틀렸는지는 알려 주지 않습니다.</Notice>
        </Screen>
      );

    // LOGIN-9: @ 앞 처음 2글자 + 마지막 1글자만 보이고(3글자 이하면 첫 글자만) 도메인은 그대로. 늘 목록 모양이고,
    // 맞는 계정이 여럿이면 탈퇴 계정을 빼고 모두 보인다(2026-10-08).
    case "found":
      return (
        <Screen
          title="가입된 이메일입니다"
          dock={
            <>
              <Button onClick={() => back("login")}>로그인하러 가기</Button>
              <Button variant="ghost" onClick={() => go("forgot")}>
                비밀번호도 다시 정하기
              </Button>
            </>
          }
        >
          <Card>
            <p className="text-[13px] font-semibold text-staff-text-sub">로그인 이메일 2개</p>
            <ul className="pt-[4px]">
              {["ha******e@gmail.com", "ha*****1@naver.com"].map((email) => (
                <li key={email} className="border-b border-staff-border-light py-[10px] text-[16px] font-semibold tabular-nums last:border-b-0">
                  {email}
                </li>
              ))}
            </ul>
            <p className="pt-[6px] text-[12px] text-staff-text-muted">
              @ 앞은 처음 두 글자와 마지막 한 글자만 보이고 나머지는 글자 수만큼 가립니다. 도메인으로 어느 메일함인지 알아볼 수 있습니다.
            </p>
          </Card>
          <Notice>
            <strong>다음에 할 일</strong>
            <br />이 이메일로 로그인하세요. 비밀번호가 기억나지 않으면 이 주소로 인증번호를 받아 다시 정할 수 있습니다.
          </Notice>
        </Screen>
      );

    // LOGIN-10: 어느 값이 틀렸는지 알리지 않고 5회까지.
    case "find-fail":
      return (
        <Screen
          title="맞는 계정을 찾지 못했습니다"
          desc="세 값이 가입 때 확인된 값과 다릅니다. 남은 시도는 2번입니다."
          dock={
            <>
              <Button onClick={() => back("find")}>다시 넣기</Button>
              <Button variant="ghost" onClick={() => go("find-lock")}>
                다섯 번 넘긴 경우 보기
              </Button>
            </>
          }
        >
          <Card>
            <p className="text-[13px] font-semibold text-staff-text-sub">이럴 때가 많습니다</p>
            <ul className="flex flex-col pt-[2px] text-[13px] font-medium">
              <li className="border-b border-staff-border-light py-[8px]">휴대전화번호가 가입 뒤에 바뀐 경우</li>
              <li className="py-[8px]">이름의 띄어쓰기나 생년월일 형식이 다른 경우</li>
            </ul>
            <p className="pt-[6px] text-[12px] text-staff-text-muted">다섯 번 틀리면 5분 동안 막습니다. 그때는 근무지 점포에 직접 방문해 물어 주세요.</p>
          </Card>
        </Screen>
      );

    // LOGIN-10: 5회 넘기면 5분 막고 점포 방문 안내.
    case "find-lock":
      return (
        <Screen
          title="잠시 막았습니다"
          desc="다섯 번 틀렸습니다. 아래 시간이 지나면 다시 시도할 수 있습니다."
          dock={
            <>
              <Button disabled>다시 넣기 · 02:47 뒤</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        >
          <Card>
            <div className="flex flex-col items-center text-center">
              <p className="text-[13px] font-semibold text-staff-text-sub">다시 시도까지</p>
              <p className="pt-[4px] text-[32px] font-bold tabular-nums">02:47</p>
              <p className="pt-[6px] text-[12px] text-staff-text-muted">막는 시간은 5분입니다. 로그인 잠금과 같은 규칙입니다.</p>
            </div>
          </Card>
          <Notice>
            <strong>근무지 점포에 직접 방문해 물어 주세요.</strong> 본인이 맞는지 얼굴을 보고 확인한 뒤에만 알려 드립니다. 전화나
            메시지로는 알려 드릴 수 없습니다. 이메일은 알지만 그 메일함을 쓸 수 없을 때도 같습니다.
          </Notice>
        </Screen>
      );

    // LOGIN-2·3: 이메일 핀, 보낸 때부터 10분 한 시계.
    case "forgot":
      return (
        <Screen
          title="비밀번호를 다시 정합니다"
          desc={
            <>
              가입할 때 정한 이메일로 <strong>인증번호</strong>를 보냅니다. 관리자를 거치지 않아도 됩니다.
            </>
          }
          dock={
            <>
              <Button onClick={() => go("pin")}>인증번호 받기</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        >
          <TextField label="이메일" type="email" autoComplete="username" defaultValue="haeun.lee@gmail.com" help="가입할 때 정한 아이디를 넣어 주세요" />
          <Notice>
            인증번호는 보낸 때부터 <strong>10분</strong> 동안 쓸 수 있습니다. 새 비밀번호도 이 10분 안에 정해 주세요.
          </Notice>
          <Card>
            <p className="text-[13px] font-semibold text-staff-text-sub">이메일을 쓸 수 없다면</p>
            <p className="pt-[6px] text-[13px] text-staff-text-sub">
              관리자에게 알리면 관리자가 초기화를 요청합니다. 그때는 재설정 링크가 이메일로 갑니다.{" "}
              <strong className="font-bold text-staff-text">그 메일함 자체를 쓸 수 없으면 근무지 점포에 직접 방문해 물어 주세요</strong> —
              관리자가 이메일을 대신 고치지는 못합니다.
            </p>
          </Card>
        </Screen>
      );

    // LOGIN-3: 10분 · 5회, 발급 1분 간격 · 하루 10회.
    case "pin":
      return (
        <Screen
          title="인증번호를 넣어 주세요"
          desc={
            <>
              <span className="tabular-nums">haeun****@gmail.com</span> 으로 여섯 자리를 보냈습니다.
            </>
          }
          dock={
            <>
              <Button onClick={() => go("newpw")}>확인</Button>
              <Button variant="ghost" disabled>
                다시 받기 · 47초 뒤
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-[8px]">
            <TextField label="인증번호" type="text" autoComplete="one-time-code" maxLength={6} defaultValue="4B7K2M" />
            <div className="flex items-center justify-between text-[12px] text-staff-text-muted">
              <Remaining time="09:41" />
              <span>
                남은 시도 <b className="text-staff-text tabular-nums">5</b>회
              </span>
            </div>
          </div>
          <Notice>
            메일이 오지 않으면 스팸함을 확인해 주세요. 1분 뒤 다시 받을 수 있고, 하루 10번까지 받을 수 있습니다. 다시 받으면{" "}
            <strong>앞서 보낸 인증번호는 바로 무효</strong>가 됩니다.
          </Notice>
        </Screen>
      );

    // LOGIN-3: 5회 틀리면 핀 닫힘, 쿨다운 없음.
    case "pin-closed":
      return (
        <Screen
          title="이 인증번호는 더 쓸 수 없습니다"
          desc="다섯 번 틀렸습니다. 새 인증번호를 받아 주세요."
          dock={
            <>
              <Button onClick={() => back("pin")}>새 인증번호 받기</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        >
          <Alert tone="warning">
            기다릴 필요 없이 <strong>바로 다시 받을 수 있습니다.</strong> 새로 받으면 시간도 10분부터 다시 셉니다.
          </Alert>
        </Screen>
      );

    case "pin-out":
      return (
        <Screen
          title="인증번호가 만료되었습니다"
          desc="보낸 지 10분이 지났습니다. 다시 받아 주세요."
          dock={
            <>
              <Button onClick={() => back("pin")}>인증번호 다시 받기</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        >
          <Alert tone="warning">
            남은 시도가 있어도 <strong>10분이 지나면 만료</strong>됩니다.
          </Alert>
        </Screen>
      );

    // LOGIN-11: 핀 입력과 같은 시계(09:41 → 07:12)를 이어서 보인다.
    case "newpw":
      return (
        <Screen
          title="새 비밀번호를 정해 주세요"
          desc="현재 비밀번호는 묻지 않습니다. 인증번호로 본인을 확인했습니다. 이 인증번호는 여기서 비밀번호를 정하면 무효가 됩니다."
          dock={
            <>
              <p className="pb-[6px] text-center text-[12px] text-staff-text-muted">인증번호를 받은 때부터 10분 안에 마쳐 주세요</p>
              <Button onClick={() => back("login")}>비밀번호 정하기</Button>
            </>
          }
        >
          <div className="text-[12px] text-staff-text-muted">
            <Remaining time="07:12" />
          </div>
          <NewPasswordFields />
          <Notice>
            새로 정하면 <strong>다른 기기의 로그인이 모두 끊기고</strong> 잠금도 함께 풀립니다.
          </Notice>
        </Screen>
      );

    // LOGIN-11: 저장할 때 핀을 다시 확인, 시간이 지났거나 닫혔으면 다시 받기.
    case "newpw-out":
      return (
        <Screen
          title="시간이 지났습니다"
          desc="인증번호를 받은 지 10분이 지나 비밀번호를 바꾸지 않았습니다. 인증번호를 다시 받아 주세요."
          dock={
            <>
              <Button onClick={() => back("forgot")}>인증번호 다시 받기</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        >
          <Alert tone="warning">
            저장할 때 인증번호를 한 번 더 확인합니다. 시간이 지났거나 인증번호가 닫혔으면 여기로 옵니다. 앞서 받은 인증번호는{" "}
            <strong>다시 쓸 수 없습니다.</strong>
          </Alert>
        </Screen>
      );

    // LOGIN-6: 관리자 재설정 링크 24시간 · 한 번만.
    case "temp":
      return (
        <Screen
          title="새 비밀번호를 정해 주세요"
          desc="관리자가 보낸 재설정 링크로 들어왔습니다. 지금 쓰던 비밀번호는 묻지 않습니다."
          dock={<Button onClick={() => go("splash")}>비밀번호 정하고 시작하기</Button>}
        >
          <Alert tone="warning">
            이 링크는 보낸 때로부터 <strong>24시간</strong> 동안, <strong>한 번만</strong> 쓸 수 있습니다. 이 링크나 인증번호로 비밀번호를 정하고 나면 바로
            무효가 됩니다. 관리자는 새 비밀번호를 정하지 못합니다.
          </Alert>
          <NewPasswordFields />
        </Screen>
      );

    // LOGIN-6: 이미 썼든 기한이 지났든 닫혔든 사유를 구분하지 않고 같은 문구로 막는다(운영 정책 ACC-19 v91).
    case "link-used":
      return (
        <Screen
          title="이 링크는 쓸 수 없습니다"
          desc="관리자에게 재설정 링크를 다시 청하거나, 비밀번호 찾기에서 인증번호를 받아 직접 정해 주세요. 기억나는 비밀번호가 있으면 그대로 로그인하셔도 됩니다."
          dock={
            <>
              <Button onClick={() => go("forgot")}>인증번호로 직접 정하기</Button>
              <Button variant="ghost" onClick={() => back("login")}>
                로그인으로 돌아가기
              </Button>
            </>
          }
        />
      );

    // LOGIN-4: 30일 유지, 만료되면 하던 자리로 돌아간다.
    case "expired":
      return (
        <Screen
          title="로그인이 만료되었습니다"
          desc="마지막 접속으로부터 30일이 지나 다시 로그인해야 합니다."
          dock={
            <Button onClick={() => go("splash")}>
              로그인
              <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
            </Button>
          }
        >
          <Alert tone="warning">
            <p className="text-[14px] font-semibold">출근을 찍으려던 중이었습니다</p>
            <p className="text-[12px]">로그인하면 하던 자리로 돌아갑니다</p>
          </Alert>
          <TextField label="비밀번호" type="password" autoComplete="current-password" defaultValue="haeun2026" />
        </Screen>
      );
  }
}

// 상태 화면 한 장: 제목(28px) · 설명(14px) · 내용, 아래 버튼 줄. 버튼 줄은 Figma 01.Login 의 Btns(흰 바탕, 위 14 · 아래 24 · 좌우 30)를 따른다.
function Screen({ top, title, desc, children, dock }: { top?: ReactNode; title: string; desc?: ReactNode; children?: ReactNode; dock: ReactNode }) {
  return (
    <>
      <div className="flex flex-col gap-[16px] px-[30px] pt-[52px] pb-[24px] leading-[1.5]">
        {/* Figma 01.Login: 로고 위 62 · 로고와 제목 사이 76 */}
        {top && <div className="pt-[10px] pb-[60px]">{top}</div>}
        <div className="flex flex-col gap-[6px] pb-[8px]">
          <h1 className="text-[28px] font-bold">{title}</h1>
          {desc && <p className="text-[14px] text-staff-text-sub [&_strong]:font-bold [&_strong]:text-staff-text">{desc}</p>}
        </div>
        {children}
      </div>
      <Dock inset={30}>{dock}</Dock>
    </>
  );
}

// 핀 입력 · 새 비밀번호가 함께 쓰는 남은 시간(LOGIN-11 한 시계).
function Remaining({ time }: { time: string }) {
  return (
    <span>
      남은 시간 <b className="text-staff-text tabular-nums">{time}</b>
    </span>
  );
}

const RULES: { ok: boolean; text: ReactNode }[] = [
  { ok: true, text: <>영문 대소문자·숫자·기호 중 <b>세 가지</b>를 섞었습니다</> },
  { ok: true, text: "8자 이상 20자 이하" },
  { ok: false, text: "이메일 아이디와 겹치지 않기" },
];

// 새 비밀번호 두 칸 + 조건 목록(newpw · temp 공통). 맞은 조건은 초록 체크(#16a34a, 배지 「정상」 글자색), 아직이면 빈 원.
function NewPasswordFields() {
  return (
    <>
      <div className="flex flex-col gap-[16px]">
        <TextField label="새 비밀번호" type="password" autoComplete="new-password" defaultValue="Haeun2026!" />
        <TextField label="새 비밀번호 확인" type="password" autoComplete="new-password" defaultValue="Haeun2026!" />
      </div>
      <Card>
        <p className="text-[13px] font-semibold text-staff-text-sub">비밀번호 조건</p>
        <ul className="flex flex-col pt-[2px]">
          {RULES.map((r, i) => (
            <li key={i} className={`flex items-center gap-[8px] py-[6px] text-[13px] ${r.ok ? "font-medium" : "text-staff-text-muted"}`}>
              {r.ok ? (
                <span className="flex size-[16px] shrink-0 items-center justify-center rounded-full bg-[#16a34a]">
                  <Image src="/icons/check.svg" alt="" width={10} height={10} />
                </span>
              ) : (
                <span className="size-[16px] shrink-0 rounded-full border border-staff-border" />
              )}
              <span>
                {r.text}
                <span className="sr-only">{r.ok ? " · 맞음" : " · 아직"}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="pt-[6px] text-[12px] text-staff-text-muted">두 가지만 섞으면 10자 이상이어야 합니다.</p>
      </Card>
    </>
  );
}
