import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { FIELD } from "./field";
import { FilterShell, GlobalHeader, LoginInfo, SearchField, StoreSelect } from "./interactive";

export { GlobalHeader, LoginInfo, SearchField, StoreSelect };

// 2026 Whale ERP 1차수정 Figma(01.프레임_기본) 기준 기본 유닛.
// /design 은 하나씩, /design/full 은 조합해서 보여준다. 아이콘은 public/design 의 Figma 원본이다.

const BUTTON_TONE = {
  primary: "border-erp-brand bg-erp-brand text-white",
  soft: "border-erp-brand-soft bg-erp-brand-soft text-white",
  off: "border-erp-subtle bg-erp-subtle text-erp-ink",
};

// Figma Btn_basic / Btn_basic_off / Btn_basic_off2. 세 종류 모두 호버(active)하면 흰 바탕에 브랜드 테두리가 된다.
// 테두리를 처음부터 같은 색으로 깔아 두어 호버 때 크기가 변하지 않는다.
export function Button({
  variant = "primary",
  className = "",
  ...props
}: { variant?: keyof typeof BUTTON_TONE } & ComponentProps<"button">) {
  return (
    <button
      {...props}
      className={`h-[34px] shrink-0 rounded-[2px] border px-[24px] text-[14px] font-medium whitespace-nowrap transition-[background-color,border-color,color] duration-150 ease-out hover:border-erp-brand hover:bg-white hover:text-erp-ink ${BUTTON_TONE[variant]} ${className}`}
    />
  );
}

export function Badge({ on }: { on: boolean }) {
  return (
    <span
      className={`inline-block rounded-[2px] py-[2px] text-center text-[14px] font-medium ${
        on ? "w-[44px] bg-erp-on-bg text-erp-on" : "bg-erp-off-bg px-[4px] text-erp-off"
      }`}
    >
      {on ? "운영" : "미운영"}
    </span>
  );
}

export function Select(props: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={`${FIELD} appearance-none bg-[url(/design/select-arrow.svg)] bg-[length:30px_30px] bg-[position:right_center] bg-no-repeat pr-[30px]`}
    />
  );
}

export function DateField(props: ComponentProps<"input">) {
  // 네이티브 달력 버튼은 투명하게 남겨 클릭 영역으로만 쓰고, 보이는 아이콘은 Figma 원본이다.
  return (
    <input
      {...props}
      type="date"
      className={`${FIELD} bg-[url(/design/calendar.svg)] bg-[length:30px_30px] bg-[position:right_center] bg-no-repeat [&::-webkit-calendar-picker-indicator]:opacity-0`}
    />
  );
}

export function Checkbox({ label, ...props }: { label: string } & ComponentProps<"input">) {
  // 하루에도 여러 번 누르는 컨트롤이라 짧고 옅게만 움직인다: 칸 색은 바로 바뀌고 체크 표시만 살짝 커지며 나타난다.
  return (
    <label className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="relative grid size-[20px] shrink-0 place-items-center">
        <input
          {...props}
          type="checkbox"
          className="peer absolute inset-0 appearance-none rounded-[2px] border border-erp-field-line bg-white transition-[background-color,border-color] duration-150 ease-out checked:border-erp-brand checked:bg-erp-brand"
        />
        <Image
          src="/design/check.svg"
          alt=""
          width={12}
          height={9}
          className="pointer-events-none relative scale-75 opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:scale-100"
        />
      </span>
      {label}
    </label>
  );
}

// Figma Form_radio. 체크박스와 같은 방식으로, 선택되면 가운데 점이 살짝 커지며 나타난다.
export function Radio({ label, ...props }: { label: string } & ComponentProps<"input">) {
  return (
    <label className="flex items-center gap-[8px] text-[14px] text-erp-ink">
      <span className="relative grid size-[20px] shrink-0 place-items-center">
        <input
          {...props}
          type="radio"
          className="peer absolute inset-0 appearance-none rounded-full border border-erp-field-line bg-white transition-[border-color] duration-150 ease-out checked:border-erp-brand"
        />
        <span className="pointer-events-none relative size-[8px] scale-50 rounded-full bg-erp-brand opacity-0 transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] peer-checked:scale-100 peer-checked:opacity-100 motion-reduce:scale-100" />
      </span>
      {label}
    </label>
  );
}

