---
name: Whale ERP Staff
description: 직원앱_공유 Figma 「디자인 스타일 가이드」(node 2001:68)를 그대로 옮긴 직원 근무 앱 디자인 시스템
colors:
  primary: "#4c4ddc"
  primary-inactive: "#ededfb"
  text: "#182237"
  text-sub: "#526077"
  text-muted: "#69758a"
  placeholder: "#8993a5"
  bg: "#f4f6fa"
  surface: "#ffffff"
  border: "#dbe1eb"
  border-light: "#eff2f6"
  info-bg: "#f5f7fb"
  success: "#22c55e"
  warning: "#f59e0b"
  error: "#ef4444"
  navy: "#182237"
typography:
  pay-amount:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.5
  pay-unit:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.5
  clock:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "42px"
    fontWeight: 700
    lineHeight: 1.1
  hero-number:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "-0.025em"
  sheet-title:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.5
  greeting:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.5
  display:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.5
  title-1:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.5
  title-2:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.5
  body-large:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.5
  body-small:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  caption:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  micro:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
  nano:
    fontFamily: "Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: "8px"
  sm: "12px"
  md: "14px"
  lg: "16px"
  hero: "20px"
  full: "9999px"
spacing:
  scale: [4, 6, 8, 14, 16, 18, 24, 30, 52, 76]
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    height: "52px"
    padding: "0 18px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.text-sub}"
    rounded: "{rounded.md}"
    height: "52px"
    typography: "{typography.body}"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    height: "44px"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    height: "52px"
    padding: "0 14px"
    typography: "{typography.body-large}"
  badge:
    rounded: "{rounded.xs}"
    padding: "4px 10px"
    typography: "{typography.caption}"
    fontWeight: 600
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  hero-card:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.hero}"
    padding: "20px"
---

# Design System: Whale ERP Staff

## Overview

**Creative North Star: "손에 쥔 근무표"**

매장 직원이 출근길·휴게 시간에 휴대폰으로 여는 앱이다. 한 손 엄지로 누르고, 몇 초 안에 "오늘 몇 시까지인지, 급여가 언제 들어오는지"를 확인하고 닫는다.
그래서 관리자 웹(whale-erp-front)과 정반대로 간다 — 누를 것은 크고(52px), 모서리는 둥글고(12~20px), 정보는 카드 하나에 하나씩 담는다.

