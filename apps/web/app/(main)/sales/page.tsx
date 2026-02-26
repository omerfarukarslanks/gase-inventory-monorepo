"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getSessionUser,
  getSessionUserStoreIds,
  getSessionUserStoreType,
} from "@/lib/authz";
import { getTenantStockSummary } from "@/lib/inventory";
import { getPaginationValue, normalizeProducts } from "@/lib/normalize";
import { useStores } from "@/hooks/useStores";
import { createCustomer, type CreateCustomerRequest, type Customer } from "@/lib/customers";
import { getProductPackages } from "@/lib/product-packages";
import {
  cancelSale,
  createSale,
  createSalePayment,
  createSaleReturn,
  deleteSalePayment,
  downloadSaleReceipt,
  getSaleById,
  getSalePayments,
  getSales,
  updateSalePayment,
  updateSale,
  type CreateSalePayload,
  type CreateSaleReturnLine,
  type PaymentMethod,
  type SalePayment,
  type UpdateSalePayload,
  type SaleDetail,
  type SaleDetailLine,
  type SaleListItem,
  type CreateSaleLinePayload,
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

function toFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toCurrency(value: unknown): Currency {
  if (value === "TRY" || value === "USD" || value === "EUR") return value;
  return "TRY";
}

function resolvePackageItemStockText(item: unknown): string {
  if (!item || typeof item !== "object") return "-";
  const node = item as Record<string, unknown>;
  const variantNode =
    node.productVariant && typeof node.productVariant === "object"
      ? (node.productVariant as Record<string, unknown>)
      : null;

  const candidates: unknown[] = [
    node.stock,
    node.stockQuantity,
    node.availableStock,
    node.totalStock,
    node.currentStock,
    node.onHand,
    node.availableQuantity,
    node.totalQuantity,
    node.currentQuantity,
    variantNode?.stockQuantity,
    variantNode?.availableStock,
    variantNode?.totalStock,
    variantNode?.currentStock,
    variantNode?.availableQuantity,
    variantNode?.totalQuantity,
    variantNode?.currentQuantity,
    variantNode?.onHand,
  ];

  for (const candidate of candidates) {
    const numeric = toFiniteNumber(candidate);
    if (numeric != null) return String(numeric);
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  return "-";
}

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
  const [salesPaymentStatusFilter, setSalesPaymentStatusFilter] = useState("");
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

  /* ── Return drawer ── */
  const [returnDrawerOpen, setReturnDrawerOpen] = useState(false);
  const [returnTargetSale, setReturnTargetSale] = useState<SaleListItem | null>(null);
  const [returnLines, setReturnLines] = useState<
    Array<{ saleLineId: string; lineName: string; originalQuantity: number; returnQuantity: string; refundAmount: string }>
  >([]);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnFormError, setReturnFormError] = useState("");
  const [returnDetailLoading, setReturnDetailLoading] = useState(false);

  /* ── Sale detail modal ── */
  const [saleDetailOpen, setSaleDetailOpen] = useState(false);
  const [saleDetailLoading, setSaleDetailLoading] = useState(false);
  const [saleDetailError, setSaleDetailError] = useState("");
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);

  /* ── Variant options ── */
  const [variantOptions, setVariantOptions] = useState<
    Array<{ value: string; label: string; secondaryLabel?: string }>
  >([]);
  const [variantPresetsById, setVariantPresetsById] = useState<Record<string, VariantPreset>>({});
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [loadingMoreVariants, setLoadingMoreVariants] = useState(false);
  const [variantPage, setVariantPage] = useState(0);
  const [variantHasMore, setVariantHasMore] = useState(true);

  /* ── Scope ── */
  const [scopeReady, setScopeReady] = useState(false);
  const [isStoreScopedUser, setIsStoreScopedUser] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");
  const [isWholesaleStoreType, setIsWholesaleStoreType] = useState(false);

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
    const user = getSessionUser();
    const storeType = getSessionUserStoreType(user);
    const storeIds = getSessionUserStoreIds(user);
    setIsStoreScopedUser(false);
    setIsWholesaleStoreType(storeType === "WHOLESALE");
    setScopedStoreId(storeIds[0] ?? "");
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
      salesPaymentStatusFilter,
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
      if (isWholesaleStoreType) {
        const res = await getProductPackages({
          page: nextPage,
          limit: 100,
          isActive: true,
        });
        const packages = res.data ?? [];

        const optionMap = new Map<string, { value: string; label: string; secondaryLabel?: string }>();
        const presetMap: Record<string, VariantPreset> = {};

        packages.forEach((pkg) => {
          const stockInfo = (pkg.items ?? [])
            .map((item) => {
              const variantName = item.productVariant?.name ?? "Varyant";
              const variantCode = item.productVariant?.code ?? "-";
              const stockText = resolvePackageItemStockText(item);
              return `${variantName} (${variantCode}) Stok: ${stockText}`;
            })
            .join(" • ");

          optionMap.set(pkg.id, {
            value: pkg.id,
            label: pkg.name,
            secondaryLabel: stockInfo || "Varyant bilgisi yok",
          });

          if (!presetMap[pkg.id]) {
            presetMap[pkg.id] = {
              currency: toCurrency(pkg.defaultCurrency),
              unitPrice:
                toFiniteNumber(pkg.defaultSalePrice) ??
                toFiniteNumber(pkg.defaultLineTotal) ??
                null,
              discountPercent: toFiniteNumber(pkg.defaultDiscountPercent),
              discountAmount: toFiniteNumber(pkg.defaultDiscountAmount),
              taxPercent: toFiniteNumber(pkg.defaultTaxPercent),
              taxAmount: toFiniteNumber(pkg.defaultTaxAmount),
              lineTotal: toFiniteNumber(pkg.defaultLineTotal),
              stores: [],
            };
          }
        });

        setVariantPresetsById((prev) =>
          replace ? presetMap : { ...prev, ...presetMap },
        );

        setVariantOptions((prev) => {
          const map = new Map<string, { value: string; label: string; secondaryLabel?: string }>();
          (replace ? [] : prev).forEach((item) => map.set(item.value, item));
          optionMap.forEach((item, key) => {
            if (!map.has(key)) map.set(key, item);
          });
          return Array.from(map.values());
        });

        const totalPages = res.meta?.totalPages ?? 1;
        setVariantHasMore(nextPage < totalPages);
        setVariantPage(nextPage);
      } else {
        const res = await getTenantStockSummary({ page: nextPage, limit: 100 });
        const nextProducts = normalizeProducts(res);
        const nextOptions = nextProducts.flatMap((product) =>
          (product.variants ?? []).map((variant) => ({
            value: variant.productVariantId,
            label: product.productName,
            secondaryLabel: `${variant.variantName} | Stok: ${variant.totalQuantity}`,
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
          const map = new Map<string, { value: string; label: string; secondaryLabel?: string }>();
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
      }
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
  }, [isWholesaleStoreType]);

  useEffect(() => {
    if (!scopeReady) return;
    void fetchVariantPage(1, true);
  }, [fetchVariantPage, scopeReady]);

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
              productVariantId: line.productVariantId ?? line.productPackageId ?? "",
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

  /* ── Return drawer ── */
  const openReturnDrawer = async (sale: SaleListItem) => {
    setReturnTargetSale(sale);
    setReturnNotes("");
    setReturnFormError("");
    setReturnLines([]);
    setReturnDrawerOpen(true);
    setReturnDetailLoading(true);
    try {
      const response = await getSaleById(sale.id);
      const detail = normalizeSaleDetail(response);
      if (!detail) {
        setReturnFormError("Satis detayi alinamadi.");
        return;
      }
      setReturnLines(
        detail.lines.map((line: SaleDetailLine) => ({
          saleLineId: line.id,
          lineName:
            line.productVariantName ??
            line.productPackageName ??
            line.productName ??
            line.id,
          originalQuantity: line.quantity ?? 0,
          returnQuantity: "",
          refundAmount: "",
        })),
      );
    } catch {
      setReturnFormError("Satis satirlari yuklenemedi.");
    } finally {
      setReturnDetailLoading(false);
    }
  };

  const closeReturnDrawer = () => {
    if (returnSubmitting) return;
    setReturnDrawerOpen(false);
    setReturnTargetSale(null);
    setReturnLines([]);
    setReturnFormError("");
  };

  const submitReturn = async () => {
    if (!returnTargetSale) return;
    const activeLines = returnLines.filter(
      (l) => l.returnQuantity !== "" && Number(l.returnQuantity) > 0,
    );
    if (activeLines.length === 0) {
      setReturnFormError("En az bir satir icin iade adedi girin.");
      return;
    }
    const invalidLine = activeLines.some((l) => {
      const qty = Number(l.returnQuantity);
      return !Number.isFinite(qty) || qty <= 0 || qty > l.originalQuantity;
    });
    if (invalidLine) {
      setReturnFormError("Iade adedi 0'dan buyuk ve orijinal adedi gecmemelidir.");
      return;
    }

    setReturnSubmitting(true);
    setReturnFormError("");
    try {
      const lines: CreateSaleReturnLine[] = activeLines.map((l) => ({
        saleLineId: l.saleLineId,
        quantity: Number(l.returnQuantity),
        ...(l.refundAmount !== "" && Number(l.refundAmount) >= 0
          ? { refundAmount: Number(l.refundAmount) }
          : {}),
      }));
      await createSaleReturn(returnTargetSale.id, {
        lines,
        notes: returnNotes.trim() || undefined,
      });
      setSuccess("Iade olusturuldu.");
      setReturnDrawerOpen(false);
      setReturnTargetSale(null);
      setReturnLines([]);
      await fetchSalesReceipts();
    } catch {
      setReturnFormError("Iade olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleDownloadReceipt = async (saleId: string) => {
    try {
      const blob = await downloadSaleReceipt(saleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fis-${saleId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setSalesError("Fis indirilemedi. Lutfen tekrar deneyin.");
    }
  };

  /* ── Validation ── */
  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!customerId) nextErrors.customerId = "Musteri secimi zorunludur.";
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
        nextErrors.lines = isWholesaleStoreType
          ? "Tum satirlarda paket, adet ve birim fiyat alanlari gecerli olmalidir."
          : "Tum satirlarda varyant, adet ve birim fiyat alanlari gecerli olmalidir.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ── Submit ── */
  const buildLinePayloads = (): CreateSaleLinePayload[] =>
    lines.map((line) => {
      const common = {
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
      };

      if (isWholesaleStoreType) {
        return {
          productPackageId: line.productVariantId,
          ...common,
        };
      }

      return {
        productVariantId: line.productVariantId,
        ...common,
      };
    });

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
          ...(isStoreScopedUser ? {} : { storeId }),
          customerId,
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
        paymentStatusFilter={salesPaymentStatusFilter}
        onPaymentStatusFilterChange={setSalesPaymentStatusFilter}
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
        onReturn={(sale) => void openReturnDrawer(sale)}
        onDownloadReceipt={(id) => void handleDownloadReceipt(id)}
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
        variantFieldLabel={isWholesaleStoreType ? "Paket *" : "Varyant *"}
        variantPlaceholder={isWholesaleStoreType ? "Paket secin" : "Varyant secin"}
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

      <Drawer
        open={returnDrawerOpen}
        onClose={closeReturnDrawer}
        side="right"
        title="Iade Olustur"
        description={
          returnTargetSale
            ? `Fis: ${returnTargetSale.receiptNo ?? returnTargetSale.id}`
            : "Iade edilecek satirlari ve adetleri secin."
        }
        closeDisabled={returnSubmitting}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              onClick={closeReturnDrawer}
              variant="secondary"
              disabled={returnSubmitting}
            />
            <Button
              label={returnSubmitting ? "Gonderiliyor..." : "Iadeyi Onayla"}
              onClick={submitReturn}
              variant="primarySolid"
              loading={returnSubmitting}
            />
          </div>
        }
      >
        <div className="space-y-4 p-5">
          {returnDetailLoading ? (
            <p className="text-sm text-muted">Satis satirlari yukleniyor...</p>
          ) : returnLines.length === 0 && !returnFormError ? (
            <p className="text-sm text-muted">Bu satisa ait satir bulunamadi.</p>
          ) : (
            <>
              <div className="space-y-3">
                {returnLines.map((line, idx) => (
                  <div
                    key={line.saleLineId}
                    className="rounded-xl border border-border bg-surface2/40 p-3 space-y-2"
                  >
                    <p className="text-sm font-medium text-text">
                      {line.lineName}
                      <span className="ml-2 text-xs text-muted font-normal">
                        (Adet: {line.originalQuantity})
                      </span>
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">
                          Iade Adedi
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={line.originalQuantity}
                          step={1}
                          value={line.returnQuantity}
                          onChange={(e) => {
                            if (returnFormError) setReturnFormError("");
                            setReturnLines((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, returnQuantity: e.target.value } : l,
                              ),
                            );
                          }}
                          placeholder="0"
                          className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">
                          Iade Tutari (opsiyonel)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.refundAmount}
                          onChange={(e) => {
                            if (returnFormError) setReturnFormError("");
                            setReturnLines((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, refundAmount: e.target.value } : l,
                              ),
                            );
                          }}
                          placeholder="0.00"
                          className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Notlar</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="Iade nedeni veya ek aciklama..."
                  className="min-h-[80px] w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}

          {returnFormError && (
            <p className="text-sm text-error">{returnFormError}</p>
          )}
        </div>
      </Drawer>
    </div>
  );
}
