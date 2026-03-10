"use client";
import { useState } from "react";
import { cancelSale, type SaleListItem } from "@/lib/sales";

type Options = {
  onRefreshList: () => Promise<void>;
  onSuccess: (message: string) => void;
};

export function useSaleCancel({ onRefreshList, onSuccess }: Options) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetSale, setCancelTargetSale] = useState<SaleListItem | null>(null);
  const [cancellingSale, setCancellingSale] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  const openCancelDialog = (sale: SaleListItem) => {
    setCancelTargetSale(sale);
    setCancelReason("");
    setCancelNote("");
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    if (cancellingSale) return;
    setCancelDialogOpen(false);
    setCancelTargetSale(null);
  };

  const confirmCancelSale = async () => {
    if (!cancelTargetSale) return;
    setCancellingSale(true);
    try {
      await cancelSale(cancelTargetSale.id, {
        reason: cancelReason.trim() || undefined,
        note: cancelNote.trim() || undefined,
      });
      onSuccess("Satis fisi iptal edildi.");
      setCancelDialogOpen(false);
      setCancelTargetSale(null);
      await onRefreshList();
    } catch {
      // sessizce gec
    } finally {
      setCancellingSale(false);
    }
  };

  return {
    cancelDialogOpen,
    cancelTargetSale,
    cancellingSale,
    cancelReason,
    setCancelReason,
    cancelNote,
    setCancelNote,
    openCancelDialog,
    closeCancelDialog,
    confirmCancelSale,
  };
}
