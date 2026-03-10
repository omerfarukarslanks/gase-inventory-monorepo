"use client";
import { useState } from "react";
import {
  adjustInventory,
  type InventoryAdjustItem,
  type InventoryAdjustSinglePayload,
  type InventoryReceiveItem,
  type InventoryVariantStockItem,
  type InventoryStoreStockItem,
} from "@/lib/inventory";
import type { StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";
import type { AdjustTarget } from "@/components/stock/AdjustDrawer";
import type { VariantActionParams } from "@/components/stock/StockTable";

type Options = {
  getVariantStores: (variant: InventoryVariantStockItem) => InventoryStoreStockItem[];
  resolveVariantStores: (variantId: string, fallback: InventoryStoreStockItem[]) => Promise<InventoryStoreStockItem[]>;
  isStoreScopedUser: boolean;
  onSuccess: (message: string) => void;
  refetchList: () => Promise<void>;
  fetchVariantStores: (variantId: string) => Promise<void>;
  t: (key: string) => string;
};

export function useStockAdjust({
  resolveVariantStores,
  isStoreScopedUser,
  onSuccess,
  refetchList,
  fetchVariantStores,
  t,
}: Options) {
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustFormError, setAdjustFormError] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null);
  const [adjustInitial, setAdjustInitial] = useState<Record<string, StockEntryInitialEntry[]>>({});
  const [adjustApplyToAllStores, setAdjustApplyToAllStores] = useState(false);

  const openAdjustDrawer = async (params: VariantActionParams) => {
    setAdjustFormError("");
    setAdjustLoading(true);
    setAdjustTarget({
      productVariantId: params.productVariantId,
      productName: params.productName,
      variantName: params.variantName,
    });

    const normalizedStores = await resolveVariantStores(
      params.productVariantId,
      params.stores,
    );

    setAdjustInitial({
      [params.productVariantId]: normalizedStores.map((store) => ({
        storeId: store.storeId,
        quantity: store.quantity,
        unitPrice: store.salePrice ?? 0,
        currency:
          store.currency === "TRY" || store.currency === "USD" || store.currency === "EUR"
            ? store.currency
            : "TRY",
        taxMode: "percent",
        taxPercent: store.taxPercent ?? undefined,
        discountMode: "percent",
        discountPercent: store.discountPercent ?? undefined,
      })),
    });

    setAdjustOpen(true);
    setAdjustLoading(false);
  };

  const closeAdjustDrawer = () => {
    if (adjustSubmitting) return;
    setAdjustOpen(false);
    setAdjustTarget(null);
    setAdjustInitial({});
    setAdjustApplyToAllStores(false);
    setAdjustFormError("");
  };

  const submitAdjust = async (items: InventoryReceiveItem[]) => {
    if (!adjustTarget) return;

    if (items.length === 0) {
      setAdjustFormError(t("stock.atLeastOneStoreRow"));
      return;
    }

    const usedStoreIds = new Set<string>();
    for (const item of items) {
      if (usedStoreIds.has(item.storeId)) {
        setAdjustFormError(t("stock.sameStoreTwice"));
        return;
      }
      usedStoreIds.add(item.storeId);
    }

    setAdjustSubmitting(true);
    setAdjustFormError("");
    try {
      const adjustItems: InventoryAdjustItem[] = items.map((item) => ({
        storeId: item.storeId,
        productVariantId: item.productVariantId ?? "",
        newQuantity: item.quantity,
        meta: item.meta ? { reason: item.meta.reason, note: item.meta.note } : {},
      }));

      if (isStoreScopedUser) {
        const scopedPayload: InventoryAdjustSinglePayload = {
          productVariantId: adjustTarget.productVariantId,
          newQuantity: adjustItems[0]?.newQuantity ?? 0,
          meta: adjustItems[0]?.meta ?? {},
        };
        await adjustInventory(scopedPayload);
      } else if (adjustApplyToAllStores) {
        const applyAllPayload: InventoryAdjustSinglePayload = {
          productVariantId: adjustTarget.productVariantId,
          newQuantity: adjustItems[0]?.newQuantity ?? 0,
          applyToAllStores: true,
          meta: adjustItems[0]?.meta ?? {},
        };
        await adjustInventory(applyAllPayload);
      } else if (adjustItems.length > 1) {
        await adjustInventory({ items: adjustItems });
      } else {
        await adjustInventory(adjustItems[0]);
      }
      onSuccess(t("stock.adjustSuccess"));
      closeAdjustDrawer();
      await refetchList();
      await fetchVariantStores(adjustTarget.productVariantId);
    } catch {
      setAdjustFormError(t("stock.adjustError"));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return {
    adjustOpen,
    adjustLoading,
    adjustSubmitting,
    adjustFormError,
    adjustTarget,
    adjustInitial,
    adjustApplyToAllStores,
    setAdjustApplyToAllStores,
    openAdjustDrawer,
    closeAdjustDrawer,
    submitAdjust,
  };
}
