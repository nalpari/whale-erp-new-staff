"use client";

import { useId, useState } from "react";
import { PRESS } from "@/components/common/theme";
import { AddressForm } from "./address-form";
import { ROW_CLASS, RowChevron, RowIcon, RowText } from "./me-rows";

/**
 * 내 정보 줄 상자의 주소 줄(정돈 시안 ⑬). 줄을 누르면 그 아래에 지금의 주소 편집(주소 검색 시트 · 상세 주소 · 저장)이 펼쳐진다 —
 * 시트 안에 주소 검색 시트를 겹치지 않으려고 펼침으로 두었다. 접어도 편집 칸은 남겨(hidden) 고른 주소 · 적은 상세 주소가 지워지지 않는다.
 */
export function AddressRow({ zipCode, address, addressDetail }: { zipCode: string | null; address: string | null; addressDetail: string | null }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const value = address ? [address, addressDetail].filter(Boolean).join(" ") : "등록된 주소가 없습니다";

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`${ROW_CLASS} active:bg-staff-info-bg ${PRESS}`}
      >
        <RowIcon name="home" />
        <RowText name="주소" value={value} />
        <RowChevron open={open} />
      </button>
      <div id={panelId} hidden={!open} className="px-[16px] pb-[16px]">
        <AddressForm zipCode={zipCode} address={address} addressDetail={addressDetail} onCancel={() => setOpen(false)} />
      </div>
    </div>
  );
}
