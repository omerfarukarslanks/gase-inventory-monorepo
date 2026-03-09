import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  cancelSale,
  createCustomer,
  createSale,
  createSalePayment,
  createSaleReturn,
  getCustomers,
  getSaleById,
  getSalePayments,
  getSales,
  getStores,
  getTenantStockSummary,
  normalizeProducts,
  normalizeSaleDetail,
  normalizeSalesResponse,
  updateSalePayment,
  type Customer,
  type InventoryVariantStockItem,
  type PaymentMethod,
  type SaleDetail,
  type SaleListItem,
  type SalePayment,
  type Store,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  InlineFieldError,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SelectionList,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";
import {
  formatCount,
  formatCurrency,
  formatDate,
  toNullableNumber,
  toNumber,
} from "@/src/lib/format";
import {
  readSalesRecents,
  upsertRecentCustomer,
  upsertRecentVariant,
  writeSalesRecents,
  type SalesRecentCustomer,
  type SalesRecentVariant,
} from "@/src/lib/salesRecents";
import type { RequestEnvelope, SalesDraftSeed, SalesRequest } from "@/src/lib/workflows";
import { mobileTheme } from "@/src/theme";

type SalesView = "list" | "detail" | "compose";
type ComposerStep = "customer" | "items" | "payment" | "review";
type SaleStatusFilter = "all" | "CONFIRMED" | "CANCELLED";

type SalesComposerLine = {
  id: string;
  variantId: string;
  label: string;
  quantity: string;
  unitPrice: string;
  currency: "TRY" | "USD" | "EUR";
};

type SalesComposerDraft = {
  storeId: string;
  customerId: string;
  customerLabel: string;
  note: string;
  paymentAmount: string;
  paymentMethod: PaymentMethod;
  lines: SalesComposerLine[];
};

type PaymentEditorState = {
  saleId: string;
  paymentId?: string;
  amount: string;
  note: string;
  paymentMethod: PaymentMethod;
  currency: "TRY" | "USD" | "EUR";
};

type ReturnLineState = {
  saleLineId: string;
  label: string;
  maxQuantity: number;
  quantity: string;
};

type VariantQuickPick = {
  productVariantId: string;
  label: string;
  code?: string | null;
  unitPrice?: string;
  currency: "TRY" | "USD" | "EUR";
  totalQuantity?: number;
};

type SalesScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<SalesRequest> | null;
};

const saleStatusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Onayli", value: "CONFIRMED" as const },
  { label: "Iptal", value: "CANCELLED" as const },
];

const paymentMethodOptions = [
  { label: "Nakit", value: "CASH" as const },
  { label: "Kart", value: "CARD" as const },
  { label: "Transfer", value: "TRANSFER" as const },
  { label: "Diger", value: "OTHER" as const },
];

const composerStepOptions = [
  { label: "Musteri", value: "customer" as const },
  { label: "Urunler", value: "items" as const },
  { label: "Odeme", value: "payment" as const },
  { label: "Onay", value: "review" as const },
];

function createLine(): SalesComposerLine {
  return {
    id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variantId: "",
    label: "Varyant secilmedi",
    quantity: "1",
    unitPrice: "",
    currency: "TRY",
  };
}

function createDraft(storeId = ""): SalesComposerDraft {
  return {
    storeId,
    customerId: "",
    customerLabel: "Musteri sec",
    note: "",
    paymentAmount: "",
    paymentMethod: "CASH",
    lines: [createLine()],
  };
}

function applySeedToDraft(
  draft: SalesComposerDraft,
  seed: SalesDraftSeed | undefined,
): SalesComposerDraft {
  if (!seed) return draft;

  const nextDraft = { ...draft, lines: [...draft.lines] };

  if (seed.customerId) {
    nextDraft.customerId = seed.customerId;
    nextDraft.customerLabel = seed.customerLabel ?? "Musteri sec";
  }

  if (seed.note) {
    nextDraft.note = seed.note;
  }

  if (seed.variantId) {
    const targetLine = nextDraft.lines[0] ?? createLine();
    nextDraft.lines = [
      {
        ...targetLine,
        variantId: seed.variantId,
        label: seed.variantLabel ?? targetLine.label,
        unitPrice: seed.unitPrice ?? targetLine.unitPrice,
        currency: seed.currency ?? targetLine.currency,
      },
      ...nextDraft.lines.slice(1),
    ];
  }

  return nextDraft;
}

function normalizeLookupValue(value: string | undefined): string {
  return value?.trim().toLocaleLowerCase("tr-TR") ?? "";
}

function scoreVariantMatch(query: string, variant: InventoryVariantStockItem): number {
  const lookup = normalizeLookupValue(query);
  if (!lookup) return 0;

  const variantCode = normalizeLookupValue(variant.variantCode);
  const variantName = normalizeLookupValue(variant.variantName);

  if (variantCode && variantCode === lookup) return 500;
  if (variantName === lookup) return 360;
  if (variantCode && variantCode.startsWith(lookup)) return 260;
  if (variantName.startsWith(lookup)) return 180;
  if (variantCode && variantCode.includes(lookup)) return 120;
  if (variantName.includes(lookup)) return 60;
  return 0;
}

function getPreferredStoreSummary(
  variant: InventoryVariantStockItem,
  storeId: string,
) {
  return variant.stores?.find((item) => item.storeId === storeId) ?? variant.stores?.[0];
}

function createRecentCustomerEntry(customer: Customer): SalesRecentCustomer {
  return {
    id: customer.id,
    label: `${customer.name} ${customer.surname}`.trim(),
    phoneNumber: customer.phoneNumber,
    lastUsedAt: new Date().toISOString(),
  };
}

function createVariantQuickPick(
  variant: InventoryVariantStockItem,
  storeId: string,
): VariantQuickPick {
  const storeSummary = getPreferredStoreSummary(variant, storeId);

  return {
    productVariantId: variant.productVariantId,
    label: variant.variantName,
    code: variant.variantCode,
    unitPrice: String(storeSummary?.salePrice ?? storeSummary?.unitPrice ?? ""),
    currency: ((storeSummary?.currency ?? "TRY") as "TRY" | "USD" | "EUR"),
    totalQuantity: variant.totalQuantity,
  };
}

function createQuickPickFromRecent(variant: SalesRecentVariant): VariantQuickPick {
  return {
    productVariantId: variant.productVariantId,
    label: variant.label,
    code: variant.code,
    unitPrice: variant.unitPrice,
    currency: variant.currency,
    totalQuantity: variant.totalQuantity,
  };
}

function validateComposerLine(line: SalesComposerLine) {
  if (!line.variantId) {
    return {
      variant: "Barkod veya varyant secin.",
      quantity: "",
      unitPrice: "",
    };
  }

  if (!line.quantity.trim()) {
    return {
      variant: "",
      quantity: "Miktar zorunlu.",
      unitPrice: "",
    };
  }

  if (toNumber(line.quantity) <= 0) {
    return {
      variant: "",
      quantity: "Miktar sifirdan buyuk olmali.",
      unitPrice: "",
    };
  }

  if (!line.unitPrice.trim()) {
    return {
      variant: "",
      quantity: "",
      unitPrice: "Birim fiyat zorunlu.",
    };
  }

  if (toNumber(line.unitPrice) <= 0) {
    return {
      variant: "",
      quantity: "",
      unitPrice: "Birim fiyat sifirdan buyuk olmali.",
    };
  }

  return {
    variant: "",
    quantity: "",
    unitPrice: "",
  };
}

