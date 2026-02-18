"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionUser, getSessionUserRole, getSessionUserStoreIds, isStoreScopedRole } from "@/lib/authz";
import { getTenantStockSummary } from "@/lib/inventory";
import { getPaginationValue, normalizeProducts } from "@/lib/normalize";
import { useStores } from "@/hooks/useStores";
import {
  cancelSale,
  createSale,
  getSaleById,
  getSales,
  type CreateSalePayload,
  type SaleDetail,
  type SaleListItem,
} from "@/lib/sales";
import { toNumberOrNull } from "@/lib/format";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

import {
  type SaleLineForm,
  type FieldErrors,
  type VariantPreset,
  type VariantStorePreset,
  createLineRow,
  calcLineTotal,
} from "@/components/sales/types";
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

  /* ── Cancel dialog ── */
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelTargetSale, setCancelTargetSale] = useState<SaleListItem | null>(null);
  const [cancellingSale, setCancellingSale] = useState(false);

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
  const [storeId, setStoreId] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [source, setSource] = useState("POS");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<SaleLineForm[]>([createLineRow()]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

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
    setStoreId(isStoreScopedUser ? scopedStoreId : "");
    setName("");
    setSurname("");
    setPhoneNumber("");
    setEmail("");
    setSource("POS");
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

  /* ── Cancel handlers ── */
  const openCancelDialog = (sale: SaleListItem) => {
    setCancelTargetSale(sale);
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
      await cancelSale(cancelTargetSale.id);
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
    if (!name.trim()) nextErrors.name = "Ad zorunludur.";
    if (!surname.trim()) nextErrors.surname = "Soyad zorunludur.";
    if (!isStoreScopedUser && !storeId) nextErrors.storeId = "Magaza secimi zorunludur.";

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
  const onSubmit = async () => {
    setFormError("");
    setSuccess("");
    if (!validate()) return;

    const payload: CreateSalePayload = {
      ...(isStoreScopedUser ? {} : { storeId }),
      name: name.trim(),
      surname: surname.trim(),
      phoneNumber: phoneNumber.trim() || undefined,
      email: email.trim() || undefined,
      meta: {
        source: source.trim() || undefined,
        note: note.trim() || undefined,
      },
      lines: lines.map((line) => ({
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
      })),
    };

    setSubmitting(true);
    try {
      await createSale(payload);
      setSuccess("Satis kaydi olusturuldu.");
      resetSaleForm();
      setSaleDrawerOpen(false);
      setSalesPage(1);
      await fetchSalesReceipts(1);
    } catch {
      setFormError("Satis olusturulamadi. Lutfen tekrar deneyin.");
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
        onOpenDetail={(id) => void openSaleDetailDialog(id)}
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
        submitting={submitting}
        scopeReady={scopeReady}
        loadingVariants={loadingVariants}
        isStoreScopedUser={isStoreScopedUser}
        storeOptions={storeOptions}
        variantOptions={variantOptions}
        loadingMoreVariants={loadingMoreVariants}
        variantHasMore={variantHasMore}
        onLoadMoreVariants={loadMoreVariants}
        storeId={storeId}
        onStoreIdChange={setStoreId}
        name={name}
        onNameChange={setName}
        surname={surname}
        onSurnameChange={setSurname}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        email={email}
        onEmailChange={setEmail}
        source={source}
        onSourceChange={setSource}
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
