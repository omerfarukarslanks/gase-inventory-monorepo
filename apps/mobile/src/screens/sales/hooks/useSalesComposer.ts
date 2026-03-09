import { createSale, type Customer, type InventoryVariantStockItem } from "@gase/core";
import { useCallback, useMemo, useState } from "react";
import { toNumber } from "@/src/lib/format";
import { trackEvent } from "@/src/lib/analytics";
import type { SalesRecentCustomer, SalesRecentVariant } from "@/src/lib/salesRecents";
import type { SalesDraftSeed } from "@/src/lib/workflows";
import type { ComposerStep, SalesComposerDraft, SalesView, VariantQuickPick } from "./types";
import {
  applySeedToDraft,
  composerStepOptions,
  createDraft,
  createLine,
  createRecentCustomerEntry,
  createVariantQuickPick,
  validateComposerLine,
} from "./validators";

type UseSalesComposerOptions = {
  storeIds: string[];
  recents: {
    customersRef: React.MutableRefObject<SalesRecentCustomer[]>;
    variantsRef: React.MutableRefObject<SalesRecentVariant[]>;
    addCustomer: (entry: SalesRecentCustomer) => void;
    addVariant: (entry: SalesRecentVariant) => void;
  };
  fetchList: () => Promise<void>;
  setView: (view: SalesView) => void;
};

