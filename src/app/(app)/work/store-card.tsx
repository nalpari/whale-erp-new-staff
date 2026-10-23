"use client";

import Image from "next/image";
import { Alert } from "@/components/common";
import { useStoreSheet, type StoreChoice } from "../store-sheet";

// 근무지 카드(WORK-4) — 근무스케줄 · TO-DO 두 탭 위. 누르면 「근무지 고르기」 시트를 열고, 고르면 앱 전역 근무지가 바뀐다.
// 근무지가 하나면 누를 수 없고 꺾쇠를 뺀다. 모양은 데모(/design/work)와 같다. 카드 바탕 #eef2ff 는 홈 · 출퇴근 카드와 같은 짝이다.
export function StoreCard({ stores, currentId }: { stores: StoreChoice[]; currentId: number }) {
  const current = stores.find((s) => s.staffMemberId === currentId) ?? stores[0];
  const many = stores.length > 1;
  const { openSheet, pending, error, sheet } = useStoreSheet(stores, current.staffMemberId);

  const body = (
    <>
      <Image src="/icons/store-small.svg" alt="" width={14.625} height={13.5} />
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <span className="truncate text-[16px] font-bold">{current.storeName}</span>
        <span className="text-[12px] text-staff-text-sub">
          {many ? `연결된 근무지 ${stores.length}곳 · 눌러서 바꾸기` : "연결된 근무지 1곳"}
        </span>
      </span>
      {many && <Image src="/icons/chevron-right-dark.svg" alt="" width={24} height={24} />}
    </>
  );
  const cardClass =
    "flex items-center gap-[14px] rounded-[18px] border border-staff-border-light bg-[#eef2ff] px-[20px] pt-[20px] pb-[24px] text-left";

  return (
    <>
      {many ? (
        <button
          type="button"
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
