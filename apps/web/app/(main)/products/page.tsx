"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createProduct,
  createProductVariant,
  getProductAttributes,
  getProductById,
  getProductVariants,
  getProducts,
  updateProduct,
  updateProductVariant,
  type Product,
  type ProductVariant,
  type ProductsListMeta,
  type Currency,
} from "@/lib/products";
import { getAttributes, type Attribute as AttributeDefinition } from "@/lib/attributes";
import { getSessionUser, getSessionUserRole, getSessionUserStoreIds, isStoreScopedRole } from "@/lib/authz";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getStores, type Store } from "@/lib/stores";
import {
  getVariantStockByStore,
  type InventoryStoreStockItem,
} from "@/lib/inventory";
import PriceDrawer, { type PriceTarget } from "@/components/stock/PriceDrawer";
import { useDebounceStr } from "@/hooks/useDebounce";
import { toNumberOrNull } from "@/lib/format";
import {
  EMPTY_PRODUCT_FORM,
  type ProductForm,
  type VariantForm,
  type FormErrors,
  type VariantErrors,
  type VariantSnapshot,
  type IsActiveFilter,
  createVariantClientKey,
  areVariantAttributesEqual,
  normalizeVariantsResponse,
} from "@/components/products/types";
import ProductFilters from "@/components/products/ProductFilters";
import ProductTable from "@/components/products/ProductTable";
import ProductPagination from "@/components/products/ProductPagination";
import ProductDrawerStep1 from "@/components/products/ProductDrawerStep1";
import ProductDrawerStep2 from "@/components/products/ProductDrawerStep2";

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
  const [step1ProductInfoOpen, setStep1ProductInfoOpen] = useState(true);
  const [step1StoreScopeOpen, setStep1StoreScopeOpen] = useState(true);
  const debouncedSearch = useDebounceStr(searchTerm, 500);

  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [formError, setFormError] = useState("");

  const [attributeDefinitions, setAttributeDefinitions] = useState<AttributeDefinition[]>([]);

  /* Product form */
  const [form, setForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [originalForm, setOriginalForm] = useState<ProductForm>(EMPTY_PRODUCT_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const calculatedLineTotal = useMemo(() => {
    const unitPrice = toNumberOrNull(form.unitPrice);
    if (unitPrice == null || unitPrice < 0) return null;

    const taxValue =
      form.taxMode === "percent"
        ? unitPrice * ((toNumberOrNull(form.taxPercent) ?? 0) / 100)
        : (toNumberOrNull(form.taxAmount) ?? 0);
    const discountValue =
      form.discountMode === "percent"
        ? unitPrice * ((toNumberOrNull(form.discountPercent) ?? 0) / 100)
        : (toNumberOrNull(form.discountAmount) ?? 0);

    return unitPrice + taxValue - discountValue;
  }, [
    form.unitPrice,
    form.taxMode,
    form.taxPercent,
    form.taxAmount,
    form.discountMode,
    form.discountPercent,
    form.discountAmount,
  ]);

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

  /* Price drawer state */
  const [priceOpen, setPriceOpen] = useState(false);
  const [priceTarget, setPriceTarget] = useState<PriceTarget | null>(null);
  const [priceProductId, setPriceProductId] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);

  /* Responsive */
  const [isMobile, setIsMobile] = useState(false);
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

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /* ── Fetch products ── */

  const fetchProducts = useCallback(async () => {
    if (!scopeReady) return;
    setLoading(true);
    setError("");
    try {
      const listParams = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        defaultCurrency: currencyFilter || undefined,
        defaultPurchasePriceMin: defaultPurchasePriceMinFilter ? Number(defaultPurchasePriceMinFilter) : undefined,
        defaultPurchasePriceMax: defaultPurchasePriceMaxFilter ? Number(defaultPurchasePriceMaxFilter) : undefined,
        defaultSalePriceMin: defaultSalePriceMinFilter ? Number(defaultSalePriceMinFilter) : undefined,
        defaultSalePriceMax: defaultSalePriceMaxFilter ? Number(defaultSalePriceMaxFilter) : undefined,
        isActive: productStatusFilter,
        variantIsActive: variantStatusFilter,
      };
      const res = await getProducts(listParams);
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
    variantStatusFilter,
    isStoreScopedUser,
    scopeReady,
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
    variantStatusFilter,
  ]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    getAttributes()
      .then((res) => setAttributeDefinitions(res))
      .catch(() => setAttributeDefinitions([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getStores({ token, page: 1, limit: 100 })
      .then((res) => setStores(res.data))
      .catch(() => setStores([]));
  }, []);

  /* ── Pagination ── */

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (next: number) => { setPageSize(next); setCurrentPage(1); };
  const onPageChange = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const clearAdvancedFilters = () => {
    setDefaultPurchasePriceMinFilter("");
    setDefaultPurchasePriceMaxFilter("");
    setDefaultSalePriceMinFilter("");
    setDefaultSalePriceMaxFilter("");
  };

  /* ── Product toggle ── */

  const onToggleProductActive = async (product: Product, next: boolean) => {
    setTogglingProductIds((prev) => [...prev, product.id]);
    try {
      await updateProduct(product.id, {
        currency: product.currency,
        unitPrice: Number(product.unitPrice) || 0,
        purchasePrice: Number(product.purchasePrice) || 0,
        lineTotal: Number(product.lineTotal) || Number(product.unitPrice) || 0,
        ...(product.taxPercent != null
          ? { taxPercent: Number(product.taxPercent) || 0 }
          : product.taxAmount != null
            ? { taxAmount: Number(product.taxAmount) || 0 }
            : {}),
        ...(product.discountPercent != null
          ? { discountPercent: Number(product.discountPercent) || 0 }
          : product.discountAmount != null
            ? { discountAmount: Number(product.discountAmount) || 0 }
            : {}),
        name: product.name,
        sku: product.sku,
        description: product.description ?? undefined,
        image: product.image ?? undefined,
        isActive: next,
      });
      await fetchProducts();
    } catch {
      setError("Urun durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingProductIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  /* ── Variant expansion ── */

  const fetchTableVariants = async (
    productId: string,
    status: IsActiveFilter = variantStatusFilter,
  ) => {
    if (productVariantsLoadingById[productId]) return;

    setProductVariantsLoadingById((prev) => ({ ...prev, [productId]: true }));
    setProductVariantsErrorById((prev) => ({ ...prev, [productId]: "" }));

    try {
      const dataRaw = await getProductVariants(productId, {
        isActive: status,
      });
      const data = normalizeVariantsResponse(dataRaw);
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
        attributes: variant.attributes ?? [],
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

  /* ── Price handlers ── */

  const storeOptions = useMemo(
    () => stores.map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const openPriceDrawer = async (product: Product, variant: ProductVariant) => {
    let variantStores: InventoryStoreStockItem[] = [];
    try {
      const res = await getVariantStockByStore(variant.id);
      const raw = Array.isArray(res) ? res : Array.isArray((res as Record<string, unknown>)?.items) ? ((res as Record<string, unknown>).items as unknown[]) : Array.isArray((res as Record<string, unknown>)?.data) ? ((res as Record<string, unknown>).data as unknown[]) : [];
      variantStores = raw.map((item: unknown) => {
        const obj = item as Record<string, unknown>;
        return {
          storeId: String(obj.storeId ?? (obj.store as Record<string, unknown>)?.id ?? ""),
          storeName: String(obj.storeName ?? (obj.store as Record<string, unknown>)?.name ?? "-"),
          quantity: Number(obj.quantity ?? 0),
          totalQuantity: Number(obj.totalQuantity ?? obj.quantity ?? 0),
          salePrice: obj.salePrice == null ? null : Number(obj.salePrice),
          purchasePrice: obj.purchasePrice == null ? null : Number(obj.purchasePrice),
          currency: (String(obj.currency ?? "") || null) as InventoryStoreStockItem["currency"],
          taxPercent: obj.taxPercent == null ? null : Number(obj.taxPercent),
          taxAmount: obj.taxAmount == null ? null : Number(obj.taxAmount),
          discountPercent: obj.discountPercent == null ? null : Number(obj.discountPercent),
          discountAmount: obj.discountAmount == null ? null : Number(obj.discountAmount),
          lineTotal: obj.lineTotal == null ? null : Number(obj.lineTotal),
          isStoreOverride: Boolean(obj.isStoreOverride),
        };
      });
    } catch {
      variantStores = [];
    }

    setPriceTarget({
      productVariantId: variant.id,
      productName: product.name,
      variantName: variant.name ?? "-",
      stores: variantStores,
      initial: {
        unitPrice: variant.unitPrice ?? null,
        currency: variant.currency ?? product.currency,
        discountPercent: variant.discountPercent ?? null,
        discountAmount: variant.discountAmount ?? null,
        taxPercent: variant.taxPercent ?? null,
        taxAmount: variant.taxAmount ?? null,
        lineTotal: variant.lineTotal ?? null,
      },
    });
    setPriceProductId(product.id);
    setPriceOpen(true);
  };

  const closePriceDrawer = () => {
    setPriceOpen(false);
    setPriceTarget(null);
    setPriceProductId(null);
  };

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
    setStep1ProductInfoOpen(true);
    setStep1StoreScopeOpen(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingDetail) return;
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof ProductForm, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (
      (field === "unitPrice" ||
        field === "taxPercent" ||
        field === "taxAmount" ||
        field === "discountPercent" ||
        field === "discountAmount") &&
      errors.lineTotal
    ) {
      setErrors((prev) => ({ ...prev, lineTotal: undefined }));
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onFormPatch = (patch: Partial<ProductForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const onClearError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
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
        currency: detail.currency ?? "TRY",
        purchasePrice: detail.purchasePrice != null ? String(detail.purchasePrice) : "",
        unitPrice: detail.unitPrice != null ? String(detail.unitPrice) : "",
        discountMode:
          detail.discountAmount != null && String(detail.discountAmount) !== "" ? "amount" : "percent",
        discountPercent: detail.discountPercent != null ? String(detail.discountPercent) : "",
        discountAmount: detail.discountAmount != null ? String(detail.discountAmount) : "",
        taxMode: detail.taxAmount != null && String(detail.taxAmount) !== "" ? "amount" : "percent",
        taxPercent: detail.taxPercent != null ? String(detail.taxPercent) : "",
        taxAmount: detail.taxAmount != null ? String(detail.taxAmount) : "",
        name: detail.name ?? "",
        sku: detail.sku ?? "",
        description: detail.description ?? "",
        image: detail.image ?? "",
        storeIds: detail.storeIds ?? [],
        applyToAllStores: Boolean(detail.applyToAllStores),
      };
      setForm(formData);
      setOriginalForm(formData);
      setVariants([]);
      setStep1ProductInfoOpen(true);
      setStep1StoreScopeOpen(true);

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

    if (!form.unitPrice || isNaN(Number(form.unitPrice)) || Number(form.unitPrice) < 0)
      newErrors.unitPrice = "Gecerli bir satis fiyati girin.";

    if (!form.purchasePrice || isNaN(Number(form.purchasePrice)) || Number(form.purchasePrice) < 0)
      newErrors.purchasePrice = "Gecerli bir alis fiyati girin.";

    if (form.taxMode === "percent") {
      if (form.taxPercent && isNaN(Number(form.taxPercent))) {
        newErrors.taxPercent = "Gecerli bir vergi orani girin.";
      } else if (form.taxPercent) {
        const tax = Number(form.taxPercent);
        if (tax < 0 || tax > 100) newErrors.taxPercent = "Vergi orani 0-100 arasi olmalidir.";
      }
    } else if (form.taxAmount && isNaN(Number(form.taxAmount))) {
      newErrors.taxAmount = "Gecerli bir vergi tutari girin.";
    }

    if (form.discountMode === "percent") {
      if (form.discountPercent && isNaN(Number(form.discountPercent))) {
        newErrors.discountPercent = "Gecerli bir indirim orani girin.";
      } else if (form.discountPercent) {
        const discount = Number(form.discountPercent);
        if (discount < 0 || discount > 100) newErrors.discountPercent = "Indirim orani 0-100 arasi olmalidir.";
      }
    } else if (form.discountAmount && isNaN(Number(form.discountAmount))) {
      newErrors.discountAmount = "Gecerli bir indirim tutari girin.";
    }

    if (calculatedLineTotal == null || Number.isNaN(calculatedLineTotal) || calculatedLineTotal < 0) {
      newErrors.lineTotal = "Gecerli bir satir toplami girin.";
    }

    if (!isStoreScopedUser && !form.applyToAllStores && form.storeIds.length === 0) {
      newErrors.storeIds = "En az bir magaza secin veya tum magazalara uygulayin.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVariants = (): boolean => {
    if (variants.length === 0) return true;
    const newErrors: Record<number, VariantErrors> = {};

    variants.forEach((v, i) => {
      const e: VariantErrors = {};

      const hasEmptyAttr = v.attributes.some((a) => a.id && a.values.length === 0);
      const hasEmptyKey = v.attributes.some((a) => !a.id && a.values.length > 0);

      if (hasEmptyAttr || hasEmptyKey) {
        e.attributes = "Tum ozellik alanlari doldurulmalidir.";
      }

      if (Object.keys(e).length > 0) newErrors[i] = e;
    });

    setVariantErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ── Step navigation ── */

  const isFormChanged = (): boolean => {
    const simpleKeys = Object.keys(originalForm) as (keyof ProductForm)[];
    return simpleKeys.some((key) => {
      if (key === "storeIds") {
        const left = originalForm.storeIds;
        const right = form.storeIds;
        if (left.length !== right.length) return true;
        return left.some((id, i) => id !== right[i]);
      }
      return form[key] !== originalForm[key];
    });
  };

  const fetchVariants = async (productId: string) => {
    try {
      const productAttributesRes = await getProductAttributes(productId);
      const productAttributes = (productAttributesRes.attributes ?? []).map((attribute) => ({
        id: attribute.id,
        values: (attribute.values ?? [])
          .filter((value) => value.isActive)
          .map((value) => value.id),
      }));

      setOriginalVariantMap({});
      const clientKey = createVariantClientKey();
      setVariants([
        {
          clientKey,
          id: undefined,
          isActive: true,
          attributes: productAttributes.length > 0 ? productAttributes : [{ id: "", values: [] }],
        },
      ]);
      setExpandedVariantKeys([clientKey]);
    } catch {
      setExpandedVariantKeys([]);
      setOriginalVariantMap({});
      setVariants([]);
    }
  };

  const buildPricingPayload = () => ({
    currency: form.currency,
    unitPrice: Number(form.unitPrice),
    purchasePrice: Number(form.purchasePrice),
    lineTotal: calculatedLineTotal ?? 0,
    ...(form.taxMode === "percent"
      ? form.taxPercent
        ? { taxPercent: Number(form.taxPercent) }
        : {}
      : form.taxAmount
        ? { taxAmount: Number(form.taxAmount) }
        : {}),
    ...(form.discountMode === "percent"
      ? form.discountPercent
        ? { discountPercent: Number(form.discountPercent) }
        : {}
      : form.discountAmount
        ? { discountAmount: Number(form.discountAmount) }
        : {}),
  });

  const buildScopePayload = () =>
    isStoreScopedUser
      ? { storeIds: [], applyToAllStores: false }
      : form.applyToAllStores
        ? { storeIds: [], applyToAllStores: true }
        : { storeIds: form.storeIds, applyToAllStores: false };

  const goToStep2 = async () => {
    if (!validateStep1()) return;

    setSubmitting(true);
    setFormError("");

    try {
      const productPayload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim() || undefined,
        image: form.image.trim() || undefined,
        ...buildPricingPayload(),
        ...buildScopePayload(),
      };

      if (editingProductId) {
        if (isFormChanged()) {
          await updateProduct(editingProductId, productPayload);
        }
        await fetchVariants(editingProductId);
        setStep(2);
      } else {
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

  /* ── Close & reset helper ── */
  const closeAndReset = async () => {
    setDrawerOpen(false);
    setForm(EMPTY_PRODUCT_FORM);
    setVariants([]);
    setEditingProductId(null);
    setCreatedProductId(null);
    setExpandedVariantKeys([]);
    setOriginalVariantMap({});
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

    if (!validateVariants()) return;

    const preparedVariants = variants
      .filter((v) => v.attributes.some((a) => a.id && a.values.length > 0))
      .map((v) => ({
        id: v.id,
        isActive: v.isActive ?? true,
        payload: {
          attributes: v.attributes.filter((a) => a.id && a.values.length > 0),
        },
      }));

    const targetProductId = editingProductId ?? createdProductId;

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
            !areVariantAttributesEqual(original.payload.attributes, v.payload.attributes)
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
                updateProductVariant(editingProductId, v.id!, v.payload),
              ),
            );
          }

          if (variantsToCreate.length > 0) {
            await Promise.all(
              variantsToCreate.map((dto) =>
                createProductVariant(editingProductId, dto),
              ),
            );
          }

          await fetchTableVariants(editingProductId, variantStatusFilter);
        }
      } else {
        await Promise.all(
          preparedVariants.map((v) =>
            createProductVariant(targetProductId!, v.payload),
          ),
        );
      }

      await closeAndReset();
    } catch {
      setFormError("Varyantlar olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Variant helpers ── */

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

  const addAttribute = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, attributes: [...v.attributes, { id: "", values: [] }] } : v,
      ),
    );
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === variantIndex ? { ...v, attributes: v.attributes.filter((_, ai) => ai !== attrIndex) } : v)),
    );
  };

  const updateVariantAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "id" | "values",
    value: string | string[],
  ) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) => {
                if (ai !== attrIndex) return a;
                if (field === "id") {
                  return { id: String(value), values: [] };
                }
                return { ...a, values: Array.isArray(value) ? value : [] };
              }),
            }
          : v,
      ),
    );
  };

  /* ── Render ── */

  return (
    <div className="space-y-4">
      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        onNewProduct={onOpenDrawer}
        currencyFilter={currencyFilter}
        onCurrencyFilterChange={setCurrencyFilter}
        productStatusFilter={productStatusFilter}
        onProductStatusFilterChange={setProductStatusFilter}
        variantStatusFilter={variantStatusFilter}
        onVariantStatusFilterChange={setVariantStatusFilter}
        salePriceMin={defaultSalePriceMinFilter}
        onSalePriceMinChange={setDefaultSalePriceMinFilter}
        salePriceMax={defaultSalePriceMaxFilter}
        onSalePriceMaxChange={setDefaultSalePriceMaxFilter}
        purchasePriceMin={defaultPurchasePriceMinFilter}
        onPurchasePriceMinChange={setDefaultPurchasePriceMinFilter}
        purchasePriceMax={defaultPurchasePriceMaxFilter}
        onPurchasePriceMaxChange={setDefaultPurchasePriceMaxFilter}
        onClearAdvancedFilters={clearAdvancedFilters}
      />

      <ProductTable
        products={products}
        loading={loading}
        error={error}
        expandedProductIds={expandedProductIds}
        productVariantsById={productVariantsById}
        productVariantsLoadingById={productVariantsLoadingById}
        productVariantsErrorById={productVariantsErrorById}
        togglingProductIds={togglingProductIds}
        togglingVariantIds={togglingVariantIds}
        onToggleExpand={toggleExpandedProduct}
        onEdit={onEditProduct}
        onToggleActive={onToggleProductActive}
        onToggleVariantActive={onToggleVariantActive}
        onPrice={openPriceDrawer}
      />

      {meta && !loading && !error && (
        <ProductPagination
          page={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          total={meta.total}
          loading={loading}
          onPageChange={onPageChange}
          onPageSizeChange={onChangePageSize}
        />
      )}

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
              ) : step === 2 ? (
                <Button
                  label={submitting ? (editingProductId ? "Guncelleniyor..." : "Olusturuluyor...") : "Kaydet"}
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
            <ProductDrawerStep1
              form={form}
              errors={errors}
              calculatedLineTotal={calculatedLineTotal}
              storeOptions={storeOptions}
              isStoreScopedUser={isStoreScopedUser}
              productInfoOpen={step1ProductInfoOpen}
              onToggleProductInfo={() => setStep1ProductInfoOpen((prev) => !prev)}
              storeScopeOpen={step1StoreScopeOpen}
              onToggleStoreScope={() => setStep1StoreScopeOpen((prev) => !prev)}
              formError={formError}
              onFormChange={onFormChange}
              onFormPatch={onFormPatch}
              onClearError={onClearError}
            />
          ) : step === 2 ? (
            <ProductDrawerStep2
              variants={variants}
              expandedVariantKeys={expandedVariantKeys}
              variantErrors={variantErrors}
              attributeDefinitions={attributeDefinitions}
              formError={formError}
              onToggleVariantPanel={toggleVariantPanel}
              onRemoveVariant={removeVariant}
              onAddAttribute={addAttribute}
              onRemoveAttribute={removeAttribute}
              onUpdateAttribute={updateVariantAttribute}
            />
          ) : null}
        </form>
      </Drawer>

      <PriceDrawer
        open={priceOpen}
        target={priceTarget}
        allStoreOptions={storeOptions}
        isMobile={isMobile}
        showStoreScopeControls={!isStoreScopedUser}
        fixedStoreId={isStoreScopedUser ? scopedStoreId : undefined}
        onClose={closePriceDrawer}
        onSuccess={() => {
          if (priceProductId) {
            void fetchTableVariants(priceProductId, variantStatusFilter);
          }
        }}
      />
    </div>
  );
}