export function useSalesComposer({ storeIds, recents, fetchList, setView }: UseSalesComposerOptions) {
  const [draft, setDraft] = useState<SalesComposerDraft>(createDraft(storeIds[0] ?? ""));
  const [step, setStep] = useState<ComposerStep>("customer");
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const scopedStoreIds = useMemo(() => (storeIds.length ? storeIds : undefined), [storeIds]);

  const lineValidation = useMemo(
    () =>
      Object.fromEntries(
        draft.lines.map((line) => [line.id, validateComposerLine(line)]),
      ) as Record<string, { variant: string; quantity: string; unitPrice: string }>,
    [draft.lines],
  );

  const activeDraftLines = useMemo(
    () =>
      draft.lines.filter(
        (line) =>
          Boolean(line.variantId) ||
          line.unitPrice.trim() ||
          line.quantity !== "1" ||
          line.label !== "Varyant secilmedi",
      ),
    [draft.lines],
  );

  const hasDraftLineErrors = useMemo(
    () =>
      activeDraftLines.some((line) => {
        const validation = lineValidation[line.id];
        return Boolean(validation?.variant || validation?.quantity || validation?.unitPrice);
      }),
    [activeDraftLines, lineValidation],
  );

  const validLines = useMemo(
    () =>
      draft.lines.filter((line) => {
        const validation = lineValidation[line.id];
        return line.variantId && !validation?.quantity && !validation?.unitPrice;
      }),
    [draft.lines, lineValidation],
  );

  const draftTotal = useMemo(
    () => validLines.reduce((sum, line) => sum + toNumber(line.quantity) * toNumber(line.unitPrice), 0),
    [validLines],
  );

  // Payment amount is optional in the compose flow (0 is valid — "Pesin odeme yoksa 0 birakilabilir")
  const paymentAmountError = "";

  const canResumeDraft = useMemo(
    () =>
      Boolean(
        draft.customerId ||
          draft.note.trim() ||
          draft.paymentAmount.trim() ||
          draft.lines.some(
            (line) =>
              Boolean(line.variantId) ||
              line.label !== "Varyant secilmedi" ||
              line.unitPrice.trim() ||
              line.quantity !== "1",
          ),
      ),
    [draft],
  );

  const stepErrors = useMemo(() => ({
    customer: attempted && !draft.customerId ? "Musteri secmeden satisa devam edilemez." : "",
    items: attempted
      ? !validLines.length
        ? "En az bir gecerli satis satiri ekleyin."
        : hasDraftLineErrors
          ? "Satir hatalarini duzeltmeden devam edemezsin."
          : ""
      : "",
    payment: attempted ? paymentAmountError : "",
    review: attempted
      ? !draft.customerId
        ? "Musteri secimi eksik."
        : !validLines.length
          ? "En az bir gecerli satis satiri ekle."
          : hasDraftLineErrors
            ? "Satirlardaki eksik miktar veya fiyatlari duzelt."
            : paymentAmountError
      : "",
  }), [attempted, draft.customerId, hasDraftLineErrors, paymentAmountError, validLines.length]);

  const canProceedStep = useCallback(
    (s: ComposerStep) => {
      if (s === "customer") return Boolean(draft.customerId);
      if (s === "items") return Boolean(validLines.length && !hasDraftLineErrors);
      if (s === "payment") return !paymentAmountError;
      return Boolean(draft.customerId && validLines.length && !hasDraftLineErrors && !paymentAmountError);
    },
    [draft.customerId, hasDraftLineErrors, paymentAmountError, validLines.length],
  );

  const reset = useCallback(() => {
    setDraft(createDraft(storeIds[0] ?? ""));
    setStep("customer");
    setAttempted(false);
    setError("");
  }, [storeIds]);

  const open = useCallback(
    (seed?: SalesDraftSeed, options?: { reset?: boolean; startStep?: ComposerStep }) => {
      const startStep = options?.startStep ?? "customer";
      setStep(startStep);
      setAttempted(false);
      setError("");
      setDraft((current) =>
        options?.reset
          ? applySeedToDraft(createDraft(storeIds[0] ?? current.storeId), seed)
          : applySeedToDraft(current, seed),
      );
      setView("compose");
      trackEvent("sale_started", { source: seed ? "seeded" : "sales_screen" });
    },
    [storeIds, setView],
  );

  const nextStep = useCallback(() => {
    setAttempted(true);
    if (!canProceedStep(step)) {
      trackEvent("validation_error", { screen: "sales", step });
      return;
    }
    setError("");
    setAttempted(false);
    setStep((current) =>
      composerStepOptions[Math.min(composerStepOptions.findIndex((item) => item.value === current) + 1, composerStepOptions.length - 1)]?.value ?? current,
    );
  }, [canProceedStep, step]);

  const previousStep = useCallback(() => {
    const currentIndex = composerStepOptions.findIndex((item) => item.value === step);
    if (currentIndex <= 0) {
      setView("list");
      return;
    }
    setAttempted(false);
    setStep(composerStepOptions[currentIndex - 1]?.value ?? "customer");
  }, [step, setView]);

  const changeStep = useCallback(
    (nextStep: ComposerStep) => {
      const currentIndex = composerStepOptions.findIndex((item) => item.value === step);
      const nextIndex = composerStepOptions.findIndex((item) => item.value === nextStep);

      if (nextIndex <= currentIndex) {
        setAttempted(false);
        setStep(nextStep);
        return;
      }

      for (let index = currentIndex; index < nextIndex; index += 1) {
        const s = composerStepOptions[index]?.value;
        if (!s) break;
        if (!canProceedStep(s)) {
          setAttempted(true);
          trackEvent("validation_error", { screen: "sales", step: s });
          return;
        }
      }

      setAttempted(false);
      setStep(nextStep);
    },
    [step, canProceedStep],
  );

  const selectCustomer = useCallback(
    (customer: Customer | SalesRecentCustomer) => {
      const isRecent = "lastUsedAt" in customer;
      const label = isRecent ? customer.label : `${customer.name} ${customer.surname}`.trim();

      setDraft((current) => ({
        ...current,
        customerId: customer.id,
        customerLabel: label || "Musteri sec",
      }));

      recents.addCustomer(
        isRecent
          ? { ...customer, label: label || "Musteri sec", lastUsedAt: new Date().toISOString() }
          : createRecentCustomerEntry(customer as Customer),
      );
    },
    [recents],
  );

  const applyVariantQuickPick = useCallback(
    (quickPick: VariantQuickPick, lineId?: string | null) => {
      setDraft((current) => {
        const fallbackLineId = current.lines.find((item) => !item.variantId)?.id ?? null;
        const targetLineId = lineId ?? fallbackLineId;
        const nextLine = {
          id: createLine().id,
          variantId: quickPick.productVariantId,
          label: quickPick.label,
          quantity: "1",
          unitPrice: quickPick.unitPrice ?? "",
          currency: quickPick.currency,
        };

        const nextLines = targetLineId
          ? current.lines.map((line) =>
              line.id === targetLineId
                ? {
                    ...line,
                    variantId: quickPick.productVariantId,
                    label: quickPick.label,
                    unitPrice: quickPick.unitPrice ?? line.unitPrice,
                    currency: quickPick.currency,
                  }
                : line,
            )
          : [...current.lines, nextLine];

        return { ...current, lines: nextLines };
      });

      recents.addVariant({
        productVariantId: quickPick.productVariantId,
        label: quickPick.label,
        code: quickPick.code,
        unitPrice: quickPick.unitPrice,
        currency: quickPick.currency,
        totalQuantity: quickPick.totalQuantity,
        lastUsedAt: new Date().toISOString(),
      });
    },
    [recents],
  );

  const selectVariant = useCallback(
    (variant: InventoryVariantStockItem, lineId?: string | null) => {
      applyVariantQuickPick(createVariantQuickPick(variant, draft.storeId), lineId);
    },
    [applyVariantQuickPick, draft.storeId],
  );

  const submit = useCallback(async () => {
    setAttempted(true);
    const linesToSubmit = validLines.map((line) => ({
      productVariantId: line.variantId,
      quantity: toNumber(line.quantity),
      currency: line.currency,
      unitPrice: toNumber(line.unitPrice),
    }));

    if (!draft.customerId || !linesToSubmit.length || hasDraftLineErrors || paymentAmountError) {
      trackEvent("validation_error", { screen: "sales", step: "review" });
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createSale({
        storeId: draft.storeId || undefined,
        customerId: draft.customerId,
        meta: { source: "mobile", note: draft.note || undefined },
        lines: linesToSubmit,
        initialPayment: {
          amount: toNumber(draft.paymentAmount),
          paymentMethod: draft.paymentMethod,
          note: draft.note || undefined,
        },
      });
      trackEvent("sale_completed", { lines: linesToSubmit.length, storeId: draft.storeId || "default" });
      reset();
      setView("list");
      await fetchList();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Satis olusturulamadi.");
    } finally {
      setLoading(false);
    }
  }, [draft, validLines, hasDraftLineErrors, paymentAmountError, reset, setView, fetchList]);

  return {
    draft,
    setDraft,
    step,
    attempted,
    loading,
    error,
    setError,
    scopedStoreIds,
    lineValidation,
    validLines,
    draftTotal,
    paymentAmountError,
    hasDraftLineErrors,
    canResumeDraft,
    stepErrors,
    canProceedStep,
    reset,
    open,
    nextStep,
    previousStep,
    changeStep,
    selectCustomer,
    applyVariantQuickPick,
    selectVariant,
    submit,
  };
}
