"use client";

import { Alert, MaskIcon } from "@/components/common";
import { useStoreSheet, type StoreChoice } from "../store-sheet";

// 근무지 카드(WORK-4) — 근무스케줄 · TO-DO 두 탭 위. 누르면 「근무지 고르기」 시트를 열고, 고르면 앱 전역 근무지가 바뀐다.
// 근무지가 하나면 누를 수 없고 「변경」을 뺀다. 정돈(2026-11-20 사용자 지정): 점포 아이콘 · 「연결된 근무지 N곳」을 빼고 흰 상자에
// 「근무지」 · 근무지명, 오른쪽에 「변경 ›」 — 연보라 바탕 카드는 무엇을 누르는지 알기 어려웠다.
export function StoreCard({ stores, currentId }: { stores: StoreChoice[]; currentId: number }) {
  const current = stores.find((s) => s.staffMemberId === currentId) ?? stores[0];
  const many = stores.length > 1;
  const { openSheet, pending, error, sheet } = useStoreSheet(stores, current.staffMemberId);

  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[12px] text-staff-text-muted">근무지</span>
        <span className="text-[16px] leading-[1.45] font-bold break-keep">{current.storeName}</span>
      </span>
      {many && (
        <span className="flex shrink-0 items-center gap-[2px] text-[13px] font-semibold text-staff-primary">
          변경
          <MaskIcon src="/icons/chevron-right-small.svg" size={12} />
        </span>
      )}
    </>
  );
  const cardClass =
    "flex w-full items-center gap-[12px] rounded-[16px] border border-staff-border bg-white px-[18px] py-[14px] text-left";

  return (
    <>
      {many ? (
        <button
          type="button"
          aria-label={`근무지 바꾸기, 지금 ${current.storeName}`}
          disabled={pending}
          onClick={openSheet}
          className={`${cardClass} transition-colors duration-150 ease-out active:bg-staff-primary-inactive disabled:opacity-60`}
        >
          {body}
        </button>
      ) : (
        <div className={cardClass}>{body}</div>
      )}
      {error && <Alert tone="warning">{error}</Alert>}
      {many && sheet}
    </>
  );
}
