"use client";
import { useEffect, useState } from "react";
import { getSessionUser, getSessionUserStoreIds } from "@/lib/authz";

export function useProductScope() {
  const [scopeReady, setScopeReady] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");

  useEffect(() => {
    const user = getSessionUser();
    const storeIds = getSessionUserStoreIds(user);
    setScopedStoreId(storeIds[0] ?? "");
    setScopeReady(true);
  }, []);

  return { scopeReady, scopedStoreId };
}
