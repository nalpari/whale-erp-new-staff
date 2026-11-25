// 로그인 로고 — 앞치마 · 이름표를 단 직원 고래(2026-11-25 사용자 지정 — 고래가 직원인 느낌, 전엔 Figma Logo 의 남색 고래 · 별 그림).
// 꼬리 오른쪽에 점선으로 이은 WHALE ERP, 아래에 키 메시지(20px bold) · 보조 문구(13px 흐림). 색은 이 그림에만 나와 토큰으로 두지 않는다 —
// 몸 · 꼬리 #6B8FC7, 물줄기 #B3D0F4, 꼬리 끝 점선 #8FA9D6, 「WHALE ERP」 글자 #55617A, 배 #F3EAD8, 앞치마 황토 #C99A5B(끈 #B9833F), 눈 #1B2335, 볼 #F2A7B0.
/** brand 면 꼬리 끝 점선 · WHALE ERP 를 붙인 넓은 로고(로그인), 아니면 고래만(내 정보 프로필 등) */
function StaffWhale({ brand, width, height }: { brand: boolean; width: number; height: number }) {
  return (
    // 로그인 로고는 「WHALE ERP」 글자가 그림 안에 있어 그림 전체를 이름으로 읽힌다. 고래만 그린 것(프로필)은 꾸밈이라 숨긴다
    <svg
      width={width}
      height={height}
      viewBox={brand ? "-90 -4 304 100" : "4 -4 116 100"}
      {...(brand ? { role: "img", "aria-label": "WHALE ERP" } : { "aria-hidden": true })}
    >
      {/* 물줄기 — 머리 위로 세 갈래, 끝에 물방울(하늘색 #B3D0F4) */}
      <path d="M54 20 C51 12 46 10 42 11 M56 19 C56 10 58 6 62 5 M58 20 C62 13 67 12 71 14" stroke="#b3d0f4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="41" cy="11" r="2.4" fill="#b3d0f4" />
      <circle cx="62" cy="4.8" r="2.4" fill="#b3d0f4" />
      <circle cx="72" cy="14.5" r="2.4" fill="#b3d0f4" />
      {/* 꼬리 — 몸 오른쪽 뒤에서 짧고 굵게 올라 끝이 통통한 좌우 대칭 두 갈래(가운데 홈)로 벌어진다. 몸이 밑동을 덮는다 */}
      <path d="M80 56 C88 52 94 46 96 39 L107 39 C105 49 98 57 88 62 Z" fill="#6b8fc7" />
      <path d="M101.5 42 C93 43 84 38 83 29 C83 25.5 87 24.5 90.5 26.5 C95 29 98.5 32.5 101.5 36 C104.5 32.5 108 29 112.5 26.5 C116 24.5 120 25.5 120 29 C119 38 110 43 101.5 42 Z" fill="#6b8fc7" />
      {/* 꼬리 끝에서 둥근 점선이 이어져 「WHALE ERP」(2026-11-25 사용자 지정 — 이름을 꼬리 오른쪽으로, 아래 이름 줄은 뺐다).
          고래가 가운데에 오게 viewBox 를 양쪽으로 같은 만큼 넓혔다 */}
      {brand && (
        <>
          <path d="M122 25 C127 17 133 17 137 22" stroke="#8fa9d6" strokeWidth="1.8" strokeDasharray="0.1 4.5" strokeLinecap="round" fill="none" />
          <text x="140" y="30" fontSize="11.5" fontWeight="700" fill="#55617a" letterSpacing="0.3">
            WHALE ERP
          </text>
        </>
      )}
      <path d="M18 96 C8 60 24 24 56 24 C88 24 104 60 94 96 Z" fill="#6b8fc7" />
      <path d="M32 96 C30 74 42 62 56 62 C70 62 82 74 80 96 Z" fill="#f3ead8" />
      <circle cx="44" cy="50" r="4.6" fill="#1b2335" />
      <circle cx="45.5" cy="48.5" r="1.5" fill="#fff" />
      <circle cx="68" cy="50" r="4.6" fill="#1b2335" />
      <circle cx="69.5" cy="48.5" r="1.5" fill="#fff" />
      <ellipse cx="36" cy="59" rx="4.6" ry="2.7" fill="#f2a7b0" opacity=".85" />
      <ellipse cx="76" cy="59" rx="4.6" ry="2.7" fill="#f2a7b0" opacity=".85" />
      <path d="M51 59 Q56 64 61 59" stroke="#1b2335" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* 앞치마 끈 */}
      <path d="M40 59 L42 68 M72 59 L70 68" stroke="#b9833f" strokeWidth="2.4" strokeLinecap="round" />
      {/* 둥근 모서리 한 판 · 가운데 명찰(물결 주름 · 단추 · 하트는 뺐다, 2026-11-25 사용자 지정) */}
      <path d="M34 72 Q34 67 39 67 H73 Q78 67 78 72 V96 H34 Z" fill="#c99a5b" />
      {/* 명찰 「웨일」 */}
      <rect x="44.5" y="74" width="23" height="10" rx="2.5" fill="#fff" />
      <text x="56" y="81.6" textAnchor="middle" fontSize="7" fontWeight="700" fill="#1b2335">
        웨일
      </text>
      <ellipse cx="20" cy="76" rx="9" ry="5.5" fill="#6b8fc7" transform="rotate(-35 20 76)" />
      <ellipse cx="92" cy="76" rx="9" ry="5.5" fill="#6b8fc7" transform="rotate(35 92 76)" />
    </svg>
  );
}

/** 고래만 — 내 정보 프로필 동그라미 등(2026-11-25 사용자 지정, 전엔 사람 아이콘) */
export function StaffWhaleMark({ size }: { size: number }) {
  return <StaffWhale brand={false} width={size} height={Math.round((size * 100) / 116)} />;
}

export function BrandLogo() {
  return (
    <div className="flex flex-col items-center gap-[8px]">
      <StaffWhale brand width={283} height={93} />
      <div className="flex flex-col items-center gap-[4px] pt-[6px] text-center leading-[1.5] break-keep">
        <p className="text-[20px] font-bold text-staff-text">근무지와 나를 잇는 근무 앱</p>
        <p className="text-[13px] text-staff-text-muted">근로계약, 근무스케줄, 급여명세서를 앱에서 확인하세요.</p>
      </div>
    </div>
  );
}
