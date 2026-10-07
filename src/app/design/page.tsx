import Image from "next/image";
import Link from "next/link";
import {
  Badge,
  Button,
  Card,
  HeroCard,
  InfoRow,
  Notice,
  TextField,
  WorkTimeBar,
} from "@/components/common";
import { NavDemo, SegmentedDemo, SheetDemo, TodoDemo, WeekDemo } from "./demos";
import { GuideBox, GuideCaption, GuideLabel, GuideSection, GuideSpec, MockupLinks, SwatchGrid, type Swatch } from "./guide";

// Figma 직원앱_공유 · 디자인 스타일 가이드(node 2001:68)를 코드 컴포넌트로 다시 그린 화면.
const FIGMA_FILE = "https://www.figma.com/design/fTjUhrEgrf4HG1G3dCXjpY/";

const BRAND: Swatch[] = [
  { name: "Master Color", hex: "#4c4ddc", usage: "Primary actions, active states, brand identity", dark: true },
  { name: "Master Inactive", hex: "#ededfb", usage: "Pressed fill, switch off, empty checkbox" },
];
const TEXT: Swatch[] = [
  { name: "Default Text", hex: "#182237", usage: "Headings and high-emphasis body copy", dark: true },
  { name: "Sub Text", hex: "#526077", usage: "Labels, secondary descriptions", dark: true },
  { name: "Muted Text", hex: "#69758a", usage: "Helper text, captions", dark: true },
  { name: "Placeholder", hex: "#8993a5", usage: "Input placeholders", dark: true },
];
const SURFACE: Swatch[] = [
  { name: "Background", hex: "#f4f6fa", usage: "Page / screen background" },
  { name: "Surface", hex: "#ffffff", usage: "Cards, inputs, bottom sheets" },
  { name: "Border", hex: "#dbe1eb", usage: "Input & card stroke" },
  { name: "Border Light", hex: "#eff2f6", usage: "Subtle dividers" },
  { name: "Info Background", hex: "#f5f7fb", usage: "Notice / info block fill" },
];
const STATUS: Swatch[] = [
  { name: "Success", hex: "#22c55e", usage: "완료, 정상", dark: true },
  { name: "Warning", hex: "#f59e0b", usage: "긴급", dark: true },
  { name: "Error", hex: "#ef4444", usage: "오류, 지각", dark: true },
  { name: "Dark Navy", hex: "#182237", usage: "Dark card background (급여)", dark: true },
];

const TYPE_SCALE = [
  { name: "Display", spec: "28px · 700 Bold", className: "text-[28px] font-bold", usage: "Page headings (로그인, 인사말)" },
  { name: "Title 1", spec: "22px · 700 Bold", className: "text-[22px] font-bold", usage: "Section titles" },
  { name: "Title 2", spec: "18px · 700 Bold", className: "text-[18px] font-bold", usage: "Card headings, salary amount" },
  { name: "Body Large", spec: "16px · 400 Regular", className: "text-[16px]", usage: "Input values, primary body" },
  { name: "Body", spec: "15px · 700 Bold", className: "text-[15px] font-bold", usage: "Buttons, tab labels" },
  { name: "Label", spec: "13px · 600 SemiBold", className: "text-[13px] font-semibold", usage: "Form labels, field names" },
  { name: "Caption", spec: "12px · 400 Regular", className: "text-[12px]", usage: "Helper text, timestamps" },
];

const SPACING = [4, 6, 8, 14, 16, 18, 24, 30, 52, 76];

const RADIUS = [
  { name: "XS · 8px", value: "8px", usage: "Badges, chips" },
  { name: "SM · 12px", value: "12px", usage: "Inputs, buttons, notices" },
  { name: "MD · 14px", value: "14px", usage: "Ghost buttons" },
  { name: "LG · 16px", value: "16px", usage: "Cards" },
  { name: "Full · 9999px", value: "9999px", usage: "Switch" },
];