색은 남보라 한 가지(#4c4ddc)가 끌고 간다. 지금 누를 수 있는 것, 지금 고른 것, 지금 근무 중이라는 사실에만 쓴다.
그 옅은 판(#ededfb)이 누를 때 바탕과 꺼진 스위치·빈 체크칸을 맡고, 나머지는 회청 바탕(#f4f6fa) 위의 흰 카드다.
진한 카드는 두 장뿐이다 — 홈의 오늘의 근무(남보라)와 급여 화면의 이번 달 실지급액(짙은 남색). 그 화면에서 가장 먼저 봐야 할 숫자다.

**Key Characteristics:**
- 남보라 한 가지 + 옅은 남보라 판, 나머지는 회청 바탕과 흰 카드
- 52px 주 버튼·입력칸, 44px 보조 버튼·탭 — 엄지 크기
- 둥근 모서리 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24 / 26 / 알약형
- Pretendard 400·500·600·700 네 단계
- 상태는 옅은 바탕 + 같은 계열 글자의 배지로 말한다

## Colors

### Primary
- **남보라** (#4c4ddc, `staff-primary`): 주 버튼, 고른 탭·날짜, 하단 메뉴의 지금 칸, 오늘의 근무 카드. 근무 막대의 실제 근무는 한 단계 옅은 #7676E4 다.
- **옅은 남보라** (#ededfb, `staff-primary-inactive`): 누를 때 바탕, 꺼진 스위치, 빈 체크칸. 탭 판과 근무 막대 바탕은 이보다 회색인 #EDF0F6 이다.

### Text
- **기본** (#182237, `staff-text`): 제목과 본문.
- **보조** (#526077, `staff-text-sub`): 폼 라벨, 설명, 하단 메뉴의 나머지 칸, 근무 막대 눈금.
- **흐림** (#69758a, `staff-text-muted`): 안내 문구, 일시, 고르지 않은 탭 칸, 완료한 TO-DO 제목.
- **자리표시** (#8993a5, `staff-placeholder`): 입력칸 자리표시, 주간 날짜의 `muted` 날.

### Surface & Border
- **바탕** (#f4f6fa, `staff-bg`): 화면 바탕.
- **면** (#ffffff): 카드, 입력칸, 바텀시트.
- **테두리** (#dbe1eb, `staff-border`): 입력칸·외곽선 버튼.
- **옅은 테두리** (#eff2f6, `staff-border-light`): 카드 테두리와 줄 사이 선.
- **안내 바탕** (#f5f7fb, `staff-info-bg`): 안내 블록.

### Status
- **성공** (#22c55e) · **경고** (#f59e0b) · **오류** (#ef4444, `staff-error` — 입력 오류 테두리·문구) · **짙은 남색** (#182237, `staff-navy` — 급여 카드).
- 배지는 이 색을 직접 쓰지 않고 옅은 바탕 + 진한 글자 짝을 쓴다(아래 Badges).

### Named Rules
**The 남보라는 지금이다 규칙.** 남보라는 "지금 누를 것·지금 고른 것·지금 근무 중"에만 쓴다. 장식이나 제목 색으로 쓰지 않는다.

## Typography

**Font:** Pretendard (저장소에 담은 400·500·600·700, 폴백 -apple-system → Apple SD Gothic Neo → Malgun Gothic). 줄간은 1.5, 자간은 0.

### Hierarchy
- **Pay Amount** (700, 32px) · **Pay Unit** (700, 17px): 급여 화면의 실지급액과 「원」.
- **Clock** (700, 40px · 단위 16px, 줄간 1.2): 출퇴근 화면 둥근 시계 안 숫자.
- **Hero Number** (700, 30px, 자간 -0.025em): 오늘의 근무 카드의 근무 시간("09:00 — 18:00") 한 곳.
- **Sheet Title** (700, 20px): 바텀시트 제목.
- **Greeting** (700, 26px): 홈 인사말("하은님, 좋은 아침이에요").
- **Display** (700, 28px): 로그인·인사말 같은 화면 첫 제목. 급여 금액.
- **Title 1** (700, 22px): 묶음 제목.
- **Title 2** (700, 18px): 카드 제목, 금액의 "원".
- **Body Large** (400, 16px): 입력 값, 주 본문. 입력칸은 16px 아래로 내리지 않는다(iOS 확대 방지).
- **Body** (700, 15px): 버튼.
- **Body Small** (600·700, 14px): 카드 제목, 외곽선 버튼.
- **Label** (600·700, 13px): 폼 라벨, 항목 이름, 탭 글자(700).
- **Caption** (400, 12px): 안내 문구, 일시, 주간 날짜의 요일.
- **Micro** (400·700, 11px) · **Nano** (400, 10px): 하단 메뉴 글자·근무 막대 눈금·상태 칩·견본 설명(11px), 주간 날짜 셋째 줄(10px)에만.

## Layout

모바일 한 열이다. 화면 좌우 여백 16px, 카드 사이 12~16px, 묶음 사이 24px.
간격은 4 / 6 / 8 / 14 / 16 / 18 / 24 / 30 / 52 / 76 안에서 고른다 — 8 은 라벨·입력칸·안내 사이, 12 는 아이콘과 글 사이, 16 은 카드 안쪽, 20 은 진한 카드 안쪽과 폼 줄 사이, 24 는 묶음 사이.
하단 메뉴는 화면 아래에 붙고 `env(safe-area-inset-bottom)` 만큼 비운다.

## Motion

화면을 옮길 때는 방향 있는 슬라이드를 쓴다(React `<ViewTransition>`, `design/(mockup)/page-slide.tsx`).
더 깊은 화면으로 가는 링크에는 `transitionTypes={["nav-forward"]}`, 돌아가는 링크에는 `["nav-back"]` 을 붙인다(`PageHeader` 의 뒤로 가기는 이미 붙어 있다).
나가는 화면은 150ms 로 흐려지며 60px 비키고, 들어오는 화면은 100ms 뒤 나타나며 320ms 동안 60px 를 미끄러진다. 방향이 없는 이동(브라우저 뒤로 가기)과 움직임 줄이기 설정에서는 움직이지 않는다.
하단 메뉴(`BottomNav`)로 칸을 옮길 때도 같은 슬라이드를 쓴다 — 오른쪽 칸은 nav-forward, 왼쪽 칸은 nav-back. 메뉴 자신은 `view-transition-name: bottom-nav` 로 떼어 제자리에 둔다.

## Elevation & Depth

평평하다. 흰 카드는 그림자 없이 옅은 테두리(#eff2f6)로 바탕과 갈린다. 그림자는 떠 있는 것에만 아주 옅게 쓴다.

- 하단 메뉴: 위로 `0 -5px 10px rgba(35,55,82,0.01)`
- 바텀시트: 위로 `0 -8px 28px rgba(22,25,28,0.16)`
- 오늘의 근무 카드: `0 9px 23px rgba(49,93,245,0.15)`
- 주간 날짜의 고른 날: `0 5px 6px rgba(49,93,245,0.16)`
- 스위치 손잡이: `0 3px 14px rgba(36,56,89,0.02)`

깊이가 더 필요하면 진한 카드(남보라·짙은 남색)로 무게를 준다.

## Shapes

- **XS 8px:** 배지, 상태 칩.
- **10px:** 탭 판과 탭 칸, 아이콘 칸.
- **SM 12px:** 입력칸, 주·외곽선 버튼, 안내 블록, 주간 날짜 칸, 시트 선택지.
- **MD 14px:** 고스트 버튼, 알림 버튼.
- **LG 16px:** `Card`.
- **18px:** 홈·근무·출퇴근 현황의 카드(오늘의 근무 · 이번 주 근무 · 나의 근무 정보 · 하루 카드).
- **20px:** `HeroCard`, 급여 화면의 지난 명세서.
- **24px:** 급여 화면의 실지급액 카드.
- **26px:** 바텀시트 위 모서리.
- **알약형:** 스위치.
- 그 밖: 근무 막대 6px(안쪽 5px), TO-DO 체크칸 2px.

## Components

모두 `src/components/common/` 에 있고 `@/components/common` 에서 가져온다. 눌러 볼 수 있는 견본은 `/design`, 화면 목업은 `/design/login` · `/design/home` · `/design/check-in` · `/design/attendance` · `/design/work` · `/design/pay` · `/design/notification-settings` 처럼 `src/app/design/(mockup)/` 아래에 있다.

### Buttons — `Button`
- **primary:** 52px · radius 12 · 남보라 바탕 · 흰 글자 15px bold. 화면의 주 동작 하나(출근하기·퇴근하기·로그인).
- **ghost:** 52px · radius 14 · 바탕 없음 · 보조 글자 15px bold. 주 동작 아래의 대안. 로그인의 「비밀번호를 잊으셨나요」는 버튼 대신 14px 500 밑줄 글자 링크(누르는 칸 44px), 「초대 코드로 가입」은 outline 버튼이다(2026-11-25 사용자 지정).
- **outline:** 44px · radius 12 · #dbe1eb 테두리 · 기본 글자 14px semibold. 고르는 값을 보여 주는 버튼(점포 선택).
- 폭은 늘 채운다. 누를 때 크기는 바뀌지 않는다(글자가 움직여 보인다). 색만 바뀐다 — primary 는 한 단계 진한 남보라(#3e3fc6), ghost·outline 은 옅은 남보라 바탕(150ms). `href` 를 주면 같은 모양의 링크.

### Inputs — `TextField`
- 라벨(13px semibold, 보조) · 입력칸(52px, radius 12, 테두리 #dbe1eb, 안쪽 14, 16px) · 안내(12px, 흐림). 사이 8px.
- **Focus:** 테두리만 남보라. **Error:** 테두리 #ef4444 + 안내 자리에 오류 문구.
- **Password:** `type="password"` 면 칸 오른쪽 끝에 눈 버튼(아이콘 20px `eye.svg` · `eye-off.svg`, 보조 글자색, 누르는 칸 44px · radius 10)이 붙어 비밀번호를 보이고 감춘다. 글자가 버튼 밑으로 가지 않게 오른쪽 안쪽 여백은 52.

### Notice — `Notice`
안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. 아이콘은 20px 칸 가운데, 글과 사이 6. 강조할 말은 `<strong>` (기본 글자색 bold).

### Badges — `Badge`
radius 8 · 좌우 10 · 상하 4 · 12px semibold. 톤: `working` 근무 중, `progress` 진행 중, `success` 정상·완료, `danger` 지각, `warning` 긴급, `waiting` 대기, `plain` 공유.

### Cards — `Card` · `HeroCard` · `InfoRow` · `WorkTimeBar`
- **Card:** 흰 바탕 · 옅은 테두리 · radius 16 · 안쪽 16.
- **HeroCard:** radius 20 · 좌우 20 · 위아래 16 · 흰 글자(2026-11-25 높이를 줄였다 — 실지급액 26px). `primary`(오늘의 근무) / `navy`(급여). 안쪽 보조 글자는 흰색에 투명도 60~80%, 버튼은 흰색 15% 바탕 + 20% 테두리.
- **InfoRow:** radius 18 · 안쪽 16 · 사이 9. 바탕까지 그려진 33px 아이콘(`menu-*.svg`) + 제목 14px semibold + 설명 12px 보조 글자 + 12px 꺾쇠. 카드 전체가 링크.
- **WorkTimeBar:** #EDF0F6 26px 막대(radius 6). 예정 근무는 막대 높이 전체에 #B6C1D5 점선 + 옅은 빗금, 실제 근무는 위아래 5px 안쪽 #7676E4. 근무 중(`ongoing`)이면 오른쪽 끝이 흐려진다. 아래 4시간 눈금 11px(기본 08~20시).
- **AttendanceDayCard · DayOffRow:** 출퇴근 현황의 하루 카드(radius 18). `done` 흰 바탕, `today` 연한 남보라 · 남보라 글자, `upcoming` #F9FBFD · 보조 글자. 윗줄 요일 13px bold · 점포 12px · 수정 표시(연필) · 상태 칩(11px bold, 정상 #EAF8F2/#13785E · 지각 #FFF6E5/#956013 · 근무 중 #E1E8FF/남보라). 쉬는 날은 radius 12 한 줄.
- **StatusChip:** 11px 상태 칩(radius 8). `success` 정상·완료 · `warning` 지각·긴급 · `working` 근무 중 · `progress` 진행 중 · `neutral` 대기·공유(#F9FBFD + 옅은 테두리). 카드에서는 bold, TO-DO 줄에서는 `weight="semibold"`. 12px 의 Badge 와 다른 칩이다.
- **PeriodNav:** 「‹ 이전 주 · 기간(16px bold) · 다음 주 ›」 줄. 버튼 15px semibold, 화살표 24px.

### Tabs & Nav — `SegmentedControl` · `BottomNav` · `WeekSelector`
- **SegmentedControl:** #EDF0F6 판(radius 10, 안쪽 3, 사이 6) 안에서 고른 칸만 남보라·흰 글자. 칸은 44px · radius 10 · 13px bold, 나머지는 흐린 글자. 칸을 바꾸면 바탕·글자색이 제자리에서 흐려지며 바뀐다(200ms). 탭 내용은 화면 이동과 같은 슬라이드로 바꾼다 — `startTransition` 안에서 `addTransitionType`(오른쪽 탭 nav-forward · 왼쪽 탭 nav-back) 후 상태를 바꾸고, 내용을 `<PageSlide key={tab}>` 로 감싼다. 아래 내용을 바꾸는 탭이면 `panelId` 를 넘기고 내용 쪽에 `id={panelId}` · `role="tabpanel"` · `aria-labelledby={segmentTabId(panelId, tab)}` 를 붙인다. `panelId` 가 없으면 값만 고르는 눌림 버튼(`aria-pressed`) 묶음이다.
- **BottomNav:** 홈 · 근무 · 출퇴근 · 급여 · 내 정보 다섯 칸(알림은 머리줄 알림 버튼이 맡는다). Figma 는 네 칸(출퇴근 없음)이고, 2026-10-08 재영 결정으로 목업처럼 출퇴근을 더해 다섯 칸이 됐다. 출퇴근 아이콘(`nav-attendance.svg`, 시계)은 Figma 에 없어 23px · 선 1.45 로 그렸다. 급여 아이콘은 Figma 근무지 시트의 급여명세서 아이콘(19px)을 23px 칸에 맞춰 쓴다. 아이콘 23px + 글자 11px(최소 높이 54), 지금 칸은 남보라 bold, 나머지는 보조 글자. 아이콘은 마스크라 글자색을 따르고, 홈·근무는 지금 칸일 때 채운 아이콘(`activeIcon`)으로 바뀐다. 화면 아래에 붙인다.
- **WeekSelector:** 7칸(사이 8), 칸마다 82px · radius 12 · #DCE4FF 테두리. 요일 12px · 날짜 16px bold · 근무일 4px 점. 기본은 연한 남보라(#EEF2FF), `muted` 날은 흰 바탕·흐린 글자, 고른 날은 남보라. 근무 시간·휴무를 셋째 줄 10px 글자(`note`)로 쓰면 점 대신 그 글자가 선다.

### Switch — `Switch` · `SwitchRow`
- **Switch:** 48×28 알약(role=switch). 켜짐 남보라 · 꺼짐 옅은 남보라, 흰 손잡이 22px 가 200ms 로 옮겨 간다. 누르는 칸은 위아래 8px 씩 넓혀 44px 다. 꺼 둘 수 없는 알림은 잠금(disabled) — 켜짐 상태를 그대로 보이고 50% 로 흐리게 그려 누를 수 없다.
- **SwitchRow:** 설정 한 줄. 위아래 17 · 제목 15px semibold · 설명 12px · 오른쪽 스위치. 목록이 #E8EDF3 선으로 줄을 나눈다.

### Bottom Sheet — `BottomSheet` · `SheetOption`
- **BottomSheet:** 네이티브 `<dialog>`. 흰 바탕 · 위 모서리 26 · 위 그림자 · 40×4 손잡이 · 제목 20px bold · 설명 14px · 좌우 24. 뒤 화면 #17253D 38% + 1.5px 흐림. 아래에서 260ms 로 올라오고 200ms 로 내려간다. 뒤 화면·Esc·「닫기」로 닫는다.
- **SheetOption:** 52px · radius 12 · #E4E8EF 테두리 · 15px semibold. 고른 것은 19px 체크.

### Dock · Alert · DangerButton · Toast · CheckBox
데모 조각에서 공통 부품으로 올린 것이다(데모 `docs/demo/src/ui.mjs` 의 같은 이름 함수는 따로 고친다).
- **Dock:** 화면 아래 버튼 줄. 흰 바탕 · 위 14 · 사이 8 · 아래 safe area 와 24 중 큰 쪽 · 본문이 짧으면 맨 아래에 붙는다. 좌우 24, 로그인 · 비밀번호 재설정은 30. `onPage` 면 흰 바탕 없이 화면 바탕을 그대로 쓴다(출퇴근 화면 · 로그인 — `AuthScreen` `dockOnPage`, 2026-11-25).
- **Alert:** 경고 안내 판. radius 12 · 안쪽 14 · 13px · `<strong>` bold. `warning` #FFF6E5/#956013 · `danger` #FEE2E2/#DC2626.
- **DangerButton:** 되돌리기 어려운 확정. 52px · radius 12 · 15px bold · 오류색 바탕, 누르면 #DC2626. 로그아웃 시트.
- **Toast:** 끝난 일을 알리는 한 줄. 짙은 남색 90% · radius 12 · 13px semibold 흰 글자 · 화면 아래 120px 위 · `role="status"`. 떠올라 2초쯤 머문 뒤 사라진다(`staff-toast`, 2.4s). 상태를 들지 않아 다시 띄우려면 쓰는 쪽이 `key` 를 바꾼다. 내 정보의 저장 · 동의 바꾸기, 비밀번호 · 이메일 변경 뒤 돌아왔을 때(`me/changed-toast.tsx`).
- **CheckBox:** TO-DO 체크칸 모양의 체크박스. 28px · radius 2 · 꺼짐 흰 바탕 · 1px `staff-border` 테두리(2026-11-25 — 연보라 칸은 튀었다) · 켜짐 남보라에 흰 체크, 글자 14px 보조 글자까지 눌리고 누르는 칸 44px. 폼 값은 숨은 칸으로 싣는다(React 19 폼 초기화가 체크를 되돌려도 값이 남게). 로그인의 아이디 저장 · 자동 로그인.

### Header — `TopBar` · `SectionTitle` · `PageHeader`
- **PageHeader:** 하위 화면 머리줄. 흰 바탕 · 최소 72px · 뒤로(19px) · 제목 18px bold · 오른쪽 아이콘 하나. 뒤로 가기는 보이는 24px 칸 대신 44px 로 눌린다(-10px 여백). 오른쪽 `action` 도 쓰는 쪽이 같은 방식으로 44px 칸을 만들어 넘긴다.
- **TopBar:** 작은 로고 36px · 점포 이름 버튼(15px bold + 아래 꺾쇠) · 알림 버튼(44px, radius 14, #E9EDF3 테두리, 새 알림 8px 빨간 점 #C24242).
- **SectionTitle:** 제목 16px bold, 옆에 개수(12px bold 남보라), 오른쪽 끝에 기간·「전체 보기」.

### TO-DO — `TodoList` · `TodoItem`
카드 없이 줄만 쌓고 줄 사이는 #E8EDF3 1px 선. 한 줄은 위아래 17 · 사이 12: 체크칸 28px(radius 2, 옅은 남보라 · 완료면 남보라에 흰 체크, 누르는 칸은 사방 8px 넓혀 44px) · 제목 15px semibold · 일시 12px(기한 지남은 #956013) · 오른쪽 StatusChip(semibold). 완료한 제목은 흐린 글자.

### 데모 조각 — `docs/demo/src/ui.mjs`
직원 근무 앱 데모(`docs/demo`, 정적 HTML 생성기)에서 화면 둘 이상이 쓰는 조각이다. `ui.mjs` 에 공통 부품을 HTML 문자열로 옮긴 함수와 함께 둔다(`alert`·`backHeader`·`body`·`dock` 등, 이름은 아래 항목의 소문자 시작). 공통 부품(`src/components/common`)에 없는 모양을 DESIGN.md 토큰·크기 체계로 만들었다. 실제 앱 화면을 만들 때 공통 부품으로 올릴 후보다.

- **BackHeader:** PageHeader 와 같은 모양(최소 72px · 뒤로 19px · 제목 18px bold)에 뒤로 가기가 링크가 아니라 화면 안 상태를 되돌리는 버튼. 근로계약 · 신고 정보 · 급여 · 알림 · 내 정보.
- **Body:** 머리줄과 Dock 사이 본문. `form` 좌우 24 · 사이 16(가입 · 신고 정보 · 내 정보), `detail` 좌우 22 · 사이 20(출퇴근 등록 · 근로계약 · 급여). 위 간격은 모든 화면이 머리줄 아래 20 으로 같다(2026-11-20 사용자 지정 — 전엔 16 · 22 · 24 · 30 이 섞였다). `center` 는 결과 화면 가운데 정렬, detail 은 위 52.
- **Dock:** 화면 아래 버튼 줄. 흰 바탕 · 위 14 · 사이 8 · 아래 safe area 와 24 중 큰 쪽 · 본문이 짧으면 맨 아래에 붙는다. 좌우 24, 로그인 · 근로계약은 30(출퇴근 등록은 2026-11-20 부터 24 · `onPage`).
- **Sunken:** 안내 판. 안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14 · 왼쪽 정렬. `label` 은 머리 13px semibold, `prose` 는 글을 바로 담을 때 13px 보조 글자(`<b>` 는 기본 글자 bold). 출퇴근 현황 · 근무 · 출퇴근 등록 · 근로계약 · 가입 · 신고 정보 · 내 정보.
- **Values:** 이름 · 값 줄. 13px, 이름은 보조 글자 · 값은 기본 글자 오른쪽 정렬, 위아래 9 · 줄 사이 옅은 선. 주로 Sunken 안. Sunken 을 쓰는 화면 모두.
- **Alert:** 경고 안내 판. radius 12 · 안쪽 14 · 13px · `<strong>` bold. `warning` #FFF6E5/#956013(지각 칩 짝) · `danger` #FEE2E2/#DC2626. 출퇴근 등록 · 로그인 · 내 정보.
- **Seal:** 결과 도장. 88px 원 · 2px 테두리 · 15px bold. `success` #EAF8F2/#13785E · `danger` #FEE2E2/#DC2626(거부 완료). 출퇴근 등록 · 근로계약 · 가입 · 신고 정보 · 내 정보.
- **Empty:** 빈 상태. 56px 흰 원 안 24px 아이콘 · 제목 18px bold · 설명 14px 보조 글자(최대 300px) · 사이 14, 남은 높이 가운데. 홈 · 알림.
- **DangerButton:** 되돌리기 어려운 확정. 주 버튼 크기(52px · radius 12 · 15px bold)에 오류색 바탕, 누르면 #DC2626. 시트 안 로그아웃 · 거부 확정. 로그인 · 근로계약 · 내 정보.
- **CheckBox:** TO-DO 체크칸 모양의 체크박스. 28px · radius 2 · 꺼짐 흰 바탕 · 테두리 · 켜짐 남보라에 흰 체크, 누르는 칸 44px. 가입(약관 · 본사 제공 동의) · 근무(TO-DO).
- **IconRow:** 아이콘 한 줄. 20px 칸의 16px 보조색 아이콘 · 제목 14px semibold · 설명 12px 보조 글자 · 사이 12 · 위아래 8. 가입 · 신고 정보.
- **Label · Tiny:** Label 은 카드 · 판 머리 이름 13px semibold 보조 글자(신고 정보 · 내 정보). Tiny 는 본문 아래 안내 12px 흐린 글자, `<b>` 는 보조 글자 bold(근로계약 · 급여).
- **toast:** 토스트. 짙은 남색 90% 알약 · radius 12 · 13px semibold 흰 글자 · 화면 아래 120px 위 · 2초 뒤 사라짐 · `role="status"`. 화면마다 하나 두고(build.mjs), 누를 것에 `data-toast="문구"` 를 달면 `assets/staff.js` 가 띄운다.

### 정돈 시안 (2026-11-20 사용자 지정)
KB · 우리은행 앱처럼 정돈된 느낌으로 직원 화면을 다듬었다. 3팀 확인이 필요한 문구 · 기능은 PR 에 따로 적는다.
- **흰 바탕 화면:** 등록된 신고 정보 · 근로계약서 목록 · 출퇴근의 근무 중 · 퇴근 완료는 화면 바탕을 흰색으로 두고 안쪽 묶음을 연회색(`staff-bg`) 둥근 상자(radius 16 · `staff-border`)로 감싼다. 근로계약서 목록은 진행 중인 것만 연회색, 지난 것은 흰 상자다. 근무 중 화면의 안쪽 조각은 이 연회색 상자가 아니라 아래 「근무 중 카드」 · 「둥근 시계」 줄을 따른다.
- **화면 위 여백:** 머리줄 아래 본문 위 여백은 모든 화면 20px 이다. 근로계약서 화면(목록 · 상세 · 서명 · 완료)만 위 여백과 묶음 사이를 모두 12px 로 좁힌다(20 은 흰 바탕에서 띄엄띄엄 보였다).
- **근무지 줄(`WorkplaceBox`):** 한 근무지의 정보를 보이는 화면(등록된 신고 정보 · 내 근무지에서 연 근로계약서 목록)은 맨 위에 상자 없는 머리 줄 — 연보라 동그라미 점포 아이콘(32px) + 「근무지」(12px 흐림) / 점포명(16px bold)을 둔다. 테두리 상자는 누르는 버튼처럼 보여 뺐다. 근로계약서 목록은 그 아래 옅은 구분선(위아래 16)으로 목록과 가른다. 큰 제목은 화면 제목 줄과 겹치면 두지 않는다.
- **근무 화면 근무지 카드(`StoreCard`):** 흰 상자(radius 16 · `staff-border`)에 「근무지」(12px 흐림) / 근무지명(16px bold), 근무지가 여럿이면 오른쪽에 남보라 「변경 ›」(13 semibold). 점포 아이콘 · 「연결된 근무지 N곳」 · 연보라 바탕은 뺐다 — 무엇을 누르는지 알기 어려웠다.
- **근로계약서 목록 · 상세:** 화면 제목과 목록 상자 제목은 같은 「파트타이머 근로계약서」(고용 형태가 없으면 「근로계약서」)다. 목록 상자의 이름 · 값 줄은 이름 칸 76px(줄바꿈 없음)이고, 수정 요청 · 거절은 그날을 「수정 요청일」 · 「거절일」 줄로 둔다. 상세 맨 위는 요약 카드(`ContractSummary` — 흰 상자 radius 16, 근무지명 15 bold · 상태 배지, 아래 「받은 날」과 「서명 기한」(남은 날 꺾은선, 7일 이내 #956013) · 「서명일」 · 「수정 요청일」 중 하나, 이름 칸 76)이고, 서명 완료 · 거절 · 종료 · 수정 요청이면 그 아래 ⓘ 회색 13px 한 줄로 상태를 알린다(전엔 맨 위 안내 상자). 아래 정보는 `InfoGroup` 두 묶음 — 표준근로계약서처럼 「사업주」 다음 「근로자」, 묶음 이름은 상자 밖 14 semibold, 연회색 상자 안 이름 104px · 값 왼쪽 정렬 · 줄 사이 선 없이 간격 10. 사업주 전화 · 사업자등록번호는 하이픈을 넣는다(`formatTelephone` · `formatBizNumber`).
- **남보라 제목 강조:** 제목 안의 핵심 한 조각만 남보라로 칠한다 — 근무지 추가 확인 · 완료 큰 제목(24px)의 점포명, 홈 근무지 추가 요청 시트 제목의 점포명, 퇴근 완료 제목의 시각, 신고 정보 다시 입력 맨 위 근무지명, 근로계약서 묶음 제목의 건수. 남보라는 지금이다 규칙의 예외.
- **둥근 꺾은선(`SubLine`):** 값 아래 덧붙임(남은 날 · 비과세 · 끝자리 확인 대기)은 12×14 둥근 └ 선(#C3CAD6) + 13px 흐린 글자로 한 칸 들여 단다. 관리자 웹 근로계약서 작성의 계산식 줄과 같은 생각이다.
- **요청 시트(`RequestSheet`):** 머리 작은 글(`eyebrow`) · 큰 제목(`heading`, 점포명 남보라) · 이름 · 값 상자(안내 바탕 · radius 14 · 이름 칸 72px) · 13px 흐린 설명 · [주 버튼] [나중에 하기].
- **둥근 시계:** 출퇴근 화면의 현재 시각 · 근무 시간은 흰 원(220px) · 회색 테두리 · 안쪽 10px 옅은 띠에 담아 본문 남는 세로 가운데에 둔다. 안 글자는 이름 14 · 숫자 40(단위 16) · 아래 14 세 가지, 사이 8. 숫자와 단위 사이는 빈칸이 아니라 간격으로 띄워 가운데가 쏠리지 않게 한다.
- **근무 중 카드:** 근무지명(14 semibold 보조) 아래 출근 시각(24 bold 남보라) · 「출근」 · 점 + 「근무 중」을 한 줄 글자 밑선에 맞춘다. 오늘 근무 막대는 흰 상자(radius 18)에 「오늘 근무」(15 bold)와 범례(점선 칸 예정 · 보라 칸 실제 근무)를 둔다.
- **완료 화면:** 퇴근 완료는 남보라 체크(56px) · 「HH:MM에 퇴근했습니다」(시각 남보라) · 기록 상자 · 남보라 [홈으로].
- **내 정보:** 맨 위 프로필 카드(흰 바탕 · radius 20 · 72px 옅은 회청 원 안 직원 고래(`StaffWhaleMark` — 로그인 로고와 같은 그림, 2026-11-25) · 「이름님」 20px — 「님」은 400 보조색 · 생년월일 | 휴대전화 두 칸 상자(안내 바탕 · radius 14) · 12px 자리표시 색 「ⓘ 정보 변경은 …」). 그 아래는 줄 상자(`me-rows` — 흰 상자 radius 16 · `staff-border`, 줄 min-h 56 · 사이 옅은 선, 왼쪽 32px 원 아이콘 · 이름 15 semibold · 값 13 흐림 · 오른쪽 꺾쇠)로 아이디(이메일) · 주소(누르면 편집이 펼쳐짐) · 비밀번호 변경, 「내 근무지」(새 근무지 초대 줄은 연보라 기운 바탕 #f9f9fe · 빨간 점 · 건수 남보라), 「동의」 줄 상자(이름 · 오른쪽 상태 배지 · 꺾쇠 — 내 근무지와 같은 짜임)이고, 누르면 상세(`/me/consents/location` · `hq-sharing`)에서 동의 묶음(윗줄 원 아이콘 · 상태 배지 · 일시 줄, 아랫줄 구분선 위 가로 글자 버튼 44px · 사이 1×14 세로선 · 주 동작만 남보라, 안내는 묶음 밖 12px)으로 내용 보기 · 일시 중지 · 동의 철회를 한다(2026-11-25). 묶음 제목은 14 semibold 보조, 묶음 사이 22. 로그아웃은 아이콘 + 글자 outline 버튼, 그 아래 「회원 탈퇴」 13px 밑줄 글자 링크(동의 상자 · 버튼 · 링크 글자 사이 22px, 2026-11-25).
- **근무정보 제공 동의:** 화면 이름은 「근무정보 제공 동의」(전엔 「사업자 제공 동의」 · 「가맹본부에 내 근무 정보 제공 동의」). 내용 시트는 연회색 둥근 상자에 이름 위(13 흐림) · 값 아래(14) 네 줄 — 개인정보 제3자 제공 동의서의 표준 항목 이름(제공받는 자 · 제공 항목 · 제공 목적 · 보유 및 이용 기간) — 과 아래 「동의는 선택사항이며, 동의하지 않아도 근무에는 영향이 없습니다.」 한 줄이다. 동의 문구 버전은 v1.0 그대로다.
- **입력칸 자리표시:** 명사형으로 짧게 — 「새 이메일 입력」 · 「현재 비밀번호 입력」 · 「새 비밀번호 입력」 · 「새 비밀번호 다시 입력」. 불일치 오류는 「…가 일치하지 않습니다.」다.
- **보조 버튼:** 출퇴근 기록 기간 조회의 [조회]는 외곽선 버튼이다(남보라 큰 버튼은 너무 강했다). 출퇴근 현황 머리줄 오른쪽은 시계 아이콘 대신 「출퇴근하기 ›」 알약(흰 바탕 · `staff-border` · 36px, 누르는 칸 44px)으로 출퇴근 화면의 「출퇴근 현황 ›」과 짝을 이룬다.
- **센 단위:** 근무지는 「곳」(「통합테스트 판교점 외 1곳」), 요청 · 초대는 「건」(「근무지 초대가 2건 도착했습니다」).
- **용어:** 직원에게는 「소속」 대신 「근무지」(내 근무지 · 근무지 추가 확인), 「계약서」 대신 「근로계약서」, 「나중에」 대신 「나중에 하기」를 쓴다.

## Do's and Don'ts

### Do:
- **Do** 직원앱 화면은 `StaffRoot` 안에 둔다. 밝은 테마·글꼴·포커스색·자동완성 바탕은 `StaffRoot` 가 걸고, 루트 `globals.css` 는 토큰과 바탕색·화면 이동 슬라이드·토스트 애니메이션(`staff-toast`)만 둔다.
- **Do** 색은 `--color-staff-*` 토큰에서 가져온다. 배지 색처럼 한 곳에만 나오는 색은 쓰는 자리에 직접 적고 주석을 단다.
- **Do** 누를 것은 44px 이상으로 둔다. 주 동작은 52px.
- **Do** 색·누름 전환은 150~200ms, `cubic-bezier(0.23,1,0.32,1)` 하나로 맞춘다. 자리를 옮기는 움직임(바텀시트 260ms, 화면 슬라이드 320ms)은 더 길게 둔다.
- **Do** 상태 배지에는 늘 글자를 함께 둔다.

### Don't:
- **Don't** 공통 컴포넌트에 `className`·`style` 을 넘기지 않는다. 폭과 자리는 감싸는 쪽이 정한다.
- **Don't** 남보라를 제목이나 장식에 쓰지 않는다.
- **Don't** 흰 카드에 그림자를 넣지 않는다. 무게가 필요하면 진한 카드다.
- **Don't** 입력칸 글자를 16px 아래로 줄이지 않는다.
- **Don't** 관리자 웹(whale-erp-front)의 `erp-*` 토큰·2px 모서리를 가져오지 않는다. 두 앱은 쓰는 손과 화면이 다르다.
