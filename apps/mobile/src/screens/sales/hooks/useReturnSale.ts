import { createSaleReturn, type SaleDetail } from "@gase/core";
import { useCallback, useMemo, useState } from "react";
import { formatCount, toNullableNumber } from "@/src/lib/format";
import { trackEvent } from "@/src/lib/analytics";
import type { ReturnLineState } from "./types";

type UseReturnSaleOptions = {
  detail: SaleDetail | null;
  onSuccess: () => Promise<void>;
};

function validateReturnQuantity(line: ReturnLineState): string {
  if (!line.quantity.trim()) return "";
  const quantity = toNullableNumber(line.quantity);
  if (quantity === null || !Number.isFinite(quantity)) return "Gecerli bir miktar girin.";
  if (quantity < 0) return "Iade miktari negatif olamaz.";
  if (quantity > line.maxQuantity) {
    return `En fazla ${formatCount(line.maxQuantity)} adet iade edilebilir.`;
  }
  return "";
}

export function useReturnSale({ detail, onSuccess }: UseReturnSaleOptions) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState("");
  const [lines, setLines] = useState<ReturnLineState[]>([]);
  const [notes, setNotes] = useState("");

  const lineErrors = useMemo(
    () =>
      Object.fromEntries(lines.map((line) => [line.saleLineId, validateReturnQuantity(line)])) as Record<string, string>,
    [lines],
  );

  const validLineCount = useMemo(
    () =>
      lines.filter((line) => {
        const quantity = toNullableNumber(line.quantity) ?? 0;
        return quantity > 0 && !lineErrors[line.saleLineId];
      }).length,
    [lineErrors, lines],
  );

  const hasErrors = useMemo(() => Object.values(lineErrors).some(Boolean), [lineErrors]);
  const canSubmit = Boolean(validLineCount && !hasErrors);

  const prepare = useCallback(() => {
    if (!detail) return;
    const nextLines = detail.lines
      .map((line) => {
        const maxQuantity = Math.max(0, Number(line.quantity ?? 0) - Number(line.returnedQuantity ?? 0));
        return {
          saleLineId: line.id,
          label: line.productVariantName ?? line.productName ?? "Satir",
          maxQuantity,
          quantity: maxQuantity > 0 ? "0" : "",
        };
      })
      .filter((line) => line.maxQuantity > 0);

    setLines(nextLines);
    setNotes("");
    setAttempted(false);
    setError("");
    setOpen(true);
  }, [detail]);

  const close = useCallback(() => {
    setOpen(false);
    setAttempted(false);
    setError("");
  }, []);

  const updateLine = useCallback((saleLineId: string, quantity: string) => {
    setError("");
    setLines((current) =>
      current.map((item) => (item.saleLineId === saleLineId ? { ...item, quantity } : item)),
    );
  }, []);

  const submit = useCallback(async () => {
    if (!detail) return;

    const submitLines = lines
      .map((line) => ({
        saleLineId: line.saleLineId,
        quantity: toNullableNumber(line.quantity) ?? 0,
      }))
      .filter((line) => line.quantity > 0);

    setAttempted(true);

    if (!submitLines.length || hasErrors) {
      trackEvent("validation_error", { screen: "sales", action: "return" });
      setError(hasErrors ? "Iade miktarlarini duzeltip tekrar dene." : "Iade icin en az bir satir sec.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createSaleReturn(detail.id, {
        lines: submitLines,
        notes: notes || undefined,
      });
      setOpen(false);
      setAttempted(false);
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Iade olusturulamadi.");
    } finally {
      setSubmitting(false);
    }
  }, [detail, lines, hasErrors, notes, onSuccess]);

  return {
    open,
    submitting,
    attempted,
    error,
    lines,
    notes,
    setNotes,
    lineErrors,
    canSubmit,
    prepare,
    close,
    updateLine,
    submit,
  };
}
