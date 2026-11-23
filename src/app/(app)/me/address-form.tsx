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
 * 주소 줄을 누르면 펼쳐지는 주소 편집(데모 me 의 주소 · 주소 검색, 내 정보 정돈 시안 ⑬ — address-row). 줄 이름이 「주소」라 칸 이름은 「도로명 주소」다. 도로명 주소는 검색해서 고르고 상세 주소만 직접 적는다.
 * 저장이 실패해도 고른 주소 · 적은 상세 주소는 이 컴포넌트가 들고 있어 그대로 남는다.
 */
export function AddressForm({
  zipCode,
  address,
  addressDetail,
  onCancel,
}: {
  zipCode: string | null;
  address: string | null;
  addressDetail: string | null;
  /** [취소] — 고른 주소 · 상세 주소를 저장된 값으로 되돌리고 편집을 접는다(2026-11-20 사용자 지정) */
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState(saveAddressAction, INITIAL);
  const [picked, setPicked] = useState({ zipCode: zipCode ?? "", address: address ?? "" });
  const [detail, setDetail] = useState(addressDetail ?? "");
  const [searching, setSearching] = useState(false);

  const shown = picked.address ? `(${picked.zipCode}) ${picked.address}` : "";
  // 바뀐 것이 없으면 저장을 막는다(api 는 같은 값이면 쓰지 않지만 「저장했습니다」가 뜨면 헷갈린다). 실패한 뒤의 「다시 하기」는 연다.
  const changed =
    picked.zipCode !== (zipCode ?? "") || picked.address !== (address ?? "") || detail.trim() !== (addressDetail ?? "");

  return (
    <form action={formAction} noValidate className="flex flex-col gap-[8px]">
      <input type="hidden" name="zipCode" value={picked.zipCode} />
      <input type="hidden" name="address" value={picked.address} />
      <ReadOnlyField
        label="도로명 주소"
        value={shown}
        wrap
      />
      <input
        name="addressDetail"
        aria-label="상세주소"
        placeholder="상세주소"
        autoComplete="address-line2"
        maxLength={ADDRESS_DETAIL_MAX}
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        className={FIELD}
      />
      {/* 주소 두 칸(도로명 · 상세) 아래 행에 [주소 검색](폭 전체, 2026-11-20 사용자 확정) */}
      <Button variant="outline" onClick={() => setSearching(true)}>
        주소 검색
      </Button>
      <p className="pt-[2px] text-[12px] text-staff-text-muted">
        주소를 변경해도 이미 서명한 계약서에는 반영되지 않습니다.
      </p>
      {state.error && (
        <Alert tone="danger">
          <p>{state.error}</p>
        </Alert>
      )}
      <div className="flex flex-col gap-[4px] pt-[4px]">
        {/* 실패하면 같은 값을 다시 보내는 「다시 하기」다. */}
        <Button type="submit" disabled={pending || !picked.address || (!changed && !state.error)}>
          {state.error ? "다시 하기" : "변경사항 저장"}
        </Button>
        {onCancel && (
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setPicked({ zipCode: zipCode ?? "", address: address ?? "" });
              setDetail(addressDetail ?? "");
              onCancel();
            }}
          >
            취소
          </Button>
        )}
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
