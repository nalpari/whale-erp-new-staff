import {
  Button,
  DataTable,
  GlobalHeader,
  ListToolbar,
  PageBar,
  Pagination,
  Select,
  StoreSelect,
  UserPop,
} from "@/components/common";
import { MENUS, STORE_COLUMNS, STORE_ROWS, STORES, USER_ITEMS } from "../sample";
import { StoreFilter } from "../store-filter";

// Figma 01.프레임_기본(점포정보 관리 목록)을 공통 컴포넌트로 조합한 임시 페이지.
export default function DesignFullPage() {
  return (
    <div className="flex min-h-[100dvh] min-w-[1720px] flex-col bg-erp-thead-bg">
      <GlobalHeader
        menus={MENUS}
        right={
          <>
            <StoreSelect options={STORES} />
            <UserPop name="김지영 (admin)" items={USER_ITEMS} />
          </>
        }
      />
      <PageBar title="점포정보 관리" />
      <div className="flex flex-1 gap-[12px] p-[24px]">
        <StoreFilter />
        <main className="flex flex-1 flex-col gap-[12px] rounded-[4px] border border-erp-panel-line bg-white p-[25px]">
          <ListToolbar total={100}>
            <Button>신규 등록</Button>
            {/* 입력칸은 폭을 채우므로, 폭은 감싸는 요소로 정한다. */}
            <div className="w-[80px] shrink-0">
              <Select aria-label="페이지당 건수" defaultValue="50">
                <option>20</option>
                <option>50</option>
                <option>100</option>
              </Select>
            </div>
          </ListToolbar>
          <DataTable columns={STORE_COLUMNS} rows={STORE_ROWS} rowKey={(r) => r.no} />
          <div className="pt-[14px]">
            <Pagination page={1} total={10} />
          </div>
        </main>
      </div>
    </div>
  );
}
