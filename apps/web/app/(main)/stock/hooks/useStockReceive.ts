"use client";
import { useState } from "react";
import {
  receiveInventory,
  receiveInventoryBulk,
  type InventoryReceiveItem,
  type InventoryVariantStockItem,
  type InventoryStoreStockItem,
} from "@/lib/inventory";
import type { Currency, ProductVariant } from "@/lib/products";
import type { StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";
import type { ReceiveTarget } from "@/components/stock/ReceiveDrawer";
import type { Store } from "@/lib/stores";
import type { VariantActionParams } from "@/components/stock/StockTable";

type Options = {
  stores: Store[];
  getVariantStores: (variant: InventoryVariantStockItem) => InventoryStoreStockItem[];
  onSuccess: (message: string) => void;
  refetchList: () => Promise<void>;
  resolveVariantStores: (variantId: string, fallback: InventoryStoreStockItem[]) => Promise<InventoryStoreStockItem[]>;
  t: (key: string) => string;
};

export function useStockReceive({ resolveVariantStores, onSuccess, refetchList, t }: Options) {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveFormError, setReceiveFormError] = useState("");
  const [receiveTarget, setReceiveTarget] = useState<ReceiveTarget | null>(null);
  const [receiveVariants, setReceiveVariants] = useState<ProductVariant[]>([]);
  const [receiveInitial, setReceiveInitial] = useState<Record<string, StockEntryInitialEntry[]>>({});
  const [receiveSupplierId, setReceiveSupplierId] = useState("");
  const [receiveCurrency, setReceiveCurrency] = useState<Currency>("TRY");

  const openReceiveDrawer = async (params: VariantActionParams) => {
    setReceiveFormError("");
    setReceiveLoading(true);
    setReceiveTarget({
      productVariantId: params.productVariantId,
      productName: params.productName,
      variantName: params.variantName,
    });
    setReceiveVariants([
      {
        id: params.productVariantId,
        name: params.variantName,
        code: params.variantName,
      },
    ]);
    setReceiveSupplierId("");

    const normalizedStores = await resolveVariantStores(params.productVariantId, params.stores);
    const currency = normalizedStores[0]?.currency;
    setReceiveCurrency(
      currency === "TRY" || currency === "USD" || currency === "EUR" ? currency : "TRY",
    );
    setReceiveInitial({});
    setReceiveOpen(true);
    setReceiveLoading(false);
  };

  const closeReceiveDrawer = () => {
    if (receiveSubmitting) return;
    setReceiveOpen(false);
    setReceiveTarget(null);
    setReceiveInitial({});
    setReceiveSupplierId("");
    setReceiveFormError("");
  };

  const submitReceive = async (items: InventoryReceiveItem[]) => {
    if (!receiveTarget) return;
    if (items.length === 0) {
      setReceiveFormError(t("stock.atLeastOneStoreRow"));
      return;
    }

    setReceiveSubmitting(true);
    setReceiveFormError("");
    try {
      if (items.length === 1) {
        await receiveInventory(items[0]);
      } else {
        await receiveInventoryBulk(items);
      }
      onSuccess(t("stock.receiveSuccess"));
      closeReceiveDrawer();
      await refetchList();
    } catch {
      setReceiveFormError(t("stock.receiveError"));
    } finally {
      setReceiveSubmitting(false);
    }
  };

  return {
    receiveOpen,
    receiveLoading,
    receiveSubmitting,
    receiveFormError,
    receiveTarget,
    receiveVariants,
    receiveInitial,
    receiveSupplierId,
    setReceiveSupplierId,
    receiveCurrency,
    openReceiveDrawer,
    closeReceiveDrawer,
    submitReceive,
  };
}