// mockup 이 있으면 카드가 목업 화면으로 간다(인증 없이 UI 만).
const SCREENS: { node: string; name: string; mockup?: string }[] = [
  { node: "8:3", name: "홈 대시보드", mockup: "/design/home" },
  { node: "1:252", name: "매장 선택 (Bottom Sheet)" },
  { node: "3:1965", name: "로그인", mockup: "/design/login" },
  { node: "1:893", name: "TO-DO" },
  { node: "12:1233", name: "출퇴근 현황", mockup: "/design/attendance" },
  { node: "17:825", name: "급여", mockup: "/design/pay" },
  { node: "12:756", name: "출퇴근 (GPS)", mockup: "/design/check-in" },
];

const TOKENS = [
  { token: "--color-staff-primary", hex: "#4c4ddc", usage: "Buttons, active states, brand" },
  { token: "--color-staff-primary-inactive", hex: "#ededfb", usage: "Pressed fill, switch off, empty checkbox" },
  { token: "--color-staff-text", hex: "#182237", usage: "Headings, primary body" },
  { token: "--color-staff-text-sub", hex: "#526077", usage: "Secondary labels, descriptions" },
  { token: "--color-staff-text-muted", hex: "#69758a", usage: "Captions, helper text" },
  { token: "--color-staff-placeholder", hex: "#8993a5", usage: "Input placeholders" },
  { token: "--color-staff-bg", hex: "#f4f6fa", usage: "Page background" },
  { token: "--color-white", hex: "#ffffff", usage: "Cards, inputs" },
  { token: "--color-staff-border", hex: "#dbe1eb", usage: "Input & card borders" },
  { token: "--color-staff-border-light", hex: "#eff2f6", usage: "Dividers" },
  { token: "--color-staff-info-bg", hex: "#f5f7fb", usage: "Notice block background" },
];

