"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  createProductVariants,
  getProductById,
  getProductVariants,
  getProducts,
  updateProduct,
  updateProductVariant,
  type Product,
  type ProductVariant,
  type ProductsListMeta,
  type Currency,
  type CreateVariantDto,
} from "@/lib/products";
import { getStores, type Store } from "@/lib/stores";
import { receiveInventoryBulk, type InventoryReceiveItem } from "@/lib/inventory";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import StockEntryForm from "@/components/inventory/StockEntryForm";
import { EditIcon, SearchIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";

/* ── Constants ── */

const CURRENCY_OPTIONS = [
  { value: "TRY", label: "TRY - Turk Lirasi" },
  { value: "USD", label: "USD - Amerikan Dolari" },
  { value: "EUR", label: "EUR - Euro" },
];
const CURRENCY_FILTER_OPTIONS = [
  { value: "TRY", label: "TRY" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];
const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tum Durumlar" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Pasif" },
];

type IsActiveFilter = boolean | "all";

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

const ATTRIBUTE_UNIT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  length: [
    { value: "mm", label: "mm" },
    { value: "cm", label: "cm" },
    { value: "m", label: "m" },
  ],
  width: [
    { value: "mm", label: "mm" },
    { value: "cm", label: "cm" },
    { value: "m", label: "m" },
  ],
  weight: [
    { value: "g", label: "g" },
    { value: "kg", label: "kg" },
  ],
};

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
  clientKey: string;
  id?: string;
  isActive?: boolean;
  name: string;
  code: string;
  barcode: string;
  attributes: { key: string; value: string; unit?: string }[];
};

type FormErrors = Partial<Record<keyof ProductForm, string>>;
type VariantErrors = Partial<Record<keyof Omit<VariantForm, "attributes">, string>> & {
  attributes?: string;
};

