import Image from "next/image";
import { Badge } from "@/components/common";

// 「검토 중」 — 보낸 뒤 확정을 취소해 관리자가 고치는 중인 명세서(api correcting, 2026-10-21 사용자 결정).
// 연필 아이콘은 출퇴근 「수정된 기록」과 같은 그림이다. 금액은 다시 받을 때까지 보이지 않는다.
export function CorrectingBadge() {
  return (
    <Badge tone="waiting">
      <span className="inline-flex items-center gap-[4px]">
        <Image src="/icons/pencil.svg" alt="" width={11.719} height={13.719} />
        검토 중
      </span>
    </Badge>
  );
}
