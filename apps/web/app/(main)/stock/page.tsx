"use client";

import { Fragment, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { getStores, type Store } from "@/lib/stores";
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
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import StockEntryForm, { type StockEntryInitialEntry } from "@/components/inventory/StockEntryForm";
import { EditIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";

function useDebounceStr(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function formatNumber(value: number | null | undefined) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0";
  return numeric.toLocaleString("tr-TR", { maximumFractionDigits: 2 });
}

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
      currency: pickString(item.currency) as "TRY" | "USD" | "EUR" | "",
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

export default function StockPage() {
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

  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);

  const [variantStoresById, setVariantStoresById] = useState<Record<string, InventoryStoreStockItem[]>>({});
  const [variantStoresLoadingById, setVariantStoresLoadingById] = useState<Record<string, boolean>>({});

  const [stores, setStores] = useState<Store[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [transferDrawerOpen, setTransferDrawerOpen] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [transferFormError, setTransferFormError] = useState("");

  const [adjustTarget, setAdjustTarget] = useState<{
    productVariantId: string;
    productName: string;
    variantName: string;
  } | null>(null);
  const [adjustInitialEntriesByVariant, setAdjustInitialEntriesByVariant] = useState<Record<string, StockEntryInitialEntry[]>>({});
  const [transferTarget, setTransferTarget] = useState<{
    productVariantId: string;
    productName: string;
    variantName: string;
    stores: InventoryStoreStockItem[];
  } | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromStoreId: "",
    toStoreId: "",
    quantity: "",
    reason: "",
    note: "",
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const transferFromStoreOptions = useMemo(
    () => (transferTarget?.stores ?? []).map((s) => ({ value: s.storeId, label: s.storeName })),
    [transferTarget],
  );

  const transferToStoreOptions = useMemo(
    () => storeOptions.filter((s) => s.value !== transferForm.fromStoreId),
    [storeOptions, transferForm.fromStoreId],
  );

  const selectedFromStore = useMemo(
    () => transferTarget?.stores.find((s) => s.storeId === transferForm.fromStoreId) ?? null,
    [transferTarget, transferForm.fromStoreId],
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
        return (variantStoresById[variant.productVariantId] ?? variant.stores ?? []).some((store) =>
          store.storeName.toLowerCase().includes(q),
        );
      });
    });
  }, [products, debouncedSearch, variantStoresById]);

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
    setLoading(true);
    setError("");
    try {
      const res = await getTenantStockSummary({
        page,
        limit,
        storeIds: storeFilterIds.length > 0 ? storeFilterIds : undefined,
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
  }, [page, limit, storeFilterIds, debouncedSearch]);

  const fetchVariantStores = useCallback(async (variantId: string) => {
    if (!variantId || variantStoresLoadingById[variantId]) return;
    setVariantStoresLoadingById((prev) => ({ ...prev, [variantId]: true }));
    try {
      const res = await getVariantStockByStore(variantId);
      setVariantStoresById((prev) => ({
        ...prev,
        [variantId]: normalizeStoreItems(res),
      }));
    } catch {
      setVariantStoresById((prev) => ({ ...prev, [variantId]: [] }));
    } finally {
      setVariantStoresLoadingById((prev) => ({ ...prev, [variantId]: false }));
    }
  }, [variantStoresLoadingById]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    fetchTenantSummary();
  }, [fetchTenantSummary]);

  useEffect(() => {
    setPage(1);
  }, [storeFilterIds, debouncedSearch]);

  const getVariantStoresForEditor = useCallback((variant: InventoryVariantStockItem) => {
    const cached = variantStoresById[variant.productVariantId];
    if (cached && cached.length > 0) return cached;
    return variant.stores ?? [];
  }, [variantStoresById]);

  const toggleProduct = (productId: string) => {
    setExpandedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const openAdjustDrawer = async (params: {
    productVariantId: string;
    productName: string;
    variantName: string;
    stores: InventoryStoreStockItem[];
  }) => {
    setFormError("");
    setDrawerLoading(true);
    setAdjustTarget({
      productVariantId: params.productVariantId,
      productName: params.productName,
      variantName: params.variantName,
    });

    let normalizedStores = params.stores;
    if (normalizedStores.length === 0) {
      try {
        const res = await getVariantStockByStore(params.productVariantId);
        normalizedStores = normalizeStoreItems(res);
        setVariantStoresById((prev) => ({ ...prev, [params.productVariantId]: normalizedStores }));
      } catch {
        normalizedStores = [];
      }
    }

    setAdjustInitialEntriesByVariant({
      [params.productVariantId]: normalizedStores.map((store) => ({
        storeId: store.storeId,
        quantity: store.quantity,
        unitPrice: store.salePrice ?? 0,
        currency: (store.currency === "TRY" || store.currency === "USD" || store.currency === "EUR")
          ? store.currency
          : "TRY",
        taxMode: "percent",
        taxPercent: store.taxPercent ?? undefined,
        discountMode: "percent",
        discountPercent: store.discountPercent ?? undefined,
      })),
    });

    setDrawerOpen(true);
    setDrawerLoading(false);
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
    setAdjustTarget(null);
    setAdjustInitialEntriesByVariant({});
    setFormError("");
  };

  const openTransferDrawer = async (params: {
    productVariantId: string;
    productName: string;
    variantName: string;
    stores: InventoryStoreStockItem[];
  }) => {
    setTransferFormError("");
    setTransferLoading(true);

    let normalizedStores = params.stores;
    if (normalizedStores.length === 0) {
      try {
        const res = await getVariantStockByStore(params.productVariantId);
        normalizedStores = normalizeStoreItems(res);
        setVariantStoresById((prev) => ({ ...prev, [params.productVariantId]: normalizedStores }));
      } catch {
        normalizedStores = [];
      }
    }

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
    setTransferDrawerOpen(true);
    setTransferLoading(false);
  };

  const closeTransferDrawer = () => {
    if (transferSubmitting) return;
    setTransferDrawerOpen(false);
    setTransferTarget(null);
    setTransferFormError("");
  };

  const submitAdjustFromStockEntry = async (items: InventoryReceiveItem[]) => {
    if (!adjustTarget) return;

    if (items.length === 0) {
      setFormError("En az bir magaza satiri doldurulmalidir.");
      return;
    }

    const usedStoreIds = new Set<string>();
    for (const item of items) {
      if (usedStoreIds.has(item.storeId)) {
        setFormError("Ayni magaza birden fazla kez secilemez.");
        return;
      }
      usedStoreIds.add(item.storeId);
    }

    setSubmitting(true);
    setFormError("");
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
      closeDrawer();
      await fetchTenantSummary();
      await fetchVariantStores(adjustTarget.productVariantId);
    } catch {
      setFormError("Stok duzeltme yapilamadi.");
    } finally {
      setSubmitting(false);
    }
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
    const available = Number(selectedFromStore?.quantity ?? 0);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Stok Yonetimi</h1>
          <p className="text-sm text-muted">Urun {'>'} varyant {'>'} magaza bazinda stok ozetini yonetin</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Urun / varyant / magaza ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="w-full lg:w-72">
            <SearchableMultiSelectDropdown
              options={storeOptions}
              values={storeFilterIds}
              onChange={setStoreFilterIds}
              placeholder="Tum Magazalar"
            />
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      )}

      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        {loading ? (
          <div className="p-6 text-sm text-muted">Stok ozeti yukleniyor...</div>
        ) : error ? (
          <div className="p-6 text-sm text-error">{error}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">Gosterilecek stok verisi bulunamadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-10 px-2 py-3"></th>
                  <th className="px-4 py-3">Urun</th>
                  <th className="px-4 py-3 text-right">Miktar</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const productExpanded = expandedProductIds.includes(product.productId);
                  return (
                    <Fragment key={product.productId}>
                      <tr className="border-b border-border hover:bg-surface2/40">
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleProduct(product.productId)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform", productExpanded && "rotate-90")}>
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-text">{product.productName}</td>
                        <td className="px-4 py-3 text-right text-sm text-text">{formatNumber(product.totalQuantity)}</td>
                      </tr>

                      {productExpanded && (
                        <tr className="border-b border-border bg-surface/70">
                          <td></td>
                          <td colSpan={2} className="px-4 py-3">
                            <div className="overflow-hidden rounded-xl border border-border bg-surface2/30">
                              <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr] border-b border-border bg-surface2/60 px-3 py-2 text-[11px] uppercase tracking-wide text-muted">
                                <div>Varyant</div>
                                <div>Kod</div>
                                <div className="text-right">Miktar</div>
                                <div className="text-right">Islem</div>
                              </div>
                              <VirtualVariantRows
                                variants={product.variants ?? []}
                                productName={product.productName}
                                getVariantStoresForEditor={getVariantStoresForEditor}
                                onAdjust={openAdjustDrawer}
                                onTransfer={openTransferDrawer}
                              />
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex flex-wrap items-center justify-end gap-2 border border-border rounded-xl2 bg-surface px-4 py-3 text-xs text-muted">
        <label htmlFor="stockPageSize" className="text-xs text-muted">Satir:</label>
        <select
          id="stockPageSize"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>

        <Button label="Onceki" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading} variant="pagination" />
        <span>Sayfa: {page}/{Math.max(1, totalPages)}</span>
        <Button label="Sonraki" onClick={() => setPage((p) => Math.min(Math.max(1, totalPages), p + 1))} disabled={page >= totalPages || loading} variant="pagination" />
      </div>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        side="right"
        title="Stok Duzeltme"
        description={adjustTarget ? `${adjustTarget.productName} / ${adjustTarget.variantName}` : ""}
        closeDisabled={submitting}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[560px]")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button label="Iptal" type="button" onClick={closeDrawer} disabled={submitting} variant="secondary" />
          </div>
        }
      >
        <div className="space-y-3 p-5">
          {drawerLoading ? (
            <p className="text-sm text-muted">Magaza bilgileri yukleniyor...</p>
          ) : (
            <>
              <StockEntryForm
                variants={adjustFormVariant}
                productCurrency={adjustFormCurrency}
                stores={stores}
                initialEntriesByVariant={adjustInitialEntriesByVariant}
                mode="adjust"
                onSubmit={submitAdjustFromStockEntry}
                submitting={submitting}
              />
            </>
          )}

          {formError && <p className="text-sm text-error">{formError}</p>}
        </div>
      </Drawer>

      <Drawer
        open={transferDrawerOpen}
        onClose={closeTransferDrawer}
        side="right"
        title="Stok Transfer"
        description={transferTarget ? `${transferTarget.productName} / ${transferTarget.variantName}` : ""}
        closeDisabled={transferSubmitting}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[560px]")}
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button label="Iptal" type="button" onClick={closeTransferDrawer} disabled={transferSubmitting} variant="secondary" />
            <Button label="Transferi Kaydet" type="button" onClick={submitTransfer} loading={transferSubmitting} variant="primarySolid" />
          </div>
        )}
      >
        <div className="space-y-3 p-5">
          {transferLoading ? (
            <p className="text-sm text-muted">Transfer bilgileri yukleniyor...</p>
          ) : (
            <>
              <Field label="Hangi Magazadan *">
                <SearchableDropdown
                  options={transferFromStoreOptions}
                  value={transferForm.fromStoreId}
                  onChange={(value) => setTransferForm((prev) => ({ ...prev, fromStoreId: value }))}
                  placeholder="Kaynak magaza secin"
                  showEmptyOption={false}
                />
              </Field>

              <Field label="Hangi Magazaya *">
                <SearchableDropdown
                  options={transferToStoreOptions}
                  value={transferForm.toStoreId}
                  onChange={(value) => setTransferForm((prev) => ({ ...prev, toStoreId: value }))}
                  placeholder="Hedef magaza secin"
                  showEmptyOption={false}
                />
              </Field>

              {selectedFromStore && (
                <div className="rounded-xl border border-border bg-surface2/20 px-3 py-2 text-xs text-muted">
                  Kaynak magaza stok: <span className="font-semibold text-text">{formatNumber(selectedFromStore.quantity)}</span>
                </div>
              )}

              <Field label="Adet *">
                <input
                  type="number"
                  min={1}
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, quantity: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>

              <Field label="Sebep">
                <input
                  type="text"
                  value={transferForm.reason}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Transfer sebebi"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>

              <Field label="Not">
                <textarea
                  value={transferForm.note}
                  onChange={(e) => setTransferForm((prev) => ({ ...prev, note: e.target.value }))}
                  placeholder="Aciklama"
                  className="min-h-[90px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
            </>
          )}

          {transferFormError && <p className="text-sm text-error">{transferFormError}</p>}
        </div>
      </Drawer>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}

