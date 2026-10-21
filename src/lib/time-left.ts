/** 남은 시간을 mm:ss 로. 지났으면 00:00. 초 아래는 버린다(1초 안쪽이 남으면 00:00). */
export function formatLeft(ms: number): string {
  const left = Math.max(0, ms);
  return `${String(Math.floor(left / 60_000)).padStart(2, "0")}:${String(Math.floor((left % 60_000) / 1000)).padStart(2, "0")}`;
}
