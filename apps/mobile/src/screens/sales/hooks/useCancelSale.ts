import { cancelSale, type SaleDetail } from "@gase/core";
import { useCallback, useState } from "react";

type UseCancelSaleOptions = {
  detail: SaleDetail | null;
  onSuccess: () => Promise<void>;
};

export function useCancelSale({ detail, onSuccess }: UseCancelSaleOptions) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");

  const openModal = useCallback(() => {
    setError("");
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setError("");
  }, []);

  const submit = useCallback(async () => {
    if (!detail) return;

    setSubmitting(true);
    setError("");
    try {
      await cancelSale(detail.id, {
        reason: reason || undefined,
        note: note || undefined,
      });
      setOpen(false);
      setError("");
      setReason("");
      setNote("");
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satis iptal edilemedi.");
    } finally {
      setSubmitting(false);
    }
  }, [detail, reason, note, onSuccess]);

  return { open, submitting, error, setError, reason, setReason, note, setNote, openModal, close, submit };
}
