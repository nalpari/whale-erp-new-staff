import type { CSSProperties } from "react";

// 로그인 이메일 칸 위로 고개를 내민 엄마 · 아기 고래(2026-11-25 사용자 지정 — 키 메시지 「사장님과 나를 잇는 근무 앱」의 두 사람).
// 관리자 웹 시작 가이드 미니 카드의 고래(whale-erp-front `peeking-whales.tsx`)와 같은 그림이다. 몸통은 입력칸 위 테두리에서 평평하게
// 끊겨 칸 뒤에 숨은 것처럼 보이고, 두 지느러미만 테두리에 걸친다. 색은 이 그림에만 나와 토큰으로 두지 않는다 — 엄마 #6B8FC7,
// 아기 · 물줄기 #B3D0F4, 배 크림, 눈 #1B2335, 볼 #F2A7B0. 그림은 누르는 데 끼어들지 않고 화면 낭독기도 읽지 않는다.

const MOM = "#6b8fc7";
const BABY = "#b3d0f4";
const EYE = "#1b2335";
const CHEEK = "#f2a7b0";

// viewBox 120 × 84 — 몸 아래 평평한 선(y=78)이 입력칸 위 테두리 바깥 선(lineTop)에 온다.
const box = (right: number, width: number, lineTop: number): CSSProperties => ({
  right,
  width,
  height: (width * 84) / 120,
  top: lineTop - (width * 78) / 120,
});

/** lineTop: 감싸는 상자 위에서 입력칸 위 테두리까지의 거리(라벨 줄 + 간격) */
export function LoginWhales({ lineTop }: { lineTop: number }) {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
      {/* 엄마 */}
      <svg viewBox="0 0 120 84" className="absolute overflow-visible" style={box(58, 52, lineTop)}>
        <path d="M58 16 C55 8 50 6 46 7 M60 15 C60 6 62 2 66 1 M62 16 C66 9 71 8 75 10" stroke={BABY} strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="45" cy="7" r="2.4" fill={BABY} />
        <circle cx="66" cy="1.8" r="2.4" fill={BABY} />
        <circle cx="76" cy="10.5" r="2.4" fill={BABY} />
        <path d="M14 78 C10 44 30 20 60 20 C90 20 110 44 106 78 Z" fill={MOM} />
        <path d="M30 78 C30 60 44 52 60 52 C76 52 90 60 90 78 Z" fill="#f3ead8" />
        <circle cx="44" cy="46" r="5" fill={EYE} />
        <circle cx="45.6" cy="44.4" r="1.6" fill="#fff" />
        <circle cx="76" cy="46" r="5" fill={EYE} />
        <circle cx="77.6" cy="44.4" r="1.6" fill="#fff" />
        <ellipse cx="35" cy="55" rx="5" ry="3" fill={CHEEK} opacity=".8" />
        <ellipse cx="85" cy="55" rx="5" ry="3" fill={CHEEK} opacity=".8" />
        <path d="M55 55 Q60 59 65 55" stroke={EYE} strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <ellipse cx="30" cy="78" rx="10" ry="6.5" fill={MOM} transform="rotate(-10 30 78)" />
        <ellipse cx="90" cy="78" rx="10" ry="6.5" fill={MOM} transform="rotate(10 90 78)" />
      </svg>
      {/* 아기 */}
      <svg viewBox="0 0 120 84" className="absolute overflow-visible" style={box(20, 36, lineTop)}>
        <path d="M14 78 C10 44 30 20 60 20 C90 20 110 44 106 78 Z" fill={BABY} />
        <path d="M30 78 C30 60 44 52 60 52 C76 52 90 60 90 78 Z" fill="#f7f1e4" />
        <circle cx="44" cy="47" r="4.6" fill={EYE} />
        <circle cx="45.4" cy="45.5" r="1.5" fill="#fff" />
        <circle cx="76" cy="47" r="4.6" fill={EYE} />
        <circle cx="77.4" cy="45.5" r="1.5" fill="#fff" />
        <ellipse cx="35" cy="56" rx="5" ry="3" fill={CHEEK} opacity=".8" />
        <ellipse cx="85" cy="56" rx="5" ry="3" fill={CHEEK} opacity=".8" />
        <ellipse cx="60" cy="57" rx="3.2" ry="2.4" fill={EYE} />
        <ellipse cx="30" cy="78" rx="10" ry="6.5" fill={BABY} transform="rotate(-10 30 78)" />
        <ellipse cx="90" cy="78" rx="10" ry="6.5" fill={BABY} transform="rotate(10 90 78)" />
      </svg>
    </span>
  );
}
