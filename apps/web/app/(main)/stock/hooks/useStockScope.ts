"use client";
import { useEffect, useState } from "react";
import { getSessionUser, getSessionUserStoreIds } from "@/lib/authz";

export function useStockScope() {
  const [scopeReady, setScopeReady] = useState(false);
  const [isStoreScopedUser, setIsStoreScopedUser] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");

  useEffect(() => {
    const user = getSessionUser();
    const storeIds = getSessionUserStoreIds(user);
    setIsStoreScopedUser(false);
    setScopedStoreId(storeIds[0] ?? "");
    setScopeReady(true);
  }, []);

  return { scopeReady, isStoreScopedUser, scopedStoreId };
}