export default function DesignPage() {
  return (
    <main className="mx-auto max-w-[808px] px-[16px] pt-[40px] pb-[64px] sm:px-[24px]">
      <MockupLinks />
      <header>
        <h1 className="text-[32px] leading-[1.5] font-bold">Design Style Guide</h1>
        <p className="pt-[8px] text-[15px] leading-[1.625] text-staff-text-sub">
          Whale ERP — Restaurant &amp; Cafe workforce management app.
          <br />
          All design tokens, components, and patterns in one place.
        </p>
      </header>

      <GuideSection title="Colors" first>
        <div className="pt-[24px]">
          <GuideLabel>Brand</GuideLabel>
          <SwatchGrid items={BRAND} />
        </div>
        <div className="pt-[32px]">
          <GuideLabel>Text</GuideLabel>
          <SwatchGrid items={TEXT} />
        </div>
        <div className="pt-[32px]">
          <GuideLabel>Surface &amp; Border</GuideLabel>
          <SwatchGrid items={SURFACE} />
        </div>
        <div className="pt-[32px]">
          <GuideLabel>Status</GuideLabel>
          <SwatchGrid items={STATUS} />
        </div>
      </GuideSection>

      <GuideSection title="Typography">
        <div className="pt-[24px]">
          <GuideBox padding="px-[20px] py-[16px]">
            <p className="text-[12px] font-semibold tracking-[0.05em] text-staff-text-muted uppercase">Primary Typeface</p>
            <p className="pt-[4px] text-[24px] font-bold">Pretendard</p>
            <p className="text-[13px] text-staff-text-sub">Open source Korean typeface · Weights: 400, 500, 600, 700</p>
          </GuideBox>
        </div>
        <div className="pt-[24px]">
          <div className="divide-y divide-staff-border-light overflow-clip rounded-[12px] border border-staff-border-light bg-white">
            {TYPE_SCALE.map((t) => (
              <div key={t.name} className="flex flex-col gap-[8px] px-[20px] py-[16px] sm:flex-row sm:items-center sm:gap-[16px]">
                <div className="w-[112px] shrink-0">
                  <p className="text-[12px] font-semibold text-staff-primary">{t.name}</p>
                  <p className="text-[11px] text-staff-text-muted">{t.spec}</p>
                </div>
                <p className={`min-w-0 flex-1 truncate leading-[1.5] ${t.className}`}>가나다라마바사 ABCDEFabcdef 1234567890</p>
                <p className="shrink-0 text-[11px] text-staff-text-muted sm:w-[144px] sm:text-right">{t.usage}</p>
              </div>
            ))}
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Spacing & Radius">
        <div className="grid gap-[24px] pt-[24px] sm:grid-cols-2">
          <div>
            <GuideLabel>Spacing Scale</GuideLabel>
            <div className="mt-[16px] divide-y divide-staff-border-light overflow-clip rounded-[12px] border border-staff-border-light bg-white">
              {SPACING.map((n) => (
                <div key={n} className="flex items-center gap-[16px] px-[16px] py-[12px]">
                  <span className="h-[12px] rounded-[4px] bg-staff-primary" style={{ width: n * 2 }} />
                  <span className="font-staff-code text-[13px]">{n}px</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <GuideLabel>Border Radius</GuideLabel>
            <div className="flex flex-col gap-[12px] pt-[16px]">
              {RADIUS.map((r) => (
                <div key={r.name} className="flex items-center gap-[16px] rounded-[12px] border border-staff-border-light bg-white px-[16px] py-[12px]">
                  <span
                    className="size-[48px] shrink-0 border-2 border-staff-primary bg-staff-primary-inactive"
                    style={{ borderRadius: r.value }}
                  />
                  <div>
                    <p className="text-[13px] font-semibold">{r.name}</p>
                    <p className="text-[11px] text-staff-text-muted">{r.usage}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Buttons">
        <div className="grid gap-[16px] pt-[24px] sm:grid-cols-3">
          <GuideBox>
            <div className="flex flex-col gap-[12px]">
              <GuideLabel small>Primary</GuideLabel>
              <Button>
                <Image src="/icons/arrow-right.svg" alt="" width={14} height={12} />
                퇴근하기
              </Button>
              <GuideCaption>h-52px · radius-12 · bg #4C4DDC · white bold 15px</GuideCaption>
            </div>
          </GuideBox>
          <GuideBox>
            <div className="flex flex-col gap-[12px]">
              <GuideLabel small>Ghost</GuideLabel>
              <Button variant="ghost">비밀번호를 잊으셨나요</Button>
              <GuideCaption>h-52px · radius-14 · no bg · sub text bold 15px</GuideCaption>
            </div>
          </GuideBox>
          <GuideBox>
            <div className="flex flex-col gap-[12px]">
              <GuideLabel small>Outline</GuideLabel>
              <Button variant="outline">웨일카페 강남역점</Button>
              <GuideCaption>h-44px · radius-12 · border #DBE1EB · default text</GuideCaption>
            </div>
          </GuideBox>
        </div>
      </GuideSection>

      <GuideSection title="Inputs">
        <div className="max-w-[448px] pt-[24px]">
          <GuideBox padding="p-[24px]">
            <div className="flex flex-col gap-[20px]">
              <TextField label="이메일" type="email" defaultValue="haeun.lee@gmail.com" help="가입할 때 정한 아이디입니다" />
              <TextField label="비밀번호" type="password" placeholder="비밀번호를 입력해 주세요" />
              <TextField label="비밀번호 확인" type="password" defaultValue="12345" error="비밀번호가 일치하지 않습니다" />
            </div>
          </GuideBox>
        </div>
        <div className="max-w-[448px] pt-[16px]">
          <Notice icon={<Image src="/icons/shield.svg" alt="" width={12} height={12.5} className="-scale-y-100" />}>
            한 번 로그인하면 <strong>30일</strong> 동안 다시 묻지 않습니다.
          </Notice>
        </div>
        <div className="pt-[12px]">
          <GuideBox padding="px-[20px] py-[16px]">
            <div className="flex flex-col gap-[4px]">
              <GuideSpec name="Default">bg white · border #DBE1EB · radius 12px · h 52px · padding 14px</GuideSpec>
              <GuideSpec name="Focus">border #4C4DDC</GuideSpec>
              <GuideSpec name="Error">border #EF4444 + error message below</GuideSpec>
            </div>
          </GuideBox>
        </div>
      </GuideSection>

      <GuideSection title="Badges">
        <div className="pt-[24px]">
          <GuideBox padding="p-[24px]">
            <div className="flex flex-wrap gap-[12px]">
              <Badge tone="working">근무 중</Badge>
              <Badge tone="success">정상</Badge>
              <Badge tone="danger">지각</Badge>
              <Badge tone="warning">긴급</Badge>
              <Badge tone="success">완료</Badge>
              <Badge tone="waiting">대기</Badge>
              <Badge tone="progress">진행 중</Badge>
              <Badge tone="plain">공유</Badge>
            </div>
            <div className="mt-[20px] flex flex-col gap-[4px] border-t border-staff-border-light pt-[16px]">
              <GuideSpec name="Shape">radius 8px · px 10px · py 4px · font semibold 12px</GuideSpec>
              <GuideSpec name="Pattern">muted fill (10% opacity approx) + matching text</GuideSpec>
            </div>
          </GuideBox>
        </div>
        <div className="pt-[24px]">
          <GuideLabel>Usage in TO-DO List</GuideLabel>
          <div className="pt-[12px]">
            <TodoDemo />
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Cards">
        <div className="grid gap-[16px] pt-[24px] sm:grid-cols-2">
          <div className="flex flex-col gap-[12px]">
            <GuideLabel small>Work Status Card</GuideLabel>
            <HeroCard tone="primary">
              <div className="flex items-center justify-between">
                <p className="text-[12px] font-semibold opacity-80">오늘의 근무</p>
                <span className="rounded-full bg-white/20 px-[8px] py-[2px] text-[11px] font-semibold">● 근무 중</span>
              </div>
              <p className="pt-[8px] text-[30px] leading-[1.5] font-bold tracking-[-0.025em]">09:00 — 18:00</p>
              <p className="pt-[4px] text-[12px] opacity-75">휴게 60분 · 총 8시간 근무</p>
              {/* 진한 카드 위의 버튼은 반투명 흰색이라 공통 Button 대신 이 카드 전용으로 둔다. */}
              <button
                type="button"
                className="mt-[16px] flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[12px] border border-white/20 bg-white/15 text-[14px] font-bold transition-[background-color] duration-150 ease-out active:bg-white/25"
              >
                <Image src="/icons/arrow-right-small.svg" alt="" width={12} height={10} />
                퇴근하기
              </button>
            </HeroCard>
          </div>
          <div className="flex flex-col gap-[12px]">
            <GuideLabel small>Salary Card</GuideLabel>
            <HeroCard tone="navy">
              <p className="text-[12px] font-medium opacity-60">2026년 8월 · 실지급액</p>
              <p className="pt-[8px] font-bold">
                <span className="text-[28px] leading-[1.5]">1,645,320 </span>
                <span className="text-[18px] font-semibold">원</span>
              </p>
              <div className="mt-[12px] flex items-center justify-between border-t border-white/10 pt-[12px] text-[12px]">
                <span className="opacity-60">9월 10일 도착</span>
                <a href="#" className="font-semibold opacity-80">
                  명세서 확인하기 →
                </a>
              </div>
            </HeroCard>
          </div>
          <div className="flex flex-col gap-[12px]">
            <GuideLabel small>Info Row Card</GuideLabel>
            <InfoRow href="#" icon="/icons/menu-payslip.svg" title="급여명세서" description="8월 명세서가 도착했어요" />
          </div>
          <div className="flex flex-col gap-[12px]">
            <GuideLabel small>Attendance Time Bar</GuideLabel>
            <Card>
              <div className="flex items-center justify-between pb-[8px]">
                <p className="text-[14px] font-bold">화 9/8</p>
                <div className="flex items-center gap-[8px]">
                  <span className="text-[12px] text-staff-text-sub">웨일카페 강남역점</span>
                  <Badge tone="success">정상</Badge>
                </div>
              </div>
              <WorkTimeBar schedule={{ start: "09:00", end: "18:00" }} worked={{ start: "08:58", end: "18:00" }} />
              <p className="pt-[8px] text-[12px] text-staff-text-sub">출근 08:58 · 퇴근 18:00</p>
            </Card>
          </div>
        </div>
      </GuideSection>

      <GuideSection title="Tabs & Nav">
        <div className="grid gap-[24px] pt-[24px] sm:grid-cols-2">
          <div className="flex flex-col gap-[12px]">
            <GuideLabel small>Segmented Control</GuideLabel>
            <GuideBox padding="p-[16px]">
              <SegmentedDemo />
              <p className="pt-[12px] text-[11px] text-staff-text-muted">bg #EDF0F6 · active bg #4C4DDC · radius 10px</p>
            </GuideBox>
          </div>
          <div className="flex flex-col gap-[12px]">
            <GuideLabel small>Bottom Navigation</GuideLabel>
            <div className="overflow-clip rounded-[16px] border border-staff-border-light bg-white">
              <NavDemo />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[12px] pt-[24px]">
          <GuideLabel small>Weekly Day Selector</GuideLabel>
          <Card>
            <WeekDemo />
            <p className="pt-[12px] text-[12px] text-staff-text-sub">이번 주 5일 · 40시간 근무 예정</p>
          </Card>
        </div>
      </GuideSection>

      <GuideSection title="Bottom Sheet">
        <div className="max-w-[368px] pt-[24px]">
          <GuideBox padding="p-[16px]">
            <div className="flex flex-col gap-[12px]">
              <SheetDemo />
              <GuideCaption>눌러서 열기 · 뒤 화면 / Esc / 닫기로 닫힘 · radius 26 · handle 40×4 · title 20px bold</GuideCaption>
            </div>
          </GuideBox>
        </div>
      </GuideSection>

      <GuideSection title="Screens" id="screens">
        <p className="pt-[24px] text-[14px] text-staff-text-sub">
          7 screens from the Figma design system. 목업이 있는 화면은 눌러서 목업으로, 나머지는 Figma 로 간다.
        </p>
        <div className="grid grid-cols-2 gap-[16px] pt-[24px] sm:grid-cols-4">
          {SCREENS.map((s) => {
            const card = (
              <>
                <div className="flex aspect-[178/313] flex-col items-center justify-center gap-[4px] bg-staff-bg">
                  <span className="font-staff-code text-[10px] text-staff-placeholder">{s.node}</span>
                  <span className="flex size-[32px] items-center justify-center rounded-full bg-staff-primary-inactive">
                    <Image src="/icons/phone.svg" alt="" width={16} height={16} />
                  </span>
                </div>
                <p className="flex items-center justify-between gap-[6px] px-[12px] py-[10px] text-[12px] font-semibold">
                  {s.name}
                  {s.mockup && <Badge tone="working">목업</Badge>}
                </p>
              </>
            );
            const cls =
              "overflow-clip rounded-[12px] border border-staff-border-light bg-white transition-colors duration-150 ease-out hover:border-staff-border";
            return s.mockup ? (
              <Link key={s.node} href={s.mockup} className={cls}>
                {card}
              </Link>
            ) : (
              <a key={s.node} href={`${FIGMA_FILE}?node-id=${s.node.replace(":", "-")}`} target="_blank" rel="noreferrer" className={cls}>
                {card}
              </a>
            );
          })}
        </div>
      </GuideSection>

      <GuideSection title="Token Quick Reference">
        <div className="pt-[24px]">
          <div className="overflow-x-auto rounded-[12px] border border-staff-border-light bg-white">
            <table className="w-full min-w-[560px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-staff-border-light text-staff-text-muted">
                  <th className="px-[16px] py-[12px] font-semibold">Token</th>
                  <th className="px-[16px] py-[12px] font-semibold">Value</th>
                  <th className="px-[16px] py-[12px] font-semibold">Usage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-staff-border-light">
                {TOKENS.map((t) => (
                  <tr key={t.token}>
                    <td className="px-[16px] py-[12px] font-staff-code text-staff-primary">{t.token}</td>
                    <td className="px-[16px] py-[12px]">
                      <span className="flex items-center gap-[8px] font-staff-code">
                        <span className="size-[16px] rounded-[4px] border border-staff-border-light" style={{ backgroundColor: t.hex }} />
                        {t.hex.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-[16px] py-[12px] text-staff-text-sub">{t.usage}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-[16px] py-[12px] font-staff-code text-staff-primary">--font-staff</td>
                  <td className="px-[16px] py-[12px] font-staff-code">Pretendard</td>
                  <td className="px-[16px] py-[12px] text-staff-text-sub">All text</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </GuideSection>
    </main>
  );
}
