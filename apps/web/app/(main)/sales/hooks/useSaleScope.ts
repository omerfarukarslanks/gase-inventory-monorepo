"use client";
import { useEffect, useState } from "react";
import { getSessionUser, getSessionUserStoreIds, getSessionUserStoreType } from "@/lib/authz";

export function useSaleScope() {
  const [scopeReady, setScopeReady] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");
  const [isWholesaleStoreType, setIsWholesaleStoreType] = useState(false);

  useEffect(() => {
    const user = getSessionUser();
    const storeType = getSessionUserStoreType(user);
    const storeIds = getSessionUserStoreIds(user);
    setIsWholesaleStoreType(storeType === "WHOLESALE");
    setScopedStoreId(storeIds[0] ?? "");
    setScopeReady(true);
  }, []);

  return { scopeReady, scopedStoreId, isWholesaleStoreType };
}
