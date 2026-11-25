"use client";

import { useState } from "react";
import { BottomSheet, MaskIcon } from "@/components/common";
import { HQ_SHARING_TERMS } from "@/lib/hq-sharing-terms";

/**
 * 사업자(본사) 제공 동의 전문 — 받는 자 · 항목 · 목적 · 보유 기간 줄과 거부할 권리(선택 동의 · 철회해도 그대로) 안내(ATT-30 · ATT-8).
 * 내 정보 › 동의 상세 카드의 내용 시트와 가입 · 근무지 추가 · 소속 추가 수락의 「내용 보기」가 같은 글을 보인다 — 남기는 버전(HQ_SHARING_TERMS_VERSION)이
 * 실제로 본 문구여야 해서다(ATT-30 · ATT-8 v257, 2026-10-30 재영).
 */
export function HqSharingTermsBody() {
  return (
    <>
      {/* 정돈 시안 ⑱(2026-11-20 사용자 지정) — 연회색 둥근 상자에 이름 위 · 값 아래, 아래 안내 한 줄 */}
      <dl className="overflow-hidden rounded-[16px] border border-staff-border bg-staff-bg">
        {HQ_SHARING_TERMS.map(([name, value]) => (
          // 줄 사이 #e4e8ef — staff-bg 바탕 위에서 옅은 테두리는 보이지 않아 한 단계 진하게(퇴근 완료 기록 상자와 같다)
          <div key={name} className="flex flex-col gap-[4px] border-t border-[#e4e8ef] px-[18px] py-[13px] first:border-t-0">
            <dt className="text-[13px] text-staff-text-muted">{name}</dt>
            <dd className="text-[14px] break-keep">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="px-[4px] text-[13px] leading-[1.55] break-keep text-staff-text-sub">동의는 선택사항이며, 동의하지 않아도 근무에는 영향이 없습니다.</p>
    </>
  );
}

/**
 * 동의 칸 요약 아래 「내용 보기」 — 누르면 전문 시트를 연다(가입 · 근무지 추가 · 소속 추가 수락, ATT-30 · ATT-8 v257). 동의는 체크 칸으로만
 * 받는다 — 시트는 보이기만 한다.
 */
export function HqSharingTermsButton({ chevron = false }: { chevron?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="근무정보 제공 동의 내용 보기"
        // 빈칸을 음수 여백으로 당기면 44px 누르는 칸이 위 요약 글자를 덮어 요약을 눌러도 시트가 열린다 — 당기지 않는다
        className={
          chevron
            ? // 근무지 추가 확인의 동의 카드(제안 1) — 밑줄 대신 꺾쇠, 카드 머리 줄 오른쪽 끝
              "flex min-h-[44px] shrink-0 items-center gap-[2px] px-[4px] text-[13px] font-semibold text-staff-text-sub"
            : "flex min-h-[44px] items-center self-start text-[12px] font-semibold text-staff-text-sub underline underline-offset-2"
        }
      >
        내용 보기
        {chevron && <MaskIcon src="/icons/chevron-right-small.svg" size={12} />}
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="근무정보 제공 동의">
        <HqSharingTermsBody />
      </BottomSheet>
    </>
  );
}
