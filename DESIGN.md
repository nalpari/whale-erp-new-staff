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
    fontWeight: 500
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
그 옅은 판(#ededfb)이 고르지 않은 탭과 아이콘 바탕을 맡고, 나머지는 회청 바탕(#f4f6fa) 위의 흰 카드다.
홈 맨 위 두 장만 진하다 — 오늘의 근무(남보라)와 급여(짙은 남색). 화면에서 가장 먼저 봐야 할 두 숫자다.

**Key Characteristics:**
- 남보라 한 가지 + 옅은 남보라 판, 나머지는 회청 바탕과 흰 카드
- 52px 주 버튼·입력칸, 44px 보조 버튼·탭 — 엄지 크기
- 둥근 모서리 8 / 12 / 14 / 16 / 20 / 알약형
- Pretendard 400·500·600·700 네 단계
- 상태는 옅은 바탕 + 같은 계열 글자의 배지로 말한다

## Colors

### Primary
- **남보라** (#4c4ddc, `staff-primary`): 주 버튼, 고른 탭·날짜, 하단 메뉴의 지금 칸, 근무 막대, 오늘의 근무 카드.
- **옅은 남보라** (#ededfb, `staff-primary-inactive`): 탭 판, 아이콘 칸 바탕, 근무 막대 바탕, 누를 때 바탕.

### Text
- **기본** (#182237, `staff-text`): 제목과 본문.
- **보조** (#526077, `staff-text-sub`): 폼 라벨, 설명, 고르지 않은 탭 글자.
- **흐림** (#69758a, `staff-text-muted`): 안내 문구, 일시, 하단 메뉴의 나머지 칸.
- **자리표시** (#8993a5, `staff-placeholder`): 입력칸 자리표시, 요일, 눈금, 완료한 TO-DO 제목.

### Surface & Border
- **바탕** (#f4f6fa, `staff-bg`): 화면 바탕.
- **면** (#ffffff): 카드, 입력칸, 바텀시트.
- **테두리** (#dbe1eb, `staff-border`): 입력칸·외곽선 버튼·체크칸.
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
- **Clock** (700, 42px, 줄간 1.1): 출퇴근 화면의 현재 시각.
- **Hero Number** (700, 30px, 자간 -0.025em): 오늘의 근무 카드의 근무 시간("09:00 — 18:00") 한 곳.
- **Sheet Title** (700, 20px): 바텀시트 제목.
- **Greeting** (700, 26px): 홈 인사말("하은님, 좋은 아침이에요").
- **Display** (700, 28px): 로그인·인사말 같은 화면 첫 제목. 급여 금액.
- **Title 1** (700, 22px): 묶음 제목.
- **Title 2** (700, 18px): 카드 제목, 금액의 "원".
- **Body Large** (400, 16px): 입력 값, 주 본문. 입력칸은 16px 아래로 내리지 않는다(iOS 확대 방지).
- **Body** (700, 15px): 버튼, 탭 글자.
- **Body Small** (600·700, 14px): 카드·TO-DO 제목, 외곽선 버튼, 탭 글자, 날짜 숫자.
- **Label** (600, 13px): 폼 라벨, 항목 이름.
- **Caption** (400, 12px): 안내 문구, 일시.
- **Micro** (400, 11px) · **Nano** (500·700, 10px): 요일·견본 설명(11px), 하단 메뉴 글자·근무 막대 눈금(10px)에만.

## Layout

모바일 한 열이다. 화면 좌우 여백 16px, 카드 사이 12~16px, 묶음 사이 24px.
간격은 4 / 6 / 8 / 14 / 16 / 18 / 24 / 30 / 52 / 76 안에서 고른다 — 8 은 라벨·입력칸·안내 사이, 12 는 아이콘과 글 사이, 16 은 카드 안쪽, 20 은 진한 카드 안쪽과 폼 줄 사이, 24 는 묶음 사이.
하단 메뉴는 화면 아래에 붙고 `env(safe-area-inset-bottom)` 만큼 비운다.

## Motion

화면을 옮길 때는 방향 있는 슬라이드를 쓴다(React `<ViewTransition>`, `design/(mockup)/page-slide.tsx`).
더 깊은 화면으로 가는 링크에는 `transitionTypes={["nav-forward"]}`, 돌아가는 링크에는 `["nav-back"]` 을 붙인다(`PageHeader` 의 뒤로 가기는 이미 붙어 있다).
나가는 화면은 150ms 로 흐려지며 60px 비키고, 들어오는 화면은 100ms 뒤 나타나며 320ms 동안 60px 를 미끄러진다. 방향이 없는 이동(브라우저 뒤로 가기)과 움직임 줄이기 설정에서는 움직이지 않는다.

## Elevation & Depth

평평하다. 카드는 그림자 없이 옅은 테두리(#eff2f6)로 바탕과 갈린다. 유일한 그림자는 탭에서 고른 칸이 판 위로 살짝 뜨는 `0 1px 1.5px / 0 1px 1px rgba(0,0,0,0.1)` 이다.
깊이가 필요하면 진한 카드(남보라·짙은 남색)로 무게를 준다.

## Shapes

- **XS 8px:** 배지.
- **SM 12px:** 입력칸, 주·외곽선 버튼, 탭 칸, 안내 블록.
- **MD 14px:** 고스트 버튼, 탭 판.
- **LG 16px:** TO-DO 목록, 바텀시트.
- **18px:** 홈의 카드(오늘의 근무 · 이번 주 근무 · 오늘 할 일 · 나의 근무 정보).
- **20px:** 홈의 진한 카드 두 장.
- **알약형:** 근무 막대, 날짜 원, 상태 칩, 아바타.
- 그 밖: 아이콘 칸 10px, 체크칸 6px.

## Components

모두 `src/components/common/` 에 있고 `@/components/common` 에서 가져온다. 눌러 볼 수 있는 견본은 `/design`, 화면 목업은 `/design/login` · `/design/home` · `/design/check-in` · `/design/attendance` 처럼 `src/app/design/(mockup)/` 아래에 있다.

### Buttons — `Button`
- **primary:** 52px · radius 12 · 남보라 바탕 · 흰 글자 15px bold. 화면의 주 동작 하나(출근하기·퇴근하기·로그인).
- **ghost:** 52px · radius 14 · 바탕 없음 · 보조 글자 15px bold. 주 동작 아래의 대안("비밀번호를 잊으셨나요").
- **outline:** 44px · radius 12 · #dbe1eb 테두리 · 기본 글자 14px semibold. 고르는 값을 보여 주는 버튼(점포 선택).
- 폭은 늘 채운다. 누를 때 크기는 바뀌지 않는다(글자가 움직여 보인다). 색만 바뀐다 — primary 는 한 단계 진한 남보라(#3e3fc6), ghost·outline 은 옅은 남보라 바탕(150ms). `href` 를 주면 같은 모양의 링크.

### Inputs — `TextField`
- 라벨(13px semibold, 보조) · 입력칸(52px, radius 12, 테두리 #dbe1eb, 안쪽 14, 16px) · 안내(12px, 흐림). 사이 8px.
- **Focus:** 테두리만 남보라. **Error:** 테두리 #ef4444 + 안내 자리에 오류 문구.

### Notice — `Notice`
안내 바탕 · 옅은 테두리 · radius 12 · 안쪽 14. 아이콘은 20px 칸 가운데, 글과 사이 6. 강조할 말은 `<strong>` (기본 글자색 bold).

### Badges — `Badge`
radius 8 · 좌우 10 · 상하 4 · 12px semibold. 톤: `working` 근무 중, `progress` 진행 중, `success` 정상·완료, `danger` 지각, `warning` 긴급, `waiting` 대기, `plain` 공유.

### Cards — `Card` · `HeroCard` · `InfoRow` · `WorkTimeBar`
- **Card:** 흰 바탕 · 옅은 테두리 · radius 16 · 안쪽 16.
- **HeroCard:** radius 20 · 안쪽 20 · 흰 글자. `primary`(오늘의 근무) / `navy`(급여). 안쪽 보조 글자는 흰색에 투명도 60~80%, 버튼은 흰색 15% 바탕 + 20% 테두리.
- **InfoRow:** radius 18 · 안쪽 16 · 사이 9. 바탕까지 그려진 33px 아이콘(`menu-*.svg`) + 제목 14px semibold + 설명 12px 보조 글자 + 12px 꺾쇠. 카드 전체가 링크.
- **WorkTimeBar:** #EDF0F6 26px 막대(radius 6). 예정 근무는 막대 높이 전체에 #B6C1D5 점선 + 옅은 빗금, 실제 근무는 위아래 5px 안쪽 #7676E4. 근무 중(`ongoing`)이면 오른쪽 끝이 흐려진다. 아래 4시간 눈금 11px(기본 08~20시).
- **AttendanceDayCard · DayOffRow:** 출퇴근 현황의 하루 카드(radius 18). `done` 흰 바탕, `today` 연한 남보라 · 남보라 글자, `upcoming` #F9FBFD · 보조 글자. 윗줄 요일 13px bold · 점포 12px · 수정 표시(연필) · 상태 칩(11px bold, 정상 #EAF8F2/#13785E · 지각 #FFF6E5/#956013 · 근무 중 #E1E8FF/남보라). 쉬는 날은 radius 12 한 줄.
- **PeriodNav:** 「‹ 이전 주 · 기간(16px bold) · 다음 주 ›」 줄. 버튼 15px semibold, 화살표 24px.

### Tabs & Nav — `SegmentedControl` · `BottomNav` · `WeekSelector`
- **SegmentedControl:** #EDF0F6 판(radius 10, 안쪽 3, 사이 6) 안에서 고른 칸만 남보라·흰 글자. 칸은 44px · radius 10 · 13px bold, 나머지는 흐린 글자.
- **BottomNav:** 홈 · 근무 · 알림 · 내 정보. 아이콘 23px + 글자 11px(최소 높이 54), 지금 칸은 남보라 bold, 나머지는 보조 글자. 아이콘은 마스크라 글자색을 따른다. 화면 아래에 붙인다.
- **WeekSelector:** 7칸(사이 8), 칸마다 82px · radius 12 · #DCE4FF 테두리. 요일 12px · 날짜 16px bold · 근무일 4px 점. 기본은 연한 남보라(#EEF2FF), `muted` 날은 흰 바탕·흐린 글자, 고른 날은 남보라.

### Bottom Sheet — `BottomSheet` · `SheetOption`
- **BottomSheet:** 네이티브 `<dialog>`. 흰 바탕 · 위 모서리 26 · 위 그림자 · 40×4 손잡이 · 제목 20px bold · 설명 14px · 좌우 24. 뒤 화면 #17253D 38% + 1.5px 흐림. 아래에서 260ms 로 올라오고 200ms 로 내려간다. 뒤 화면·Esc·「닫기」로 닫는다.
- **SheetOption:** 52px · radius 12 · #E4E8EF 테두리 · 15px semibold. 고른 것은 19px 체크.

### Header — `TopBar` · `SectionTitle` · `PageHeader`
- **PageHeader:** 하위 화면 머리줄. 흰 바탕 · 최소 72px · 뒤로(19px) · 제목 18px bold · 오른쪽 아이콘 하나.
- **TopBar:** 작은 로고 36px · 점포 이름 버튼(15px bold + 아래 꺾쇠) · 알림 버튼(44px, radius 14, #E9EDF3 테두리, 새 알림 8px 빨간 점 #C24242).
- **SectionTitle:** 제목 16px bold, 옆에 개수(12px bold 남보라), 오른쪽 끝에 기간·「전체 보기」.

### TO-DO — `TodoList` · `TodoItem`
radius 16 목록, 줄 사이 옅은 선. 체크칸 24px(radius 6, 2px 테두리) · 제목 14px semibold · 일시 12px · 오른쪽 배지. 완료하면 체크칸이 남보라로 차고 제목은 자리표시 색 + 취소선.

## Do's and Don'ts

### Do:
- **Do** 직원앱 화면은 `StaffRoot` 안에 둔다. 루트 `globals.css` 는 계근대(다크) 콘솔이라, 밝은 테마·글꼴·포커스색·자동완성 바탕이 `StaffRoot` 안에서만 바뀐다.
- **Do** 색은 `--color-staff-*` 토큰에서 가져온다. 배지 색처럼 한 곳에만 나오는 색은 쓰는 자리에 직접 적고 주석을 단다.
- **Do** 누를 것은 44px 이상으로 둔다. 주 동작은 52px.
- **Do** 전환은 150~200ms, `cubic-bezier(0.23,1,0.32,1)` 하나로 맞춘다.
- **Do** 상태 배지에는 늘 글자를 함께 둔다.

### Don't:
- **Don't** 공통 컴포넌트에 `className`·`style` 을 넘기지 않는다. 폭과 자리는 감싸는 쪽이 정한다.
- **Don't** 남보라를 제목이나 장식에 쓰지 않는다.
- **Don't** 흰 카드에 그림자를 넣지 않는다. 무게가 필요하면 진한 카드다.
- **Don't** 입력칸 글자를 16px 아래로 줄이지 않는다.
- **Don't** 관리자 웹(whale-erp-front)의 `erp-*` 토큰·2px 모서리를 가져오지 않는다. 두 앱은 쓰는 손과 화면이 다르다.