type VariantSnapshot = {
  payload: CreateVariantDto;
  isActive: boolean;
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

/* ── Helpers ── */

function useDebounceStr(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

function createVariantClientKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createEmptyVariant(): VariantForm {
  return {
    clientKey: createVariantClientKey(),
    id: undefined,
    isActive: true,
    name: "",
    code: "",
    barcode: "",
    attributes: [{ key: "", value: "", unit: "" }],
  };
}

function formatPrice(val: number | string | null | undefined): string {
  if (val == null) return "-";
  const numeric = Number(val);
  if (Number.isNaN(numeric)) return "-";
  return numeric.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function areAttributesEqual(a: Record<string, string>, b: Record<string, string>) {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    if (a[aKeys[i]] !== b[bKeys[i]]) return false;
  }
  return true;
}

function getAttributeUnitOptions(key: string) {
  return ATTRIBUTE_UNIT_OPTIONS[key] ?? [];
}

function parseAttributeValue(key: string, rawValue: string) {
  const value = rawValue ?? "";
  const unitOptions = getAttributeUnitOptions(key);
  if (unitOptions.length === 0) return { value, unit: "" };

  const matchedUnit = unitOptions.find((opt) => value.endsWith(` ${opt.value}`));
  if (!matchedUnit) return { value, unit: "" };

  return {
    value: value.slice(0, -(` ${matchedUnit.value}`.length)).trim(),
    unit: matchedUnit.value,
  };
}

function serializeAttributeValue(attr: { key: string; value: string; unit?: string }) {
  const trimmedValue = attr.value.trim();
  if (!trimmedValue) return "";

  const unitOptions = getAttributeUnitOptions(attr.key);
  if (unitOptions.length === 0) return trimmedValue;
  if (!attr.unit) return trimmedValue;
  return `${trimmedValue} ${attr.unit}`;
}

function VirtualVariantList({
  variants,
  togglingVariantIds,
  onToggleVariantActive,
}: {
  variants: ProductVariant[];
  togglingVariantIds: string[];
  onToggleVariantActive: (variant: ProductVariant, next: boolean) => void;
}) {
  const rowHeight = 56;
  const containerHeight = 240;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = variants.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const end = Math.min(variants.length, start + visibleCount + overscan * 2);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, rowHeight, overscan, visibleCount, variants.length]);

  const visibleItems = variants.slice(startIndex, endIndex);

  return (
    <div
      className="h-[240px] overflow-y-auto rounded-xl border border-border bg-surface2/40"
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div className="relative" style={{ height: totalHeight }}>
        <div
          className="absolute left-0 right-0"
          style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
        >
          {visibleItems.map((variant) => (
            <div
              key={variant.id}
              className="flex h-14 items-center justify-between border-b border-border px-3 text-sm last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate font-medium text-text">{variant.name}</div>
                <div className="truncate text-xs text-muted">
                  Kod: {variant.code || "-"}{variant.barcode ? ` | Barkod: ${variant.barcode}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="max-w-[320px] truncate text-xs text-text2">
                  {Object.keys(variant.attributes || {}).length > 0
                    ? Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")
                    : "-"}
                </div>
                <ToggleSwitch
                  checked={Boolean(variant.isActive)}
                  onChange={(next) => onToggleVariantActive(variant, next)}
                  disabled={togglingVariantIds.includes(variant.id)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Component ── */

export default function ProductsPage() {
  /* List state */
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<ProductsListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<Currency | "">("");
  const [defaultPurchasePriceMinFilter, setDefaultPurchasePriceMinFilter] = useState("");
  const [defaultPurchasePriceMaxFilter, setDefaultPurchasePriceMaxFilter] = useState("");
  const [defaultSalePriceMinFilter, setDefaultSalePriceMinFilter] = useState("");
  const [defaultSalePriceMaxFilter, setDefaultSalePriceMaxFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<IsActiveFilter>("all");
  const [variantStatusFilter, setVariantStatusFilter] = useState<IsActiveFilter>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debouncedSearch = useDebounceStr(searchTerm, 500);

  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formError, setFormError] = useState("");

  /* Stores (for stock entry) */
  const [storesList, setStoresList] = useState<Store[]>([]);
  const [stockSubmitting, setStockSubmitting] = useState(false);

  /* Saved variants for step 3 (ProductVariant[] from API) */
  const [savedVariants, setSavedVariants] = useState<ProductVariant[]>([]);

  /* Product form */
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [originalForm, setOriginalForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});

  /* Variants */
  const [variants, setVariants] = useState<VariantForm[]>([]);
  const [expandedVariantKeys, setExpandedVariantKeys] = useState<string[]>([]);
  const [originalVariantMap, setOriginalVariantMap] = useState<Record<string, VariantSnapshot>>({});
  const [variantErrors, setVariantErrors] = useState<Record<number, VariantErrors>>({});
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);
  const [productVariantsById, setProductVariantsById] = useState<Record<string, ProductVariant[]>>({});
  const [productVariantsLoadingById, setProductVariantsLoadingById] = useState<Record<string, boolean>>({});
  const [productVariantsErrorById, setProductVariantsErrorById] = useState<Record<string, string>>({});
  const [togglingProductIds, setTogglingProductIds] = useState<string[]>([]);
  const [togglingVariantIds, setTogglingVariantIds] = useState<string[]>([]);

  /* Created product id (for variant step) */
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);

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
        defaultCurrency: currencyFilter || undefined,
        defaultPurchasePriceMin: defaultPurchasePriceMinFilter ? Number(defaultPurchasePriceMinFilter) : undefined,
        defaultPurchasePriceMax: defaultPurchasePriceMaxFilter ? Number(defaultPurchasePriceMaxFilter) : undefined,
        defaultSalePriceMin: defaultSalePriceMinFilter ? Number(defaultSalePriceMinFilter) : undefined,
        defaultSalePriceMax: defaultSalePriceMaxFilter ? Number(defaultSalePriceMaxFilter) : undefined,
        isActive: productStatusFilter,
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
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    currencyFilter,
    defaultPurchasePriceMinFilter,
    defaultPurchasePriceMaxFilter,
    defaultSalePriceMinFilter,
    defaultSalePriceMaxFilter,
    productStatusFilter,
  ]);

  useEffect(() => {
    if (debouncedSearch !== "") setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    currencyFilter,
    defaultPurchasePriceMinFilter,
    defaultPurchasePriceMaxFilter,
    defaultSalePriceMinFilter,
    defaultSalePriceMaxFilter,
    productStatusFilter,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Fetch stores for stock entry ── */
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") ?? "" : "";
    if (!token) return;
    getStores({ token }).then((res) => setStoresList(res.data)).catch(() => {});
  }, []);

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

  const clearAdvancedFilters = () => {
    setDefaultPurchasePriceMinFilter("");
    setDefaultPurchasePriceMaxFilter("");
    setDefaultSalePriceMinFilter("");
    setDefaultSalePriceMaxFilter("");
  };

  const parseIsActiveFilter = (value: string): IsActiveFilter => {
    if (value === "all") return "all";
    return value === "true";
  };

  const onToggleProductActive = async (product: Product, next: boolean) => {
    setTogglingProductIds((prev) => [...prev, product.id]);
    try {
      await updateProduct(product.id, {
        name: product.name,
        sku: product.sku,
        description: product.description ?? undefined,
        defaultBarcode: product.defaultBarcode ?? undefined,
        image: product.image ?? undefined,
        defaultCurrency: product.defaultCurrency,
        defaultSalePrice: Number(product.defaultSalePrice) || 0,
        defaultPurchasePrice: Number(product.defaultPurchasePrice) || 0,
        defaultTaxPercent: Number(product.defaultTaxPercent) || 0,
        isActive: next,
      });
      await fetchProducts();
    } catch {
      setError("Urun durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingProductIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  const fetchTableVariants = async (
    productId: string,
    status: IsActiveFilter = variantStatusFilter,
  ) => {
    if (productVariantsLoadingById[productId]) return;

    setProductVariantsLoadingById((prev) => ({ ...prev, [productId]: true }));
    setProductVariantsErrorById((prev) => ({ ...prev, [productId]: "" }));

    try {
      const data = await getProductVariants(productId, {
        isActive: status,
      });
      setProductVariantsById((prev) => ({ ...prev, [productId]: data }));
    } catch {
      setProductVariantsErrorById((prev) => ({
        ...prev,
        [productId]: "Varyantlar yüklenemedi. Lütfen tekrar deneyin.",
      }));
    } finally {
      setProductVariantsLoadingById((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const toggleExpandedProduct = (productId: string) => {
    const isExpanded = expandedProductIds.includes(productId);
    if (isExpanded) {
      setExpandedProductIds((prev) => prev.filter((id) => id !== productId));
      return;
    }

    setExpandedProductIds((prev) => [...prev, productId]);
    if (!productVariantsById[productId]) {
      fetchTableVariants(productId, variantStatusFilter);
    }
  };

  const onToggleVariantActive = async (
    productId: string,
    variant: ProductVariant,
    next: boolean,
  ) => {
    setTogglingVariantIds((prev) => [...prev, variant.id]);
    try {
      await updateProductVariant(productId, variant.id, {
        name: variant.name,
        code: variant.code,
        barcode: variant.barcode,
        attributes: variant.attributes || {},
        isActive: next,
      });
      await fetchTableVariants(productId, variantStatusFilter);
    } catch {
      setProductVariantsErrorById((prev) => ({
        ...prev,
        [productId]: "Varyant durumu guncellenemedi. Lutfen tekrar deneyin.",
      }));
    } finally {
      setTogglingVariantIds((prev) => prev.filter((id) => id !== variant.id));
    }
  };

  useEffect(() => {
    if (expandedProductIds.length === 0) return;
    expandedProductIds.forEach((productId) => {
      fetchTableVariants(productId, variantStatusFilter);
    });
  }, [variantStatusFilter]);

  /* ── Drawer handlers ── */

  const onOpenDrawer = () => {
    setForm(EMPTY_PRODUCT_FORM);
    setVariants([]);
    setErrors({});
    setVariantErrors({});
    setFormError("");
    setEditingProductId(null);
    setCreatedProductId(null);
    setExpandedVariantKeys([]);
    setOriginalVariantMap({});
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
    setOriginalVariantMap({});
    setLoadingDetail(true);
    setStep(1);

    try {
      const detail = await getProductById(id);
      const formData: ProductForm = {
        name: detail.name ?? "",
        sku: detail.sku ?? "",
        description: detail.description ?? "",
        defaultBarcode: detail.defaultBarcode ?? "",
        image: detail.image ?? "",
        defaultCurrency: detail.defaultCurrency ?? "TRY",
        defaultSalePrice: detail.defaultSalePrice != null ? String(detail.defaultSalePrice) : "",
        defaultPurchasePrice: detail.defaultPurchasePrice != null ? String(detail.defaultPurchasePrice) : "",
        defaultTaxPercent: detail.defaultTaxPercent != null ? String(detail.defaultTaxPercent) : "",
      };
      setForm(formData);
      setOriginalForm(formData);
      setVariants([]);

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
      const hasMissingUnit = v.attributes.some((a) => {
        const unitOptions = getAttributeUnitOptions(a.key);
        return Boolean(a.key && a.value.trim() && unitOptions.length > 0 && !a.unit);
      });

      if (hasEmptyAttr || hasEmptyKey || hasMissingUnit) {
        e.attributes = "Tum ozellik alanlari doldurulmalidir.";
      }

      if (Object.keys(e).length > 0) newErrors[i] = e;
    });

    setVariantErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Step navigation ── */

  const isFormChanged = (): boolean => {
    return (Object.keys(originalForm) as (keyof ProductForm)[]).some(
      (key) => form[key] !== originalForm[key],
    );
  };

  const fetchVariants = async (productId: string) => {
    try {
      const data = await getProductVariants(productId);
      setOriginalVariantMap(
        Object.fromEntries(
          data.map((v) => [
            v.id,
            {
              payload: {
                name: v.name ?? "",
                code: v.code ?? "",
                barcode: v.barcode ?? "",
                attributes: v.attributes ?? {},
              },
              isActive: v.isActive ?? true,
            },
          ]),
        ),
      );
      setVariants(
        data.map((v) => ({
          clientKey: v.id,
          id: v.id,
          isActive: v.isActive ?? true,
          name: v.name,
          code: v.code,
          barcode: v.barcode,
          attributes: Object.entries(v.attributes).map(([key, value]) => {
            const parsed = parseAttributeValue(key, value);
            return { key, value: parsed.value, unit: parsed.unit };
          }),
        })),
      );
      setExpandedVariantKeys(data.length > 0 ? [data[0].id] : []);
    } catch {
      setExpandedVariantKeys([]);
      setOriginalVariantMap({});
      setVariants([]);
    }
  };

  const goToStep2 = async () => {
    if (!validateStep1()) return;

    setSubmitting(true);
    setFormError("");

    try {
      if (editingProductId) {
        /* Degisiklik varsa guncelle, yoksa API'ye gitme */
        if (isFormChanged()) {
          const productPayload = {
            name: form.name.trim(),
            sku: form.sku.trim(),
            description: form.description.trim() || undefined,
            defaultBarcode: form.defaultBarcode.trim() || undefined,
            image: form.image.trim() || undefined,
            defaultCurrency: form.defaultCurrency,
            defaultSalePrice: form.defaultSalePrice ? Number(form.defaultSalePrice) : 0,
            defaultPurchasePrice: form.defaultPurchasePrice ? Number(form.defaultPurchasePrice) : 0,
            defaultTaxPercent: form.defaultTaxPercent ? Number(form.defaultTaxPercent) : 0,
          };
          await updateProduct(editingProductId, productPayload);
        }
        await fetchVariants(editingProductId);
        setStep(2);
      } else {
        const productPayload = {
          name: form.name.trim(),
          sku: form.sku.trim(),
          description: form.description.trim() || undefined,
          defaultBarcode: form.defaultBarcode.trim() || undefined,
          image: form.image.trim() || undefined,
          defaultCurrency: form.defaultCurrency,
          defaultSalePrice: form.defaultSalePrice ? Number(form.defaultSalePrice) : 0,
          defaultPurchasePrice: form.defaultPurchasePrice ? Number(form.defaultPurchasePrice) : 0,
          defaultTaxPercent: form.defaultTaxPercent ? Number(form.defaultTaxPercent) : 0,
        };
        const created = await createProduct(productPayload);
        setCreatedProductId(created.id);
        await fetchVariants(created.id);
        setStep(2);
      }
    } catch {
      setFormError(
        editingProductId
          ? "Urun guncellenemedi. Lutfen tekrar deneyin."
          : "Urun olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const goToStep1 = () => setStep(1);
  const goToStep2FromStep3 = () => setStep(2);

  /* ── Close & reset helper ── */
  const closeAndReset = async () => {
    setDrawerOpen(false);
    setForm(EMPTY_PRODUCT_FORM);
    setVariants([]);
    setEditingProductId(null);
    setCreatedProductId(null);
    setExpandedVariantKeys([]);
    setOriginalVariantMap({});
    setSavedVariants([]);
    setStep(1);
    await fetchProducts();
  };

  /* ── Submit ── */

  const onSubmitProduct = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step === 1) {
      goToStep2();
      return;
    }

    if (step === 3) {
      // Step 3 is handled by StockEntryForm's own submit
      return;
    }

    if (!validateVariants()) return;

    const preparedVariants = variants
      .filter((v) => v.name.trim() || v.code.trim())
      .map((v) => ({
        id: v.id,
        isActive: v.isActive ?? true,
        payload: {
          name: v.name.trim(),
          code: v.code.trim(),
          barcode: v.barcode.trim(),
          attributes: Object.fromEntries(
            v.attributes
              .filter((a) => a.key && a.value.trim())
              .map((a) => [a.key, serializeAttributeValue(a)]),
          ),
        },
      }));

    const targetProductId = editingProductId ?? createdProductId;

    /* Variant yoksa dogrudan kapat */
    if (preparedVariants.length === 0) {
      await closeAndReset();
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingProductId) {
        const variantsToUpdate = preparedVariants.filter((v) => {
          if (!v.id) return false;
          const original = originalVariantMap[v.id];
          if (!original) return true;
          return (
            original.isActive !== v.isActive ||
            original.payload.name !== v.payload.name ||
            original.payload.code !== v.payload.code ||
            original.payload.barcode !== v.payload.barcode ||
            !areAttributesEqual(original.payload.attributes, v.payload.attributes)
          );
        });
        const variantsToCreate = preparedVariants
          .filter((v) => !v.id)
          .map((v) => v.payload);

        const hasChanges = variantsToUpdate.length > 0 || variantsToCreate.length > 0;

        if (hasChanges) {
          if (variantsToUpdate.length > 0) {
            await Promise.all(
              variantsToUpdate.map((v) =>
                updateProductVariant(editingProductId, v.id!, {
                  ...v.payload,
                  isActive: v.isActive,
                }),
              ),
            );
          }

          if (variantsToCreate.length > 0) {
            await createProductVariants(editingProductId, variantsToCreate);
          }

          await fetchTableVariants(editingProductId, variantStatusFilter);
        }
      } else {
        await createProductVariants(
          targetProductId!,
          preparedVariants.map((v) => v.payload),
        );
      }

      /* After saving variants, fetch saved variants and go to step 3 */
      const allVariants = await getProductVariants(targetProductId!);
      setSavedVariants(allVariants);
      setStep(3);
    } catch {
      setFormError("Varyantlar olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Stock entry submit ── */
  const onStockEntrySubmit = async (items: InventoryReceiveItem[]) => {
    // No stock data filled — just close without calling API
    if (items.length === 0) {
      await closeAndReset();
      return;
    }

    setStockSubmitting(true);
    setFormError("");
    try {
      if (items.length === 1) {
        const { receiveInventory } = await import("@/lib/inventory");
        await receiveInventory(items[0]);
      } else {
        await receiveInventoryBulk(items);
      }
      await closeAndReset();
    } catch {
      setFormError("Stok girisi yapilamadi. Lutfen tekrar deneyin.");
    } finally {
      setStockSubmitting(false);
    }
  };

  /* ── Skip stock entry ── */
  const skipStockEntry = async () => {
    await closeAndReset();
  };

  /* ── Variant helpers ── */

  const addVariant = () => {
    const newVariant = createEmptyVariant();
    setVariants((prev) => [...prev, newVariant]);
    setExpandedVariantKeys((prev) => [...prev, newVariant.clientKey]);
  };

  const removeVariant = (index: number) => {
    const removedKey = variants[index]?.clientKey;
    setVariants((prev) => prev.filter((_, i) => i !== index));
    if (removedKey) {
      setExpandedVariantKeys((prev) => prev.filter((key) => key !== removedKey));
    }
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const toggleVariantPanel = (clientKey: string) => {
    setExpandedVariantKeys((prev) =>
      prev.includes(clientKey) ? prev.filter((key) => key !== clientKey) : [...prev, clientKey],
    );
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
      prev.map((v, i) =>
        i === variantIndex ? { ...v, attributes: [...v.attributes, { key: "", value: "", unit: "" }] } : v,
      ),
    );
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIndex ? { ...v, attributes: v.attributes.filter((_, ai) => ai !== attrIndex) } : v)),
    );
  };

  const updateAttribute = (variantIndex: number, attrIndex: number, field: "key" | "value" | "unit", value: string) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) => {
                if (ai !== attrIndex) return a;
                if (field === "key") {
                  const unitOptions = getAttributeUnitOptions(value);
                  return {
                    ...a,
                    key: value,
                    unit: unitOptions.length > 0 ? (a.unit && unitOptions.some((opt) => opt.value === a.unit) ? a.unit : unitOptions[0].value) : "",
                  };
                }
                return { ...a, [field]: value };
              }),
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
          <Button
            label={showAdvancedFilters ? "Detaylı Filtreyi Gizle" : "Detaylı Filtre"}
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          <Button label="Yeni Urun" onClick={onOpenDrawer} variant="primarySoft" className="w-full px-2.5 py-2 lg:w-auto lg:px-3" />
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Para Birimi</label>
            <SearchableDropdown
              options={CURRENCY_FILTER_OPTIONS}
              value={currencyFilter}
              onChange={(value) => setCurrencyFilter(value as Currency | "")}
              placeholder="Tüm Para Birimleri"
              emptyOptionLabel="Tüm Para Birimleri"
              inputAriaLabel="Para birimi filtresi"
              clearAriaLabel="Para birimi filtresini temizle"
              toggleAriaLabel="Para birimi listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Ürün Durumu</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={productStatusFilter === "all" ? "all" : String(productStatusFilter)}
              onChange={(value) => setProductStatusFilter(parseIsActiveFilter(value))}
              placeholder="Ürün Durumu"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Ürün durum filtresi"
              toggleAriaLabel="Ürün durum listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Varyant Durumu</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={variantStatusFilter === "all" ? "all" : String(variantStatusFilter)}
              onChange={(value) => setVariantStatusFilter(parseIsActiveFilter(value))}
              placeholder="Varyant Durumu"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Varyant durum filtresi"
              toggleAriaLabel="Varyant durum listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Satış Fiyatı Min</label>
            <input
              type="number"
              value={defaultSalePriceMinFilter}
              onChange={(e) => setDefaultSalePriceMinFilter(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Satış Fiyatı Max</label>
            <input
              type="number"
              value={defaultSalePriceMaxFilter}
              onChange={(e) => setDefaultSalePriceMaxFilter(e.target.value)}
              placeholder="1000"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Alış Fiyatı Min</label>
            <input
              type="number"
              value={defaultPurchasePriceMinFilter}
              onChange={(e) => setDefaultPurchasePriceMinFilter(e.target.value)}
              placeholder="0"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Alış Fiyatı Max</label>
            <input
              type="number"
              value={defaultPurchasePriceMaxFilter}
              onChange={(e) => setDefaultPurchasePriceMaxFilter(e.target.value)}
              placeholder="1000"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <Button
              label="Detaylı Filtreleri Temizle"
              onClick={clearAdvancedFilters}
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      )}

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
                    <th className="w-10 px-2 py-3 text-center"></th>
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
                      <td colSpan={10} className="px-4 py-8 text-center text-sm text-muted">
                        Henuz urun bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => {
                      const isExpanded = expandedProductIds.includes(product.id);
                      const tableVariants = productVariantsById[product.id] || [];
                      const loadingVariants = productVariantsLoadingById[product.id];
                      const variantsError = productVariantsErrorById[product.id];
                      return (
                        [
                          <tr key={`${product.id}-row`} className="group border-b border-border hover:bg-surface2/50 transition-colors">
                            <td className="px-2 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => toggleExpandedProduct(product.id)}
                                className="inline-flex h-7 w-7 items-center cursor-pointer justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text"
                                aria-label={isExpanded ? "Varyantları gizle" : "Varyantları göster"}
                              >
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
                                  className={cn("transition-transform", isExpanded && "rotate-90")}
                                >
                                  <path d="m9 18 6-6-6-6" />
                                </svg>
                              </button>
                            </td>
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
                                {product.variantCount ?? product.variants?.length ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => onEditProduct(product.id)}
                                  disabled={togglingProductIds.includes(product.id)}
                                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                                  aria-label="Urunu duzenle"
                                  title="Duzenle"
                                >
                                  <EditIcon />
                                </button>
                                <ToggleSwitch
                                  checked={Boolean(product.isActive)}
                                  onChange={(next) => onToggleProductActive(product, next)}
                                  disabled={togglingProductIds.includes(product.id)}
                                />
                              </div>
                            </td>
                          </tr>,
                          isExpanded ? (
                            <tr key={`${product.id}-expanded`} className="border-b border-border bg-surface/60">
                              <td colSpan={10} className="px-4 py-3">
                                {loadingVariants ? (
                                  <div className="rounded-xl border border-border bg-surface2/40 p-3 text-sm text-muted">
                                    Varyantlar yükleniyor...
                                  </div>
                                ) : variantsError ? (
                                  <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-sm text-error">
                                    {variantsError}
                                  </div>
                                ) : tableVariants.length === 0 ? (
                                  <div className="rounded-xl border border-border bg-surface2/40 p-3 text-sm text-muted">
                                    Secilen filtrede varyant bulunmuyor.
                                  </div>
                                ) : (
                                  <VirtualVariantList
                                    variants={tableVariants}
                                    togglingVariantIds={togglingVariantIds}
                                    onToggleVariantActive={(variant, next) =>
                                      onToggleVariantActive(product.id, variant, next)
                                    }
                                  />
                                )}
                              </td>
                            </tr>
                          ) : null,
                        ]
                      );
                    })
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
        description={step === 1 ? "Adim 1/3 - Urun Bilgileri" : step === 2 ? "Adim 2/3 - Varyantlar" : "Adim 3/3 - Stok Girisi"}
        closeDisabled={submitting || loadingDetail}
        className={cn(isMobile ? "!max-w-none" : "!max-w-[540px]")}
        footer={
          <div className="flex items-center justify-between">
            <div>
              {step === 2 && (
                <Button label="Geri" type="button" onClick={goToStep1} disabled={submitting} variant="secondary" />
              )}
              {step === 3 && (
                <Button label="Geri" type="button" onClick={goToStep2FromStep3} disabled={stockSubmitting} variant="secondary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {step === 3 ? (
                <Button
                  label="Atla"
                  type="button"
                  onClick={skipStockEntry}
                  disabled={stockSubmitting}
                  variant="secondary"
                />
              ) : (
                <Button
                  label="Iptal"
                  type="button"
                  onClick={onCloseDrawer}
                  disabled={submitting || loadingDetail}
                  variant="secondary"
                />
              )}
              {step === 1 ? (
                <Button
                  label="Devam Et"
                  type="submit"
                  form="product-form"
                  disabled={submitting || loadingDetail}
                  variant="primarySolid"
                />
              ) : step === 2 ? (
                <Button
                  label={submitting ? (editingProductId ? "Guncelleniyor..." : "Olusturuluyor...") : "Devam Et"}
                  type="submit"
                  form="product-form"
                  disabled={submitting || loadingDetail}
                  loading={submitting}
                  variant="primarySolid"
                />
              ) : null}
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
          ) : step === 2 ? (
            /* ── Step 2: Variants ── */
            <>
              {/* Step indicator */}
              <div className="flex gap-2 mb-2">
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className="h-1 flex-1 rounded-full bg-border" />
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
                    <CollapsiblePanel
                      key={variant.clientKey}
                      title={`Varyant #${vi + 1}${variant.name ? ` - ${variant.name}` : ""}`}
                      open={expandedVariantKeys.includes(variant.clientKey)}
                      onToggle={() => toggleVariantPanel(variant.clientKey)}
                      toggleAriaLabel={expandedVariantKeys.includes(variant.clientKey) ? "Varyanti daralt" : "Varyanti genislet"}
                      rightSlot={(
                        <button
                          type="button"
                          onClick={() => removeVariant(vi)}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                          aria-label="Varyanti sil"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    >
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
                              {getAttributeUnitOptions(attr.key).length > 0 && (
                                <SearchableDropdown
                                  options={getAttributeUnitOptions(attr.key)}
                                  value={attr.unit || ""}
                                  onChange={(v) => updateAttribute(vi, ai, "unit", v)}
                                  placeholder="Birim"
                                  showEmptyOption={false}
                                  allowClear={false}
                                  className="w-28"
                                />
                              )}
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
                    </CollapsiblePanel>
                  ))}
                </div>
              )}

              {formError && <p className="mt-3 text-sm text-error">{formError}</p>}
            </>
          ) : (
            /* ── Step 3: Stock Entry ── */
            <>
              {/* Step indicator */}
              <div className="flex gap-2 mb-2">
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className="h-1 flex-1 rounded-full bg-primary" />
                <div className="h-1 flex-1 rounded-full bg-primary" />
              </div>

              <div className="mb-3">
                <h3 className="text-sm font-semibold text-text">Stok Girisi</h3>
                <p className="text-xs text-muted">Varyantlar icin stok miktari ve fiyat bilgilerini girin. Bu adimi atlayabilirsiniz.</p>
              </div>

              <StockEntryForm
                variants={savedVariants}
                productCurrency={form.defaultCurrency}
                stores={storesList}
                onSubmit={onStockEntrySubmit}
                submitting={stockSubmitting}
              />

              {formError && <p className="mt-3 text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>

    </div>
  );
}
