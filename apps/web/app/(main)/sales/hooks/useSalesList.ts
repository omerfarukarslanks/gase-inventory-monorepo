"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getSalePayments,
  getSales,
  type SaleListItem,
  type SalePayment,
} from "@/lib/sales";
import { normalizeSalesResponse } from "@/lib/sales-normalize";

type Options = {
  scopeReady: boolean;
  canTenantOnly: boolean;
  t: (key: string) => string;
};

export function useSalesList({ scopeReady, canTenantOnly, t }: Options) {
  const [salesReceipts, setSalesReceipts] = useState<SaleListItem[]>([]);
  const [salesMeta, setSalesMeta] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [salesError, setSalesError] = useState("");
  const [salesPage, setSalesPage] = useState(1);
  const [salesLimit, setSalesLimit] = useState(10);
  const [salesStoreIds, setSalesStoreIds] = useState<string[]>([]);
  const [salesIncludeLines, setSalesIncludeLines] = useState(false);
  const [showSalesAdvancedFilters, setShowSalesAdvancedFilters] = useState(false);
  const [salesReceiptNoFilter, setSalesReceiptNoFilter] = useState("");
  const [salesNameFilter, setSalesNameFilter] = useState("");
  const [salesSurnameFilter, setSalesSurnameFilter] = useState("");
  const [salesStatusFilters, setSalesStatusFilters] = useState<string[]>([]);
  const [salesPaymentStatusFilter, setSalesPaymentStatusFilter] = useState("");
  const [salesMinUnitPriceFilter, setSalesMinUnitPriceFilter] = useState("");
  const [salesMaxUnitPriceFilter, setSalesMaxUnitPriceFilter] = useState("");
  const [salesMinLineTotalFilter, setSalesMinLineTotalFilter] = useState("");
  const [salesMaxLineTotalFilter, setSalesMaxLineTotalFilter] = useState("");
  const [expandedPaymentSaleIds, setExpandedPaymentSaleIds] = useState<string[]>([]);
  const [paymentsBySaleId, setPaymentsBySaleId] = useState<Record<string, SalePayment[]>>({});
  const [paymentLoadingBySaleId, setPaymentLoadingBySaleId] = useState<Record<string, boolean>>({});
  const [paymentErrorBySaleId, setPaymentErrorBySaleId] = useState<Record<string, string>>({});

  const fetchSalesReceipts = useCallback(
    async (targetPage?: number) => {
      if (!scopeReady) return;
      setSalesLoading(true);
      setSalesError("");
      try {
        const response = await getSales({
          page: targetPage ?? salesPage,
          limit: salesLimit,
          includeLines: salesIncludeLines,
          ...(canTenantOnly ? {} : { storeIds: salesStoreIds }),
          receiptNo: salesReceiptNoFilter || undefined,
          name: salesNameFilter || undefined,
          surname: salesSurnameFilter || undefined,
          status: salesStatusFilters.length > 0 ? salesStatusFilters : undefined,
          paymentStatus: salesPaymentStatusFilter || undefined,
          minUnitPrice: salesMinUnitPriceFilter ? Number(salesMinUnitPriceFilter) : undefined,
          maxUnitPrice: salesMaxUnitPriceFilter ? Number(salesMaxUnitPriceFilter) : undefined,
          minLineTotal: salesMinLineTotalFilter ? Number(salesMinLineTotalFilter) : undefined,
          maxLineTotal: salesMaxLineTotalFilter ? Number(salesMaxLineTotalFilter) : undefined,
        });
        const normalized = normalizeSalesResponse(response);
        setSalesReceipts(normalized.data);
        setSalesMeta(normalized.meta);
      } catch {
        setSalesReceipts([]);
        setSalesMeta(null);
        setSalesError(t("sales.loadError"));
      } finally {
        setSalesLoading(false);
      }
    },
    [
      scopeReady,
      salesPage,
      salesLimit,
      salesIncludeLines,
      canTenantOnly,
      salesStoreIds,
      salesReceiptNoFilter,
      salesNameFilter,
      salesSurnameFilter,
      salesStatusFilters,
      salesPaymentStatusFilter,
      salesMinUnitPriceFilter,
      salesMaxUnitPriceFilter,
      salesMinLineTotalFilter,
      salesMaxLineTotalFilter,
      t,
    ],
  );

  useEffect(() => {
    if (!scopeReady) return;
    void fetchSalesReceipts();
  }, [fetchSalesReceipts, scopeReady]);

  const fetchSalePayments = useCallback(
    async (saleId: string, force = false) => {
      if (!saleId) return;
      if (!force && paymentLoadingBySaleId[saleId]) return;

      setPaymentLoadingBySaleId((prev) => ({ ...prev, [saleId]: true }));
      setPaymentErrorBySaleId((prev) => ({ ...prev, [saleId]: "" }));
      try {
        const payments = await getSalePayments(saleId);
        setPaymentsBySaleId((prev) => ({ ...prev, [saleId]: payments }));
      } catch {
        setPaymentErrorBySaleId((prev) => ({
          ...prev,
          [saleId]: t("sales.paymentsLoadError"),
        }));
      } finally {
        setPaymentLoadingBySaleId((prev) => ({ ...prev, [saleId]: false }));
      }
    },
    [paymentLoadingBySaleId, t],
  );

  const togglePaymentsCollapse = (saleId: string) => {
    const isExpanded = expandedPaymentSaleIds.includes(saleId);
    if (isExpanded) {
      setExpandedPaymentSaleIds((prev) => prev.filter((id) => id !== saleId));
      return;
    }

    setExpandedPaymentSaleIds((prev) => [...prev, saleId]);
    void fetchSalePayments(saleId, !paymentsBySaleId[saleId]);
  };

  return {
    salesReceipts,
    salesMeta,
    salesLoading,
    salesError,
    salesPage,
    setSalesPage,
    salesLimit,
    setSalesLimit,
    salesStoreIds,
    setSalesStoreIds,
    salesIncludeLines,
    setSalesIncludeLines,
    showSalesAdvancedFilters,
    setShowSalesAdvancedFilters,
    salesReceiptNoFilter,
    setSalesReceiptNoFilter,
    salesNameFilter,
    setSalesNameFilter,
    salesSurnameFilter,
    setSalesSurnameFilter,
    salesStatusFilters,
    setSalesStatusFilters,
    salesPaymentStatusFilter,
    setSalesPaymentStatusFilter,
    salesMinUnitPriceFilter,
    setSalesMinUnitPriceFilter,
    salesMaxUnitPriceFilter,
    setSalesMaxUnitPriceFilter,
    salesMinLineTotalFilter,
    setSalesMinLineTotalFilter,
    salesMaxLineTotalFilter,
    setSalesMaxLineTotalFilter,
    expandedPaymentSaleIds,
    paymentsBySaleId,
    paymentLoadingBySaleId,
    paymentErrorBySaleId,
    fetchSalePayments,
    togglePaymentsCollapse,
    refetch: fetchSalesReceipts,
  };
}