export function FilterSection({
  label,
  children,
  tight,
  last,
}: {
  label: string;
  children: ReactNode;
  /** 입력칸 섹션은 라벨 간격이 8, 체크박스 섹션은 12 다. */
  tight?: boolean;
  last?: boolean;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`flex flex-col ${tight ? "gap-[8px]" : "gap-[12px]"} ${last ? "" : "border-b border-erp-divider pb-[18px]"}`}
    >
      <p className="text-[14px] font-medium text-erp-label">{label}</p>
      {children}
    </div>
  );
}

export function FilterPanel({ className = "" }: { className?: string }) {
  return (
    <FilterShell
      className={className}
      header={
        <>
          <h2 className="flex-1 text-[15px] font-semibold text-erp-ink">필터</h2>
          <button
            type="button"
            aria-label="필터 초기화"
            className="grid h-[32px] place-items-center rounded-[2px] border border-erp-button-line bg-white px-[13px]"
          >
            <Image src="/design/reset.svg" alt="" width={14} height={14} />
          </button>
        </>
      }
    >
      <FilterSection label="점포명">
        <Checkbox label="을지로3가점" defaultChecked />
        <Checkbox label="무교점" />
        <Checkbox label="신촌점" />
      </FilterSection>
      <FilterSection label="대표자명" tight>
        <SearchField placeholder="대표자명 입력" aria-label="대표자명" />
      </FilterSection>
      <FilterSection label="점포상태">
        <Checkbox label="운영" defaultChecked />
        <Checkbox label="미운영" />
        <Checkbox label="폐점" />
      </FilterSection>
      <FilterSection label="점포유형">
        <Checkbox label="일반점포" defaultChecked />
        <Checkbox label="가맹점포" />
      </FilterSection>
      <FilterSection label="등록일" tight last>
        <DateField aria-label="등록일 시작" defaultValue="2020-08-28" />
        <DateField aria-label="등록일 끝" defaultValue="2020-08-28" />
      </FilterSection>
    </FilterShell>
  );
}

export type StoreRow = {
  no: number;
  bpName: string;
  on: boolean;
  type: string;
  store: string;
  phone: string;
  owner: string;
  contract: string;
  createdAt: string;
};

