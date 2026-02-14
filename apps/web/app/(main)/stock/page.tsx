"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProducts,
  getProductVariants,
  type Product,
  type ProductVariant,
  type Currency,
} from "@/lib/products";
import { getStores, type Store } from "@/lib/stores";
import { receiveInventory, receiveInventoryBulk, type InventoryReceiveItem } from "@/lib/inventory";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import StockEntryForm from "@/components/inventory/StockEntryForm";
import { SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";

/* ── Helpers ── */

function useDebounceStr(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function formatPrice(val: number | string | null | undefined): string {
  if (val == null) return "-";
  const numeric = Number(val);
  if (Number.isNaN(numeric)) return "-";
  return numeric.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Component ── */

export default function StockPage() {
  /* Products list */
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounceStr(searchTerm, 500);

  /* Stores */
  const [storesList, setStoresList] = useState<Store[]>([]);

  /* Selected product & variants */
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);

  /* Drawer */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* Responsive */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ── Fetch products ── */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getProducts({ page: 1, limit: 50, search: debouncedSearch });
      setProducts(res.data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Fetch stores ── */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
    if (!token) return;
    getStores({ token }).then((res) => setStoresList(res.data)).catch(() => {});
  }, []);

  /* ── Select product ── */
  const onSelectProduct = async (product: Product) => {
    setSelectedProduct(product);
    setVariantsLoading(true);
    setError("");
    setSuccess("");
    try {
      const data = await getProductVariants(product.id);
      setVariants(data);
      setDrawerOpen(true);
    } catch {
      setError("Varyantlar yuklenemedi.");
    } finally {
      setVariantsLoading(false);
    }
  };

  /* ── Submit stock entry ── */
  const onStockSubmit = async (items: InventoryReceiveItem[]) => {
    if (items.length === 0) {
      setDrawerOpen(false);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (items.length === 1) {
        await receiveInventory(items[0]);
      } else {
        await receiveInventoryBulk(items);
      }
      setDrawerOpen(false);
      setSuccess("Stok girisi basariyla tamamlandi.");
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      setError("Stok girisi yapilamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Stok Yonetimi</h1>
          <p className="text-sm text-muted">Urun secin ve stok girisi yapin</p>
        </div>
        <div className="relative w-full lg:w-80">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Urun ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {success}
        </div>
      )}

      {/* Products grid */}
      {loading ? (
        <div className="p-6 text-sm text-muted">Urunler yukleniyor...</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl2 border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted">
            {searchTerm ? "Aramayla eslesen urun bulunamadi." : "Henuz urun bulunmuyor."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelectProduct(product)}
              className="group flex items-start gap-3 rounded-xl2 border border-border bg-surface p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/[0.03] cursor-pointer"
            >
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-border bg-surface2 text-sm font-semibold text-muted">
                  {product.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text group-hover:text-primary transition-colors">
                  {product.name}
                </div>
                <div className="truncate text-xs text-muted">SKU: {product.sku}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {product.defaultCurrency}
                  </span>
                  <span className="text-xs text-text2">
                    {formatPrice(product.defaultPurchasePrice)}
                  </span>
                  <span className="text-xs text-muted">
                    {product.variantCount ?? 0} varyant
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drawer for stock entry */}
      <Drawer
        open={drawerOpen}
        onClose={() => { if (!submitting) setDrawerOpen(false); }}
        side="right"
        title={selectedProduct ? `Stok Girisi - ${selectedProduct.name}` : "Stok Girisi"}
        description={`${variants.length} varyant icin stok bilgilerini girin`}
        closeDisabled={submitting}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[600px]")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              type="button"
              onClick={() => setDrawerOpen(false)}
              disabled={submitting}
              variant="secondary"
            />
          </div>
        }
      >
        <div className="p-5">
          {variantsLoading ? (
            <div className="text-sm text-muted">Varyantlar yukleniyor...</div>
          ) : variants.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted">Bu urun icin varyant bulunamadi.</p>
              <p className="mt-1 text-xs text-muted">Once urun sayfasindan varyant eklemeniz gerekiyor.</p>
            </div>
          ) : (
            <StockEntryForm
              variants={variants}
              productCurrency={selectedProduct?.defaultCurrency ?? "TRY"}
              stores={storesList}
              onSubmit={onStockSubmit}
              submitting={submitting}
            />
          )}

          {error && <p className="mt-3 text-sm text-error">{error}</p>}
        </div>
      </Drawer>
    </div>
  );
}
