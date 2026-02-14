"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type { Currency, ProductVariant } from "@/lib/products";
import { getStores, type Store } from "@/lib/stores";
import {
  adjustInventory,
  getStoreStockSummary,
  getTenantStockSummary,
  receiveInventory,
  receiveInventoryBulk,
  sellInventory,
  transferInventory,
  type InventoryAdjustPayload,
  type InventoryReceiveItem,
  type InventorySellPayload,
  type InventoryTransferPayload,
} from "@/lib/inventory";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import StockEntryForm from "@/components/inventory/StockEntryForm";
import { SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import {
  getSessionUser,
  getSessionUserRole,
  getSessionUserStoreIds,
  isStoreScopedRole,
  type UserRole,
} from "@/lib/authz";

type Scope = "tenant" | "store";
type DrawerMode = "receive" | "adjust" | "transfer" | "sell" | null;
type SellType = "sale" | "return";

type InventoryRow = {
  key: string;
  productVariantId: string;
  productVariantName: string;
  productName: string;
  storeId: string;
  storeName: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
};

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

function normalizeSingleRow(raw: Record<string, unknown>): InventoryRow | null {
  const storeObj = asObject(raw.store);
  const variantObj = asObject(raw.productVariant) ?? asObject(raw.variant);
  const productObj = asObject(raw.product) ?? asObject(variantObj?.product);

  const productVariantId = pickString(
    raw.productVariantId,
    raw.variantId,
    variantObj?.id,
  );

  if (!productVariantId) return null;

  const quantity = pickNumber(
    raw.quantity,
    raw.stock,
    raw.currentQuantity,
    raw.onHand,
  );

  const reservedQuantity = pickNumber(raw.reservedQuantity, raw.reserved);

  const availableQuantity = pickNumber(
    raw.availableQuantity,
    raw.available,
    quantity - reservedQuantity,
  );

  const storeId = pickString(raw.storeId, storeObj?.id, "-");

  return {
    key: `${productVariantId}-${storeId || "-"}`,
    productVariantId,
    productVariantName: pickString(
      raw.productVariantName,
      raw.variantName,
      variantObj?.name,
      productVariantId,
    ),
    productName: pickString(raw.productName, productObj?.name, "-"),
    storeId: storeId || "-",
    storeName: pickString(raw.storeName, storeObj?.name, "-"),
    quantity,
    reservedQuantity,
    availableQuantity,
  };
}

function normalizeInventoryRows(payload: unknown): InventoryRow[] {
  const root = asObject(payload);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.data)
      ? root?.data
      : Array.isArray(root?.items)
        ? root?.items
        : [];

  const rows: InventoryRow[] = [];
  const storeGroupKeys = ["stores", "storeStocks"];
  const productGroupKeys = ["products", "productStocks"];
  const variantGroupKeys = ["variants", "productVariants", "variantStocks"];

  const collectRows = (
    node: Record<string, unknown>,
    inherited: Record<string, unknown> = {},
  ) => {
    const merged: Record<string, unknown> = {
      ...inherited,
      ...node,
      store: node.store ?? inherited.store,
      storeId: node.storeId ?? inherited.storeId,
      storeName: node.storeName ?? inherited.storeName,
      product: node.product ?? inherited.product,
      productName: node.productName ?? inherited.productName,
      productVariant: node.productVariant ?? inherited.productVariant,
      productVariantId: node.productVariantId ?? inherited.productVariantId,
      productVariantName: node.productVariantName ?? inherited.productVariantName,
      variant: node.variant ?? inherited.variant,
      variantId: node.variantId ?? inherited.variantId,
      variantName: node.variantName ?? inherited.variantName,
    };
    const context: Record<string, unknown> = {
      store: merged.store,
      storeId: merged.storeId,
      storeName: merged.storeName,
      product: merged.product,
      productName: merged.productName,
      productVariant: merged.productVariant,
      productVariantId: merged.productVariantId,
      productVariantName: merged.productVariantName,
      variant: merged.variant,
      variantId: merged.variantId,
      variantName: merged.variantName,
    };

    let traversed = false;

    for (const key of storeGroupKeys) {
      const group = node[key];
      if (!Array.isArray(group)) continue;
      traversed = true;
      for (const item of group) {
        const itemObj = asObject(item);
        if (!itemObj) continue;
        collectRows(itemObj, context);
      }
    }

    for (const key of productGroupKeys) {
      const group = node[key];
      if (!Array.isArray(group)) continue;
      traversed = true;
      for (const item of group) {
        const itemObj = asObject(item);
        if (!itemObj) continue;
        collectRows(itemObj, context);
      }
    }

    for (const key of variantGroupKeys) {
      const group = node[key];
      if (!Array.isArray(group)) continue;
      traversed = true;
      for (const item of group) {
        const itemObj = asObject(item);
        if (!itemObj) continue;
        collectRows(itemObj, context);
      }
    }

    if (!traversed) {
      const normalized = normalizeSingleRow(merged);
      if (normalized) rows.push(normalized);
    }
  };

  for (const item of rawItems) {
    const rowObj = asObject(item);
    if (!rowObj) continue;
    collectRows(rowObj);
  }

  const map = new Map<string, InventoryRow>();
  for (const row of rows) {
    map.set(row.key, row);
  }

  return [...map.values()];
}

