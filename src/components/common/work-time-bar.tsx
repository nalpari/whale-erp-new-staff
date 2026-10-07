// "HH:MM" → 분.
function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const pad = (n: number) => String(n).padStart(2, "0");

type Range = { start: string; end: string };

// Figma 05.출퇴근 현황 근무 막대(node 12:1364): #EDF0F6 바탕 26px(radius 6) 위에
//   예정 근무 — 막대 높이 전체, #B6C1D5 점선 테두리 + 옅은 빗금(radius 5)
//   실제 근무 — 위아래 5px 안쪽, #7676E4(radius 5). 근무 중(ongoing)이면 오른쪽 끝 18% 가 흐려진다.
// 아래에 4시간 간격 눈금(11px, 보조 글자). 막대 범위는 from~to 시(기본 08~20시), 벗어난 시각은 끝에 붙인다.
// 막대 색들은 이 막대에만 나와 토큰으로 두지 않는다.
export function WorkTimeBar({
  schedule,
  worked,
  ongoing = false,
  from = 8,
  to = 20,
}: {
  schedule?: Range;
  worked?: Range;
  ongoing?: boolean;
  from?: number;
  to?: number;
}) {
  const span = (to - from) * 60;
  const position = (time: string) => Math.min(Math.max(((toMinutes(time) - from * 60) / span) * 100, 0), 100);
  const place = (r: Range) => ({ left: `${position(r.start)}%`, right: `${100 - position(r.end)}%` });
  const ticks = Array.from({ length: Math.floor((to - from) / 4) + 1 }, (_, i) => from + i * 4);
  const label = [schedule && `예정 ${schedule.start}–${schedule.end}`, worked && `근무 ${worked.start}–${ongoing ? "진행 중" : worked.end}`]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex w-full flex-col">
      <div role="img" aria-label={label || "근무 없음"} className="relative h-[26px] w-full overflow-clip rounded-[6px] bg-[#edf0f6]">
        {schedule && (
          <div
            className="absolute inset-y-0 rounded-[5px] border border-dashed border-[#b6c1d5] bg-[repeating-linear-gradient(45deg,transparent_0_5px,rgba(22,25,28,0.04)_5px_10px)]"
            style={place(schedule)}
          />
        )}
        {worked && (
          <div
            className={`absolute inset-y-[5px] rounded-[5px] bg-[#7676e4] ${ongoing ? "[mask-image:linear-gradient(to_right,black_82%,transparent)]" : ""}`}
            style={place(worked)}
          />
        )}
      </div>
      <div className="flex justify-between text-[11px] leading-[1.5] text-staff-text-sub">
        {ticks.map((h) => (
          <span key={h}>{pad(h)}:00</span>
        ))}
      </div>
    </div>
  );
}
