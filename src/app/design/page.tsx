import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Checkbox,
  DataTable,
  DateField,
  FilterPanel,
  GlobalHeader,
  ListTops,
  LoginInfo,
  PageBar,
  Pagination,
  SAMPLE_ROWS,
  SearchField,
  Select,
  StoreSelect,
} from "./units";

const COLORS = [
  ["erp-ink", "bg-erp-ink", "#3C4046"],
  ["erp-brand", "bg-erp-brand", "#6B7988"],
  ["erp-label", "bg-erp-label", "#888888"],
  ["erp-thead-text", "bg-erp-thead-text", "#858B94"],
  ["erp-field-line", "bg-erp-field-line", "#EDEDEE"],
  ["erp-button-line", "bg-erp-button-line", "#E5E5E5"],
  ["erp-thead-line", "bg-erp-thead-line", "#E9EDF5"],
  ["erp-thead-bg", "bg-erp-thead-bg", "#F8F9FB"],
  ["erp-subtle", "bg-erp-subtle", "#F0F1F3"],
  ["erp-bar", "bg-erp-bar", "#F0F2F3"],
  ["erp-on", "bg-erp-on", "#5E8CE9"],
  ["erp-off", "bg-erp-off", "#EF6363"],
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-erp-panel-line py-10">
      <h2 className="mb-6 text-[13px] font-semibold tracking-normal text-erp-label uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignUnitsPage() {
  return (
    <main className="mx-auto max-w-[1680px] px-6 py-12 sm:px-10">
      <h1 className="mb-2 text-[28px] font-bold">기본 유닛</h1>
      <p className="mb-10 text-[14px] text-erp-label">2026 Whale ERP 1차수정 · 01.프레임_기본</p>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {COLORS.map(([name, bg, hex]) => (
            <li key={name}>
              <div className={`h-14 rounded-[2px] border border-erp-panel-line ${bg}`} />
              <p className="mt-2 text-[13px] font-medium">{name}</p>
              <p className="text-[12px] text-erp-label">{hex}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Type · Pretendard">
        <div className="space-y-4">
          <p className="text-[22px] font-semibold">페이지 제목 22 SemiBold</p>
          <p className="text-[16px] font-semibold">메뉴 16 SemiBold</p>
          <p className="text-[15px] font-semibold">패널 제목 15 SemiBold</p>
          <p className="text-[14px]">본문 14 Regular</p>
          <p className="text-[14px] font-medium text-erp-label">폼 라벨 14 Medium</p>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap gap-2">
          <Button>신규 등록</Button>
          <Button variant="off">취소</Button>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex gap-2">
          <Badge on />
          <Badge on={false} />
        </div>
      </Section>

      <Section title="Field">
        <div className="grid max-w-[640px] gap-4 sm:grid-cols-3">
          <SearchField placeholder="대표자명 입력" aria-label="대표자명" />
          <Select aria-label="페이지당 건수" defaultValue="50">
            <option>20</option>
            <option>50</option>
            <option>100</option>
          </Select>
          <DateField aria-label="등록일" defaultValue="2020-08-28" />
        </div>
      </Section>

      <Section title="Checkbox">
        <div className="flex gap-6">
          <Checkbox label="선택됨" defaultChecked />
          <Checkbox label="선택 안 됨" />
        </div>
      </Section>

      <Section title="Header controls">
        <div className="flex flex-wrap items-center gap-6">
          <StoreSelect />
          <LoginInfo />
        </div>
      </Section>

      <Section title="Filter panel">
        <FilterPanel />
      </Section>

      <Section title="List tops · Table · Pagination">
        <div className="flex flex-col gap-3 overflow-x-auto">
          <ListTops total={100} />
          <div className="min-w-[1280px]">
            <DataTable rows={SAMPLE_ROWS.slice(0, 3)} />
          </div>
          <Pagination page={1} total={10} />
        </div>
      </Section>

      <Section title="Global header · Page bar">
        <div className="overflow-x-auto border border-erp-panel-line">
          <div className="min-w-[1720px]">
            <GlobalHeader />
            <PageBar title="점포정보 관리" />
          </div>
        </div>
      </Section>
    </main>
  );
}
