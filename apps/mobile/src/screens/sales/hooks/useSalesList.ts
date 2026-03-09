import { getSales, normalizeSalesResponse, type SaleListItem } from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import type { SaleStatusFilter } from "./types";

type UseSalesListOptions = {
  isActive?: boolean;
  storeIds: string[];
};

export function useSalesList({ isActive, storeIds }: UseSalesListOptions) {
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatusFilter>("all");

  const debouncedReceipt = useDebouncedValue(receiptNo, 350);
  const debouncedCustomer = useDebouncedValue(customerName, 350);

  const scopedStoreIds = useMemo(() => (storeIds.length ? storeIds : undefined), [storeIds]);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSales({
        storeIds: scopedStoreIds,
        page: 1,
        limit: 50,
        receiptNo: debouncedReceipt || undefined,
        name: debouncedCustomer || undefined,
        status: statusFilter === "all" ? undefined : [statusFilter],
      });
      setSales(normalizeSalesResponse(response).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satislar yuklenemedi.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedCustomer, debouncedReceipt, scopedStoreIds, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void refetch();
  }, [refetch, isActive]);

  const clearFilters = useCallback(() => {
    setReceiptNo("");
    setCustomerName("");
    setStatusFilter("all");
  }, []);

  return {
    sales,
    loading,
    error,
    receiptNo,
    setReceiptNo,
    customerName,
    setCustomerName,
    statusFilter,
    setStatusFilter,
    refetch,
    clearFilters,
  };
}
