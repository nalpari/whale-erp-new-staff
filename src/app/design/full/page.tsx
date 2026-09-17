import {
  DataTable,
  FilterPanel,
  GlobalHeader,
  ListTops,
  PageBar,
  Pagination,
  SAMPLE_ROWS,
} from "../units";

// Figma 01.프레임_기본(점포정보 관리 목록)을 유닛으로 조합한 임시 페이지. 동작은 없다.
export default function DesignFullPage() {
  return (
    <div className="flex min-h-[100dvh] min-w-[1720px] flex-col bg-erp-thead-bg">
      <GlobalHeader />
      <PageBar title="점포정보 관리" />
      <div className="flex flex-1 gap-[12px] p-[24px]">
        <FilterPanel className="shrink-0" />
        <main className="flex flex-1 flex-col gap-[12px] rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListTops total={100} />
          <DataTable rows={SAMPLE_ROWS} />
          <div className="pt-[14px]">
            <Pagination page={1} total={10} />
          </div>
        </main>
      </div>
    </div>
  );
}
