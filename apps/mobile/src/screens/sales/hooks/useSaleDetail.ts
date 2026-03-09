import {
  getSaleById,
  getSalePayments,
  normalizeSaleDetail,
  type SaleDetail,
  type SalePayment,
} from "@gase/core";
import { useCallback, useMemo, useState } from "react";
import { toNumber } from "@/src/lib/format";

export function useSaleDetail() {
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = useCallback(async (saleId: string) => {
    setLoading(true);
    setError("");
    try {
      const [detailResponse, paymentsResponse] = await Promise.all([
        getSaleById(saleId),
        getSalePayments(saleId),
      ]);
      setDetail(normalizeSaleDetail(detailResponse));
      setPayments(paymentsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satis detayi yuklenemedi.");
      setDetail(null);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(
    async (saleId: string) => {
      await open(saleId);
    },
    [open],
  );

  const clear = useCallback(() => {
    setDetail(null);
    setPayments([]);
    setError("");
  }, []);

  const remainingAmount = useMemo(
    () => Math.max(0, toNumber(detail?.remainingAmount)),
    [detail?.remainingAmount],
  );

  return { data: detail, payments, loading, error, open, reload, clear, remainingAmount };
}