function toProductVariant(row: InventoryRow): ProductVariant {
  return {
    id: row.productVariantId,
    name: row.productVariantName,
    code: row.productVariantName,
    barcode: "",
    attributes: {},
    isActive: true,
  };
}

export default function StockPage() {
  const [scope, setScope] = useState<Scope>("tenant");
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounceStr(searchTerm, 400);

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userStoreIds, setUserStoreIds] = useState<string[]>([]);
  const [roleReady, setRoleReady] = useState(false);

  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<InventoryRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const user = getSessionUser();
    setUserRole(getSessionUserRole());
    setUserStoreIds(getSessionUserStoreIds(user));
    setRoleReady(true);
  }, []);

  const storeScopedAccess = isStoreScopedRole(userRole);

  useEffect(() => {
    if (storeScopedAccess && scope !== "store") {
      setScope("store");
    }
  }, [storeScopedAccess, scope]);

  const [adjustForm, setAdjustForm] = useState({
    storeId: "",
    newQuantity: "",
    reference: "",
    reason: "",
    note: "",
  });

  const [transferForm, setTransferForm] = useState({
    fromStoreId: "",
    toStoreId: "",
    quantity: "",
    reference: "",
    note: "",
  });

  const [sellType, setSellType] = useState<SellType>("sale");
  const [sellForm, setSellForm] = useState({
    storeId: "",
    quantity: "",
    reference: "",
    posTerminal: "",
    currency: "TRY" as Currency,
    unitPrice: "",
    discountPercent: "",
    discountAmount: "",
    taxPercent: "",
    taxAmount: "",
    campaignCode: "",
    saleId: "",
    saleLineId: "",
  });

  const scopeOptions = storeScopedAccess
    ? [{ value: "store", label: "Magaza Bazli Ozet" }]
    : [
        { value: "tenant", label: "Tenant Stok Ozeti" },
        { value: "store", label: "Magaza Bazli Ozet" },
      ];

  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const filteredRows = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const haystack = `${row.productName} ${row.productVariantName} ${row.storeName}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, debouncedSearch]);

  const receiveVariants = useMemo(() => {
    const map = new Map<string, ProductVariant>();
    for (const row of rows) {
      if (!map.has(row.productVariantId)) {
        map.set(row.productVariantId, toProductVariant(row));
      }
    }
    return [...map.values()];
  }, [rows]);

  const fetchStores = useCallback(async () => {
    if (!roleReady) return;
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await getStores({ token, page: 1, limit: 100 });
      const nextStores = storeScopedAccess
        ? res.data.filter((store) => userStoreIds.includes(store.id))
        : res.data;
      setStores(nextStores);
      if (storeScopedAccess) {
        setSelectedStoreId((prev) => {
          if (prev && nextStores.some((store) => store.id === prev)) return prev;
          return nextStores[0]?.id ?? "";
        });
      }
    } catch {
      setStores([]);
    }
  }, [storeScopedAccess, userStoreIds, roleReady]);

  const fetchSummary = useCallback(async () => {
    if (!roleReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let payload: unknown;
      if (storeScopedAccess || scope === "store") {
        const targetStoreId = selectedStoreId || userStoreIds[0] || "";
        if (!targetStoreId) {
          setRows([]);
          if (storeScopedAccess) {
            setError("Bu kullanici icin magaza erisimi bulunamadi.");
          }
          return;
        }
        payload = await getStoreStockSummary(targetStoreId);
      } else {
        payload = await getTenantStockSummary();
      }
      setRows(normalizeInventoryRows(payload));
    } catch {
      setRows([]);
      setError("Stok ozeti yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, [scope, selectedStoreId, storeScopedAccess, userStoreIds, roleReady]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const openDrawer = (mode: Exclude<DrawerMode, null>, row?: InventoryRow) => {
    if (mode !== "receive" && !row) return;
    setFormError("");
    setSelectedRow(row ?? null);
    setDrawerMode(mode);

    if (mode === "adjust" && row) {
      setAdjustForm({
        storeId: row.storeId !== "-" ? row.storeId : "",
        newQuantity: String(Math.max(0, row.quantity)),
        reference: "",
        reason: "",
        note: "",
      });
    }

    if (mode === "transfer" && row) {
      setTransferForm({
        fromStoreId: row.storeId !== "-" ? row.storeId : "",
        toStoreId: "",
        quantity: "",
        reference: "",
        note: "",
      });
    }

    if (mode === "sell" && row) {
      setSellType("sale");
      setSellForm({
        storeId: row.storeId !== "-" ? row.storeId : "",
        quantity: "",
        reference: "",
        posTerminal: "",
        currency: "TRY",
        unitPrice: "",
        discountPercent: "",
        discountAmount: "",
        taxPercent: "",
        taxAmount: "",
        campaignCode: "",
        saleId: "",
        saleLineId: "",
      });
    }

    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
    setDrawerMode(null);
    setSelectedRow(null);
    setFormError("");
  };

  const onReceiveSubmit = async (items: InventoryReceiveItem[]) => {
    if (items.length === 0) {
      closeDrawer();
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (items.length === 1) {
        await receiveInventory(items[0]);
      } else {
        await receiveInventoryBulk(items);
      }
      closeDrawer();
      setSuccess("Stok girisi tamamlandi.");
      await fetchSummary();
    } catch {
      setFormError("Stok girisi yapilamadi.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitAdjust = async () => {
    if (!selectedRow) return;
    if (!adjustForm.storeId) {
      setFormError("Magaza secimi zorunludur.");
      return;
    }
    if (adjustForm.newQuantity === "" || Number(adjustForm.newQuantity) < 0) {
      setFormError("Yeni miktar 0 veya daha buyuk olmalidir.");
      return;
    }

    const payload: InventoryAdjustPayload = {
      storeId: adjustForm.storeId,
      productVariantId: selectedRow.productVariantId,
      newQuantity: Number(adjustForm.newQuantity),
      reference: adjustForm.reference || undefined,
      meta: {
        reason: adjustForm.reason || undefined,
        note: adjustForm.note || undefined,
      },
    };

    setSubmitting(true);
    setFormError("");
    try {
      await adjustInventory(payload);
      closeDrawer();
      setSuccess("Stok duzeltme kaydedildi.");
      await fetchSummary();
    } catch {
      setFormError("Stok duzeltme yapilamadi.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitTransfer = async () => {
    if (!selectedRow) return;
    if (!transferForm.fromStoreId || !transferForm.toStoreId) {
      setFormError("Kaynak ve hedef magazalar zorunludur.");
      return;
    }
    if (transferForm.fromStoreId === transferForm.toStoreId) {
      setFormError("Kaynak ve hedef magaza farkli olmalidir.");
      return;
    }
    if (!transferForm.quantity || Number(transferForm.quantity) <= 0) {
      setFormError("Transfer miktari 0'dan buyuk olmalidir.");
      return;
    }

    const payload: InventoryTransferPayload = {
      fromStoreId: transferForm.fromStoreId,
      toStoreId: transferForm.toStoreId,
      productVariantId: selectedRow.productVariantId,
      quantity: Number(transferForm.quantity),
      reference: transferForm.reference || undefined,
      meta: {
        note: transferForm.note || undefined,
      },
    };

    setSubmitting(true);
    setFormError("");
    try {
      await transferInventory(payload);
      closeDrawer();
      setSuccess("Transfer kaydedildi.");
      await fetchSummary();
    } catch {
      setFormError("Transfer islemi basarisiz oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const sellLineTotal = useMemo(() => {
    const qty = Number(sellForm.quantity) || 0;
    const unitPrice = Number(sellForm.unitPrice) || 0;
    const subtotal = qty * unitPrice;
    const discountFromPercent = subtotal * ((Number(sellForm.discountPercent) || 0) / 100);
    const discountFromAmount = Number(sellForm.discountAmount) || 0;
    const taxFromPercent = subtotal * ((Number(sellForm.taxPercent) || 0) / 100);
    const taxFromAmount = Number(sellForm.taxAmount) || 0;
    return subtotal - discountFromPercent - discountFromAmount + taxFromPercent + taxFromAmount;
  }, [sellForm]);

  const onSubmitSell = async () => {
    if (!selectedRow) return;
    if (!sellForm.storeId) {
      setFormError("Magaza secimi zorunludur.");
      return;
    }
    if (!sellForm.quantity || Number(sellForm.quantity) <= 0) {
      setFormError("Miktar 0'dan buyuk olmalidir.");
      return;
    }
    if (!sellForm.unitPrice || Number(sellForm.unitPrice) < 0) {
      setFormError("Birim fiyat gecersiz.");
      return;
    }

    const quantity = Number(sellForm.quantity);

    const payload: InventorySellPayload = {
      storeId: sellForm.storeId,
      productVariantId: selectedRow.productVariantId,
      quantity: sellType === "return" ? -quantity : quantity,
      reference: sellForm.reference || undefined,
      meta: {
        posTerminal: sellForm.posTerminal || undefined,
      },
      currency: sellForm.currency,
      unitPrice: Number(sellForm.unitPrice),
      discountPercent: sellForm.discountPercent ? Number(sellForm.discountPercent) : undefined,
      discountAmount: sellForm.discountAmount ? Number(sellForm.discountAmount) : undefined,
      taxPercent: sellForm.taxPercent ? Number(sellForm.taxPercent) : undefined,
      taxAmount: sellForm.taxAmount ? Number(sellForm.taxAmount) : undefined,
      lineTotal: Number(sellLineTotal.toFixed(2)),
      campaignCode: sellForm.campaignCode || undefined,
      saleId: sellForm.saleId || undefined,
      saleLineId: sellForm.saleLineId || undefined,
    };

    setSubmitting(true);
    setFormError("");
    try {
      await sellInventory(payload);
      closeDrawer();
      setSuccess(sellType === "return" ? "Iade islemi kaydedildi." : "Satis islemi kaydedildi.");
      await fetchSummary();
    } catch {
      setFormError("Satis/iade islemi basarisiz oldu.");
    } finally {
      setSubmitting(false);
    }
  };

  const drawerTitle =
    drawerMode === "receive"
      ? "Stok Girisi"
      : drawerMode === "adjust"
        ? "Stok Duzeltme"
        : drawerMode === "transfer"
          ? "Magazalar Arasi Transfer"
          : drawerMode === "sell"
            ? "Satis / Iade"
            : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Stok Yonetimi</h1>
          <p className="text-sm text-muted">Ozet stoklari goruntuleyin ve hareket yonetin</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-72">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Urun/Varyant/Magaza ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button
            label="Yeni Stok Girisi"
            onClick={() => openDrawer("receive")}
            variant="primarySolid"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          
        </div>
      </div>

      <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Ozet Tipi</label>
          <SearchableDropdown
            options={scopeOptions}
            value={scope}
            onChange={(v) => setScope(v as Scope)}
            showEmptyOption={false}
            allowClear={false}
            placeholder="Ozet tipi"
          />
        </div>

        {scope === "store" && (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Magaza</label>
            <SearchableDropdown
              options={storeOptions}
              value={selectedStoreId}
              onChange={setSelectedStoreId}
              placeholder="Magaza seciniz"
              emptyOptionLabel="Magaza seciniz"
              showEmptyOption={false}
              allowClear={false}
            />
          </div>
        )}

        <div className="flex items-end">
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
            Gosterilen Kayit: <span className="font-semibold">{filteredRows.length}</span>
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
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">Gosterilecek stok verisi bulunamadi.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">Urun</th>
                  <th className="px-4 py-3">Varyant</th>
                  <th className="px-4 py-3">Magaza</th>
                  <th className="px-4 py-3 text-right">Miktar</th>
                  <th className="px-4 py-3 text-right">Rezerve</th>
                  <th className="px-4 py-3 text-right">Kullanilabilir</th>
                  <th className="px-4 py-3 text-right">Islemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.key} className="border-b border-border last:border-b-0 hover:bg-surface2/40">
                    <td className="px-4 py-3 text-sm font-medium text-text">{row.productName}</td>
                    <td className="px-4 py-3 text-sm text-text2">{row.productVariantName}</td>
                    <td className="px-4 py-3 text-sm text-text2">{row.storeName}</td>
                    <td className="px-4 py-3 text-right text-sm text-text">{formatNumber(row.quantity)}</td>
                    <td className="px-4 py-3 text-right text-sm text-text2">{formatNumber(row.reservedQuantity)}</td>
                    <td className="px-4 py-3 text-right text-sm text-text2">{formatNumber(row.availableQuantity)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDrawer("adjust", row)}
                          className="rounded-lg border border-border bg-surface2 px-2 py-1 text-xs text-text2 hover:border-primary/40 hover:text-primary"
                        >
                          Duzelt
                        </button>
                        <button
                          type="button"
                          onClick={() => openDrawer("transfer", row)}
                          className="rounded-lg border border-border bg-surface2 px-2 py-1 text-xs text-text2 hover:border-primary/40 hover:text-primary"
                        >
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        side="right"
        title={drawerTitle}
        description={
          drawerMode === "receive"
            ? "Yeni stok girisi"
            : selectedRow
              ? `${selectedRow.productName} / ${selectedRow.productVariantName}`
              : ""
        }
        closeDisabled={submitting}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[720px]")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              type="button"
              onClick={closeDrawer}
              disabled={submitting}
              variant="secondary"
            />
            {drawerMode === "adjust" && (
              <Button label="Duzeltmeyi Kaydet" type="button" onClick={onSubmitAdjust} loading={submitting} variant="primarySolid" />
            )}
            {drawerMode === "transfer" && (
              <Button label="Transferi Kaydet" type="button" onClick={onSubmitTransfer} loading={submitting} variant="primarySolid" />
            )}
            {drawerMode === "sell" && (
              <Button label={sellType === "return" ? "Iadeyi Kaydet" : "Satisi Kaydet"} type="button" onClick={onSubmitSell} loading={submitting} variant="primarySolid" />
            )}
          </div>
        }
      >
        <div className="space-y-4 p-5">
          {drawerMode === "receive" && (
            <StockEntryForm
              variants={receiveVariants}
              productCurrency="TRY"
              stores={stores}
              onSubmit={onReceiveSubmit}
              submitting={submitting}
            />
          )}

          {drawerMode === "adjust" && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Magaza *">
                <SearchableDropdown
                  options={storeOptions}
                  value={adjustForm.storeId}
                  onChange={(v) => setAdjustForm((p) => ({ ...p, storeId: v }))}
                  placeholder="Magaza secin"
                  showEmptyOption={false}
                  allowClear={false}
                />
              </Field>
              <Field label="Yeni Miktar *">
                <input
                  type="number"
                  min={0}
                  value={adjustForm.newQuantity}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, newQuantity: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Referans">
                <input
                  type="text"
                  value={adjustForm.reference}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, reference: e.target.value }))}
                  placeholder="COUNT-2025-001"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Sebep">
                <input
                  type="text"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
                  placeholder="Sayim farki"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Not" className="md:col-span-2">
                <textarea
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Aciklama"
                  className="min-h-[90px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
            </div>
          )}

          {drawerMode === "transfer" && (
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Kaynak Magaza *">
                <SearchableDropdown
                  options={storeOptions}
                  value={transferForm.fromStoreId}
                  onChange={(v) => setTransferForm((p) => ({ ...p, fromStoreId: v }))}
                  placeholder="Kaynak magaza"
                  showEmptyOption={false}
                  allowClear={false}
                />
              </Field>
              <Field label="Hedef Magaza *">
                <SearchableDropdown
                  options={storeOptions}
                  value={transferForm.toStoreId}
                  onChange={(v) => setTransferForm((p) => ({ ...p, toStoreId: v }))}
                  placeholder="Hedef magaza"
                  showEmptyOption={false}
                  allowClear={false}
                />
              </Field>
              <Field label="Miktar *">
                <input
                  type="number"
                  min={1}
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm((p) => ({ ...p, quantity: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Referans">
                <input
                  type="text"
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm((p) => ({ ...p, reference: e.target.value }))}
                  placeholder="TRF-2025-001"
                  className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Not" className="md:col-span-2">
                <textarea
                  value={transferForm.note}
                  onChange={(e) => setTransferForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Transfer aciklamasi"
                  className="min-h-[90px] w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </Field>
            </div>
          )}

          {drawerMode === "sell" && (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Islem Tipi">
                  <SearchableDropdown
                    options={[
                      { value: "sale", label: "Satis" },
                      { value: "return", label: "Iade" },
                    ]}
                    value={sellType}
                    onChange={(v) => setSellType(v as SellType)}
                    showEmptyOption={false}
                    allowClear={false}
                  />
                </Field>
                <Field label="Magaza *">
                  <SearchableDropdown
                    options={storeOptions}
                    value={sellForm.storeId}
                    onChange={(v) => setSellForm((p) => ({ ...p, storeId: v }))}
                    placeholder="Magaza secin"
                    showEmptyOption={false}
                    allowClear={false}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Miktar *">
                  <input
                    type="number"
                    min={1}
                    value={sellForm.quantity}
                    onChange={(e) => setSellForm((p) => ({ ...p, quantity: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Birim Fiyat *">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={sellForm.unitPrice}
                    onChange={(e) => setSellForm((p) => ({ ...p, unitPrice: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Para Birimi">
                  <SearchableDropdown
                    options={[
                      { value: "TRY", label: "TRY" },
                      { value: "USD", label: "USD" },
                      { value: "EUR", label: "EUR" },
                    ]}
                    value={sellForm.currency}
                    onChange={(v) => setSellForm((p) => ({ ...p, currency: v as Currency }))}
                    showEmptyOption={false}
                    allowClear={false}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Indirim %">
                  <input
                    type="number"
                    min={0}
                    value={sellForm.discountPercent}
                    onChange={(e) => setSellForm((p) => ({ ...p, discountPercent: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Indirim Tutar">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={sellForm.discountAmount}
                    onChange={(e) => setSellForm((p) => ({ ...p, discountAmount: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Vergi %">
                  <input
                    type="number"
                    min={0}
                    value={sellForm.taxPercent}
                    onChange={(e) => setSellForm((p) => ({ ...p, taxPercent: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Vergi Tutar">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={sellForm.taxAmount}
                    onChange={(e) => setSellForm((p) => ({ ...p, taxAmount: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Referans">
                  <input
                    type="text"
                    value={sellForm.reference}
                    onChange={(e) => setSellForm((p) => ({ ...p, reference: e.target.value }))}
                    placeholder="POS-2025-001"
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="POS Terminal">
                  <input
                    type="text"
                    value={sellForm.posTerminal}
                    onChange={(e) => setSellForm((p) => ({ ...p, posTerminal: e.target.value }))}
                    placeholder="Kasa 1"
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Kampanya Kodu">
                  <input
                    type="text"
                    value={sellForm.campaignCode}
                    onChange={(e) => setSellForm((p) => ({ ...p, campaignCode: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Sale ID">
                  <input
                    type="text"
                    value={sellForm.saleId}
                    onChange={(e) => setSellForm((p) => ({ ...p, saleId: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
                <Field label="Sale Line ID" className="md:col-span-2">
                  <input
                    type="text"
                    value={sellForm.saleLineId}
                    onChange={(e) => setSellForm((p) => ({ ...p, saleLineId: e.target.value }))}
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                Hesaplanan Line Total: <span className="font-semibold">{formatNumber(sellLineTotal)}</span>
              </div>
            </div>
          )}

          {formError && <p className="text-sm text-error">{formError}</p>}
        </div>
      </Drawer>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-muted">{label}</label>
      {children}
    </div>
  );
}
