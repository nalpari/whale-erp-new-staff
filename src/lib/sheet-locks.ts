/**
 * 바텀시트가 열린 동안 문서(뒤 화면) 스크롤을 잠그는 카운터와, 마지막 시트가 실제로 닫힌 뒤에 부를 일 모음.
 * 시트가 여러 개 겹쳐 열릴 수 있어 센다 — 처음 잠글 때 [apply], 마지막으로 풀 때 [restore] 를 부르고 기다리던 일을 부른다.
 * DOM 을 직접 만지지 않게 잠그기 · 풀기를 받아(bottom-sheet.tsx 가 html · body overflow 를 넘긴다) node --test 로 확인한다.
 */
export function createSheetLocks({ apply, restore }: { apply: () => void; restore: () => void }) {
  let count = 0;
  const waiting: (() => void)[] = [];
  return {
    lock() {
      if (count++ === 0) apply();
    },
    /** 잠근 적 없이 풀어도 0 아래로 내려가지 않는다. */
    unlock() {
      if (count === 0 || --count > 0) return;
      restore();
      // 하나가 던져도 나머지 일은 부른다(기다리던 알림이 함께 사라지지 않게).
      for (const fn of waiting.splice(0)) {
        try {
          fn();
        } catch (error) {
          console.error("[bottom-sheet] afterSheetsClose 콜백 실패", error);
        }
      }
    },
    /** 열린(또는 내려가는 중인) 시트가 없으면 바로, 있으면 마지막 시트가 풀릴 때 [fn] 을 부른다. */
    afterAllClosed(fn: () => void) {
      if (count === 0) return fn();
      waiting.push(fn);
    },
    get count() {
      return count;
    },
  };
}

/** 머리를 이만큼(px) 넘게 끌면 닫는다. 덜 끌었어도 빠르게 튕기듯 내리면(DRAG_FLICK) 닫는다. */
export const DRAG_CLOSE_PX = 80;
/** 빠르게 내린 것으로 보는 속도(px/ms)와 그때 필요한 최소 거리(px). */
export const DRAG_FLICK = { speed: 0.5, minPx: 24 };

/** 머리를 [dy]px 내린 채 [elapsedMs] 만에 손을 뗐을 때 닫을지. */
export function shouldCloseOnDrag(dy: number, elapsedMs: number): boolean {
  if (dy > DRAG_CLOSE_PX) return true;
  return dy > DRAG_FLICK.minPx && dy / Math.max(1, elapsedMs) > DRAG_FLICK.speed;
}