function validateReturnQuantity(line: ReturnLineState) {
  if (!line.quantity.trim()) return "";
  const quantity = toNumber(line.quantity, Number.NaN);
  if (!Number.isFinite(quantity)) return "Gecerli bir miktar girin.";
  if (quantity < 0) return "Iade miktari negatif olamaz.";
  if (quantity > line.maxQuantity) {
    return `En fazla ${formatCount(line.maxQuantity)} adet iade edilebilir.`;
  }
  return "";
}

export default function SalesScreen({
  isActive = true,
  request,
}: SalesScreenProps = {}) {
  const handledRequestId = useRef<number | null>(null);
  const recentCustomersRef = useRef<SalesRecentCustomer[]>([]);
  const recentVariantsRef = useRef<SalesRecentVariant[]>([]);
  const { storeIds } = useAuth();
  const [view, setView] = useState<SalesView>("list");
  const [composerStep, setComposerStep] = useState<ComposerStep>("customer");
  const [receiptNo, setReceiptNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatusFilter>("all");
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerDraft, setComposerDraft] = useState<SalesComposerDraft>(createDraft(storeIds[0] ?? ""));
  const [composerAttempted, setComposerAttempted] = useState(false);
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerPickerSearch, setCustomerPickerSearch] = useState("");
  const [customerPickerLoading, setCustomerPickerLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [variantPickerLineId, setVariantPickerLineId] = useState<string | null>(null);
  const [variantPickerSearch, setVariantPickerSearch] = useState("");
  const [variantPickerLoading, setVariantPickerLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<InventoryVariantStockItem[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<SalesRecentCustomer[]>([]);
  const [recentVariants, setRecentVariants] = useState<SalesRecentVariant[]>([]);
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerLoading, setQuickCustomerLoading] = useState(false);
  const [quickCustomerAttempted, setQuickCustomerAttempted] = useState(false);
  const [quickCustomerError, setQuickCustomerError] = useState("");
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: "",
    surname: "",
    phoneNumber: "",
  });
  const [paymentEditor, setPaymentEditor] = useState<PaymentEditorState | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnAttempted, setReturnAttempted] = useState(false);
  const [returnError, setReturnError] = useState("");
  const [returnLines, setReturnLines] = useState<ReturnLineState[]>([]);
  const [returnNotes, setReturnNotes] = useState("");
  const debouncedReceipt = useDebouncedValue(receiptNo, 350);
  const debouncedCustomer = useDebouncedValue(customerName, 350);
  const debouncedCustomerPickerSearch = useDebouncedValue(customerPickerSearch, 300);
  const debouncedVariantPickerSearch = useDebouncedValue(variantPickerSearch, 300);

  const scopedStoreIds = useMemo(() => (storeIds.length ? storeIds : undefined), [storeIds]);
  const visibleStores = useMemo(
    () => (stores.length ? stores.filter((store) => !storeIds.length || storeIds.includes(store.id)) : []),
    [storeIds, stores],
  );
  const canResumeDraft = useMemo(
    () =>
      Boolean(
        composerDraft.customerId ||
          composerDraft.note.trim() ||
          composerDraft.paymentAmount.trim() ||
          composerDraft.lines.some(
            (line) =>
              Boolean(line.variantId) ||
              line.label !== "Varyant secilmedi" ||
              line.unitPrice.trim() ||
              line.quantity !== "1",
          ),
      ),
    [composerDraft],
  );
  const detailRemainingAmount = useMemo(
    () => Math.max(0, toNumber(detail?.remainingAmount)),
    [detail?.remainingAmount],
  );
  const quickCustomerPhoneDigits = useMemo(
    () => quickCustomerForm.phoneNumber.replace(/\D/g, ""),
    [quickCustomerForm.phoneNumber],
  );
  const quickCustomerNameError = useMemo(() => {
    if (!quickCustomerAttempted && !quickCustomerForm.name.trim()) return "";
    return quickCustomerForm.name.trim() ? "" : "Ad zorunlu.";
  }, [quickCustomerAttempted, quickCustomerForm.name]);
  const quickCustomerSurnameError = useMemo(() => {
    if (!quickCustomerAttempted && !quickCustomerForm.surname.trim()) return "";
    return quickCustomerForm.surname.trim() ? "" : "Soyad zorunlu.";
  }, [quickCustomerAttempted, quickCustomerForm.surname]);
  const quickCustomerPhoneError = useMemo(() => {
    if (!quickCustomerForm.phoneNumber.trim()) return "";
    return quickCustomerPhoneDigits.length >= 10
      ? ""
      : "Telefon en az 10 haneli olmali.";
  }, [quickCustomerForm.phoneNumber, quickCustomerPhoneDigits.length]);
  const quickCustomerHasErrors = Boolean(
    quickCustomerNameError || quickCustomerSurnameError || quickCustomerPhoneError,
  );
  const canCreateQuickCustomer = Boolean(
    quickCustomerForm.name.trim() &&
      quickCustomerForm.surname.trim() &&
      !quickCustomerPhoneError,
  );
  const paymentAmountError = useMemo(() => {
    if (!paymentEditor) return "";
    if (!paymentEditor.amount.trim()) return "Tutar zorunlu.";
    return toNumber(paymentEditor.amount) > 0 ? "" : "Odeme tutari sifirdan buyuk olmali.";
  }, [paymentEditor]);
  const composerLineValidation = useMemo(
    () =>
      Object.fromEntries(
        composerDraft.lines.map((line) => [line.id, validateComposerLine(line)]),
      ) as Record<
        string,
        { variant: string; quantity: string; unitPrice: string }
      >,
    [composerDraft.lines],
  );
  const activeDraftLines = useMemo(
    () =>
      composerDraft.lines.filter(
        (line) =>
          Boolean(line.variantId) ||
          line.unitPrice.trim() ||
          line.quantity !== "1" ||
          line.label !== "Varyant secilmedi",
      ),
    [composerDraft.lines],
  );
  const hasDraftLineErrors = useMemo(
    () =>
      activeDraftLines.some((line) => {
        const validation = composerLineValidation[line.id];
        return Boolean(validation?.variant || validation?.quantity || validation?.unitPrice);
      }),
    [activeDraftLines, composerLineValidation],
  );
  const validDraftLines = useMemo(
    () =>
      composerDraft.lines.filter((line) => {
        const validation = composerLineValidation[line.id];
        return line.variantId && !validation?.quantity && !validation?.unitPrice;
      }),
    [composerDraft.lines, composerLineValidation],
  );
  const draftTotal = useMemo(
    () =>
      validDraftLines.reduce(
        (sum, line) => sum + toNumber(line.quantity) * toNumber(line.unitPrice),
        0,
      ),
    [validDraftLines],
  );
  const customerStepError = useMemo(() => {
    if (!composerAttempted) return "";
    return composerDraft.customerId ? "" : "Musteri secmeden satisa devam edilemez.";
  }, [composerAttempted, composerDraft.customerId]);
  const itemsStepError = useMemo(() => {
    if (!composerAttempted) return "";
    if (!validDraftLines.length) return "En az bir gecerli satis satiri ekleyin.";
    if (hasDraftLineErrors) return "Satir hatalarini duzeltmeden devam edemezsin.";
    return "";
  }, [composerAttempted, hasDraftLineErrors, validDraftLines.length]);
  const paymentStepError = useMemo(() => {
    if (!composerAttempted) return "";
    return paymentAmountError;
  }, [composerAttempted, paymentAmountError]);
  const reviewStepError = useMemo(() => {
    if (!composerAttempted) return "";
    if (!composerDraft.customerId) return "Musteri secimi eksik.";
    if (!validDraftLines.length) return "En az bir gecerli satis satiri ekle.";
    if (hasDraftLineErrors) return "Satirlardaki eksik miktar veya fiyatlari duzelt.";
    if (paymentAmountError) return paymentAmountError;
    return "";
  }, [
    composerAttempted,
    composerDraft.customerId,
    hasDraftLineErrors,
    paymentAmountError,
    validDraftLines.length,
  ]);
  const returnLineErrors = useMemo(
    () =>
      Object.fromEntries(
        returnLines.map((line) => [line.saleLineId, validateReturnQuantity(line)]),
      ) as Record<string, string>,
    [returnLines],
  );
  const validReturnLineCount = useMemo(
    () =>
      returnLines.filter((line) => {
        const quantity = toNullableNumber(line.quantity) ?? 0;
        return quantity > 0 && !returnLineErrors[line.saleLineId];
      }).length,
    [returnLineErrors, returnLines],
  );
  const returnHasErrors = useMemo(
    () => Object.values(returnLineErrors).some(Boolean),
    [returnLineErrors],
  );
  const canSubmitReturn = Boolean(validReturnLineCount && !returnHasErrors);

  const canProceedComposerStep = useCallback(
    (step: ComposerStep) => {
      if (step === "customer") return Boolean(composerDraft.customerId);
      if (step === "items") return Boolean(validDraftLines.length && !hasDraftLineErrors);
      if (step === "payment") return !paymentAmountError;
      return Boolean(
        composerDraft.customerId &&
          validDraftLines.length &&
          !hasDraftLineErrors &&
          !paymentAmountError,
      );
    },
    [composerDraft.customerId, hasDraftLineErrors, paymentAmountError, validDraftLines.length],
  );

  useEffect(() => {
    recentCustomersRef.current = recentCustomers;
  }, [recentCustomers]);

  useEffect(() => {
    recentVariantsRef.current = recentVariants;
  }, [recentVariants]);

  useEffect(() => {
    if (!isActive) return;
    let active = true;

    readSalesRecents()
      .then((recents) => {
        if (!active) return;
        recentCustomersRef.current = recents.customers;
        recentVariantsRef.current = recents.variants;
        setRecentCustomers(recents.customers);
        setRecentVariants(recents.variants);
      })
      .catch(() => {
        if (!active) return;
        recentCustomersRef.current = [];
        recentVariantsRef.current = [];
        setRecentCustomers([]);
        setRecentVariants([]);
      });

    return () => {
      active = false;
    };
  }, [isActive]);

  const fetchSalesList = useCallback(async () => {
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
      const normalized = normalizeSalesResponse(response);
      setSales(normalized.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satislar yuklenemedi.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedCustomer, debouncedReceipt, scopedStoreIds, statusFilter]);

  const fetchStoresList = useCallback(async () => {
    try {
      const response = await getStores({ page: 1, limit: 100 });
      setStores(response.data ?? []);
    } catch {
      setStores([]);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void fetchStoresList();
  }, [fetchStoresList, isActive]);

  useEffect(() => {
    if (!isActive) return;
    void fetchSalesList();
  }, [fetchSalesList, isActive]);

  useEffect(() => {
    if (!customerPickerOpen) return;
    let active = true;
    setCustomerPickerLoading(true);
    getCustomers({ page: 1, limit: 30, search: debouncedCustomerPickerSearch || undefined })
      .then((response) => {
        if (active) setCustomerOptions(response.data ?? []);
      })
      .catch(() => {
        if (active) setCustomerOptions([]);
      })
      .finally(() => {
        if (active) setCustomerPickerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [customerPickerOpen, debouncedCustomerPickerSearch]);

  useEffect(() => {
    if (!variantPickerOpen) return;
    let active = true;
    setVariantPickerLoading(true);
    getTenantStockSummary({
      page: 1,
      limit: 20,
      search: debouncedVariantPickerSearch || undefined,
      storeIds: scopedStoreIds,
    })
      .then((response) => {
        if (!active) return;
        const variants = normalizeProducts(response)
          .flatMap((product) => product.variants ?? [])
          .sort((left, right) => {
            const scoreDiff =
              scoreVariantMatch(debouncedVariantPickerSearch, right) -
              scoreVariantMatch(debouncedVariantPickerSearch, left);
            if (scoreDiff !== 0) return scoreDiff;
            return right.totalQuantity - left.totalQuantity;
          })
          .slice(0, 30);
        setVariantOptions(variants);
      })
      .catch(() => {
        if (active) setVariantOptions([]);
      })
      .finally(() => {
        if (active) setVariantPickerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [variantPickerOpen, debouncedVariantPickerSearch, scopedStoreIds]);

  const openDetailById = useCallback(async (saleId: string) => {
    setView("detail");
    setDetailLoading(true);
    setError("");
    try {
      const [detailResponse, paymentsResponse] = await Promise.all([
        getSaleById(saleId),
        getSalePayments(saleId),
      ]);
      const normalizedDetail = normalizeSaleDetail(detailResponse);
      setDetail(normalizedDetail);
      setPayments(paymentsResponse);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satis detayi yuklenemedi.");
      setDetail(null);
      setPayments([]);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;
    handledRequestId.current = request.id;
    const payload = request.payload;

    if (payload.kind === "compose") {
      setComposerAttempted(false);
      setComposerStep("customer");
      setView("compose");
      setComposerDraft(applySeedToDraft(createDraft(storeIds[0] ?? ""), payload.seed));
      trackEvent("sale_started", { source: "external_request" });
      return;
    }

    void openDetailById(payload.saleId);
  }, [openDetailById, request, storeIds]);

  const persistSalesRecents = useCallback(
    (nextCustomers: SalesRecentCustomer[], nextVariants: SalesRecentVariant[]) => {
      void writeSalesRecents({
        customers: nextCustomers,
        variants: nextVariants,
      });
    },
    [],
  );

  const rememberRecentCustomerEntry = useCallback(
    (entry: SalesRecentCustomer) => {
      const nextCustomers = upsertRecentCustomer(recentCustomersRef.current, entry);
      recentCustomersRef.current = nextCustomers;
      setRecentCustomers(nextCustomers);
      persistSalesRecents(nextCustomers, recentVariantsRef.current);
    },
    [persistSalesRecents],
  );

  const rememberRecentVariantEntry = useCallback(
    (entry: SalesRecentVariant) => {
      const nextVariants = upsertRecentVariant(recentVariantsRef.current, entry);
      recentVariantsRef.current = nextVariants;
      setRecentVariants(nextVariants);
      persistSalesRecents(recentCustomersRef.current, nextVariants);
    },
    [persistSalesRecents],
  );

  const selectCustomer = useCallback(
    (customer: Customer | SalesRecentCustomer) => {
      const isRecent = "lastUsedAt" in customer;
      const label = isRecent ? customer.label : `${customer.name} ${customer.surname}`.trim();

      setComposerDraft((current) => ({
        ...current,
        customerId: customer.id,
        customerLabel: label || "Musteri sec",
      }));

      rememberRecentCustomerEntry(
        isRecent
          ? {
              ...customer,
              label: label || "Musteri sec",
              lastUsedAt: new Date().toISOString(),
            }
          : createRecentCustomerEntry(customer),
      );
    },
    [rememberRecentCustomerEntry],
  );

  const applyVariantQuickPick = useCallback(
    (quickPick: VariantQuickPick, lineId?: string | null) => {
      setComposerDraft((current) => {
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

        return {
          ...current,
          lines: nextLines,
        };
      });

      rememberRecentVariantEntry({
        productVariantId: quickPick.productVariantId,
        label: quickPick.label,
        code: quickPick.code,
        unitPrice: quickPick.unitPrice,
        currency: quickPick.currency,
        totalQuantity: quickPick.totalQuantity,
        lastUsedAt: new Date().toISOString(),
      });
    },
    [rememberRecentVariantEntry],
  );

  const selectVariant = useCallback(
    (variant: InventoryVariantStockItem, lineId?: string | null) => {
      applyVariantQuickPick(createVariantQuickPick(variant, composerDraft.storeId), lineId);
      setVariantPickerLineId(null);
      setVariantPickerOpen(false);
    },
    [applyVariantQuickPick, composerDraft.storeId],
  );

  const resetComposer = useCallback(() => {
    setComposerDraft(createDraft(storeIds[0] ?? ""));
    setComposerStep("customer");
    setComposerAttempted(false);
    setError("");
  }, [storeIds]);

  const openComposer = (
    seed?: SalesDraftSeed,
    options?: { reset?: boolean; startStep?: ComposerStep },
  ) => {
    const startStep = options?.startStep ?? "customer";
    setView("compose");
    setComposerStep(startStep);
    setComposerAttempted(false);
    setError("");
    setComposerDraft((current) =>
      options?.reset
        ? applySeedToDraft(createDraft(storeIds[0] ?? current.storeId), seed)
        : applySeedToDraft(current, seed),
    );
    trackEvent("sale_started", { source: seed ? "seeded" : "sales_screen" });
  };

  const nextComposerStep = () => {
    setComposerAttempted(true);
    if (!canProceedComposerStep(composerStep)) {
      trackEvent("validation_error", { screen: "sales", step: composerStep });
      return;
    }
    setError("");
    setComposerAttempted(false);
    setComposerStep((current) => composerStepOptions[Math.min(composerStepOptions.findIndex((item) => item.value === current) + 1, composerStepOptions.length - 1)]?.value ?? current);
  };

  const previousComposerStep = () => {
    const currentIndex = composerStepOptions.findIndex((item) => item.value === composerStep);
    if (currentIndex <= 0) {
      setView("list");
      return;
    }
    setComposerAttempted(false);
    setComposerStep(composerStepOptions[currentIndex - 1]?.value ?? "customer");
  };

  const submitComposer = async () => {
    setComposerAttempted(true);
    const linesToSubmit = validDraftLines
      .map((line) => ({
        productVariantId: line.variantId,
        quantity: toNumber(line.quantity),
        currency: line.currency,
        unitPrice: toNumber(line.unitPrice),
      }));

    if (
      !composerDraft.customerId ||
      !linesToSubmit.length ||
      hasDraftLineErrors ||
      paymentAmountError
    ) {
      trackEvent("validation_error", { screen: "sales", step: "review" });
      return;
    }

    setComposerLoading(true);
    setError("");
    try {
      await createSale({
        storeId: composerDraft.storeId || undefined,
        customerId: composerDraft.customerId,
        meta: {
          source: "mobile",
          note: composerDraft.note || undefined,
        },
        lines: linesToSubmit,
        initialPayment: {
          amount: toNumber(composerDraft.paymentAmount),
          paymentMethod: composerDraft.paymentMethod,
          note: composerDraft.note || undefined,
        },
      });
      trackEvent("sale_completed", {
        lines: linesToSubmit.length,
        storeId: composerDraft.storeId || "default",
      });
      resetComposer();
      setView("list");
      await fetchSalesList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satis olusturulamadi.");
    } finally {
      setComposerLoading(false);
    }
  };

  const openPaymentEditor = (saleId: string, payment?: SalePayment, presetAmount?: string) => {
    setPaymentError("");
    setPaymentEditor({
      saleId,
      paymentId: payment?.id,
      amount: String(payment?.amount ?? presetAmount ?? ""),
      note: payment?.note ?? "",
      paymentMethod: (payment?.paymentMethod as PaymentMethod | undefined) ?? "CASH",
      currency: ((payment?.currency as "TRY" | "USD" | "EUR" | undefined) ?? detail?.currency ?? "TRY"),
    });
  };

  const submitPayment = async () => {
    if (!paymentEditor) return;

    if (paymentAmountError) {
      trackEvent("validation_error", { screen: "sales", action: "payment" });
      setPaymentError(paymentAmountError);
      return;
    }

    setPaymentSubmitting(true);
    setPaymentError("");
    try {
      if (paymentEditor.paymentId) {
        await updateSalePayment(paymentEditor.saleId, paymentEditor.paymentId, {
          amount: toNumber(paymentEditor.amount),
          note: paymentEditor.note || undefined,
          paymentMethod: paymentEditor.paymentMethod,
          currency: paymentEditor.currency,
        });
      } else {
        await createSalePayment(paymentEditor.saleId, {
          amount: toNumber(paymentEditor.amount),
          note: paymentEditor.note || undefined,
          paymentMethod: paymentEditor.paymentMethod,
          currency: paymentEditor.currency,
        });
      }

      setPaymentEditor(null);
      if (detail) await openDetailById(detail.id);
      await fetchSalesList();
    } catch (nextError) {
      setPaymentError(nextError instanceof Error ? nextError.message : "Odeme kaydedilemedi.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const prepareReturn = () => {
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

    setReturnLines(nextLines);
    setReturnNotes("");
    setReturnAttempted(false);
    setReturnError("");
    setReturnOpen(true);
  };

  const submitReturn = async () => {
    if (!detail) return;

    const lines = returnLines
      .map((line) => ({
        saleLineId: line.saleLineId,
        quantity: toNullableNumber(line.quantity) ?? 0,
      }))
      .filter((line) => line.quantity > 0);

    setReturnAttempted(true);

    if (!lines.length || returnHasErrors) {
      trackEvent("validation_error", { screen: "sales", action: "return" });
      setReturnError(
        returnHasErrors
          ? "Iade miktarlarini duzeltip tekrar dene."
          : "Iade icin en az bir satir sec.",
      );
      return;
    }

    setReturnSubmitting(true);
    setReturnError("");
    try {
      await createSaleReturn(detail.id, {
        lines,
        notes: returnNotes || undefined,
      });
      setReturnOpen(false);
      setReturnAttempted(false);
      await openDetailById(detail.id);
      await fetchSalesList();
    } catch (nextError) {
      setReturnError(nextError instanceof Error ? nextError.message : "Iade olusturulamadi.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const submitCancel = async () => {
    if (!detail) return;

    setCancelSubmitting(true);
    setCancelError("");
    try {
      await cancelSale(detail.id, {
        reason: cancelReason || undefined,
        note: cancelNote || undefined,
      });
      setCancelOpen(false);
      setCancelError("");
      setCancelReason("");
      setCancelNote("");
      await openDetailById(detail.id);
      await fetchSalesList();
    } catch (nextError) {
      setCancelError(nextError instanceof Error ? nextError.message : "Satis iptal edilemedi.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const createQuickCustomer = async () => {
    setQuickCustomerAttempted(true);

    if (!canCreateQuickCustomer || quickCustomerHasErrors) {
      trackEvent("validation_error", { screen: "sales", action: "quick_customer" });
      setQuickCustomerError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setQuickCustomerLoading(true);
    setQuickCustomerError("");
    try {
      const customer = await createCustomer({
        name: quickCustomerForm.name.trim(),
        surname: quickCustomerForm.surname.trim(),
        phoneNumber: quickCustomerForm.phoneNumber.trim() || undefined,
      });
      selectCustomer(customer);
      setQuickCustomerOpen(false);
      setQuickCustomerAttempted(false);
      setQuickCustomerForm({ name: "", surname: "", phoneNumber: "" });
    } catch (nextError) {
      setQuickCustomerError(
        nextError instanceof Error ? nextError.message : "Musteri olusturulamadi.",
      );
    } finally {
      setQuickCustomerLoading(false);
    }
  };

  const changeComposerStep = (nextStep: ComposerStep) => {
    const currentIndex = composerStepOptions.findIndex((item) => item.value === composerStep);
    const nextIndex = composerStepOptions.findIndex((item) => item.value === nextStep);

    if (nextIndex <= currentIndex) {
      setComposerAttempted(false);
      setComposerStep(nextStep);
      return;
    }

    for (let index = currentIndex; index < nextIndex; index += 1) {
      const step = composerStepOptions[index]?.value;
      if (!step) break;
      if (!canProceedComposerStep(step)) {
        setComposerAttempted(true);
        trackEvent("validation_error", { screen: "sales", step });
        return;
      }
    }

    setComposerAttempted(false);
    setComposerStep(nextStep);
  };

  if (view === "detail") {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <ScreenHeader
            title={detail?.receiptNo ?? "Satis detayi"}
            subtitle={detail ? `${detail.name ?? "-"} ${detail.surname ?? ""}`.trim() : "Satis ozeti"}
            onBack={() => {
              setView("list");
              setDetail(null);
              setPayments([]);
            }}
          />

          {error ? <Banner text={error} /> : null}

          {detailLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={96} />
              <SkeletonBlock height={84} />
              <SkeletonBlock height={84} />
            </View>
          ) : detail ? (
            <>
              <Card>
                <SectionTitle title="Satis ozeti" />
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Magaza</Text>
                    <Text style={styles.summaryValue}>{detail.storeName ?? "-"}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Toplam</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(detail.lineTotal, detail.currency ?? "TRY")}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Odenen</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(detail.paidAmount, detail.currency ?? "TRY")}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Kalan</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(detail.remainingAmount, detail.currency ?? "TRY")}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title={`Satirlar (${detail.lines.length})`} />
                <View style={styles.list}>
                  {detail.lines.map((line) => (
                    <ListRow
                      key={line.id}
                      title={line.productVariantName ?? line.productName ?? "-"}
                      subtitle={`${formatCount(line.quantity)} adet`}
                      caption={formatCurrency(line.lineTotal, line.currency ?? detail.currency ?? "TRY")}
                      badgeLabel={`Iade ${formatCount(line.returnedQuantity)}`}
                      badgeTone="warning"
                      icon={<MaterialCommunityIcons name="package-variant" size={20} color={mobileTheme.colors.brand.primary} />}
                    />
                  ))}
                </View>
              </Card>

              <Card>
                <SectionTitle
                  title={`Odemeler (${payments.length})`}
                  action={
                    <Button
                      label={detailRemainingAmount > 0 ? "Kalani tahsil et" : "Odeme ekle"}
                      onPress={() =>
                        openPaymentEditor(
                          detail.id,
                          undefined,
                          detailRemainingAmount > 0 ? String(detailRemainingAmount) : undefined,
                        )
                      }
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                    />
                  }
                />
                <View style={styles.list}>
                  {payments.length ? (
                    payments.map((payment) => (
                      <ListRow
                        key={payment.id}
                        title={payment.paymentMethod ?? "PAYMENT"}
                        subtitle={formatCurrency(payment.amount, (payment.currency as "TRY" | "USD" | "EUR" | undefined) ?? "TRY")}
                        caption={formatDate(payment.paidAt ?? payment.createdAt)}
                        badgeLabel={payment.status ?? "ACTIVE"}
                        badgeTone="positive"
                        onPress={() => openPaymentEditor(detail.id, payment)}
                        icon={<MaterialCommunityIcons name="cash" size={20} color={mobileTheme.colors.brand.primary} />}
                      />
                    ))
                  ) : (
                    <EmptyStateWithAction
                      title="Odeme bulunamadi."
                      subtitle="Bu satis icin odeme ekleyebilirsin."
                      actionLabel="Odeme ekle"
                      onAction={() => openPaymentEditor(detail.id)}
                    />
                  )}
                </View>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Detay getirilemedi."
              subtitle="Satis listesinden tekrar dene."
              actionLabel="Listeye don"
              onAction={() => setView("list")}
            />
          )}
        </ScrollView>

        {detail ? (
          <StickyActionBar>
            <Button
              label={detailRemainingAmount > 0 ? "Kalani tahsil et" : "Odeme"}
              onPress={() =>
                openPaymentEditor(
                  detail.id,
                  undefined,
                  detailRemainingAmount > 0 ? String(detailRemainingAmount) : undefined,
                )
              }
              variant="secondary"
            />
            <Button label="Iade" onPress={prepareReturn} variant="ghost" />
            <Button
              label="Iptal"
              onPress={() => {
                setCancelError("");
                setCancelOpen(true);
              }}
              variant="danger"
            />
          </StickyActionBar>
        ) : null}

        <ModalSheet
          visible={Boolean(paymentEditor)}
          title={paymentEditor?.paymentId ? "Odemeyi duzenle" : "Odeme ekle"}
          subtitle="Odeme kalemini guncelle"
          onClose={() => {
            setPaymentEditor(null);
            setPaymentError("");
          }}
        >
          {paymentEditor ? (
            <>
              {paymentError ? <Banner text={paymentError} /> : null}
              <FilterTabs value={paymentEditor.paymentMethod} options={paymentMethodOptions} onChange={(value) => setPaymentEditor((current) => current ? { ...current, paymentMethod: value } : current)} />
              <TextField
                label="Tutar"
                value={paymentEditor.amount}
                onChangeText={(value) => {
                  setPaymentError("");
                  setPaymentEditor((current) => current ? { ...current, amount: value } : current);
                }}
                keyboardType="numeric"
                inputMode="decimal"
                errorText={paymentAmountError}
              />
              <TextField label="Not" value={paymentEditor.note} onChangeText={(value) => setPaymentEditor((current) => current ? { ...current, note: value } : current)} multiline />
              <Button
                label="Odemeyi kaydet"
                onPress={() => void submitPayment()}
                loading={paymentSubmitting}
                disabled={Boolean(paymentAmountError)}
              />
            </>
          ) : null}
        </ModalSheet>

        <ModalSheet
          visible={cancelOpen}
          title="Satisi iptal et"
          subtitle="Iptal nedeni ve not ekle"
          onClose={() => {
            setCancelOpen(false);
            setCancelError("");
          }}
        >
          {cancelError ? <Banner text={cancelError} /> : null}
          <TextField
            label="Iptal nedeni"
            value={cancelReason}
            onChangeText={(value) => {
              setCancelError("");
              setCancelReason(value);
            }}
            helperText="Opsiyonel ama operasyon notu icin onerilir."
          />
          <TextField label="Not" value={cancelNote} onChangeText={setCancelNote} multiline />
          <Button label="Iptali onayla" onPress={() => void submitCancel()} loading={cancelSubmitting} variant="danger" />
        </ModalSheet>

        <ModalSheet
          visible={returnOpen}
          title="Iade olustur"
          subtitle="Her satir icin iade miktarini gir"
          onClose={() => {
            setReturnOpen(false);
            setReturnAttempted(false);
            setReturnError("");
          }}
        >
          {returnLines.length ? (
            <>
              {returnError ? <Banner text={returnError} /> : null}
              {returnLines.map((line) => (
                <Card key={line.saleLineId}>
                  <Text style={styles.lineLabel}>{line.label}</Text>
                  <Text style={styles.mutedText}>Maksimum {line.maxQuantity} adet</Text>
                  <TextField
                    label="Iade miktari"
                    value={line.quantity}
                    onChangeText={(value) => {
                      setReturnError("");
                      setReturnLines((current) =>
                        current.map((item) =>
                          item.saleLineId === line.saleLineId ? { ...item, quantity: value } : item,
                        ),
                      );
                    }}
                    keyboardType="numeric"
                    inputMode="numeric"
                    helperText="Iade etmeyeceksen 0 birak."
                    errorText={returnAttempted ? returnLineErrors[line.saleLineId] : ""}
                  />
                </Card>
              ))}
              <TextField label="Not" value={returnNotes} onChangeText={setReturnNotes} multiline />
              <Button
                label="Iadeyi kaydet"
                onPress={() => void submitReturn()}
                loading={returnSubmitting}
                disabled={!canSubmitReturn}
              />
            </>
          ) : (
            <EmptyStateWithAction
              title="Iadeye uygun satir kalmadi."
              subtitle="Tum satirlar zaten iade edilmis olabilir."
              actionLabel="Kapat"
              onAction={() => setReturnOpen(false)}
            />
          )}
        </ModalSheet>
      </View>
    );
  }

  if (view === "compose") {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title="Yeni satis"
            subtitle="Adim adim satis olustur"
            onBack={previousComposerStep}
            action={<Button label="Taslagi sifirla" onPress={resetComposer} variant="ghost" size="sm" fullWidth={false} />}
          />

          {error ? <Banner text={error} /> : null}

          <Card>
            <FilterTabs value={composerStep} options={composerStepOptions} onChange={changeComposerStep} />
          </Card>

          {composerStep === "customer" ? (
            <>
              <Card>
                <SectionTitle title="Magaza secimi" />
                <View style={styles.sectionContent}>
                  <SelectionList
                    items={visibleStores.map((store) => ({
                      label: store.name,
                      value: store.id,
                      description: store.code,
                    }))}
                    selectedValue={composerDraft.storeId}
                    onSelect={(value) => setComposerDraft((current) => ({ ...current, storeId: value }))}
                    emptyText="Magaza bulunamadi."
                  />
                </View>
              </Card>

              <Card>
                <SectionTitle
                  title="Musteri"
                  action={
                    <Button
                      label="Hizli musteri"
                      onPress={() => {
                        setQuickCustomerAttempted(false);
                        setQuickCustomerError("");
                        setQuickCustomerForm({ name: "", surname: "", phoneNumber: "" });
                        setQuickCustomerOpen(true);
                      }}
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                    />
                  }
                />
                <View style={styles.sectionContent}>
                  <Text style={styles.selectionValue}>{composerDraft.customerLabel}</Text>
                  <Button label="Musteri sec" onPress={() => setCustomerPickerOpen(true)} variant="ghost" />
                  <InlineFieldError text={customerStepError} />
                </View>
              </Card>

              {recentCustomers.length ? (
                <Card>
                  <SectionTitle title="Son kullanilan musteriler" />
                  <View style={styles.list}>
                    {recentCustomers.map((customer) => (
                      <ListRow
                        key={customer.id}
                        title={customer.label}
                        subtitle={customer.phoneNumber ?? "Hizli secim"}
                        caption="Tek dokunusla devam et"
                        onPress={() => selectCustomer(customer)}
                        icon={
                          <MaterialCommunityIcons
                            name="account-clock-outline"
                            size={20}
                            color={mobileTheme.colors.brand.primary}
                          />
                        }
                      />
                    ))}
                  </View>
                </Card>
              ) : null}
            </>
          ) : null}

          {composerStep === "items" ? (
            <>
              {recentVariants.length ? (
                <Card>
                  <SectionTitle title="Son kullanilan varyantlar" />
                  <View style={styles.list}>
                    {recentVariants.map((variant) => (
                      <ListRow
                        key={variant.productVariantId}
                        title={variant.label}
                        subtitle={variant.code ?? "Hizli ekle"}
                        caption={`${formatCount(variant.totalQuantity)} adet • ${formatCurrency(
                          variant.unitPrice ?? 0,
                          variant.currency,
                        )}`}
                        onPress={() => applyVariantQuickPick(createQuickPickFromRecent(variant))}
                        icon={
                          <MaterialCommunityIcons
                            name="barcode-scan"
                            size={20}
                            color={mobileTheme.colors.brand.primary}
                          />
                        }
                      />
                    ))}
                  </View>
                </Card>
              ) : null}

              <Card>
                <SectionTitle
                  title={`Satis satirlari (${composerDraft.lines.length})`}
                  action={
                    <Button
                      label="Satir ekle"
                      onPress={() =>
                        setComposerDraft((current) => ({
                          ...current,
                          lines: [...current.lines, createLine()],
                        }))
                      }
                      variant="secondary"
                      size="sm"
                      fullWidth={false}
                    />
                  }
                />
                <View style={styles.sectionContent}>
                  {composerDraft.lines.map((line) => (
                    <Card key={line.id} style={styles.lineCard}>
                      <Text style={styles.lineLabel}>{line.label}</Text>
                      <Button
                        label={line.variantId ? "Varyanti degistir" : "Barkod / SKU ile sec"}
                        onPress={() => {
                          setVariantPickerLineId(line.id);
                          setVariantPickerOpen(true);
                        }}
                        variant="ghost"
                      />
                      <InlineFieldError
                        text={composerAttempted ? composerLineValidation[line.id]?.variant : ""}
                      />
                      <TextField
                        label="Miktar"
                        value={line.quantity}
                        onChangeText={(value) =>
                          setComposerDraft((current) => ({
                            ...current,
                            lines: current.lines.map((item) =>
                              item.id === line.id ? { ...item, quantity: value } : item,
                            ),
                          }))
                        }
                        keyboardType="numeric"
                        inputMode="numeric"
                        errorText={composerAttempted ? composerLineValidation[line.id]?.quantity : ""}
                      />
                      <TextField
                        label="Birim fiyat"
                        value={line.unitPrice}
                        onChangeText={(value) =>
                          setComposerDraft((current) => ({
                            ...current,
                            lines: current.lines.map((item) =>
                              item.id === line.id ? { ...item, unitPrice: value } : item,
                            ),
                          }))
                        }
                        keyboardType="numeric"
                        inputMode="decimal"
                        helperText="Varyant secildiginde son bilinen satis fiyati onerilir."
                        errorText={composerAttempted ? composerLineValidation[line.id]?.unitPrice : ""}
                      />
                      {composerDraft.lines.length > 1 ? (
                        <Button
                          label="Satiri sil"
                          onPress={() =>
                            setComposerDraft((current) => ({
                              ...current,
                              lines: current.lines.filter((item) => item.id !== line.id),
                            }))
                          }
                          variant="ghost"
                        />
                      ) : null}
                    </Card>
                  ))}
                  <InlineFieldError text={itemsStepError} />
                </View>
              </Card>
            </>
          ) : null}

          {composerStep === "payment" ? (
            <Card>
              <SectionTitle title="Ilk odeme ve not" />
              <View style={styles.sectionContent}>
                <FilterTabs value={composerDraft.paymentMethod} options={paymentMethodOptions} onChange={(value) => setComposerDraft((current) => ({ ...current, paymentMethod: value }))} />
                <TextField
                  label="Odeme tutari"
                  value={composerDraft.paymentAmount}
                  onChangeText={(value) => setComposerDraft((current) => ({ ...current, paymentAmount: value }))}
                  keyboardType="numeric"
                  inputMode="decimal"
                  helperText="Pesin odeme yoksa 0 birakilabilir."
                  errorText={paymentStepError}
                />
                <TextField label="Not" value={composerDraft.note} onChangeText={(value) => setComposerDraft((current) => ({ ...current, note: value }))} multiline />
              </View>
            </Card>
          ) : null}

          {composerStep === "review" ? (
            <>
              {reviewStepError ? <Banner text={reviewStepError} /> : null}
              <Card>
                <SectionTitle title="Satis ozeti" />
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Musteri</Text>
                    <Text style={styles.summaryValue}>{composerDraft.customerLabel}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Magaza</Text>
                    <Text style={styles.summaryValue}>{visibleStores.find((store) => store.id === composerDraft.storeId)?.name ?? "-"}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Satir sayisi</Text>
                    <Text style={styles.summaryValue}>{formatCount(validDraftLines.length)}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Toplam</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(draftTotal, "TRY")}</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Ilk odeme</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(composerDraft.paymentAmount, "TRY")}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="Satir kontrolu" />
                {validDraftLines.length ? (
                  <View style={styles.list}>
                    {validDraftLines.map((line) => (
                      <ListRow
                        key={line.id}
                        title={line.label}
                        subtitle={`${formatCount(line.quantity)} adet`}
                        caption={formatCurrency(toNumber(line.quantity) * toNumber(line.unitPrice), line.currency)}
                        badgeLabel={line.currency}
                        badgeTone="info"
                        icon={<MaterialCommunityIcons name="package-variant" size={20} color={mobileTheme.colors.brand.primary} />}
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyStateWithAction
                    title="Satir hazir degil."
                    subtitle="Urun ekleyip miktar ve fiyat bilgisini tamamla."
                    actionLabel="Urunlere don"
                    onAction={() => setComposerStep("items")}
                  />
                )}
              </Card>
            </>
          ) : null}
        </ScrollView>

        <StickyActionBar>
          <Button label={composerStep === "customer" ? "Listeye don" : "Geri"} onPress={previousComposerStep} variant="ghost" />
          {composerStep === "review" ? (
            <Button
              label="Satisi olustur"
              onPress={() => void submitComposer()}
              loading={composerLoading}
              disabled={Boolean(reviewStepError)}
            />
          ) : (
            <Button
              label="Ilerle"
              onPress={nextComposerStep}
              disabled={
                (composerStep === "customer" && Boolean(customerStepError)) ||
                (composerStep === "items" && Boolean(itemsStepError)) ||
                (composerStep === "payment" && Boolean(paymentStepError))
              }
            />
          )}
        </StickyActionBar>

        <ModalSheet
          visible={customerPickerOpen}
          title="Musteri sec"
          subtitle="Hizli arama ile musteriyi bagla"
          onClose={() => setCustomerPickerOpen(false)}
        >
          <SearchBar
            value={customerPickerSearch}
            onChangeText={setCustomerPickerSearch}
            placeholder="Ad, soyad veya telefon ara"
            hint="Son musteriler ustte, detayli arama altta listelenir."
          />
          {!customerPickerSearch.trim() && recentCustomers.length ? (
            <View style={styles.modalSection}>
              <SectionTitle title="Son musteriler" />
              <View style={styles.list}>
                {recentCustomers.map((customer) => (
                  <ListRow
                    key={customer.id}
                    title={customer.label}
                    subtitle={customer.phoneNumber ?? "Hizli secim"}
                    onPress={() => {
                      selectCustomer(customer);
                      setCustomerPickerOpen(false);
                    }}
                    icon={
                      <MaterialCommunityIcons
                        name="account-clock-outline"
                        size={20}
                        color={mobileTheme.colors.brand.primary}
                      />
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
          {customerPickerLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={72} />
              <SkeletonBlock height={72} />
            </View>
          ) : (
            <SelectionList
              items={customerOptions.map((customer) => ({
                label: `${customer.name} ${customer.surname}`.trim(),
                value: customer.id,
                description: customer.phoneNumber ?? customer.email ?? "",
              }))}
              selectedValue={composerDraft.customerId}
              onSelect={(value) => {
                const customer = customerOptions.find((item) => item.id === value);
                if (!customer) return;
                selectCustomer(customer);
                setCustomerPickerOpen(false);
              }}
            />
          )}
        </ModalSheet>

        <ModalSheet
          visible={variantPickerOpen}
          title="Varyant sec"
          subtitle="Satisa eklenecek varyanti sec"
          onClose={() => setVariantPickerOpen(false)}
        >
          <SearchBar
            value={variantPickerSearch}
            onChangeText={setVariantPickerSearch}
            placeholder="Barkod, SKU, varyant veya urun ara"
            hint="Tam barkod ve SKU eslesmeleri ustte gosterilir."
          />
          {!variantPickerSearch.trim() && recentVariants.length ? (
            <View style={styles.modalSection}>
              <SectionTitle title="Son kullanilan varyantlar" />
              <View style={styles.list}>
                {recentVariants.map((variant) => (
                  <ListRow
                    key={variant.productVariantId}
                    title={variant.label}
                    subtitle={variant.code ?? "Hizli secim"}
                    caption={`${formatCount(variant.totalQuantity)} adet`}
                    onPress={() => {
                      applyVariantQuickPick(createQuickPickFromRecent(variant), variantPickerLineId);
                      setVariantPickerLineId(null);
                      setVariantPickerOpen(false);
                    }}
                    icon={
                      <MaterialCommunityIcons
                        name="barcode-scan"
                        size={20}
                        color={mobileTheme.colors.brand.primary}
                      />
                    }
                  />
                ))}
              </View>
            </View>
          ) : null}
          {variantPickerLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={72} />
              <SkeletonBlock height={72} />
            </View>
          ) : (
            <SelectionList
              items={variantOptions.map((variant) => {
                const storeSummary = getPreferredStoreSummary(variant, composerDraft.storeId);
                return {
                  label: variant.variantName,
                  value: variant.productVariantId,
                  description: `${variant.variantCode ?? "-"} • ${formatCount(variant.totalQuantity)} adet • ${formatCurrency(storeSummary?.salePrice ?? storeSummary?.unitPrice, (storeSummary?.currency ?? "TRY") as "TRY" | "USD" | "EUR")}`,
                };
              })}
              selectedValue={composerDraft.lines.find((line) => line.id === variantPickerLineId)?.variantId}
              onSelect={(value) => {
                const variant = variantOptions.find((item) => item.productVariantId === value);
                if (!variant) return;
                selectVariant(variant, variantPickerLineId);
              }}
            />
          )}
        </ModalSheet>

        <ModalSheet
          visible={quickCustomerOpen}
          title="Hizli musteri"
          subtitle="Satis icin yeni musteri olustur"
          onClose={() => {
            setQuickCustomerOpen(false);
            setQuickCustomerAttempted(false);
            setQuickCustomerError("");
          }}
        >
          {quickCustomerError ? <Banner text={quickCustomerError} /> : null}
          <TextField
            label="Ad"
            value={quickCustomerForm.name}
            onChangeText={(value) => {
              setQuickCustomerError("");
              setQuickCustomerForm((current) => ({ ...current, name: value }));
            }}
            errorText={quickCustomerNameError}
          />
          <TextField
            label="Soyad"
            value={quickCustomerForm.surname}
            onChangeText={(value) => {
              setQuickCustomerError("");
              setQuickCustomerForm((current) => ({ ...current, surname: value }));
            }}
            errorText={quickCustomerSurnameError}
          />
          <TextField
            label="Telefon"
            value={quickCustomerForm.phoneNumber}
            onChangeText={(value) => {
              setQuickCustomerError("");
              setQuickCustomerForm((current) => ({ ...current, phoneNumber: value }));
            }}
            keyboardType="phone-pad"
            errorText={quickCustomerPhoneError}
          />
          <Button
            label="Musteriyi olustur"
            onPress={() => void createQuickCustomer()}
            loading={quickCustomerLoading}
            disabled={!canCreateQuickCustomer || quickCustomerHasErrors}
          />
        </ModalSheet>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Satislar"
          subtitle="Liste, detay ve yeni satis akislarini ayri gorevler halinde yonet"
          action={<Button label="Yenile" onPress={() => void fetchSalesList()} variant="secondary" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar value={customerName} onChangeText={setCustomerName} placeholder="Musteri ara" />
            <TextField label="Fis no" value={receiptNo} onChangeText={setReceiptNo} placeholder="ORN-001" />
            <FilterTabs value={statusFilter} options={saleStatusOptions} onChange={setStatusFilter} />
          </View>
        </Card>

        {canResumeDraft || recentCustomers.length ? (
          <Card>
            <SectionTitle title="Hizli baslat" />
            <View style={styles.list}>
              {canResumeDraft ? (
                <ListRow
                  title="Acik satis taslagi"
                  subtitle="Yarim kalan adimdan devam et"
                  caption={composerStep === "review" ? "Onaya hazir" : "Satis akisini tamamla"}
                  onPress={() => {
                    trackEvent("empty_state_action_clicked", {
                      screen: "sales",
                      action: "resume_draft",
                    });
                    setView("compose");
                  }}
                  icon={
                    <MaterialCommunityIcons
                      name="progress-clock"
                      size={20}
                      color={mobileTheme.colors.brand.primary}
                    />
                  }
                />
              ) : null}
              {recentCustomers[0] ? (
                <ListRow
                  title="Son musteri ile yeni satis"
                  subtitle={recentCustomers[0].label}
                  caption="Musteri adimini atla ve urun secimine gec"
                  onPress={() => {
                    trackEvent("empty_state_action_clicked", {
                      screen: "sales",
                      action: "recent_customer_start",
                    });
                    openComposer(
                      {
                        customerId: recentCustomers[0].id,
                        customerLabel: recentCustomers[0].label,
                      },
                      { reset: true, startStep: "items" },
                    );
                  }}
                  icon={
                    <MaterialCommunityIcons
                      name="account-arrow-right-outline"
                      size={20}
                      color={mobileTheme.colors.brand.primary}
                    />
                  }
                />
              ) : null}
            </View>
          </Card>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.listWrap}>
          <View style={styles.loadingList}>
            <SkeletonBlock height={84} />
            <SkeletonBlock height={84} />
            <SkeletonBlock height={84} />
          </View>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ListRow
              title={item.receiptNo ?? item.id}
              subtitle={`${item.name ?? "-"} ${item.surname ?? ""}`.trim()}
              caption={`${formatCurrency(item.lineTotal ?? item.total, item.currency ?? "TRY")} • ${formatDate(item.createdAt)}`}
              badgeLabel={item.status ?? "DURUM"}
              badgeTone={item.status === "CANCELLED" ? "danger" : "positive"}
              onPress={() => void openDetailById(item.id)}
              icon={<MaterialCommunityIcons name="receipt-text-outline" size={20} color={mobileTheme.colors.brand.primary} />}
            />
          )}
          ListEmptyComponent={
            <EmptyStateWithAction
              title="Satis bulunamadi."
              subtitle="Filtreleri temizle veya yeni satis baslat."
              actionLabel="Yeni satis"
              onAction={() => openComposer(undefined, { reset: true })}
            />
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={() => {
          setReceiptNo("");
          setCustomerName("");
          setStatusFilter("all");
        }} variant="ghost" />
        <Button
          label="Yeni satis"
          onPress={() => openComposer(undefined, { reset: true })}
          icon={<MaterialCommunityIcons name="cart-plus" size={16} color="#FFFFFF" />}
        />
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  filterStack: {
    gap: 12,
  },
  modalSection: {
    gap: 8,
  },
  sectionContent: {
    marginTop: 12,
    gap: 12,
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  loadingList: {
    gap: 12,
    paddingBottom: 120,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  selectionValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  lineCard: {
    gap: 10,
  },
  lineLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  summaryGrid: {
    marginTop: 12,
    gap: 12,
  },
  summaryItem: {
    gap: 4,
  },
  summaryLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  mutedText: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    lineHeight: 17,
  },
});