// Figma 시안의 더미 데이터 그대로.
export const SAMPLE_ROWS: StoreRow[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((no) => ({
  no,
  bpName: "주식회사 따름인",
  on: [10, 8, 4, 3, 1].includes(no),
  type: "일반점포",
  store: "힘이나는커피생활 종로점",
  phone: "02 324 0328",
  owner: "홍길동",
  contract: "계약서보기",
  createdAt: "2025.08.28",
}));

// [헤더, 너비, 본문 좌측 정렬 여부]. 너비가 없는 열은 남는 폭을 나눠 갖는다.
const COLUMNS: [string, string, boolean][] = [
  ["번호", "w-[60px]", false],
  ["BP 상호명", "", true],
  ["점포상태", "w-[98px]", false],
  ["점포유형", "w-[180px]", false],
  ["점포명", "w-[320px]", true],
  ["점포 연락처", "", false],
  ["대표자명", "", false],
  ["계약여부", "", false],
  ["등록일", "", false],
];

export function DataTable({ rows }: { rows: StoreRow[] }) {
  return (
    <table className="w-full table-fixed border-collapse border-x border-erp-thead-line text-[14px]">
      <colgroup>
        {COLUMNS.map(([name, width]) => (
          <col key={name} className={width} />
        ))}
      </colgroup>
      <thead>
        <tr className="h-[42px] border-y border-erp-thead-line bg-erp-thead-bg">
          {COLUMNS.map(([name]) => (
            <th key={name} scope="col" className="px-[10px] font-medium text-erp-thead-text">
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="text-erp-ink">
        {rows.map((row) => (
          <tr key={row.no} className="h-[46px] border-b border-erp-thead-line">
            {[row.no, row.bpName, <Badge key="badge" on={row.on} />, row.type, row.store, row.phone, row.owner, row.contract, row.createdAt].map(
              (cell, i) => (
                <td key={i} className={`truncate px-[10px] ${COLUMNS[i][2] ? "text-left" : "text-center"}`}>
                  {cell}
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Pagination({ page, total }: { page: number; total: number }) {
  const first = page === 1;
  const last = page === total;
  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-[17px] text-[14px] font-medium">
      <button type="button" disabled={first} className="flex items-center gap-[4px] text-erp-thead-text disabled:cursor-default">
        <Image src="/design/prev.svg" alt="" width={16} height={16} />
        Prev
      </button>
      <ol className="flex gap-[9px]">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <li key={n}>
            <button
              type="button"
              aria-current={n === page ? "page" : undefined}
              className={`size-[38px] rounded-[2px] ${
                n === page ? "bg-erp-subtle font-semibold text-erp-ink" : "border border-erp-subtle bg-white text-erp-muted"
              }`}
            >
              {n}
            </button>
          </li>
        ))}
      </ol>
      <button type="button" disabled={last} className="flex items-center gap-[4px] text-erp-ink disabled:text-erp-thead-text">
        Next
        <Image src="/design/next.svg" alt="" width={16} height={16} />
      </button>
    </nav>
  );
}

const SWAP_OFF = "transition-opacity duration-150 ease-out group-hover:opacity-0 group-focus-visible:opacity-0";
const SWAP_ON = "absolute opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100";

function Dots({ on }: { on?: boolean }) {
  return (
    <span className={`grid grid-cols-3 gap-[2.5px] ${on ? SWAP_ON : SWAP_OFF}`}>
      {Array.from({ length: 9 }, (_, i) => (
        <Image key={i} src={on ? "/design/dot-on.svg" : "/design/dot.svg"} alt="" width={3} height={3} />
      ))}
    </span>
  );
}

// Figma Services. 아이콘에 올리면 아이콘이 채워지고 아래에 이름 툴팁이 뜬다.
// 호버는 자주 스치는 동작이라 150ms 페이드로만 바꾸고, 키보드 포커스에도 같은 상태를 보여 준다.
// 툴팁은 어느 아이콘에서 열리든 가운데 아이콘 아래 중앙에 뜬다(Figma 기준).
// 그래서 링크 자체는 위치 기준이 되지 않고, 툴팁은 아이콘 묶음(ServiceLinks 의 relative)을 기준으로 놓인다.
function ServiceLink({ label, boxed, off, on }: { label: string; boxed?: boolean; off: ReactNode; on: ReactNode }) {
  return (
    <a
      href="#"
      aria-label={label}
      className={`group grid size-[34px] place-items-center rounded-[2px] ${
        boxed
          ? "border border-erp-brand bg-white transition-colors duration-150 ease-out hover:bg-erp-brand focus-visible:bg-erp-brand"
          : ""
      }`}
    >
      <span className="relative grid place-items-center">
        {off}
        {on}
      </span>
      <span className="pointer-events-none absolute top-[calc(100%+12px)] left-1/2 z-20 min-w-[110px] -translate-x-1/2 rounded-[2px] border border-erp-brand bg-white px-[11px] py-[9px] text-center text-[14px] leading-[2] whitespace-nowrap [text-box:trim-both_cap_alphabetic] text-erp-brand opacity-0 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
        <span className="absolute -top-[5px] left-1/2 size-[8px] -translate-x-1/2 -rotate-45 rounded-tr-[1px] border-t border-r border-erp-brand bg-white" />
        {label}
      </span>
    </a>
  );
}

export function ServiceLinks() {
  return (
    <div className="flex items-center gap-[18px]">
      <span className="text-[15px] font-medium text-erp-ink">서비스 바로가기</span>
      <div className="relative flex gap-[6px]">
        <ServiceLink
          label="웨일ERP"
          off={<Image src="/design/service-1.svg" alt="" width={34} height={34} className={SWAP_OFF} />}
          on={<Image src="/design/service-1-on.svg" alt="" width={34} height={34} className={SWAP_ON} />}
        />
        <ServiceLink
          label="부가서비스 현황"
          boxed
          off={<Image src="/design/service-2.svg" alt="" width={18} height={18} className={SWAP_OFF} />}
          on={<Image src="/design/service-2-on.svg" alt="" width={18} height={18} className={SWAP_ON} />}
        />
        <ServiceLink label="플랫폼관리" boxed off={<Dots />} on={<Dots on />} />
      </div>
    </div>
  );
}

export function PageBar({ title }: { title: string }) {
  return (
    <div className="flex h-[59px] items-center border-b border-erp-bar-line bg-erp-bar px-[24px]">
      <h1 className="flex-1 text-[22px] font-semibold text-erp-ink">{title}</h1>
      <ServiceLinks />
    </div>
  );
}

export function ListTops({ total }: { total: number }) {
  return (
    <div className="flex items-end gap-[6px]">
      <p className="flex-1 text-[14px] text-erp-ink">
        총 <b className="font-semibold">{total}</b> 건
      </p>
      <Button>신규 등록</Button>
      <div className="w-[80px] shrink-0">
        <Select aria-label="페이지당 건수" defaultValue="50">
          <option>20</option>
          <option>50</option>
          <option>100</option>
        </Select>
      </div>
    </div>
  );
}
