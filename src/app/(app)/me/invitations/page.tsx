import type { Metadata } from "next";
import { AddCodeForm } from "./add-code-form";

export const metadata: Metadata = { title: "근무지 추가 · Whale ERP" };

// 로그인 뒤 초대 코드로 근무지 추가(WHALEERP-604, api 603). 들어오는 곳은 내 정보 - 소속 근무지의 「초대 코드로 근무지 추가」
// 하나다(2026-10-28 김민식). 로그인하지 않고 초대 코드를 넣어 「이미 계정이 있습니다」가 나오면 로그인한 뒤 여기로 온다.
export default function AddWorkplacePage() {
  return <AddCodeForm />;
}