function VirtualVariantRows({
  variants,
  productName,
  getVariantStoresForEditor,
  onAdjust,
  onTransfer,
}: {
  variants: InventoryVariantStockItem[];
  productName: string;
  getVariantStoresForEditor: (variant: InventoryVariantStockItem) => InventoryStoreStockItem[];
  onAdjust: (params: {
    productVariantId: string;
    productName: string;
    variantName: string;
    stores: InventoryStoreStockItem[];
  }) => Promise<void>;
  onTransfer: (params: {
    productVariantId: string;
    productName: string;
    variantName: string;
    stores: InventoryStoreStockItem[];
  }) => Promise<void>;
}) {
  const rowHeight = 44;
  const containerHeight = 280;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  if (variants.length === 0) {
    return (
      <div className="px-3 py-4 text-sm text-muted">Bu urun icin varyant bulunamadi.</div>
    );
  }

  const totalHeight = variants.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(variants.length, startIndex + visibleCount + overscan * 2);
  const visibleVariants = variants.slice(startIndex, endIndex);

  return (
    <div
      className="h-[280px] overflow-y-auto"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div className="relative" style={{ height: totalHeight }}>
        <div
          className="absolute inset-x-0"
          style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
        >
          {visibleVariants.map((variant) => (
            <div
              key={variant.productVariantId}
              className="grid h-11 grid-cols-[1.5fr_1fr_0.8fr_0.8fr] items-center border-b border-border px-3 text-sm last:border-b-0 hover:bg-surface2/40"
            >
              <div className="truncate text-text">{variant.variantName}</div>
              <div className="truncate text-text2">{variant.variantCode ?? "-"}</div>
              <div className="text-right text-text">{formatNumber(variant.totalQuantity)}</div>
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => void onAdjust({
                    productVariantId: variant.productVariantId,
                    productName,
                    variantName: variant.variantName,
                    stores: getVariantStoresForEditor(variant),
                  })}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-text2 hover:border-primary/40 hover:text-primary"
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => void onTransfer({
                    productVariantId: variant.productVariantId,
                    productName,
                    variantName: variant.variantName,
                    stores: getVariantStoresForEditor(variant),
                  })}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border bg-surface px-2 py-1 text-[11px] text-text2 hover:border-primary/40 hover:text-primary"
                >
                  <TransferIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TransferIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3h4v4" />
      <path d="M3 21 21 3" />
      <path d="M7 3H3v4" />
      <path d="M21 21l-6-6" />
    </svg>
  );
}
