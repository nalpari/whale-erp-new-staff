// "HH:MM" → 분.
function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const pad = (n: number) => String(n).padStart(2, "0");

// Figma WorkTimeBar: 연한 브랜드 바탕 막대(12px, 알약형) 위에 근무한 구간을 브랜드색으로 칠하고,
// 아래에 4시간 간격 눈금(10px, placeholder 색)을 둔다. 막대 범위는 from~to 시(기본 08~20시).
export function WorkTimeBar({
  checkIn,
  checkOut,
  from = 8,
  to = 20,
}: {
  checkIn: string;
  checkOut: string;
  from?: number;
  to?: number;
}) {
  const span = (to - from) * 60;
  const clamp = (v: number) => Math.min(Math.max(v, 0), 100);
  const left = clamp(((toMinutes(checkIn) - from * 60) / span) * 100);
  const right = clamp(((toMinutes(checkOut) - from * 60) / span) * 100);
  const ticks = Array.from({ length: Math.floor((to - from) / 4) + 1 }, (_, i) => from + i * 4);

  return (
    <div className="flex w-full flex-col gap-[8px]">
      <div
        role="img"
        aria-label={`출근 ${checkIn}, 퇴근 ${checkOut}`}
        className="relative h-[12px] w-full overflow-clip rounded-full bg-staff-primary-inactive"
      >
        <div className="absolute inset-y-0 rounded-full bg-staff-primary" style={{ left: `${left}%`, width: `${right - left}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-staff-placeholder">
        {ticks.map((h) => (
          <span key={h}>{pad(h)}:00</span>
        ))}
      </div>
    </div>
  );
}
