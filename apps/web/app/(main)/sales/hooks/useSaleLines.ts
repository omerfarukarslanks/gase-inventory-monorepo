"use client";
import { useState } from "react";
import {
  addSaleLine,
  getSaleById,
  removeSaleLine,
  updateSaleLine,
  type PatchSaleLinePayload,
  type AddSaleLinePayload,
  type SaleDetailLine,
  type SaleListItem,
} from "@/lib/sales";
import { normalizeSaleDetail } from "@/lib/sales-normalize";
import { createLineRow, type ManagedLineEditForm } from "@/components/sales/types";
import type { Currency } from "@/lib/products";
import { toNumberOrNull } from "@/lib/format";

type Options = {
  isWholesaleStoreType: boolean;
  variantOptions: Array<{ value: string; label: string; secondaryLabel?: string }>;
  onRefreshList: () => Promise<void>;
};

export function useSaleLines({ isWholesaleStoreType, onRefreshList }: Options) {
  const [linesDrawerOpen, setLinesDrawerOpen] = useState(false);
  const [linesDrawerSale, setLinesDrawerSale] = useState<SaleListItem | null>(null);
  const [managedLines, setManagedLines] = useState<SaleDetailLine[]>([]);
  const [linesDrawerLoading, setLinesDrawerLoading] = useState(false);
  const [linesDrawerError, setLinesDrawerError] = useState("");
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editLineForm, setEditLineForm] = useState<ManagedLineEditForm>({
    quantity: "",
    unitPrice: "",
    currency: "TRY",
    discountMode: "percent",
    discountPercent: "",
    discountAmount: "",
    taxMode: "percent",
    taxPercent: "",
    taxAmount: "",
    campaignCode: "",
  });
  const [lineOpSubmitting, setLineOpSubmitting] = useState(false);
  const [lineOpError, setLineOpError] = useState("");
  const [deleteLineTarget, setDeleteLineTarget] = useState<string | null>(null);
  const [deleteLineDialogOpen, setDeleteLineDialogOpen] = useState(false);
  const [deletingLine, setDeletingLine] = useState(false);
  const [addLineExpanded, setAddLineExpanded] = useState(false);
  const [addLineForm, setAddLineForm] = useState<ReturnType<typeof createLineRow>>(() => createLineRow());

  const refreshManagedLines = async (saleId: string) => {
    const response = await getSaleById(saleId);
    const detail = normalizeSaleDetail(response);
    setManagedLines(detail?.lines ?? []);
  };

  const openManageLinesDrawer = async (sale: SaleListItem) => {
    setLinesDrawerSale(sale);
    setManagedLines([]);
    setLinesDrawerError("");
    setEditingLineId(null);
    setLineOpError("");
    setAddLineExpanded(false);
    setAddLineForm(createLineRow());
    setLinesDrawerOpen(true);
    setLinesDrawerLoading(true);
    try {
      await refreshManagedLines(sale.id);
    } catch {
      setLinesDrawerError("Satirlar yuklenemedi.");
    } finally {
      setLinesDrawerLoading(false);
    }
  };

  const closeManageLinesDrawer = () => {
    if (lineOpSubmitting || deletingLine) return;
    setLinesDrawerOpen(false);
    setLinesDrawerSale(null);
    setManagedLines([]);
    setEditingLineId(null);
    setLineOpError("");
    setAddLineExpanded(false);
  };

  const startEditLine = (line: SaleDetailLine) => {
    setEditingLineId(line.id);
    setLineOpError("");
    setEditLineForm({
      quantity: line.quantity != null ? String(line.quantity) : "",
      unitPrice: line.unitPrice != null ? String(line.unitPrice) : "",
      currency: (line.currency as Currency) ?? "TRY",
      discountMode: line.discountAmount != null ? "amount" : "percent",
      discountPercent: line.discountPercent != null ? String(line.discountPercent) : "",
      discountAmount: line.discountAmount != null ? String(line.discountAmount) : "",
      taxMode: line.taxAmount != null ? "amount" : "percent",
      taxPercent: line.taxPercent != null ? String(line.taxPercent) : "",
      taxAmount: line.taxAmount != null ? String(line.taxAmount) : "",
      campaignCode: line.campaignCode ?? "",
    });
  };

  const cancelEditLine = () => {
    setEditingLineId(null);
    setLineOpError("");
  };

  const submitEditLine = async (lineId: string) => {
    if (!linesDrawerSale) return;
    const qty = toNumberOrNull(editLineForm.quantity);
    const unitPrice = toNumberOrNull(editLineForm.unitPrice);
    if (qty == null || qty <= 0) { setLineOpError("Gecerli bir adet girin."); return; }
    if (unitPrice == null || unitPrice < 0) { setLineOpError("Gecerli bir birim fiyat girin."); return; }

    const payload: PatchSaleLinePayload = {
      quantity: qty,
      unitPrice,
      currency: editLineForm.currency as Currency,
      ...(editLineForm.discountMode === "percent" && editLineForm.discountPercent
        ? { discountPercent: Number(editLineForm.discountPercent) } : {}),
      ...(editLineForm.discountMode === "amount" && editLineForm.discountAmount
        ? { discountAmount: Number(editLineForm.discountAmount) } : {}),
      ...(editLineForm.taxMode === "percent" && editLineForm.taxPercent
        ? { taxPercent: Number(editLineForm.taxPercent) } : {}),
      ...(editLineForm.taxMode === "amount" && editLineForm.taxAmount
        ? { taxAmount: Number(editLineForm.taxAmount) } : {}),
      ...(editLineForm.campaignCode.trim() ? { campaignCode: editLineForm.campaignCode.trim() } : {}),
    };

    setLineOpSubmitting(true);
    setLineOpError("");
    try {
      await updateSaleLine(linesDrawerSale.id, lineId, payload);
      setEditingLineId(null);
      await refreshManagedLines(linesDrawerSale.id);
      await onRefreshList();
    } catch {
      setLineOpError("Satir guncellenemedi.");
    } finally {
      setLineOpSubmitting(false);
    }
  };

  const requestDeleteLine = (lineId: string) => {
    setDeleteLineTarget(lineId);
    setDeleteLineDialogOpen(true);
  };

  const confirmDeleteLine = async () => {
    if (!linesDrawerSale || !deleteLineTarget) return;
    setDeletingLine(true);
    try {
      await removeSaleLine(linesDrawerSale.id, deleteLineTarget);
      setDeleteLineDialogOpen(false);
      setDeleteLineTarget(null);
      await refreshManagedLines(linesDrawerSale.id);
      await onRefreshList();
    } catch {
      setLineOpError("Satir silinemedi.");
      setDeleteLineDialogOpen(false);
    } finally {
      setDeletingLine(false);
    }
  };

  const submitAddLine = async () => {
    if (!linesDrawerSale) return;
    const qty = toNumberOrNull(addLineForm.quantity);
    const unitPrice = toNumberOrNull(addLineForm.unitPrice);
    if (!addLineForm.productVariantId) { setLineOpError("Urun/varyant secin."); return; }
    if (qty == null || qty <= 0) { setLineOpError("Gecerli bir adet girin."); return; }
    if (unitPrice == null || unitPrice < 0) { setLineOpError("Gecerli bir birim fiyat girin."); return; }

    const common = {
      quantity: qty,
      currency: addLineForm.currency,
      unitPrice,
      ...(addLineForm.discountMode === "percent" && addLineForm.discountPercent
        ? { discountPercent: Number(addLineForm.discountPercent) } : {}),
      ...(addLineForm.discountMode === "amount" && addLineForm.discountAmount
        ? { discountAmount: Number(addLineForm.discountAmount) } : {}),
      ...(addLineForm.taxMode === "percent" && addLineForm.taxPercent
        ? { taxPercent: Number(addLineForm.taxPercent) } : {}),
      ...(addLineForm.taxMode === "amount" && addLineForm.taxAmount
        ? { taxAmount: Number(addLineForm.taxAmount) } : {}),
      ...(addLineForm.campaignCode.trim() ? { campaignCode: addLineForm.campaignCode.trim() } : {}),
    };

    const payload: AddSaleLinePayload = isWholesaleStoreType
      ? { productPackageId: addLineForm.productVariantId, ...common }
      : { productVariantId: addLineForm.productVariantId, ...common };

    setLineOpSubmitting(true);
    setLineOpError("");
    try {
      await addSaleLine(linesDrawerSale.id, payload);
      setAddLineExpanded(false);
      setAddLineForm(createLineRow());
      await refreshManagedLines(linesDrawerSale.id);
      await onRefreshList();
    } catch {
      setLineOpError("Satir eklenemedi.");
    } finally {
      setLineOpSubmitting(false);
    }
  };

  return {
    linesDrawerOpen,
    linesDrawerSale,
    managedLines,
    linesDrawerLoading,
    linesDrawerError,
    editingLineId,
    editLineForm,
    setEditLineForm,
    lineOpSubmitting,
    lineOpError,
    setLineOpError,
    deleteLineTarget,
    setDeleteLineTarget,
    deleteLineDialogOpen,
    setDeleteLineDialogOpen,
    deletingLine,
    addLineExpanded,
    setAddLineExpanded,
    addLineForm,
    setAddLineForm,
    refreshManagedLines,
    openManageLinesDrawer,
    closeManageLinesDrawer,
    startEditLine,
    cancelEditLine,
    submitEditLine,
    requestDeleteLine,
    confirmDeleteLine,
    submitAddLine,
  };
}
