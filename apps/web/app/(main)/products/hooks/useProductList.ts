"use client";
import { useCallback, useEffect, useState } from "react";
import {
  getProducts,
  getProductVariants,
  updateProduct,
  updateProductVariant,
  type Product,
  type ProductVariant,
  type ProductsListMeta,
  type Currency,
} from "@/lib/products";
import { useDebounceStr } from "@/hooks/useDebounce";
import { normalizeVariantsResponse, type IsActiveFilter } from "@/components/products/types";

type Options = {
  scopeReady: boolean;
  t: (key: string) => string;
};

export function useProductList({ scopeReady, t }: Options) {
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

  /* Variant expansion state */
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);
  const [productVariantsById, setProductVariantsById] = useState<Record<string, ProductVariant[]>>({});
  const [productVariantsLoadingById, setProductVariantsLoadingById] = useState<Record<string, boolean>>({});
  const [productVariantsErrorById, setProductVariantsErrorById] = useState<Record<string, string>>({});

  /* Toggle state */
  const [togglingProductIds, setTogglingProductIds] = useState<string[]>([]);
  const [togglingVariantIds, setTogglingVariantIds] = useState<string[]>([]);

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
      setError(t("products.loadError"));
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
    scopeReady,
    t,
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

  /* ── Pagination ── */

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (next: number) => {
    setPageSize(next);
    setCurrentPage(1);
  };

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

  /* ── Product toggle ── */

  const onToggleProductActive = async (product: Product, next: boolean) => {
    setTogglingProductIds((prev) => [...prev, product.id]);
    try {
      await updateProduct(product.id, {
        currency: product.currency,
        unitPrice: Number(product.unitPrice) || 0,
        purchasePrice: Number(product.purchasePrice) || 0,
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
        categoryId: product.categoryId ?? product.category?.id ?? undefined,
        supplierId: product.supplierId ?? product.supplier?.id ?? undefined,
        isActive: next,
      });
      await fetchProducts();
    } catch {
      setError("Urun durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingProductIds((prev) => prev.filter((id) => id !== product.id));
    }
  };

  /* ── Variant toggle ── */

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variantStatusFilter]);

  return {
    /* state */
    products,
    meta,
    currentPage,
    pageSize,
    searchTerm,
    setSearchTerm,
    currencyFilter,
    setCurrencyFilter,
    defaultPurchasePriceMinFilter,
    setDefaultPurchasePriceMinFilter,
    defaultPurchasePriceMaxFilter,
    setDefaultPurchasePriceMaxFilter,
    defaultSalePriceMinFilter,
    setDefaultSalePriceMinFilter,
    defaultSalePriceMaxFilter,
    setDefaultSalePriceMaxFilter,
    productStatusFilter,
    setProductStatusFilter,
    variantStatusFilter,
    setVariantStatusFilter,
    showAdvancedFilters,
    setShowAdvancedFilters,
    loading,
    error,
    /* derived */
    totalPages,
    /* expansion */
    expandedProductIds,
    productVariantsById,
    productVariantsLoadingById,
    productVariantsErrorById,
    /* toggle */
    togglingProductIds,
    togglingVariantIds,
    /* functions */
    fetchProducts,
    fetchTableVariants,
    toggleExpandedProduct,
    onToggleProductActive,
    onToggleVariantActive,
    onPageChange,
    onChangePageSize,
    clearAdvancedFilters,
  };
}
