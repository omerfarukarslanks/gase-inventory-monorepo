"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { getReportLowStock, type LowStockItem } from "@/lib/reports";

export type VariantLowStockMeta = {
  productName?: string;
  variantName?: string;
  storeName?: string;
  quantity?: number;
};

export function useLowStockVariantMap(activeStoreId: string) {
  const [items, setItems] = useState<LowStockItem[]>([]);

  const loadLowStock = useEffectEvent(async (storeId: string, isCancelled: () => boolean) => {
    try {
      const response = await getReportLowStock({ storeIds: [storeId], limit: 100 });
      if (!isCancelled()) {
        setItems(response.data ?? []);
      }
    } catch {
      if (!isCancelled()) {
        setItems([]);
      }
    }
  });

  useEffect(() => {
    let cancelled = false;

    if (!activeStoreId) return;

    void loadLowStock(activeStoreId, () => cancelled);

    return () => {
      cancelled = true;
    };
  }, [activeStoreId]);

  const visibleItems = useMemo(
    () => (activeStoreId ? items : []),
    [activeStoreId, items],
  );

  const metaByVariantId = useMemo(() => {
    const next: Record<string, VariantLowStockMeta> = {};
    visibleItems.forEach((item) => {
      if (!item.productVariantId) return;
      next[item.productVariantId] = {
        productName: item.productName,
        variantName: item.variantName,
        storeName: item.storeName,
        quantity: item.quantity,
      };
    });
    return next;
  }, [visibleItems]);

  return { lowStockItems: visibleItems, metaByVariantId };
}
