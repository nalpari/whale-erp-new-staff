"use client";

import { useActionState, useState } from "react";
import { Alert, Button, Toast } from "@/components/common";
import { FIELD } from "@/components/common/theme";
import { ADDRESS_DETAIL_MAX } from "@/lib/profile";
import { saveAddressAction, type AddressSaveState } from "./actions";
import { AddressSearchSheet } from "@/app/_components/address-search-sheet";
import { ReadOnlyField } from "@/app/_components/read-only-field";

const INITIAL: AddressSaveState = {};

/**
 * 연락처 카드의 주소 칸(데모 me 의 주소 · 주소 검색). 도로명 주소는 검색해서 고르고 상세 주소만 직접 적는다.
 * 저장이 실패해도 고른 주소 · 적은 상세 주소는 이 컴포넌트가 들고 있어 그대로 남는다.
 */
export function AddressForm({ zipCode, address, addressDetail }: { zipCode: string | null; address: string | null; addressDetail: string | null }) {
  const [state, formAction, pending] = useActionState(saveAddressAction, INITIAL);
  const [picked, setPicked] = useState({ zipCode: zipCode ?? "", address: address ?? "" });
  const [detail, setDetail] = useState(addressDetail ?? "");
  const [searching, setSearching] = useState(false);

  const shown = picked.address ? `(${picked.zipCode}) ${picked.address}` : "";
  // 바뀐 것이 없으면 저장을 막는다(api 는 같은 값이면 쓰지 않지만 「저장했습니다」가 뜨면 헷갈린다). 실패한 뒤의 「다시 하기」는 연다.
  const changed =
    picked.zipCode !== (zipCode ?? "") || picked.address !== (address ?? "") || detail.trim() !== (addressDetail ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-[8px]">
      <input type="hidden" name="zipCode" value={picked.zipCode} />
      <input type="hidden" name="address" value={picked.address} />
      <ReadOnlyField
        label="주소"
        value={shown}
        wrap
        action={
          <Button variant="outline" onClick={() => setSearching(true)}>
            검색
          </Button>
        }
      />
      <input
        name="addressDetail"
        aria-label="상세 주소"
        placeholder="상세 주소"
        autoComplete="address-line2"
        maxLength={ADDRESS_DETAIL_MAX}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        className={FIELD}
      />
      <p className="pt-[2px] text-[12px] text-staff-text-muted">
        도로명 주소는 검색해서 고르고 상세 주소만 직접 적습니다. 주소 변경은 다음 계약부터 반영됩니다.
      </p>
      {state.error && (
        <Alert tone="danger">
          <p>{state.error}</p>
        </Alert>
      )}
      <div className="pt-[4px]">
        {/* 실패하면 같은 값을 다시 보내는 「다시 하기」다. */}
        <Button type="submit" disabled={pending || !picked.address || (!changed && !state.error)}>
          {state.error ? "다시 하기" : "변경사항 저장"}
        </Button>
      </div>
      {state.savedAt && <Toast key={state.savedAt}>변경사항을 저장했습니다</Toast>}
      <AddressSearchSheet
        open={searching}
        onClose={() => setSearching(false)}
        onPick={(found) => {
          setPicked(found);
          setSearching(false);
        }}
      />
    </form>
  );
}
