"use client";
import { useState } from "react";
import { getSaleById, type SaleDetail } from "@/lib/sales";
import { normalizeSaleDetail } from "@/lib/sales-normalize";

export function useSaleDetail() {
  const [saleDetailOpen, setSaleDetailOpen] = useState(false);
  const [saleDetailLoading, setSaleDetailLoading] = useState(false);
  const [saleDetailError, setSaleDetailError] = useState("");
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);

  const openSaleDetailDialog = async (saleId: string) => {
    setSaleDetailOpen(true);
    setSaleDetailLoading(true);
    setSaleDetailError("");
    try {
      const response = await getSaleById(saleId);
      const normalized = normalizeSaleDetail(response);
      if (!normalized) {
        setSaleDetail(null);
        setSaleDetailError("Satis fis detayi alinamadi.");
        return;
      }
      setSaleDetail(normalized);
    } catch {
      setSaleDetail(null);
      setSaleDetailError("Satis fis detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setSaleDetailLoading(false);
    }
  };

  const closeSaleDetailDialog = () => {
    setSaleDetailOpen(false);
    setSaleDetailError("");
    setSaleDetail(null);
  };

  return {
    saleDetailOpen,
    saleDetailLoading,
    saleDetailError,
    saleDetail,
    openSaleDetailDialog,
    closeSaleDetailDialog,
  };
}
