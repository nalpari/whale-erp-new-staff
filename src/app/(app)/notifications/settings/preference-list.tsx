"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Alert, SwitchRow } from "@/components/common";
import { PREFERENCE_ITEMS, type PreferenceCategory } from "@/lib/notifications";
import type { Schemas } from "@/lib/api";
import { setPreferenceAction } from "../actions";

type Preference = Schemas["MyNotificationPreferenceDto"];

// 네 묶음의 스위치. 누르면 바로 바뀐 것으로 보이고(낙관), 저장에 실패하면 이전 값으로 돌아가며 문구를 띄운다(#268 「저장에 실패하면
// 이전 설정을 그대로 둔다」). 목록은 데모 /design/notification-settings 와 같은 모양이다.
export function PreferenceList({ items }: { items: Preference[] }) {
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(items, (state, change: Preference) =>
    state.map((p) => (p.category === change.category ? change : p)),
  );
  const enabledOf = (category: PreferenceCategory) => shown.find((p) => p.category === category)?.isEnabled ?? true;

  const handleChange = (category: PreferenceCategory, isEnabled: boolean) =>
    startTransition(async () => {
      setError(undefined);
      setShown({ category, isEnabled });
      setError((await setPreferenceAction(category, isEnabled)).error);
    });

  return (
    <>
      {error && <Alert tone="warning">{error}</Alert>}
      <ul className="divide-y divide-[#e8edf3] rounded-[16px] border border-staff-border-light bg-white px-[16px]">
        {PREFERENCE_ITEMS.map((item) => (
          <SwitchRow
            key={item.category}
            title={item.title}
            description={item.description}
            checked={enabledOf(item.category)}
            onChange={(checked) => handleChange(item.category, checked)}
          />
        ))}
      </ul>
    </>
  );
}
