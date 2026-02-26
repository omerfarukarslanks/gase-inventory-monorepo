"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionUser, getSessionUserStoreIds } from "@/lib/authz";
import {
  adjustInventory,
  getTenantStockSummary,
  getVariantStockByStore,
  transferInventory,
  type InventoryAdjustItem,
  type InventoryAdjustSinglePayload,
  type InventoryReceiveItem,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryTransferPayload,
  type InventoryVariantStockItem,
} from "@/lib/inventory";
import type { Currency, ProductVariant } from "@/lib/products";
import type { StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useStores } from "@/hooks/useStores";
import { normalizeStoreItems, normalizeProducts, getPaginationValue } from "@/lib/normalize";

import StockFilters from "@/components/stock/StockFilters";
import StockTable, { type VariantActionParams } from "@/components/stock/StockTable";
import StockPagination from "@/components/stock/StockPagination";
import AdjustDrawer, { type AdjustTarget } from "@/components/stock/AdjustDrawer";
import TransferDrawer, {
  type TransferTarget,
  type TransferFormState,
} from "@/components/stock/TransferDrawer";

/* ── Page ── */

export default function StockPage() {
  /* ── List state ── */
  const [products, setProducts] = useState<InventoryProductStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilterIds, setStoreFilterIds] = useState<string[]>([]);
  const debouncedSearch = useDebounceStr(searchTerm, 400);
  const [scopeReady, setScopeReady] = useState(false);
  const [isStoreScopedUser, setIsStoreScopedUser] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");

  useEffect(() => {
    const user = getSessionUser();
    const storeIds = getSessionUserStoreIds(user);
    setIsStoreScopedUser(false);
    setScopedStoreId(storeIds[0] ?? "");
    setScopeReady(true);
  }, []);
  const applyStoreScope = useCallback(
    (items: InventoryStoreStockItem[]) => {
      if (!isStoreScopedUser) return items;
      return items.filter((item) => item.storeId === scopedStoreId);
    },
    [isStoreScopedUser, scopedStoreId],
  );

  /* ── Variant store cache ── */
  const [variantStoresById, setVariantStoresById] = useState<
    Record<string, InventoryStoreStockItem[]>
  >({});
  const [variantStoresLoadingById, setVariantStoresLoadingById] = useState<
    Record<string, boolean>
  >({});

  /* ── Stores ── */
  const stores = useStores();

  /* ── Adjust drawer ── */
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustFormError, setAdjustFormError] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null);
  const [adjustInitial, setAdjustInitial] = useState<
    Record<string, StockEntryInitialEntry[]>
  >({});
  const [adjustApplyToAllStores, setAdjustApplyToAllStores] = useState(false);

  /* ── Transfer drawer ── */
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFormError, setTransferFormError] = useState("");
  const [transferTarget, setTransferTarget] = useState<TransferTarget | null>(null);
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    fromStoreId: "",
    toStoreId: "",
    quantity: "",
    reason: "",
    note: "",
  });

  /* ── Responsive ── */
  const isMobile = !useMediaQuery();

  /* ── Derived ── */
  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const adjustFormVariant = useMemo<ProductVariant[]>(
    () =>
      adjustTarget
        ? [
            {
              id: adjustTarget.productVariantId,
              name: adjustTarget.variantName,
              code: adjustTarget.variantName,
            },
          ]
        : [],
    [adjustTarget],
  );

  const adjustFormCurrency = useMemo<Currency>(() => {
    if (!adjustTarget) return "TRY";
    const storesForVariant = variantStoresById[adjustTarget.productVariantId] ?? [];
    const currency = storesForVariant[0]?.currency;
    if (currency === "TRY" || currency === "USD" || currency === "EUR") return currency;
    return "TRY";
  }, [adjustTarget, variantStoresById]);

  const filteredProducts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => {
      if (product.productName.toLowerCase().includes(q)) return true;
      return (product.variants ?? []).some((variant) => {
        if (variant.variantName.toLowerCase().includes(q)) return true;
        if ((variant.variantCode ?? "").toLowerCase().includes(q)) return true;
        return (variantStoresById[variant.productVariantId] ?? variant.stores ?? []).some(
          (store) => store.storeName.toLowerCase().includes(q),
        );
      });
    });
  }, [products, debouncedSearch, variantStoresById]);

  /* ── Fetchers ── */

  const fetchTenantSummary = useCallback(async () => {
    if (!scopeReady) return;
    setLoading(true);
    setError("");
    try {
      const effectiveStoreIds =
        !isStoreScopedUser && storeFilterIds.length > 0
          ? storeFilterIds
          : undefined;

      const res = await getTenantStockSummary({
        page,
        limit,
        storeIds: effectiveStoreIds,
        search: debouncedSearch || undefined,
      });
      setProducts(normalizeProducts(res));
      setTotal(getPaginationValue(res, "total"));

      const nextTotalPages = getPaginationValue(res, "totalPages");
      if (nextTotalPages > 0) {
        setTotalPages(nextTotalPages);
      } else {
        const total = getPaginationValue(res, "total");
        if (total > 0) setTotalPages(Math.max(1, Math.ceil(total / limit)));
        else setTotalPages(1);
      }
    } catch {
      setProducts([]);
      setTotal(0);
      setError("Stok ozeti yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, storeFilterIds, debouncedSearch, isStoreScopedUser, scopeReady]);

  const fetchVariantStores = useCallback(
    async (variantId: string) => {
      if (!variantId || variantStoresLoadingById[variantId]) return;
      setVariantStoresLoadingById((prev) => ({ ...prev, [variantId]: true }));
      try {
        const res = await getVariantStockByStore(variantId);
        const scopedItems = applyStoreScope(normalizeStoreItems(res));
        setVariantStoresById((prev) => ({
          ...prev,
          [variantId]: scopedItems,
        }));
      } catch {
        setVariantStoresById((prev) => ({ ...prev, [variantId]: [] }));
      } finally {
        setVariantStoresLoadingById((prev) => ({ ...prev, [variantId]: false }));
      }
    },
    [variantStoresLoadingById, applyStoreScope],
  );

  useEffect(() => {
    fetchTenantSummary();
  }, [fetchTenantSummary]);

  useEffect(() => {
    setPage(1);
  }, [storeFilterIds, debouncedSearch]);

  const getVariantStores = useCallback(
    (variant: InventoryVariantStockItem) => {
      const cached = variantStoresById[variant.productVariantId];
      if (cached && cached.length > 0) return cached;
      return variant.stores ?? [];
    },
    [variantStoresById],
  );

  /* ── Resolve stores for a variant (fetch if missing) ── */

  const resolveVariantStores = async (
    variantId: string,
    fallback: InventoryStoreStockItem[],
  ): Promise<InventoryStoreStockItem[]> => {
    if (fallback.length > 0) return fallback;
    try {
      const res = await getVariantStockByStore(variantId);
      const normalized = applyStoreScope(normalizeStoreItems(res));
      setVariantStoresById((prev) => ({ ...prev, [variantId]: normalized }));
      return normalized;
    } catch {
      return [];
    }
  };

  /* ── Adjust handlers ── */

  const openAdjustDrawer = async (params: VariantActionParams) => {
    setAdjustFormError("");
    setAdjustLoading(true);
    setAdjustTarget({
      productVariantId: params.productVariantId,
      productName: params.productName,
      variantName: params.variantName,
    });

    const normalizedStores = await resolveVariantStores(
      params.productVariantId,
      params.stores,
    );

    setAdjustInitial({
      [params.productVariantId]: normalizedStores.map((store) => ({
        storeId: store.storeId,
        quantity: store.quantity,
        unitPrice: store.salePrice ?? 0,
        currency:
          store.currency === "TRY" || store.currency === "USD" || store.currency === "EUR"
            ? store.currency
            : "TRY",
        taxMode: "percent",
        taxPercent: store.taxPercent ?? undefined,
        discountMode: "percent",
        discountPercent: store.discountPercent ?? undefined,
      })),
    });

    setAdjustOpen(true);
    setAdjustLoading(false);
  };

  const closeAdjustDrawer = () => {
    if (adjustSubmitting) return;
    setAdjustOpen(false);
    setAdjustTarget(null);
    setAdjustInitial({});
    setAdjustApplyToAllStores(false);
    setAdjustFormError("");
  };

  const submitAdjust = async (items: InventoryReceiveItem[]) => {
    if (!adjustTarget) return;

    if (items.length === 0) {
      setAdjustFormError("En az bir magaza satiri doldurulmalidir.");
      return;
    }

    const usedStoreIds = new Set<string>();
    for (const item of items) {
      if (usedStoreIds.has(item.storeId)) {
        setAdjustFormError("Ayni magaza birden fazla kez secilemez.");
        return;
      }
      usedStoreIds.add(item.storeId);
    }

    setAdjustSubmitting(true);
    setAdjustFormError("");
    try {
      const adjustItems: InventoryAdjustItem[] = items.map((item) => ({
        storeId: item.storeId,
        productVariantId: item.productVariantId,
        newQuantity: item.quantity,
        meta: item.meta ? { reason: item.meta.reason, note: item.meta.note } : {},
      }));

      if (isStoreScopedUser) {
        const scopedPayload: InventoryAdjustSinglePayload = {
          productVariantId: adjustTarget.productVariantId,
          newQuantity: adjustItems[0]?.newQuantity ?? 0,
          meta: adjustItems[0]?.meta ?? {},
        };
        await adjustInventory(scopedPayload);
      } else if (adjustApplyToAllStores) {
        const applyAllPayload: InventoryAdjustSinglePayload = {
          productVariantId: adjustTarget.productVariantId,
          newQuantity: adjustItems[0]?.newQuantity ?? 0,
          applyToAllStores: true,
          meta: adjustItems[0]?.meta ?? {},
        };
        await adjustInventory(applyAllPayload);
      } else if (adjustItems.length > 1) {
        await adjustInventory({ items: adjustItems });
      } else {
        await adjustInventory(adjustItems[0]);
      }
      setSuccess("Stok duzeltme kaydedildi.");
      closeAdjustDrawer();
      await fetchTenantSummary();
      await fetchVariantStores(adjustTarget.productVariantId);
    } catch {
      setAdjustFormError("Stok duzeltme yapilamadi.");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  /* ── Transfer handlers ── */

  const openTransferDrawer = async (params: VariantActionParams) => {
    setTransferFormError("");
    setTransferLoading(true);

    const normalizedStores = await resolveVariantStores(
      params.productVariantId,
      params.stores,
    );

    setTransferTarget({
      productVariantId: params.productVariantId,
      productName: params.productName,
      variantName: params.variantName,
      stores: normalizedStores,
    });
    setTransferForm({
      fromStoreId: "",
      toStoreId: "",
      quantity: "",
      reason: "",
      note: "",
    });
    setTransferOpen(true);
    setTransferLoading(false);
  };

  const closeTransferDrawer = () => {
    if (transferSubmitting) return;
    setTransferOpen(false);
    setTransferTarget(null);
    setTransferFormError("");
  };

  const submitTransfer = async () => {
    if (!transferTarget) return;
    if (!transferForm.fromStoreId) {
      setTransferFormError("Kaynak magaza secimi zorunludur.");
      return;
    }
    if (!transferForm.toStoreId) {
      setTransferFormError("Hedef magaza secimi zorunludur.");
      return;
    }
    if (transferForm.fromStoreId === transferForm.toStoreId) {
      setTransferFormError("Kaynak ve hedef magaza ayni olamaz.");
      return;
    }
    if (!transferForm.quantity || Number(transferForm.quantity) <= 0) {
      setTransferFormError("Adet 0'dan buyuk olmalidir.");
      return;
    }

    const qty = Number(transferForm.quantity);
    const fromStore = transferTarget.stores.find(
      (s) => s.storeId === transferForm.fromStoreId,
    );
    const available = Number(fromStore?.quantity ?? 0);
    if (qty > available) {
      setTransferFormError("Transfer adedi, kaynak magazadaki stoktan fazla olamaz.");
      return;
    }

    const payload: InventoryTransferPayload = {
      fromStoreId: transferForm.fromStoreId,
      toStoreId: transferForm.toStoreId,
      productVariantId: transferTarget.productVariantId,
      quantity: qty,
      meta: {
        reason: transferForm.reason || undefined,
        note: transferForm.note || undefined,
      },
    };

    setTransferSubmitting(true);
    setTransferFormError("");
    try {
      await transferInventory(payload);
      setSuccess("Stok transferi kaydedildi.");
      closeTransferDrawer();
      await fetchTenantSummary();
      await fetchVariantStores(transferTarget.productVariantId);
    } catch {
      setTransferFormError("Stok transferi yapilamadi.");
    } finally {
      setTransferSubmitting(false);
    }
  };

  /* ── Render ── */

  return (
    <div className="space-y-4">
      <StockFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        storeFilterIds={storeFilterIds}
        onStoreFilterChange={setStoreFilterIds}
        storeOptions={storeOptions}
        showStoreFilter={!isStoreScopedUser}
      />

      {success && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      )}

      <StockTable
        products={filteredProducts}
        loading={loading}
        error={error}
        getVariantStores={getVariantStores}
        onAdjust={openAdjustDrawer}
        onTransfer={openTransferDrawer}
        footer={
          !loading && !error ? (
            <StockPagination
              page={page}
              totalPages={totalPages}
              limit={limit}
              total={total}
              loading={loading}
              onPageChange={setPage}
              onLimitChange={(next) => {
                setLimit(next);
                setPage(1);
              }}
            />
          ) : null
        }
      />

      <AdjustDrawer
        open={adjustOpen}
        loading={adjustLoading}
        submitting={adjustSubmitting}
        formError={adjustFormError}
        target={adjustTarget}
        variants={adjustFormVariant}
        currency={adjustFormCurrency}
        stores={stores}
        initialEntriesByVariant={adjustInitial}
        isMobile={isMobile}
        showStoreSelector={!isStoreScopedUser && !adjustApplyToAllStores}
        showApplyToAllStores={!isStoreScopedUser}
        applyToAllStores={adjustApplyToAllStores}
        onApplyToAllStoresChange={setAdjustApplyToAllStores}
        fixedStoreId={isStoreScopedUser ? scopedStoreId : undefined}
        onClose={closeAdjustDrawer}
        onSubmit={submitAdjust}
      />

      <TransferDrawer
        open={transferOpen}
        loading={transferLoading}
        submitting={transferSubmitting}
        formError={transferFormError}
        target={transferTarget}
        form={transferForm}
        allStoreOptions={storeOptions}
        isMobile={isMobile}
        onClose={closeTransferDrawer}
        onFormChange={(patch) => setTransferForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={submitTransfer}
      />

    </div>
  );
}
