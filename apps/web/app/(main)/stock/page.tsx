"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getStores, type Store } from "@/lib/stores";
import { getSessionUser, getSessionUserRole, getSessionUserStoreIds, isStoreScopedRole } from "@/lib/authz";
import {
  adjustInventory,
  adjustInventoryBulk,
  getTenantStockSummary,
  getVariantStockByStore,
  transferInventory,
  type InventoryAdjustPayload,
  type InventoryReceiveItem,
  type InventoryProductStockItem,
  type InventoryStoreStockItem,
  type InventoryTransferPayload,
  type InventoryVariantStockItem,
} from "@/lib/inventory";
import type { Currency, ProductVariant } from "@/lib/products";
import type { StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";

import StockFilters from "@/components/stock/StockFilters";
import StockTable, { type VariantActionParams } from "@/components/stock/StockTable";
import StockPagination from "@/components/stock/StockPagination";
import AdjustDrawer, { type AdjustTarget } from "@/components/stock/AdjustDrawer";
import TransferDrawer, {
  type TransferTarget,
  type TransferFormState,
} from "@/components/stock/TransferDrawer";

/* ── Hooks ── */

function useDebounceStr(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/* ── Normalize helpers ── */

function asObject(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return 0;
}

function normalizeStoreItems(payload: unknown): InventoryStoreStockItem[] {
  const root = asObject(payload);
  const dataNode = asObject(root?.data);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.items)
      ? root?.items
      : Array.isArray(dataNode?.items)
        ? dataNode?.items
        : Array.isArray(root?.data)
          ? root?.data
          : [];

  return rawItems
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      storeId: pickString(item.storeId, asObject(item.store)?.id),
      storeName: pickString(item.storeName, asObject(item.store)?.name, "-"),
      quantity: pickNumber(item.quantity, item.totalQuantity),
      totalQuantity: pickNumber(item.totalQuantity, item.quantity),
      salePrice: item.salePrice == null ? null : pickNumber(item.salePrice),
      purchasePrice: item.purchasePrice == null ? null : pickNumber(item.purchasePrice),
      currency: (pickString(item.currency) || null) as Currency | null,
      taxPercent: item.taxPercent == null ? null : pickNumber(item.taxPercent),
      discountPercent: item.discountPercent == null ? null : pickNumber(item.discountPercent),
      isStoreOverride: Boolean(item.isStoreOverride),
    }));
}

function normalizeProducts(payload: unknown): InventoryProductStockItem[] {
  const root = asObject(payload);
  const dataNode = asObject(root?.data);
  const rawItems = Array.isArray(root?.items)
    ? root?.items
    : Array.isArray(dataNode?.items)
      ? dataNode?.items
      : Array.isArray(root?.data)
        ? root?.data
        : [];

  return rawItems
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const rawVariants = Array.isArray(item.variants) ? item.variants : [];
      const variants: InventoryVariantStockItem[] = rawVariants
        .map((variant) => asObject(variant))
        .filter((variant): variant is Record<string, unknown> => Boolean(variant))
        .map((variant) => ({
          productVariantId: pickString(variant.productVariantId, variant.variantId),
          variantName: pickString(variant.variantName, variant.name, "-"),
          variantCode: pickString(variant.variantCode, variant.code),
          totalQuantity: pickNumber(variant.totalQuantity, variant.quantity),
          stores: normalizeStoreItems(variant.stores),
        }))
        .filter((variant) => Boolean(variant.productVariantId));

      return {
        productId: pickString(item.productId, item.id),
        productName: pickString(item.productName, item.name, "-"),
        totalQuantity: pickNumber(item.totalQuantity, item.quantity),
        variants,
      };
    })
    .filter((product) => Boolean(product.productId));
}

function getPaginationValue(
  payload: unknown,
  key: "totalPages" | "total" | "page" | "limit",
): number {
  const root = asObject(payload);
  const metaNode = asObject(root?.meta);
  const dataNode = asObject(root?.data);

  const fromRoot = Number(root?.[key]);
  if (!Number.isNaN(fromRoot) && fromRoot > 0) return fromRoot;

  const fromMeta = Number(metaNode?.[key]);
  if (!Number.isNaN(fromMeta) && fromMeta > 0) return fromMeta;

  const fromData = Number(dataNode?.[key]);
  if (!Number.isNaN(fromData) && fromData > 0) return fromData;

  return 0;
}

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
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilterIds, setStoreFilterIds] = useState<string[]>([]);
  const debouncedSearch = useDebounceStr(searchTerm, 400);
  const [scopeReady, setScopeReady] = useState(false);
  const [isStoreScopedUser, setIsStoreScopedUser] = useState(false);
  const [scopedStoreId, setScopedStoreId] = useState("");

  useEffect(() => {
    const role = getSessionUserRole();
    const user = getSessionUser();
    const storeIds = getSessionUserStoreIds(user);
    setIsStoreScopedUser(isStoreScopedRole(role));
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
  const [stores, setStores] = useState<Store[]>([]);

  /* ── Adjust drawer ── */
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustFormError, setAdjustFormError] = useState("");
  const [adjustTarget, setAdjustTarget] = useState<AdjustTarget | null>(null);
  const [adjustInitial, setAdjustInitial] = useState<
    Record<string, StockEntryInitialEntry[]>
  >({});

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
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

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
              barcode: null,
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

  const fetchStores = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await getStores({ token, page: 1, limit: 100 });
      setStores(res.data);
    } catch {
      setStores([]);
    }
  }, []);

  const fetchTenantSummary = useCallback(async () => {
    if (!scopeReady) return;
    setLoading(true);
    setError("");
    try {
      if (isStoreScopedUser && !scopedStoreId) {
        setProducts([]);
        setTotalPages(1);
        setError("Kullaniciya ait magaza bulunamadi.");
        return;
      }

      const effectiveStoreIds = isStoreScopedUser
        ? [scopedStoreId]
        : storeFilterIds.length > 0
          ? storeFilterIds
          : undefined;

      const res = await getTenantStockSummary({
        page,
        limit,
        storeIds: effectiveStoreIds,
        search: debouncedSearch || undefined,
      });
      setProducts(normalizeProducts(res));

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
      setError("Stok ozeti yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, storeFilterIds, debouncedSearch, isStoreScopedUser, scopedStoreId, scopeReady]);

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
    fetchStores();
  }, [fetchStores]);

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
      const adjustItems: InventoryAdjustPayload[] = items.map((item) => ({
        storeId: item.storeId,
        productVariantId: item.productVariantId,
        newQuantity: item.quantity,
        meta: {
          reason: item.meta?.reason,
          note: item.meta?.note,
        },
      }));

      if (adjustItems.length > 1) {
        await adjustInventoryBulk(adjustItems);
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
      />

      <StockPagination
        page={page}
        totalPages={totalPages}
        limit={limit}
        loading={loading}
        onPageChange={setPage}
        onLimitChange={(next) => {
          setLimit(next);
          setPage(1);
        }}
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
        showStoreSelector={!isStoreScopedUser}
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
