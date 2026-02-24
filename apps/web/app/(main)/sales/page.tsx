"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionUser, getSessionUserRole, getSessionUserStoreIds, isStoreScopedRole } from "@/lib/authz";
import { getTenantStockSummary } from "@/lib/inventory";
import { getPaginationValue, normalizeProducts } from "@/lib/normalize";
import { useStores } from "@/hooks/useStores";
import { createCustomer, type CreateCustomerRequest, type Customer } from "@/lib/customers";
import {
  cancelSale,
  createSale,
  createSalePayment,
  deleteSalePayment,
  getSaleById,
  getSalePayments,
  getSales,
  updateSalePayment,
  updateSale,
  type CreateSalePayload,
  type PaymentMethod,
  type SalePayment,
  type UpdateSalePayload,
  type SaleDetail,
  type SaleListItem,
} from "@/lib/sales";
import type { Currency } from "@/lib/products";
import { toNumberOrNull } from "@/lib/format";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

import {
  PAYMENT_METHOD_OPTIONS,
  type SaleLineForm,
  type FieldErrors,
  type VariantPreset,
  type VariantStorePreset,
  createLineRow,
  calcLineTotal,
} from "@/components/sales/types";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import { normalizeSalesResponse, normalizeSaleDetail } from "@/lib/sales-normalize";
import SalesFilters from "@/components/sales/SalesFilters";
import SalesTable from "@/components/sales/SalesTable";
import SalesPagination from "@/components/sales/SalesPagination";
import SaleDrawer from "@/components/sales/SaleDrawer";
import SaleDetailModal from "@/components/sales/SaleDetailModal";

