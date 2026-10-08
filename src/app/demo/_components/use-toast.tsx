"use client";

import { useEffect, useState } from "react";

// 목업의 data-toast. 짙은 남색 알약(radius 12 · 13px semibold · 흰 글자)이 화면 아래 120px 위에 떠서 2초 뒤 사라진다.
// const [toast, setToast] = useToast() 로 받아, 화면을 옮겨도 남도록 PageSlide 밖에 {toast} 를 둔다.
export function useToast() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [message]);
  const toast = message && (
    <p
      role="status"
      className="fixed bottom-[120px] left-1/2 z-40 -translate-x-1/2 rounded-[12px] bg-staff-navy/90 px-[16px] py-[10px] text-[13px] font-semibold whitespace-nowrap text-white"
    >
      {message}
    </p>
  );
  return [toast, setMessage] as const;
}
