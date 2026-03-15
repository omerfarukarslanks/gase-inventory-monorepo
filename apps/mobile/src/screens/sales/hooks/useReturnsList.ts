import { getSales, normalizeSalesResponse, type SaleListItem } from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

type UseReturnsListOptions = {
  isActive?: boolean;
  storeIds: string[];
};

export function useReturnsList({ isActive, storeIds }: UseReturnsListOptions) {
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  const debouncedCustomer = useDebouncedValue(customerName, 350);
  const debouncedReceipt = useDebouncedValue(receiptNo, 350);

  const scopedStoreIds = storeIds.length ? storeIds : undefined;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSales({
        storeIds: scopedStoreIds,
        page: 1,
        limit: 50,
        name: debouncedCustomer || undefined,
        receiptNo: debouncedReceipt || undefined,
        status: ["RETURNED"],
      });
      setSales(normalizeSalesResponse(response).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Iadeler yuklenemedi.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedCustomer, debouncedReceipt, scopedStoreIds]);

  useEffect(() => {
    if (!isActive) return;
    void refetch();
  }, [refetch, isActive]);

  return {
    sales,
    loading,
    error,
    customerName,
    setCustomerName,
    receiptNo,
    setReceiptNo,
    refetch,
  };
}
