"use client";
import { useState } from "react";
import {
  createSaleReturn,
  getSaleById,
  type SaleListItem,
  type SaleDetailLine,
  type CreateSaleReturnLine,
} from "@/lib/sales";
import { normalizeSaleDetail } from "@/lib/sales-normalize";
import type { ReturnLineForm } from "@/components/sales/types";

type Options = {
  onRefreshList: () => Promise<void>;
  onSuccess: (message: string) => void;
};

export function useSaleReturn({ onRefreshList, onSuccess }: Options) {
  const [returnDrawerOpen, setReturnDrawerOpen] = useState(false);
  const [returnTargetSale, setReturnTargetSale] = useState<SaleListItem | null>(null);
  const [returnLines, setReturnLines] = useState<ReturnLineForm[]>([]);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnFormError, setReturnFormError] = useState("");
  const [returnDetailLoading, setReturnDetailLoading] = useState(false);

  const openReturnDrawer = async (sale: SaleListItem) => {
    setReturnTargetSale(sale);
    setReturnNotes("");
    setReturnFormError("");
    setReturnLines([]);
    setReturnDrawerOpen(true);
    setReturnDetailLoading(true);
    try {
      const response = await getSaleById(sale.id);
      const detail = normalizeSaleDetail(response);
      if (!detail) {
        setReturnFormError("Satis detayi alinamadi.");
        return;
      }
      setReturnLines(
        detail.lines.map((line: SaleDetailLine) => {
          const variants = line.variantPool ?? line.packageItems ?? [];
          return {
            saleLineId: line.id,
            lineName:
              line.productVariantName ??
              line.productPackageName ??
              line.productName ??
              line.id,
            originalQuantity: line.originalQuantity ?? line.quantity ?? 0,
            returnedQuantity: line.returnedQuantity ?? 0,
            completePackagesRemaining: line.completePackagesRemaining ?? null,
            partialPackage: line.partialPackage ?? null,
            isPackageLine: Boolean(line.productPackageId),
            returnMode: "quantity" as const,
            returnQuantity: "",
            packageVariantReturns: variants.map((item) => ({
              productVariantId: item.productVariantId,
              name: item.productVariantName ?? item.productVariantId,
              qtyPerPackage: item.qtyPerPackage,
              remaining: (item as { remaining?: number | null }).remaining ?? null,
              returnQuantity: "",
            })),
            refundAmount: "",
          };
        }),
      );
    } catch {
      setReturnFormError("Satis satirlari yuklenemedi.");
    } finally {
      setReturnDetailLoading(false);
    }
  };

  const closeReturnDrawer = () => {
    if (returnSubmitting) return;
    setReturnDrawerOpen(false);
    setReturnTargetSale(null);
    setReturnLines([]);
    setReturnFormError("");
  };

  const submitReturn = async () => {
    if (!returnTargetSale) return;

    const activeLines = returnLines.filter((l) => {
      if (l.returnMode === "variants") {
        return l.packageVariantReturns.some((pv) => Number(pv.returnQuantity) > 0);
      }
      return l.returnQuantity !== "" && Number(l.returnQuantity) > 0;
    });

    if (activeLines.length === 0) {
      setReturnFormError("En az bir satir icin iade adedi girin.");
      return;
    }

    const invalidLine = activeLines.some((l) => {
      if (l.returnMode === "variants") {
        return l.packageVariantReturns.some((pv) => {
          if (pv.returnQuantity === "" || Number(pv.returnQuantity) === 0) return false;
          const qty = Number(pv.returnQuantity);
          if (!Number.isFinite(qty) || qty < 0) return true;
          if (pv.remaining != null && qty > pv.remaining) return true;
          return false;
        });
      }
      const qty = Number(l.returnQuantity);
      const maxQty = l.isPackageLine
        ? (l.completePackagesRemaining ?? l.originalQuantity)
        : l.originalQuantity;
      return !Number.isFinite(qty) || qty <= 0 || qty > maxQty;
    });

    if (invalidLine) {
      setReturnFormError("Iade adedi gecersiz. Lutfen kontrol edin.");
      return;
    }

    setReturnSubmitting(true);
    setReturnFormError("");
    try {
      const lines: CreateSaleReturnLine[] = activeLines.map((l) => {
        const refund =
          l.refundAmount !== "" && Number(l.refundAmount) >= 0
            ? { refundAmount: Number(l.refundAmount) }
            : {};
        if (l.returnMode === "variants") {
          return {
            saleLineId: l.saleLineId,
            packageVariantReturns: l.packageVariantReturns
              .filter((pv) => Number(pv.returnQuantity) > 0)
              .map((pv) => ({ productVariantId: pv.productVariantId, quantity: Number(pv.returnQuantity) })),
            ...refund,
          };
        }
        return {
          saleLineId: l.saleLineId,
          quantity: Number(l.returnQuantity),
          ...refund,
        };
      });
      await createSaleReturn(returnTargetSale.id, {
        lines,
        notes: returnNotes.trim() || undefined,
      });
      onSuccess("Iade olusturuldu.");
      setReturnDrawerOpen(false);
      setReturnTargetSale(null);
      setReturnLines([]);
      await onRefreshList();
    } catch {
      setReturnFormError("Iade olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  return {
    returnDrawerOpen,
    returnTargetSale,
    returnLines,
    setReturnLines,
    returnNotes,
    setReturnNotes,
    returnSubmitting,
    returnFormError,
    setReturnFormError,
    returnDetailLoading,
    openReturnDrawer,
    closeReturnDrawer,
    submitReturn,
  };
}
