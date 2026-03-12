"use client";

import { useMemo, useState } from "react";
import { useStores } from "@/hooks/useStores";
import { useSessionProfile } from "@/hooks/useSessionProfile";

export function useReportScopeState() {
  const stores = useStores();
  const { activeStoreId } = useSessionProfile();
  const [storeIds, setStoreIds] = useState<string[]>(() => (activeStoreId ? [activeStoreId] : []));

  const storeOptions = useMemo(
    () =>
      stores.map((store) => ({
        value: store.id,
        label: store.name,
      })),
    [stores],
  );

  return {
    storeIds,
    setStoreIds,
    storeOptions,
    activeStoreId,
  };
}
