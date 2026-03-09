import {
  createSalePayment,
  updateSalePayment,
  type PaymentMethod,
  type SaleDetail,
  type SalePayment,
} from "@gase/core";
import { useCallback, useMemo, useState } from "react";
import { toNumber } from "@/src/lib/format";
import { trackEvent } from "@/src/lib/analytics";
import type { PaymentEditorState } from "./types";

type UsePaymentEditorOptions = {
  detail: SaleDetail | null;
  onSuccess: () => Promise<void>;
};

export function usePaymentEditor({ detail, onSuccess }: UsePaymentEditorOptions) {
  const [editor, setEditor] = useState<PaymentEditorState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const amountError = useMemo(() => {
    if (!editor) return "";
    if (!editor.amount.trim()) return "Tutar zorunlu.";
    return toNumber(editor.amount) > 0 ? "" : "Odeme tutari sifirdan buyuk olmali.";
  }, [editor]);

  const open = useCallback(
    (saleId: string, payment?: SalePayment, presetAmount?: string) => {
      setError("");
      setEditor({
        saleId,
        paymentId: payment?.id,
        amount: String(payment?.amount ?? presetAmount ?? ""),
        note: payment?.note ?? "",
        paymentMethod: (payment?.paymentMethod as PaymentMethod | undefined) ?? "CASH",
        currency: ((payment?.currency as "TRY" | "USD" | "EUR" | undefined) ?? detail?.currency ?? "TRY"),
      });
    },
    [detail?.currency],
  );

  const close = useCallback(() => {
    setEditor(null);
    setError("");
  }, []);

  const submit = useCallback(async () => {
    if (!editor) return;

    if (amountError) {
      trackEvent("validation_error", { screen: "sales", action: "payment" });
      setError(amountError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (editor.paymentId) {
        await updateSalePayment(editor.saleId, editor.paymentId, {
          amount: toNumber(editor.amount),
          note: editor.note || undefined,
          paymentMethod: editor.paymentMethod,
          currency: editor.currency,
        });
      } else {
        await createSalePayment(editor.saleId, {
          amount: toNumber(editor.amount),
          note: editor.note || undefined,
          paymentMethod: editor.paymentMethod,
          currency: editor.currency,
        });
      }
      setEditor(null);
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Odeme kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  }, [editor, amountError, onSuccess]);

  return { editor, setEditor, submitting, error, setError, amountError, open, close, submit };
}
