"use client";
import { useState } from "react";
import {
  transferInventory,
  type InventoryTransferPayload,
  type InventoryVariantStockItem,
  type InventoryStoreStockItem,
} from "@/lib/inventory";
import type { TransferTarget, TransferFormState } from "@/components/stock/TransferDrawer";
import type { VariantActionParams } from "@/components/stock/StockTable";

type Options = {
  getVariantStores: (variant: InventoryVariantStockItem) => InventoryStoreStockItem[];
  resolveVariantStores: (variantId: string, fallback: InventoryStoreStockItem[]) => Promise<InventoryStoreStockItem[]>;
  onSuccess: (message: string) => void;
  refetchList: () => Promise<void>;
  fetchVariantStores: (variantId: string) => Promise<void>;
  t: (key: string) => string;
};

export function useStockTransfer({
  resolveVariantStores,
  onSuccess,
  refetchList,
  fetchVariantStores,
  t,
}: Options) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFormError, setTransferFormError] = useState("");
  const [transferTarget, setTransferTarget] = useState<TransferTarget | null>(null);
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    fromStoreId: "",
    toStoreId: "",
    quantity: "",
    reason: "",
    note: "",
  });

  const openTransferDrawer = async (params: VariantActionParams) => {
    setTransferFormError("");
    setTransferLoading(true);

    const normalizedStores = await resolveVariantStores(
      params.productVariantId,
      params.stores,
    );

    setTransferTarget({
      productVariantId: params.productVariantId,
      productName: params.productName,
      variantName: params.variantName,
      stores: normalizedStores,
    });
    setTransferForm({
      fromStoreId: "",
      toStoreId: "",
      quantity: "",
      reason: "",
      note: "",
    });
    setTransferOpen(true);
    setTransferLoading(false);
  };

  const closeTransferDrawer = () => {
    if (transferSubmitting) return;
    setTransferOpen(false);
    setTransferTarget(null);
    setTransferFormError("");
  };

  const submitTransfer = async () => {
    if (!transferTarget) return;
    if (!transferForm.fromStoreId) {
      setTransferFormError(t("stock.sourceStoreRequired"));
      return;
    }
    if (!transferForm.toStoreId) {
      setTransferFormError(t("stock.targetStoreRequired"));
      return;
    }
    if (transferForm.fromStoreId === transferForm.toStoreId) {
      setTransferFormError(t("stock.sameStoreError"));
      return;
    }
    if (!transferForm.quantity || Number(transferForm.quantity) <= 0) {
      setTransferFormError(t("stock.quantityPositive"));
      return;
    }

    const qty = Number(transferForm.quantity);
    const fromStore = transferTarget.stores.find(
      (s) => s.storeId === transferForm.fromStoreId,
    );
    const available = Number(fromStore?.quantity ?? 0);
    if (qty > available) {
      setTransferFormError(t("stock.transferExceedsStock"));
      return;
    }

    const payload: InventoryTransferPayload = {
      fromStoreId: transferForm.fromStoreId,
      toStoreId: transferForm.toStoreId,
      productVariantId: transferTarget.productVariantId,
      quantity: qty,
      meta: {
        reason: transferForm.reason || undefined,
        note: transferForm.note || undefined,
      },
    };

    setTransferSubmitting(true);
    setTransferFormError("");
    try {
      await transferInventory(payload);
      onSuccess(t("stock.transferSuccess"));
      closeTransferDrawer();
      await refetchList();
      await fetchVariantStores(transferTarget.productVariantId);
    } catch {
      setTransferFormError(t("stock.transferError"));
    } finally {
      setTransferSubmitting(false);
    }
  };

  return {
    transferOpen,
    transferLoading,
    transferSubmitting,
    transferFormError,
    transferTarget,
    transferForm,
    setTransferForm,
    openTransferDrawer,
    closeTransferDrawer,
    submitTransfer,
  };
}