export default function SalesPage() {
  const stores = useStores();

  /* ── Sales list state ── */
  const [salesReceipts, setSalesReceipts] = useState<SaleListItem[]>([]);
  const [salesMeta, setSalesMeta] = useState<{ page: number; limit: number; total: number; totalPages: number } | null>(null);
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
  const [salesMinUnitPriceFilter, setSalesMinUnitPriceFilter] = useState("");
  const [salesMaxUnitPriceFilter, setSalesMaxUnitPriceFilter] = useState("");
  const [salesMinLineTotalFilter, setSalesMinLineTotalFilter] = useState("");
  const [salesMaxLineTotalFilter, setSalesMaxLineTotalFilter] = useState("");
  const [expandedPaymentSaleIds, setExpandedPaymentSaleIds] = useState<string[]>([]);
  const [paymentsBySaleId, setPaymentsBySaleId] = useState<Record<string, SalePayment[]>>({});
  const [paymentLoadingBySaleId, setPaymentLoadingBySaleId] = useState<Record<string, boolean>>({});
  const [paymentErrorBySaleId, setPaymentErrorBySaleId] = useState<Record<string, string>>({});

  /* ── Cancel dialog ── */
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetSale, setCancelTargetSale] = useState<SaleListItem | null>(null);
  const [cancellingSale, setCancellingSale] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [paymentDeleteDialogOpen, setPaymentDeleteDialogOpen] = useState(false);
  const [paymentDeleteTarget, setPaymentDeleteTarget] = useState<{
    saleId: string;
    paymentId: string;
  } | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  /* ── Sale detail modal ── */
  const [saleDetailOpen, setSaleDetailOpen] = useState(false);
  const [saleDetailLoading, setSaleDetailLoading] = useState(false);
  const [saleDetailError, setSaleDetailError] = useState("");
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);

  /* ── Variant options ── */
  const [variantOptions, setVariantOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [variantPresetsById, setVariantPresetsById] = useState<Record<string, VariantPreset>>({});
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [loadingMoreVariants, setLoadingMoreVariants] = useState(false);
  const [variantPage, setVariantPage] = useState(0);
  const [variantHasMore, setVariantHasMore] = useState(true);

  /* ── Scope ── */
  const [scopeReady, setScopeReady] = useState(false);
  const [isStoreScopedUser, setIsStoreScopedUser] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");

  /* ── Sale drawer state ── */
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerDropdownRefreshKey, setCustomerDropdownRefreshKey] = useState(0);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("CASH");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<SaleLineForm[]>([createLineRow()]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentDrawerSaleId, setPaymentDrawerSaleId] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>("CASH");
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>("TRY");
  const [paymentNoteInput, setPaymentNoteInput] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentFormError, setPaymentFormError] = useState("");

  /* ── Init scope ── */
  useEffect(() => {
    const role = getSessionUserRole();
    const user = getSessionUser();
    const storeIds = getSessionUserStoreIds(user);
    setIsStoreScopedUser(isStoreScopedRole(role));
    setScopedStoreId(storeIds[0] ?? "");
    if (isStoreScopedRole(role)) {
      setStoreId(storeIds[0] ?? "");
    }
    setScopeReady(true);
  }, []);

  /* ── Fetch sales ── */
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
          ...(isStoreScopedUser ? {} : { storeIds: salesStoreIds }),
          receiptNo: salesReceiptNoFilter || undefined,
          name: salesNameFilter || undefined,
          surname: salesSurnameFilter || undefined,
          status: salesStatusFilters.length > 0 ? salesStatusFilters : undefined,
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
        setSalesError("Satis fisleri yuklenemedi. Lutfen tekrar deneyin.");
      } finally {
        setSalesLoading(false);
      }
    },
    [
      scopeReady,
      salesPage,
      salesLimit,
      salesIncludeLines,
      isStoreScopedUser,
      salesStoreIds,
      salesReceiptNoFilter,
      salesNameFilter,
      salesSurnameFilter,
      salesStatusFilters,
      salesMinUnitPriceFilter,
      salesMaxUnitPriceFilter,
      salesMinLineTotalFilter,
      salesMaxLineTotalFilter,
    ],
  );

  useEffect(() => {
    if (!scopeReady) return;
    void fetchSalesReceipts();
  }, [fetchSalesReceipts, scopeReady]);

  /* ── Fetch variant options ── */
  const fetchVariantPage = useCallback(async (nextPage: number, replace: boolean) => {
    if (replace) {
      setLoadingVariants(true);
    } else {
      setLoadingMoreVariants(true);
    }

    try {
      const res = await getTenantStockSummary({ page: nextPage, limit: 100 });
      const nextProducts = normalizeProducts(res);
      const nextOptions = nextProducts.flatMap((product) =>
        (product.variants ?? []).map((variant) => ({
          value: variant.productVariantId,
          label: `${product.productName} / ${variant.variantName} (${variant.totalQuantity})`,
        })),
      );

      setVariantPresetsById((prev) => {
        const nextMap: Record<string, VariantPreset> = replace ? {} : { ...prev };
        nextProducts.forEach((product) => {
          (product.variants ?? []).forEach((variant) => {
            const storePresets: VariantStorePreset[] = (variant.stores ?? []).map((store) => ({
              storeId: store.storeId,
              currency:
                store.currency === "TRY" || store.currency === "USD" || store.currency === "EUR"
                  ? store.currency
                  : "TRY",
              unitPrice: store.unitPrice ?? store.salePrice ?? null,
              discountPercent: store.discountPercent ?? null,
              discountAmount: store.discountAmount ?? null,
              taxPercent: store.taxPercent ?? null,
              taxAmount: store.taxAmount ?? null,
              lineTotal: store.lineTotal ?? null,
            }));

            const first = storePresets[0];
            nextMap[variant.productVariantId] = {
              currency: first?.currency ?? "TRY",
              unitPrice: first?.unitPrice ?? null,
              discountPercent: first?.discountPercent ?? null,
              discountAmount: first?.discountAmount ?? null,
              taxPercent: first?.taxPercent ?? null,
              taxAmount: first?.taxAmount ?? null,
              lineTotal: first?.lineTotal ?? null,
              stores: storePresets,
            };
          });
        });
        return nextMap;
      });

      setVariantOptions((prev) => {
        const map = new Map<string, { value: string; label: string }>();
        (replace ? [] : prev).forEach((item) => map.set(item.value, item));
        nextOptions.forEach((item) => {
          if (item.value && !map.has(item.value)) map.set(item.value, item);
        });
        return Array.from(map.values());
      });

      const totalPages = getPaginationValue(res, "totalPages");
      if (totalPages > 0) {
        setVariantHasMore(nextPage < totalPages);
      } else {
        setVariantHasMore(nextOptions.length >= 100);
      }
      setVariantPage(nextPage);
    } catch {
      if (replace) {
        setVariantOptions([]);
        setVariantPresetsById({});
      }
      setVariantHasMore(false);
    } finally {
      setLoadingVariants(false);
      setLoadingMoreVariants(false);
    }
  }, []);

  useEffect(() => {
    void fetchVariantPage(1, true);
  }, [fetchVariantPage]);

  /* ── Derived ── */
  const storeOptions = useMemo(
    () => stores.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const salesTotalPages = salesMeta?.totalPages ?? 1;
  const salesTotal = salesMeta?.total ?? 0;

  const loadMoreVariants = useCallback(() => {
    if (loadingVariants || loadingMoreVariants || !variantHasMore) return;
    void fetchVariantPage(variantPage + 1, false);
  }, [loadingVariants, loadingMoreVariants, variantHasMore, variantPage, fetchVariantPage]);

  /* ── Payments ── */
  const fetchSalePayments = useCallback(async (saleId: string, force = false) => {
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
        [saleId]: "Odeme kayitlari yuklenemedi. Lutfen tekrar deneyin.",
      }));
    } finally {
      setPaymentLoadingBySaleId((prev) => ({ ...prev, [saleId]: false }));
    }
  }, [paymentLoadingBySaleId]);

  const togglePaymentsCollapse = (saleId: string) => {
    const isExpanded = expandedPaymentSaleIds.includes(saleId);
    if (isExpanded) {
      setExpandedPaymentSaleIds((prev) => prev.filter((id) => id !== saleId));
      return;
    }

    setExpandedPaymentSaleIds((prev) => [...prev, saleId]);
    void fetchSalePayments(saleId, !paymentsBySaleId[saleId]);
  };

  const normalizePaymentMethod = (value?: string | null): PaymentMethod => {
    if (value === "CASH" || value === "CARD" || value === "TRANSFER" || value === "OTHER") {
      return value;
    }
    return "OTHER";
  };

  const normalizeCurrency = (value?: string | null): Currency => {
    if (value === "TRY" || value === "USD" || value === "EUR") return value;
    return "TRY";
  };

  const openAddPaymentDrawer = (saleId: string) => {
    setPaymentDrawerSaleId(saleId);
    setEditingPaymentId(null);
    setPaymentAmount("");
    setPaymentMethodInput("CASH");
    setPaymentCurrency("TRY");
    setPaymentNoteInput("");
    setPaymentFormError("");
    setPaymentDrawerOpen(true);
  };

  const openEditPaymentDrawer = (saleId: string, payment: SalePayment) => {
    setPaymentDrawerSaleId(saleId);
    setEditingPaymentId(payment.id);
    setPaymentAmount(payment.amount != null ? String(payment.amount) : "");
    setPaymentMethodInput(normalizePaymentMethod(payment.paymentMethod as string | null | undefined));
    setPaymentCurrency(normalizeCurrency(payment.currency as string | null | undefined));
    setPaymentNoteInput(payment.note ?? "");
    setPaymentFormError("");
    setPaymentDrawerOpen(true);
  };

  const closePaymentDrawer = () => {
    if (paymentSubmitting) return;
    setPaymentDrawerOpen(false);
    setPaymentFormError("");
  };

  const submitPayment = async () => {
    const amount = toNumberOrNull(paymentAmount);
    if (!paymentDrawerSaleId) {
      setPaymentFormError("Satis kaydi secilmedi.");
      return;
    }
    if (amount == null || amount < 0) {
      setPaymentFormError("Gecerli bir tutar girin.");
      return;
    }

    setPaymentSubmitting(true);
    setPaymentFormError("");
    try {
      if (editingPaymentId) {
        await updateSalePayment(paymentDrawerSaleId, editingPaymentId, {
          amount,
          paymentMethod: paymentMethodInput,
          note: paymentNoteInput.trim() || undefined,
          currency: paymentCurrency,
        });
        setSuccess("Odeme kaydi guncellendi.");
      } else {
        await createSalePayment(paymentDrawerSaleId, {
          amount,
          paymentMethod: paymentMethodInput,
          note: paymentNoteInput.trim() || undefined,
          paidAt: new Date().toISOString(),
          currency: paymentCurrency,
        });
        setSuccess("Odeme kaydi eklendi.");
      }

      setPaymentDrawerOpen(false);
      setEditingPaymentId(null);
      setPaymentAmount("");
      setPaymentNoteInput("");
      await fetchSalePayments(paymentDrawerSaleId, true);
      await fetchSalesReceipts();
    } catch {
      setPaymentFormError(editingPaymentId ? "Odeme guncellenemedi." : "Odeme olusturulamadi.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const openDeletePaymentDialog = (saleId: string, payment: SalePayment) => {
    setPaymentDeleteTarget({ saleId, paymentId: payment.id });
    setPaymentDeleteDialogOpen(true);
  };

  const closeDeletePaymentDialog = () => {
    if (deletingPayment) return;
    setPaymentDeleteDialogOpen(false);
    setPaymentDeleteTarget(null);
  };

  const confirmDeletePayment = async () => {
    if (!paymentDeleteTarget) return;
    setDeletingPayment(true);
    try {
      await deleteSalePayment(paymentDeleteTarget.saleId, paymentDeleteTarget.paymentId);
      setSuccess("Odeme kaydi silindi.");
      setPaymentDeleteDialogOpen(false);
      setPaymentDeleteTarget(null);
      await fetchSalePayments(paymentDeleteTarget.saleId, true);
      await fetchSalesReceipts();
    } catch {
      setSalesError("Odeme kaydi silinemedi. Lutfen tekrar deneyin.");
    } finally {
      setDeletingPayment(false);
    }
  };

  /* ── Line handlers ── */
  const onChangeLine = (rowId: string, patch: Partial<SaleLineForm>) => {
    setErrors((prev) => ({ ...prev, lines: undefined }));
    setLines((prev) => prev.map((line) => (line.rowId === rowId ? { ...line, ...patch } : line)));
  };

  const applyVariantPreset = useCallback(
    (rowId: string, variantId: string) => {
      const preset = variantPresetsById[variantId];
      if (!preset) {
        onChangeLine(rowId, { productVariantId: variantId });
        return;
      }

      const storePreset = storeId
        ? preset.stores.find((store) => store.storeId === storeId) ?? preset.stores[0]
        : preset.stores[0];
      const selected = storePreset ?? preset;

      onChangeLine(rowId, {
        productVariantId: variantId,
        currency: selected.currency,
        unitPrice:
          selected.unitPrice != null
            ? String(selected.unitPrice)
            : selected.lineTotal != null
              ? String(selected.lineTotal)
              : "",
        discountMode: selected.discountAmount != null ? "amount" : "percent",
        discountPercent: selected.discountPercent != null ? String(selected.discountPercent) : "",
        discountAmount: selected.discountAmount != null ? String(selected.discountAmount) : "",
        taxMode: selected.taxAmount != null ? "amount" : "percent",
        taxPercent: selected.taxPercent != null ? String(selected.taxPercent) : "",
        taxAmount: selected.taxAmount != null ? String(selected.taxAmount) : "",
      });
    },
    [variantPresetsById, storeId],
  );

  const addLine = () => setLines((prev) => [...prev, createLineRow()]);
  const removeLine = (rowId: string) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.rowId !== rowId)));

  /* ── Form helpers ── */
  const resetSaleForm = useCallback(() => {
    setEditingSaleId(null);
    setStoreId(isStoreScopedUser ? scopedStoreId : "");
    setCustomerId("");
    setName("");
    setSurname("");
    setPhoneNumber("");
    setEmail("");
    setPaymentMethod("CASH");
    setInitialPaymentAmount("");
    setNote("");
    setLines([createLineRow()]);
    setErrors({});
    setFormError("");
  }, [isStoreScopedUser, scopedStoreId]);

  const openSaleDrawer = () => {
    resetSaleForm();
    setSuccess("");
    setSaleDrawerOpen(true);
  };

  const closeSaleDrawer = () => {
    if (submitting) return;
    setFormError("");
    setSaleDrawerOpen(false);
  };

  const openEditDrawer = async (sale: SaleListItem) => {
    resetSaleForm();
    setSuccess("");
    setFormError("");
    setSaleDrawerOpen(true);
    setEditingSaleId(sale.id);
    setSubmitting(true);
    try {
      const response = await getSaleById(sale.id);
      const detail = normalizeSaleDetail(response);
      if (!detail) {
        setFormError("Satis detayi alinamadi.");
        return;
      }
      setName(detail.name ?? "");
      setSurname(detail.surname ?? "");
      setPhoneNumber(detail.phoneNumber ?? "");
      setEmail(detail.email ?? "");
      setCustomerId(detail.customerId ?? "");
      setNote(detail.note ?? "");
      if (detail.storeId) setStoreId(detail.storeId);
      setLines(
        detail.lines.length > 0
          ? detail.lines.map((line) => ({
              rowId: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              productVariantId: line.productVariantId ?? "",
              quantity: line.quantity != null ? String(line.quantity) : "1",
              currency: line.currency ?? "TRY",
              unitPrice: line.unitPrice != null ? String(line.unitPrice) : "",
              discountMode: line.discountAmount != null ? ("amount" as const) : ("percent" as const),
              discountPercent: line.discountPercent != null ? String(line.discountPercent) : "",
              discountAmount: line.discountAmount != null ? String(line.discountAmount) : "",
              taxMode: line.taxAmount != null ? ("amount" as const) : ("percent" as const),
              taxPercent: line.taxPercent != null ? String(line.taxPercent) : "",
              taxAmount: line.taxAmount != null ? String(line.taxAmount) : "",
              campaignCode: line.campaignCode ?? "",
            }))
          : [createLineRow()],
      );
    } catch {
      setFormError("Satis detayi yuklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Cancel handlers ── */
  const openCancelDialog = (sale: SaleListItem) => {
    setCancelTargetSale(sale);
    setCancelReason("");
    setCancelNote("");
    setCancelDialogOpen(true);
  };

  const closeCancelDialog = () => {
    if (cancellingSale) return;
    setCancelDialogOpen(false);
    setCancelTargetSale(null);
  };

  const confirmCancelSale = async () => {
    if (!cancelTargetSale) return;
    setCancellingSale(true);
    try {
      await cancelSale(cancelTargetSale.id, {
        reason: cancelReason.trim() || undefined,
        note: cancelNote.trim() || undefined,
      });
      setSuccess("Satis fisi iptal edildi.");
      setCancelDialogOpen(false);
      setCancelTargetSale(null);
      await fetchSalesReceipts();
    } catch {
      setSalesError("Satis fisi iptal edilemedi. Lutfen tekrar deneyin.");
    } finally {
      setCancellingSale(false);
    }
  };

  /* ── Detail modal ── */
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

  /* ── Validation ── */
  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!customerId && !editingSaleId) nextErrors.customerId = "Musteri secimi zorunludur.";
    if (!isStoreScopedUser && !storeId) nextErrors.storeId = "Magaza secimi zorunludur.";
    if (!editingSaleId && !paymentMethod) nextErrors.paymentMethod = "Odeme yontemi zorunludur.";
    if (!editingSaleId) {
      const amount = toNumberOrNull(initialPaymentAmount);
      if (amount == null || amount < 0) {
        nextErrors.initialPaymentAmount = "Gecerli bir odenen tutar girin.";
      }
    }

    if (lines.length === 0) {
      nextErrors.lines = "En az bir satis satiri eklemelisiniz.";
    } else {
      const invalidLine = lines.some((line) => {
        const quantity = toNumberOrNull(line.quantity);
        const unitPrice = toNumberOrNull(line.unitPrice);
        return !line.productVariantId || quantity == null || quantity <= 0 || unitPrice == null || unitPrice < 0;
      });
      if (invalidLine) {
        nextErrors.lines = "Tum satirlarda varyant, adet ve birim fiyat alanlari gecerli olmalidir.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ── Submit ── */
  const buildLinePayloads = () =>
    lines.map((line) => ({
      productVariantId: line.productVariantId,
      quantity: Number(line.quantity),
      currency: line.currency,
      unitPrice: Number(line.unitPrice),
      ...(line.discountMode === "percent" && line.discountPercent
        ? { discountPercent: Number(line.discountPercent) }
        : {}),
      ...(line.discountMode === "amount" && line.discountAmount
        ? { discountAmount: Number(line.discountAmount) }
        : {}),
      ...(line.taxMode === "percent" && line.taxPercent
        ? { taxPercent: Number(line.taxPercent) }
        : {}),
      ...(line.taxMode === "amount" && line.taxAmount
        ? { taxAmount: Number(line.taxAmount) }
        : {}),
      lineTotal: Math.round(calcLineTotal(line) * 100) / 100,
      ...(line.campaignCode.trim() ? { campaignCode: line.campaignCode.trim() } : {}),
    }));

  const onSelectCustomer = useCallback((customer: Customer) => {
    setCustomerId(customer.id);
    setName(customer.name ?? "");
    setSurname(customer.surname ?? "");
    setPhoneNumber(customer.phoneNumber ?? "");
    setEmail(customer.email ?? "");
  }, []);

  const onQuickCreateCustomer = useCallback(
    async (payload: CreateCustomerRequest) => {
      const created = await createCustomer(payload);
      setCustomerDropdownRefreshKey((prev) => prev + 1);
      return created;
    },
    [],
  );

  const onSubmit = async () => {
    setFormError("");
    setSuccess("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingSaleId) {
        const payload: UpdateSalePayload = {
          name: name.trim(),
          surname: surname.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          email: email.trim() || undefined,
          meta: {
            note: note.trim() || undefined,
          },
          lines: buildLinePayloads(),
        };
        await updateSale(editingSaleId, payload);
        setSuccess("Satis kaydi guncellendi.");
      } else {
        const payload: CreateSalePayload = {
          ...(isStoreScopedUser ? {} : { storeId }),
          customerId,
          meta: {
            note: note.trim() || undefined,
          },
          lines: buildLinePayloads(),
          initialPayment: {
            amount: Number(initialPaymentAmount),
            paymentMethod: paymentMethod as PaymentMethod,
          },
        };
        await createSale(payload);
        setSuccess("Satis kaydi olusturuldu.");
      }
      resetSaleForm();
      setSaleDrawerOpen(false);
      await fetchSalesReceipts();
    } catch {
      setFormError(editingSaleId ? "Satis guncellenemedi. Lutfen tekrar deneyin." : "Satis olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Render ── */
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-text">Satislar</h1>
        <p className="text-sm text-muted">Satis fisleri ve yeni satis olusturma</p>
      </div>

      <SalesFilters
        showAdvancedFilters={showSalesAdvancedFilters}
        onToggleAdvancedFilters={() => setShowSalesAdvancedFilters((prev) => !prev)}
        onNewSale={openSaleDrawer}
        isStoreScopedUser={isStoreScopedUser}
        storeOptions={storeOptions}
        salesStoreIds={salesStoreIds}
        onSalesStoreIdsChange={setSalesStoreIds}
        receiptNoFilter={salesReceiptNoFilter}
        onReceiptNoFilterChange={setSalesReceiptNoFilter}
        nameFilter={salesNameFilter}
        onNameFilterChange={setSalesNameFilter}
        surnameFilter={salesSurnameFilter}
        onSurnameFilterChange={setSalesSurnameFilter}
        statusFilters={salesStatusFilters}
        onStatusFiltersChange={setSalesStatusFilters}
        minUnitPriceFilter={salesMinUnitPriceFilter}
        onMinUnitPriceFilterChange={setSalesMinUnitPriceFilter}
        maxUnitPriceFilter={salesMaxUnitPriceFilter}
        onMaxUnitPriceFilterChange={setSalesMaxUnitPriceFilter}
        minLineTotalFilter={salesMinLineTotalFilter}
        onMinLineTotalFilterChange={setSalesMinLineTotalFilter}
        maxLineTotalFilter={salesMaxLineTotalFilter}
        onMaxLineTotalFilterChange={setSalesMaxLineTotalFilter}
        includeLines={salesIncludeLines}
        onIncludeLinesChange={setSalesIncludeLines}
        onResetPage={() => setSalesPage(1)}
      />

      <SalesTable
        salesReceipts={salesReceipts}
        salesLoading={salesLoading}
        salesError={salesError}
        expandedPaymentSaleIds={expandedPaymentSaleIds}
        paymentsBySaleId={paymentsBySaleId}
        paymentLoadingBySaleId={paymentLoadingBySaleId}
        paymentErrorBySaleId={paymentErrorBySaleId}
        onTogglePayments={togglePaymentsCollapse}
        onAddPayment={openAddPaymentDrawer}
        onEditPayment={openEditPaymentDrawer}
        onDeletePayment={openDeletePaymentDialog}
        onOpenDetail={(id) => void openSaleDetailDialog(id)}
        onEdit={(sale) => void openEditDrawer(sale)}
        onOpenCancel={openCancelDialog}
      />

      <SalesPagination
        page={salesPage}
        totalPages={salesTotalPages}
        limit={salesLimit}
        total={salesTotal}
        loading={salesLoading}
        onPageChange={setSalesPage}
        onLimitChange={setSalesLimit}
      />

      {success && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {success}
        </div>
      )}

      <SaleDrawer
        open={saleDrawerOpen}
        editMode={!!editingSaleId}
        submitting={submitting}
        scopeReady={scopeReady}
        loadingVariants={loadingVariants}
        isStoreScopedUser={isStoreScopedUser}
        storeOptions={storeOptions}
        customerId={customerId}
        onCustomerIdChange={(value) => {
          setCustomerId(value);
          if (!value) {
            setName("");
            setSurname("");
            setPhoneNumber("");
            setEmail("");
          }
        }}
        onCustomerSelected={onSelectCustomer}
        customerDropdownRefreshKey={customerDropdownRefreshKey}
        onQuickCreateCustomer={onQuickCreateCustomer}
        variantOptions={variantOptions}
        loadingMoreVariants={loadingMoreVariants}
        variantHasMore={variantHasMore}
        onLoadMoreVariants={loadMoreVariants}
        storeId={storeId}
        onStoreIdChange={setStoreId}
        name={name}
        surname={surname}
        phoneNumber={phoneNumber}
        email={email}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        initialPaymentAmount={initialPaymentAmount}
        onInitialPaymentAmountChange={setInitialPaymentAmount}
        note={note}
        onNoteChange={setNote}
        lines={lines}
        onChangeLine={onChangeLine}
        onApplyVariantPreset={applyVariantPreset}
        onAddLine={addLine}
        onRemoveLine={removeLine}
        errors={errors}
        onClearError={(field) => setErrors((prev) => ({ ...prev, [field]: undefined }))}
        formError={formError}
        success={success}
        onClose={closeSaleDrawer}
        onSubmit={onSubmit}
      />

      <Drawer
        open={paymentDrawerOpen}
        onClose={closePaymentDrawer}
        side="right"
        title={editingPaymentId ? "Odeme Guncelle" : "Odeme Ekle"}
        description="Satis fisine odeme adimi ekleyin veya duzenleyin."
        closeDisabled={paymentSubmitting}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              onClick={closePaymentDrawer}
              variant="secondary"
              disabled={paymentSubmitting}
            />
            <Button
              label={paymentSubmitting ? "Kaydediliyor..." : "Kaydet"}
              onClick={submitPayment}
              variant="primarySolid"
              loading={paymentSubmitting}
            />
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Tutar *</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={paymentAmount}
              onChange={(e) => {
                if (paymentFormError) setPaymentFormError("");
                setPaymentAmount(e.target.value);
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Odeme Yontemi *</label>
            <SearchableDropdown
              options={PAYMENT_METHOD_OPTIONS}
              value={paymentMethodInput}
              onChange={(value) => {
                if (paymentFormError) setPaymentFormError("");
                setPaymentMethodInput(normalizePaymentMethod(value));
              }}
              placeholder="Odeme yontemi secin"
              showEmptyOption={false}
              allowClear={false}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Para Birimi *</label>
            <SearchableDropdown
              options={CURRENCY_OPTIONS}
              value={paymentCurrency}
              onChange={(value) => {
                if (paymentFormError) setPaymentFormError("");
                setPaymentCurrency(normalizeCurrency(value));
              }}
              showEmptyOption={false}
              allowClear={false}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Not</label>
            <textarea
              value={paymentNoteInput}
              onChange={(e) => {
                if (paymentFormError) setPaymentFormError("");
                setPaymentNoteInput(e.target.value);
              }}
              className="min-h-[88px] w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {paymentFormError && <p className="text-sm text-error">{paymentFormError}</p>}
        </div>
      </Drawer>

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Satis Fisini Iptal Et"
        description="Bu satis fisini iptal etmek istiyor musunuz?"
        confirmLabel="Evet"
        cancelLabel="Hayir"
        loading={cancellingSale}
        loadingLabel="Iptal ediliyor..."
        onConfirm={confirmCancelSale}
        onClose={closeCancelDialog}
      >
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Sebep</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Orn: Musteri vazgecti"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
            <textarea
              value={cancelNote}
              onChange={(e) => setCancelNote(e.target.value)}
              placeholder="Orn: Telefon ile iptal"
              className="min-h-18 w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={paymentDeleteDialogOpen}
        title="Odeme Kaydini Sil"
        description="Bu odeme kaydini silmek istiyor musunuz?"
        confirmLabel="Evet"
        cancelLabel="Hayir"
        loading={deletingPayment}
        loadingLabel="Siliniyor..."
        onConfirm={confirmDeletePayment}
        onClose={closeDeletePaymentDialog}
      />

      <SaleDetailModal
        open={saleDetailOpen}
        loading={saleDetailLoading}
        error={saleDetailError}
        detail={saleDetail}
        onClose={closeSaleDetailDialog}
      />
    </div>
  );
}
