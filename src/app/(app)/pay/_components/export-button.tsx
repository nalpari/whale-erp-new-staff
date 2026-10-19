"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/common";

const TOAST_MS = 2_000;

// PAY-2 명세서 내보내기(상세에서만). PDF 는 아직 없고 데모처럼 알림만 2초 보인다.
// 알림 칸(role=status)은 늘 두고 글자만 바꿔 화면 읽기 프로그램이 바뀐 글자를 읽게 한다.
export function ExportButton() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <>
      <Button variant="outline" onClick={() => setMessage("처리 완료본 PDF 를 공유합니다")}>
        명세서 내보내기
      </Button>
      <p
        role="status"
        className={`fixed bottom-[120px] left-1/2 z-40 -translate-x-1/2 rounded-[12px] bg-staff-navy/90 px-[16px] py-[10px] text-[13px] font-semibold whitespace-nowrap text-white ${message ? "" : "invisible"}`}
      >
        {message}
      </p>
    </>
  );
}
