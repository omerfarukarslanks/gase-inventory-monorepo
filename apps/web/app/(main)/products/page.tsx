"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
  type Product,
  type ProductsListMeta,
  type Currency,
  type CreateVariantDto,
} from "@/lib/products";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { EditIcon, SearchIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";

/* ── Constants ── */

const CURRENCY_OPTIONS = [
  { value: "TRY", label: "TRY - Turk Lirasi" },
  { value: "USD", label: "USD - Amerikan Dolari" },
  { value: "EUR", label: "EUR - Euro" },
];

const COMMON_ATTRIBUTE_KEYS = [
  { value: "color", label: "Renk" },
  { value: "size", label: "Beden" },
  { value: "weight", label: "Agirlik" },
  { value: "length", label: "Uzunluk" },
  { value: "material", label: "Materyal" },
  { value: "width", label: "Genislik" },
  { value: "height", label: "Yukseklik" },
  { value: "volume", label: "Hacim" },
];

const SIZE_SUGGESTIONS = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const COLOR_SUGGESTIONS = [
  "Kirmizi", "Mavi", "Yesil", "Siyah", "Beyaz", "Sari",
  "Turuncu", "Mor", "Pembe", "Gri", "Kahverengi", "Lacivert",
];

/* ── Types ── */

type ProductForm = {
  name: string;
  sku: string;
  description: string;
  defaultBarcode: string;
  image: string;
  defaultCurrency: Currency;
  defaultSalePrice: string;
  defaultPurchasePrice: string;
  defaultTaxPercent: string;
};

type VariantForm = {
  name: string;
  code: string;
  barcode: string;
  attributes: { key: string; value: string }[];
};

type FormErrors = Partial<Record<keyof ProductForm, string>>;
type VariantErrors = Partial<Record<keyof Omit<VariantForm, "attributes">, string>> & {
  attributes?: string;
};

const EMPTY_PRODUCT_FORM: ProductForm = {
  name: "",
  sku: "",
  description: "",
  defaultBarcode: "",
  image: "",
  defaultCurrency: "TRY",
  defaultSalePrice: "",
  defaultPurchasePrice: "",
  defaultTaxPercent: "",
};

const EMPTY_VARIANT: VariantForm = {
  name: "",
  code: "",
  barcode: "",
  attributes: [{ key: "", value: "" }],
};

/* ── Helpers ── */

function useDebounceStr(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function formatPrice(val: number | null | undefined): string {
  if (val == null) return "-";
  return val.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Component ── */

export default function ProductsPage() {
  /* List state */
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductsListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounceStr(searchTerm, 500);

  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formError, setFormError] = useState("");

  /* Product form */
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  /* Variants */
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [variantErrors, setVariantErrors] = useState<Record<number, VariantErrors>>({});

  /* Delete */
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

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
    setError("");
    try {
      const res = await getProducts({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
      });
      setProducts(res.data);
      setMeta(res.meta);
    } catch {
      setError("Urunler yuklenemedi. Lutfen tekrar deneyin.");
      setProducts([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    if (debouncedSearch !== "") setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Pagination ── */

  const totalPages = meta?.totalPages ?? 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goPrev = () => { if (canGoPrev && !loading) setCurrentPage((p) => p - 1); };
  const goNext = () => { if (canGoNext && !loading) setCurrentPage((p) => p + 1); };
  const onChangePageSize = (next: number) => { setPageSize(next); setCurrentPage(1); };
  const goToPage = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const getVisiblePages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, -1, totalPages];
    if (currentPage >= totalPages - 3) return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  const pageItems = getVisiblePages();

  /* ── Drawer handlers ── */

  const onOpenDrawer = () => {
    setForm(EMPTY_PRODUCT_FORM);
    setVariants([]);
    setErrors({});
    setVariantErrors({});
    setFormError("");
    setEditingProductId(null);
    setStep(1);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingDetail) return;
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof ProductForm, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Edit product ── */

  const onEditProduct = async (id: string) => {
    setFormError("");
    setErrors({});
    setVariantErrors({});
    setLoadingDetail(true);
    setStep(1);

    try {
      const detail = await getProductById(id);
      setForm({
        name: detail.name ?? "",
        sku: detail.sku ?? "",
        description: detail.description ?? "",
        defaultBarcode: detail.defaultBarcode ?? "",
        image: detail.image ?? "",
        defaultCurrency: detail.defaultCurrency ?? "TRY",
        defaultSalePrice: detail.defaultSalePrice != null ? String(detail.defaultSalePrice) : "",
        defaultPurchasePrice: detail.defaultPurchasePrice != null ? String(detail.defaultPurchasePrice) : "",
        defaultTaxPercent: detail.defaultTaxPercent != null ? String(detail.defaultTaxPercent) : "",
      });

      if (detail.variants && detail.variants.length > 0) {
        setVariants(
          detail.variants.map((v) => ({
            name: v.name,
            code: v.code,
            barcode: v.barcode,
            attributes: Object.entries(v.attributes).map(([key, value]) => ({ key, value })),
          })),
        );
      } else {
        setVariants([]);
      }

      setEditingProductId(detail.id);
      setDrawerOpen(true);
    } catch {
      setFormError("Urun detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ── Validation ── */

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) newErrors.name = "Urun adi zorunludur.";
    if (!form.sku.trim()) newErrors.sku = "SKU zorunludur.";

    if (form.defaultSalePrice && isNaN(Number(form.defaultSalePrice)))
      newErrors.defaultSalePrice = "Gecerli bir fiyat girin.";

    if (form.defaultPurchasePrice && isNaN(Number(form.defaultPurchasePrice)))
      newErrors.defaultPurchasePrice = "Gecerli bir fiyat girin.";

    if (form.defaultTaxPercent) {
      const tax = Number(form.defaultTaxPercent);
      if (isNaN(tax)) newErrors.defaultTaxPercent = "Gecerli bir oran girin.";
      else if (tax < 0 || tax > 100) newErrors.defaultTaxPercent = "Vergi orani 0-100 arasi olmalidir.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVariants = (): boolean => {
    if (variants.length === 0) return true;
    const newErrors: Record<number, VariantErrors> = {};

    variants.forEach((v, i) => {
      const e: VariantErrors = {};
      if (!v.name.trim()) e.name = "Varyant adi zorunludur.";
      if (!v.code.trim()) e.code = "Varyant kodu zorunludur.";

      const hasEmptyAttr = v.attributes.some((a) => a.key && !a.value.trim());
      const hasEmptyKey = v.attributes.some((a) => !a.key && a.value.trim());
      if (hasEmptyAttr || hasEmptyKey) e.attributes = "Tum ozellik alanlari doldurulmalidir.";

      if (Object.keys(e).length > 0) newErrors[i] = e;
    });

    setVariantErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Step navigation ── */

  const goToStep2 = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const goToStep1 = () => setStep(1);

  /* ── Submit ── */

  const onSubmitProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 1) {
      goToStep2();
      return;
    }

    if (!validateStep1() || !validateVariants()) return;

    setSubmitting(true);
    setFormError("");

    const variantDtos: CreateVariantDto[] = variants
      .filter((v) => v.name.trim() || v.code.trim())
      .map((v) => ({
        name: v.name.trim(),
        code: v.code.trim(),
        barcode: v.barcode.trim(),
        attributes: Object.fromEntries(
          v.attributes.filter((a) => a.key && a.value.trim()).map((a) => [a.key, a.value.trim()]),
        ),
      }));

    try {
      if (editingProductId) {
        await updateProduct(editingProductId, {
          name: form.name.trim(),
          sku: form.sku.trim(),
          description: form.description.trim() || undefined,
          defaultBarcode: form.defaultBarcode.trim() || undefined,
          image: form.image.trim() || undefined,
          defaultCurrency: form.defaultCurrency,
          defaultSalePrice: form.defaultSalePrice ? Number(form.defaultSalePrice) : undefined,
          defaultPurchasePrice: form.defaultPurchasePrice ? Number(form.defaultPurchasePrice) : undefined,
          defaultTaxPercent: form.defaultTaxPercent ? Number(form.defaultTaxPercent) : undefined,
          variants: variantDtos.length > 0 ? variantDtos : undefined,
        });
      } else {
        await createProduct({
          name: form.name.trim(),
          sku: form.sku.trim(),
          description: form.description.trim() || undefined,
          defaultBarcode: form.defaultBarcode.trim() || undefined,
          image: form.image.trim() || undefined,
          defaultCurrency: form.defaultCurrency,
          defaultSalePrice: form.defaultSalePrice ? Number(form.defaultSalePrice) : 0,
          defaultPurchasePrice: form.defaultPurchasePrice ? Number(form.defaultPurchasePrice) : 0,
          defaultTaxPercent: form.defaultTaxPercent ? Number(form.defaultTaxPercent) : 0,
          variants: variantDtos.length > 0 ? variantDtos : undefined,
        });
      }

      setDrawerOpen(false);
      setForm(EMPTY_PRODUCT_FORM);
      setVariants([]);
      setEditingProductId(null);
      setStep(1);
      await fetchProducts();
    } catch {
      setFormError(editingProductId ? "Urun guncellenemedi. Lutfen tekrar deneyin." : "Urun olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Delete ── */

  const onDeleteProduct = async () => {
    if (!deleteTarget) return;
    setError("");
    setDeletingProductId(deleteTarget.id);
    try {
      await deleteProduct(deleteTarget.id);
      await fetchProducts();
      setDeleteTarget(null);
    } catch {
      setError("Urun silinemedi. Lutfen tekrar deneyin.");
    } finally {
      setDeletingProductId(null);
    }
  };

  /* ── Variant helpers ── */

  const addVariant = () => {
    setVariants((prev) => [...prev, { ...EMPTY_VARIANT, attributes: [{ key: "", value: "" }] }]);
  };

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const updateVariantField = (index: number, field: keyof Omit<VariantForm, "attributes">, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
    if (variantErrors[index]?.[field]) {
      setVariantErrors((prev) => {
        const next = { ...prev };
        if (next[index]) {
          const updated = { ...next[index] };
          delete updated[field];
          next[index] = updated;
        }
        return next;
      });
    }
  };

  const addAttribute = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIndex ? { ...v, attributes: [...v.attributes, { key: "", value: "" }] } : v)),
    );
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIndex ? { ...v, attributes: v.attributes.filter((_, ai) => ai !== attrIndex) } : v)),
    );
  };

  const updateAttribute = (variantIndex: number, attrIndex: number, field: "key" | "value", value: string) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) => (ai === attrIndex ? { ...a, [field]: value } : a)),
            }
          : v,
      ),
    );
  };

  const applySuggestion = (variantIndex: number, attrIndex: number, value: string) => {
    updateAttribute(variantIndex, attrIndex, "value", value);
  };

  /* ── Render ── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Urunler</h1>
          <p className="text-sm text-muted">Urun listesi ve yonetimi</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <div className="relative w-full lg:w-64">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button label="Yeni Urun" onClick={onOpenDrawer} variant="primarySoft" className="w-full px-2.5 py-2 lg:w-auto lg:px-3" />
          <Button label="Yenile" onClick={fetchProducts} variant="secondary" className="w-full px-2.5 py-2 lg:w-auto lg:px-3" />
        </div>
      </div>

      {/* Table */}
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        {loading ? (
          <div className="p-6 text-sm text-muted">Urunler yukleniyor...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Urun Adi</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Barkod</th>
                    <th className="px-4 py-3">Para Birimi</th>
                    <th className="px-4 py-3 text-right">Satis Fiyati</th>
                    <th className="px-4 py-3 text-right">Alis Fiyati</th>
                    <th className="px-4 py-3 text-right">KDV %</th>
                    <th className="px-4 py-3 text-center">Varyant</th>
                    <th className="px-4 py-3 text-right">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">
                        Henuz urun bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-9 w-9 rounded-lg object-cover border border-border"
                              />
                            ) : (
                              <div className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-surface2 text-xs text-muted">
                                {product.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-sm font-medium text-text">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-text2">{product.defaultBarcode ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {product.defaultCurrency}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-text2">{formatPrice(product.defaultSalePrice)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text2">{formatPrice(product.defaultPurchasePrice)}</td>
                        <td className="px-4 py-3 text-right text-sm text-text2">
                          {product.defaultTaxPercent != null ? `%${product.defaultTaxPercent}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex rounded-full bg-surface2 px-2 py-0.5 text-xs font-medium text-text2">
                            {product.variants?.length ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditProduct(product.id)}
                              disabled={deletingProductId === product.id}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                              aria-label="Urunu duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                              disabled={deletingProductId === product.id}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors disabled:opacity-50"
                              aria-label="Urunu sil"
                              title="Sil"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span>Toplam: {meta.total}</span>
                  <span>Sayfa: {currentPage}/{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="pageSize" className="text-xs text-muted">Satir:</label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => onChangePageSize(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <Button label="Onceki" onClick={goPrev} disabled={!canGoPrev || loading} variant="pagination" />
                  {pageItems.map((item, idx) =>
                    item === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted">...</span>
                    ) : (
                      <Button
                        key={`page-${item}`}
                        label={String(item)}
                        onClick={() => goToPage(item)}
                        disabled={loading}
                        variant={item === currentPage ? "paginationActive" : "pagination"}
                      />
                    ),
                  )}
                  <Button label="Sonraki" onClick={goNext} disabled={!canGoNext || loading} variant="pagination" />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Drawer ── */}
      <Drawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        side="right"
        title={editingProductId ? "Urunu Guncelle" : "Yeni Urun Olustur"}
        description={step === 1 ? "Adim 1/2 - Urun Bilgileri" : "Adim 2/2 - Varyantlar"}
        closeDisabled={submitting || loadingDetail}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[540px]")}
        footer={
          <div className="flex items-center justify-between">
            <div>
              {step === 2 && (
                <Button label="Geri" type="button" onClick={goToStep1} disabled={submitting} variant="secondary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                label="Iptal"
                type="button"
                onClick={onCloseDrawer}
                disabled={submitting || loadingDetail}
                variant="secondary"
              />
              {step === 1 ? (
                <Button
                  label="Devam Et"
                  type="submit"
                  form="product-form"
                  disabled={submitting || loadingDetail}
                  variant="primarySolid"
                />
              ) : (
                <Button
                  label={submitting ? (editingProductId ? "Guncelleniyor..." : "Olusturuluyor...") : editingProductId ? "Guncelle" : "Olustur"}
                  type="submit"
                  form="product-form"
                  disabled={submitting || loadingDetail}
                  loading={submitting}
                  variant="primarySolid"
                />
              )}
            </div>
          </div>
        }
      >
        <form id="product-form" onSubmit={onSubmitProduct} className="space-y-4 p-5">
          {loadingDetail ? (
            <div className="text-sm text-muted">Urun detayi yukleniyor...</div>
          ) : step === 1 ? (
            /* ── Step 1: Product Base Info ── */
            <>
              {/* Step indicator */}
              <div className="flex gap-2 mb-2">
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className="h-1 flex-1 rounded-full bg-border" />
              </div>

              <InputField
                label="Urun Adi *"
                type="text"
                value={form.name}
                onChange={(v) => onFormChange("name", v)}
                placeholder="Basic Pantolon"
                error={errors.name}
              />

              <InputField
                label="SKU *"
                type="text"
                value={form.sku}
                onChange={(v) => onFormChange("sku", v)}
                placeholder="Pantolon-BASIC"
                error={errors.sku}
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => onFormChange("description", e.target.value)}
                  className="min-h-[80px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                  placeholder="Pamuklu basic pantolon"
                />
              </div>

              <InputField
                label="Barkod"
                type="text"
                value={form.defaultBarcode}
                onChange={(v) => onFormChange("defaultBarcode", v)}
                placeholder="1234567890125"
              />

              <InputField
                label="Gorsel URL"
                type="text"
                value={form.image}
                onChange={(v) => onFormChange("image", v)}
                placeholder="https://example.com/image.jpg"
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Para Birimi</label>
                <SearchableDropdown
                  options={CURRENCY_OPTIONS}
                  value={form.defaultCurrency}
                  onChange={(v) => onFormChange("defaultCurrency", v || "TRY")}
                  placeholder="Para birimi secin"
                  showEmptyOption={false}
                  allowClear={false}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Satis Fiyati"
                  type="text"
                  value={form.defaultSalePrice}
                  onChange={(v) => onFormChange("defaultSalePrice", v)}
                  placeholder="499.90"
                  error={errors.defaultSalePrice}
                />
                <InputField
                  label="Alis Fiyati"
                  type="text"
                  value={form.defaultPurchasePrice}
                  onChange={(v) => onFormChange("defaultPurchasePrice", v)}
                  placeholder="200.00"
                  error={errors.defaultPurchasePrice}
                />
              </div>

              <InputField
                label="KDV Orani (%)"
                type="text"
                value={form.defaultTaxPercent}
                onChange={(v) => onFormChange("defaultTaxPercent", v)}
                placeholder="20"
                error={errors.defaultTaxPercent}
              />

              {formError && <p className="text-sm text-error">{formError}</p>}
            </>
          ) : (
            /* ── Step 2: Variants ── */
            <>
              {/* Step indicator */}
              <div className="flex gap-2 mb-2">
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className="h-1 flex-1 rounded-full bg-primary" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text">Varyantlar</h3>
                  <p className="text-xs text-muted">Urun icin renk, beden gibi varyantlar ekleyin</p>
                </div>
                <Button label="+ Varyant Ekle" onClick={addVariant} variant="primarySoft" className="px-2.5 py-1.5 text-xs" />
              </div>

              {variants.length === 0 ? (
                <div className="rounded-xl2 border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-muted">Henuz varyant eklenmedi.</p>
                  <p className="mt-1 text-xs text-muted">Varyant eklemek zorunlu degildir, dogrudan urun olusturabilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {variants.map((variant, vi) => (
                    <div key={vi} className="rounded-xl2 border border-border bg-surface2/30 p-4 space-y-3">
                      {/* Variant header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted">Varyant #{vi + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeVariant(vi)}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                          aria-label="Varyanti sil"
                        >
                          <TrashIcon />
                        </button>
                      </div>

                      {/* Variant base fields */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted">Varyant Adi *</label>
                          <input
                            type="text"
                            value={variant.name}
                            onChange={(e) => updateVariantField(vi, "name", e.target.value)}
                            placeholder="Kirmizi / L"
                            className={cn(
                              "h-10 w-full rounded-xl border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                              variantErrors[vi]?.name ? "border-error" : "border-border",
                            )}
                          />
                          {variantErrors[vi]?.name && (
                            <p className="text-xs text-error">{variantErrors[vi].name}</p>
                          )}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted">Kod *</label>
                          <input
                            type="text"
                            value={variant.code}
                            onChange={(e) => updateVariantField(vi, "code", e.target.value)}
                            placeholder="RED-L"
                            className={cn(
                              "h-10 w-full rounded-xl border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary",
                              variantErrors[vi]?.code ? "border-error" : "border-border",
                            )}
                          />
                          {variantErrors[vi]?.code && (
                            <p className="text-xs text-error">{variantErrors[vi].code}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">Barkod</label>
                        <input
                          type="text"
                          value={variant.barcode}
                          onChange={(e) => updateVariantField(vi, "barcode", e.target.value)}
                          placeholder="8691234567890"
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Attributes */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-muted">Ozellikler</label>
                          <button
                            type="button"
                            onClick={() => addAttribute(vi)}
                            className="text-xs cursor-pointer font-medium text-primary hover:text-primary/80 transition-colors"
                          >
                            + Ozellik Ekle
                          </button>
                        </div>

                        {variant.attributes.map((attr, ai) => (
                          <div key={ai} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <SearchableDropdown
                                options={COMMON_ATTRIBUTE_KEYS}
                                value={attr.key}
                                onChange={(v) => updateAttribute(vi, ai, "key", v)}
                                placeholder="Ozellik secin"
                                showEmptyOption={false}
                                allowClear={false}
                                className="flex-1"
                              />
                              <input
                                type="text"
                                value={attr.value}
                                onChange={(e) => updateAttribute(vi, ai, "value", e.target.value)}
                                placeholder="Deger girin"
                                className="h-10 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                              {variant.attributes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeAttribute(vi, ai)}
                                  className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                                  aria-label="Ozelligi sil"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>

                            {/* Suggestions */}
                            {attr.key === "size" && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {SIZE_SUGGESTIONS.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => applySuggestion(vi, ai, s)}
                                    className={cn(
                                      "rounded-md border px-2 py-0.5 text-xs cursor-pointer transition-colors",
                                      attr.value === s
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border bg-surface text-muted hover:border-primary/40 hover:text-text",
                                    )}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                            {attr.key === "color" && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {COLOR_SUGGESTIONS.map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => applySuggestion(vi, ai, c)}
                                    className={cn(
                                      "rounded-md border px-2 py-0.5 text-xs cursor-pointer transition-colors",
                                      attr.value === c
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border bg-surface text-muted hover:border-primary/40 hover:text-text",
                                    )}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}

                        {variantErrors[vi]?.attributes && (
                          <p className="text-xs text-error">{variantErrors[vi].attributes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {formError && <p className="mt-3 text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Silme Onayi"
        description={deleteTarget ? `"${deleteTarget.name}" urununu silmek istediginize emin misiniz?` : "Silmek istediginize emin misiniz?"}
        confirmLabel="Evet"
        cancelLabel="Hayir"
        loading={Boolean(deleteTarget && deletingProductId === deleteTarget.id)}
        onConfirm={onDeleteProduct}
        onClose={() => {
          if (deletingProductId) return;
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
