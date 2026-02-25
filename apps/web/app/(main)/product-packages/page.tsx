"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProductPackage,
  getProductPackageById,
  getProductPackages,
  updateProductPackage,
  type ProductPackage,
  type ProductPackagesListMeta,
} from "@/lib/product-packages";
import { getProducts, getProductVariants, type Product } from "@/lib/products";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import { EditIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { formatPrice, toNumberOrNull } from "@/lib/format";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getVisiblePages } from "@/lib/pagination";
import {
  STATUS_FILTER_OPTIONS,
  parseIsActiveFilter,
} from "@/components/products/types";

/* ── Local types ── */

type PackageItemRow = {
  rowId: string;
  productVariantId: string;
  variantLabel: string;
  quantity: string;
};

type PackageForm = {
  name: string;
  code: string;
  description: string;
};

type FormErrors = Partial<Record<keyof PackageForm | "items", string>>;

const EMPTY_FORM: PackageForm = {
  name: "",
  code: "",
  description: "",
};

type SessionUserForStoreType = {
  storeType?: string;
  store?: {
    storeType?: string;
  };
  userStores?: Array<{
    storeType?: string;
    store?: {
      storeType?: string;
    };
  }>;
};

function normalizeStoreType(value?: string | null): "RETAIL" | "WHOLESALE" | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === "WHOLESALE") return "WHOLESALE";
  if (normalized === "RETAIL") return "RETAIL";
  return null;
}

function resolveStoreType(user: SessionUserForStoreType | null): "RETAIL" | "WHOLESALE" | null {
  if (!user) return null;
  const direct = normalizeStoreType(user.storeType);
  if (direct) return direct;
  const fromStore = normalizeStoreType(user.store?.storeType);
  if (fromStore) return fromStore;
  if (Array.isArray(user.userStores)) {
    for (const item of user.userStores) {
      const fromUserStore = normalizeStoreType(item?.storeType ?? item?.store?.storeType);
      if (fromUserStore) return fromUserStore;
    }
  }
  return null;
}

function createRowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/* ── Component ── */

export default function ProductPackagesPage() {
  const router = useRouter();
  const [accessChecked, setAccessChecked] = useState(false);
  const isMobile = !useMediaQuery();

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        router.replace("/dashboard");
        return;
      }
      const parsed = JSON.parse(rawUser) as SessionUserForStoreType;
      if (resolveStoreType(parsed) !== "WHOLESALE") {
        router.replace("/dashboard");
        return;
      }
      setAccessChecked(true);
    } catch {
      router.replace("/dashboard");
    }
  }, [router]);

  /* List state */
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [meta, setMeta] = useState<ProductPackagesListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedPackageIds, setExpandedPackageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  /* Drawer state */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [items, setItems] = useState<PackageItemRow[]>([]);

  /* Variant add state */
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [variantSearchLoading, setVariantSearchLoading] = useState(false);
  const [variantSearchProducts, setVariantSearchProducts] = useState<Product[]>([]);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState("");
  const [variantOptions, setVariantOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [addItemQuantity, setAddItemQuantity] = useState("1");
  const [addItemError, setAddItemError] = useState("");

  const debouncedSearch = useDebounceStr(searchTerm, 500);
  const debouncedVariantSearch = useDebounceStr(variantSearchTerm, 400);

  /* ── Fetch packages ── */
  const fetchPackages = useCallback(async () => {
    if (!accessChecked) return;
    setLoading(true);
    setError("");
    try {
      const res = await getProductPackages({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive: statusFilter,
      });
      setPackages(res.data);
      setMeta(res.meta);
    } catch {
      setError("Paketler yuklenemedi. Lutfen tekrar deneyin.");
      setPackages([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [accessChecked, currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (debouncedSearch !== "") setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  /* ── Variant search (product level) ── */
  useEffect(() => {
    if (!debouncedVariantSearch.trim()) {
      setVariantSearchProducts([]);
      return;
    }
    let cancelled = false;
    setVariantSearchLoading(true);
    getProducts({ search: debouncedVariantSearch, limit: 20 })
      .then((res) => {
        if (!cancelled) setVariantSearchProducts(res.data);
      })
      .catch(() => {
        if (!cancelled) setVariantSearchProducts([]);
      })
      .finally(() => {
        if (!cancelled) setVariantSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedVariantSearch]);

  /* ── Load variants for selected product ── */
  useEffect(() => {
    if (!selectedProductForVariant) {
      setVariantOptions([]);
      setSelectedVariantIds([]);
      return;
    }
    setVariantsLoading(true);
    getProductVariants(selectedProductForVariant)
      .then((variants) => {
        setVariantOptions(
          variants
            .filter((v) => v.isActive !== false)
            .map((v) => ({ value: v.id, label: `${v.name} (${v.code})` })),
        );
      })
      .catch(() => setVariantOptions([]))
      .finally(() => setVariantsLoading(false));
  }, [selectedProductForVariant]);

  /* ── Pagination ── */
  const totalPages = meta?.totalPages ?? 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  const goPrev = () => {
    if (!canGoPrev || loading) return;
    setCurrentPage((p) => p - 1);
  };
  const goNext = () => {
    if (!canGoNext || loading) return;
    setCurrentPage((p) => p + 1);
  };
  const onChangePageSize = (s: number) => {
    setPageSize(s);
    setCurrentPage(1);
  };
  const goToPage = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };
  const pageItems = getVisiblePages(currentPage, totalPages);

  /* ── Helpers ── */
  const resetItemSearch = () => {
    setVariantSearchTerm("");
    setVariantSearchProducts([]);
    setSelectedProductForVariant("");
    setVariantOptions([]);
    setSelectedVariantIds([]);
    setAddItemQuantity("1");
    setAddItemError("");
  };

  /* ── Drawer open/close ── */
  const onOpenDrawer = () => {
    setFormError("");
    setErrors({});
    setForm(EMPTY_FORM);
    setItems([]);
    setEditingId(null);
    setEditingIsActive(true);
    resetItemSearch();
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingDetail) return;
    setErrors({});
    setDrawerOpen(false);
  };

  /* ── Edit ── */
  const onEditPackage = async (id: string) => {
    setFormError("");
    setErrors({});
    setLoadingDetail(true);
    resetItemSearch();
    try {
      const detail = await getProductPackageById(id);
      setForm({
        name: detail.name ?? "",
        code: detail.code ?? "",
        description: detail.description ?? "",
      });
      setItems(
        (detail.items ?? []).map((item) => ({
          rowId: createRowId(),
          productVariantId: item.productVariant.id,
          variantLabel: `${item.productVariant.name} (${item.productVariant.code})`,
          quantity: String(item.quantity),
        })),
      );
      setEditingId(detail.id);
      setEditingIsActive(detail.isActive ?? true);
      setDrawerOpen(true);
    } catch {
      setFormError("Paket detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingDetail(false);
    }
  };

  /* ── Form change ── */
  const onFormChange = (field: keyof PackageForm, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  /* ── Add item ── */
  const onAddItem = () => {
    setAddItemError("");
    if (selectedVariantIds.length === 0) {
      setAddItemError("Lutfen en az bir varyant secin.");
      return;
    }
    const qty = toNumberOrNull(addItemQuantity);
    if (!qty || qty <= 0) {
      setAddItemError("Gecerli bir miktar girin (en az 1).");
      return;
    }

    const existingVariantIds = new Set(items.map((it) => it.productVariantId));
    const variantIdsToAdd = selectedVariantIds.filter((id) => !existingVariantIds.has(id));
    if (variantIdsToAdd.length === 0) {
      setAddItemError("Secilen varyantlar pakete zaten eklendi.");
      return;
    }

    setItems((prev) => {
      const nextItems = [...prev];
      for (const variantId of variantIdsToAdd) {
        const label = variantOptions.find((v) => v.value === variantId)?.label ?? variantId;
        nextItems.push({
          rowId: createRowId(),
          productVariantId: variantId,
          variantLabel: label,
          quantity: String(qty),
        });
      }
      return nextItems;
    });

    if (errors.items) setErrors((prev) => ({ ...prev, items: undefined }));
    setSelectedVariantIds([]);
    setAddItemQuantity("1");
  };

  /* ── Remove item ── */
  const onRemoveItem = (rowId: string) => {
    setItems((prev) => prev.filter((it) => it.rowId !== rowId));
  };

  /* ── Item quantity change ── */
  const onItemQuantityChange = (rowId: string, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.rowId === rowId ? { ...it, quantity: value } : it)),
    );
  };

  /* ── Validate ── */
  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Paket adi zorunludur.";
    if (!form.code.trim()) nextErrors.code = "Paket kodu zorunludur.";
    if (items.length === 0) nextErrors.items = "En az bir urun kalemi eklenmeli.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /* ── Submit ── */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        items: items.map((it) => ({
          productVariantId: it.productVariantId,
          quantity: toNumberOrNull(it.quantity) ?? 1,
        })),
      };
      if (editingId) {
        await updateProductPackage(editingId, { ...payload, isActive: editingIsActive });
      } else {
        await createProductPackage(payload);
      }
      setDrawerOpen(false);
      await fetchPackages();
    } catch {
      setFormError(
        editingId
          ? "Paket guncellenemedi. Lutfen tekrar deneyin."
          : "Paket olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Toggle active ── */
  const onToggleActive = async (pkg: ProductPackage, next: boolean) => {
    setTogglingIds((prev) => [...prev, pkg.id]);
    try {
      await updateProductPackage(pkg.id, {
        name: pkg.name,
        code: pkg.code,
        isActive: next,
        items: (pkg.items ?? []).map((it) => ({
          productVariantId: it.productVariant.id,
          quantity: it.quantity,
        })),
      });
      await fetchPackages();
    } catch {
      setError("Paket durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== pkg.id));
    }
  };

  const clearAdvancedFilters = () => setStatusFilter("all");

  const onToggleExpand = (packageId: string) => {
    setExpandedPackageIds((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId],
    );
  };

  /* ── Render ── */
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Urun Paketleri</h1>
          <p className="text-sm text-muted">Toptan satis paket tanimlari ve yonetimi</p>
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
            label={showAdvancedFilters ? "Detayli Filtreyi Gizle" : "Detayli Filtre"}
            onClick={() => setShowAdvancedFilters((p) => !p)}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          <Button
            label="Yeni Paket"
            onClick={onOpenDrawer}
            variant="primarySoft"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => setStatusFilter(parseIsActiveFilter(value))}
              placeholder="Tum Durumlar"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Paket durum filtresi"
              toggleAriaLabel="Paket durum listesini ac"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button
              label="Filtreleri Temizle"
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
          <div className="p-6 text-sm text-muted">Paketler yukleniyor...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1060px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="w-10 px-2 py-3 text-center"></th>
                    <th className="px-4 py-3">Paket Adi</th>
                    <th className="px-4 py-3">Kod</th>
                    <th className="px-4 py-3">Aciklama</th>
                    <th className="px-4 py-3">Satis Fiyati</th>
                    <th className="px-4 py-3">Alis Fiyati</th>
                    <th className="px-4 py-3">KDV %</th>
                    <th className="px-4 py-3">Para Birimi</th>
                    <th className="px-4 py-3">Varyant</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="sticky right-0 z-20 w-[156px] bg-surface2/70 px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                      Islemler
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {packages.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted">
                        Kayit bulunamadi.
                      </td>
                    </tr>
                  ) : (
                    packages.map((pkg) => {
                      const isExpanded = expandedPackageIds.includes(pkg.id);
                      const itemCount = pkg.items?.length ?? 0;
                      return [
                        <tr
                          key={`${pkg.id}-row`}
                          className="group border-b border-border hover:bg-surface2/50 transition-colors"
                        >
                          <td className="px-2 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleExpand(pkg.id)}
                              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text"
                              aria-label={isExpanded ? "Paket kalemlerini gizle" : "Paket kalemlerini goster"}
                              title={isExpanded ? "Paket kalemlerini gizle" : "Paket kalemlerini goster"}
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
                          <td className="px-4 py-3 text-sm font-medium text-text">{pkg.name}</td>
                          <td className="px-4 py-3 text-sm font-mono text-text2">{pkg.code}</td>
                          <td className="max-w-[160px] truncate px-4 py-3 text-sm text-text2">
                            {pkg.description ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-text2">
                            {pkg.defaultSalePrice != null
                              ? formatPrice(pkg.defaultSalePrice)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-text2">
                            {pkg.defaultPurchasePrice != null
                              ? formatPrice(pkg.defaultPurchasePrice)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-text2">
                            {pkg.defaultTaxPercent != null ? `%${pkg.defaultTaxPercent}` : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-text2">
                            {pkg.defaultCurrency ?? "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-text2">
                            <span className="inline-flex rounded-full bg-surface2 px-2 py-0.5 text-xs font-semibold text-text2">
                              {itemCount}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                                pkg.isActive
                                  ? "bg-primary/15 text-primary"
                                  : "bg-error/15 text-error",
                              )}
                            >
                              {pkg.isActive ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="sticky right-0 z-10 w-[156px] bg-surface px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)] group-hover:bg-surface2/50">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onEditPackage(pkg.id)}
                                disabled={togglingIds.includes(pkg.id)}
                                className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                                title="Duzenle"
                              >
                                <EditIcon />
                              </button>
                              <ToggleSwitch
                                checked={Boolean(pkg.isActive)}
                                onChange={(next) => onToggleActive(pkg, next)}
                                disabled={togglingIds.includes(pkg.id)}
                              />
                            </div>
                          </td>
                        </tr>,
                        isExpanded ? (
                          <tr key={`${pkg.id}-items`} className="border-b border-border bg-surface/60">
                            <td colSpan={11} className="px-4 py-3">
                              {itemCount === 0 ? (
                                <div className="rounded-xl border border-border bg-surface2/40 p-3 text-sm text-muted">
                                  Bu pakette varyant kalemi bulunmuyor.
                                </div>
                              ) : (
                                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                                  <table className="w-full min-w-[620px]">
                                    <thead className="border-b border-border bg-surface2/70">
                                      <tr className="text-left text-xs uppercase tracking-wide text-muted">
                                        <th className="px-4 py-2.5">Varyant Adi</th>
                                        <th className="px-4 py-2.5">Kod</th>
                                        <th className="px-4 py-2.5 text-right">Adet</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(pkg.items ?? []).map((item) => (
                                        <tr key={item.id} className="border-b border-border last:border-b-0">
                                          <td className="px-4 py-2.5 text-sm text-text">
                                            {item.productVariant.name}
                                          </td>
                                          <td className="px-4 py-2.5 text-sm font-mono text-text2">
                                            {item.productVariant.code}
                                          </td>
                                          <td className="px-4 py-2.5 text-right text-sm text-text2">
                                            {item.quantity}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        ) : null,
                      ];
                    })
                  )}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span>Toplam: {meta.total}</span>
                  <span>
                    Sayfa: {currentPage}/{totalPages}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="pkgPageSize" className="text-xs text-muted">
                    Satir:
                  </label>
                  <select
                    id="pkgPageSize"
                    value={pageSize}
                    onChange={(e) => onChangePageSize(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <Button
                    label="Onceki"
                    onClick={goPrev}
                    disabled={!canGoPrev || loading}
                    variant="pagination"
                  />
                  {pageItems.map((item, idx) =>
                    item === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted">
                        ...
                      </span>
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
                  <Button
                    label="Sonraki"
                    onClick={goNext}
                    disabled={!canGoNext || loading}
                    variant="pagination"
                  />
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        side="right"
        title={editingId ? "Paketi Guncelle" : "Yeni Paket Olustur"}
        description={
          editingId
            ? "Paket bilgilerini ve icerigini guncelleyin"
            : "Paket bilgilerini ve urun kalemlerini tanimlayin"
        }
        closeDisabled={submitting || loadingDetail}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              type="button"
              onClick={onCloseDrawer}
              disabled={submitting || loadingDetail}
              variant="secondary"
            />
            <Button
              label={
                submitting
                  ? editingId
                    ? "Guncelleniyor..."
                    : "Olusturuluyor..."
                  : "Kaydet"
              }
              type="submit"
              form="package-form"
              disabled={submitting || loadingDetail}
              variant="primarySolid"
            />
          </div>
        }
      >
        <form id="package-form" onSubmit={onSubmit} className="space-y-4 p-5">
          {loadingDetail ? (
            <div className="text-sm text-muted">Paket detayi yukleniyor...</div>
          ) : (
            <>
              {/* Paket Adi */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Paket Adi *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => onFormChange("name", e.target.value)}
                  placeholder="Kiyafet Paketi S/M/L"
                  className={cn(
                    "h-10 w-full rounded-xl border bg-surface px-3 text-sm text-text outline-none transition-colors focus:ring-1 focus:ring-primary",
                    errors.name ? "border-error" : "border-border focus:border-primary",
                  )}
                />
                {errors.name && <p className="text-xs text-error">{errors.name}</p>}
              </div>

              {/* Paket Kodu */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Paket Kodu *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => onFormChange("code", e.target.value)}
                  placeholder="PKG-001"
                  className={cn(
                    "h-10 w-full rounded-xl border bg-surface px-3 font-mono text-sm text-text outline-none transition-colors focus:ring-1 focus:ring-primary",
                    errors.code ? "border-error" : "border-border focus:border-primary",
                  )}
                />
                {errors.code && <p className="text-xs text-error">{errors.code}</p>}
              </div>

              {/* Aciklama */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => onFormChange("description", e.target.value)}
                  placeholder="S, M, L bedenlerinden birer adet icerir"
                  className="min-h-[80px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                />
              </div>

              {/* Aktif toggle (sadece edit modunda) */}
              {editingId && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
                  <span className="text-xs font-semibold text-muted">Aktif</span>
                  <ToggleSwitch
                    checked={editingIsActive}
                    onChange={setEditingIsActive}
                    disabled={submitting}
                  />
                </div>
              )}

              {/* Paket Kalemleri */}
              <div className="space-y-3 border-t border-border pt-4">
                <div>
                  <h3 className="text-sm font-semibold text-text">Paket Kalemleri</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    Pakete eklenecek urun varyantlarini ve miktarlarini tanimlayin
                  </p>
                </div>

                {errors.items && <p className="text-xs text-error">{errors.items}</p>}

                {/* Eklenen kalemler listesi */}
                {items.length > 0 && (
                  <div className="divide-y divide-border rounded-xl border border-border bg-surface2/30">
                    {items.map((item) => (
                      <div
                        key={item.rowId}
                        className="flex items-center gap-3 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-text">{item.variantLabel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="whitespace-nowrap text-xs text-muted">Adet:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              onItemQuantityChange(item.rowId, e.target.value)
                            }
                            className="h-8 w-20 rounded-lg border border-border bg-surface px-2 text-sm text-text outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.rowId)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-error hover:bg-error/10 transition-colors"
                            title="Kalemi kaldir"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Yeni kalem ekleme bolumu */}
                <div className="space-y-3 rounded-xl2 border border-dashed border-border bg-surface2/20 p-3">
                  <p className="text-xs font-semibold text-muted">Varyant Ekle</p>

                  {/* Urun arama */}
                  <div className="space-y-1">
                    <label className="text-xs text-muted">Urun Ara</label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                        <SearchIcon />
                      </div>
                      <input
                        type="text"
                        placeholder="Urun adi veya SKU..."
                        value={variantSearchTerm}
                        onChange={(e) => {
                          setVariantSearchTerm(e.target.value);
                          setSelectedProductForVariant("");
                          setSelectedVariantIds([]);
                        }}
                        className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {variantSearchLoading && (
                      <p className="text-xs text-muted">Aranyor...</p>
                    )}
                    {!variantSearchLoading &&
                      variantSearchProducts.length > 0 &&
                      !selectedProductForVariant && (
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface shadow-md">
                          {variantSearchProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductForVariant(product.id);
                                setVariantSearchTerm(product.name);
                                setVariantSearchProducts([]);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-text2 hover:bg-surface2 hover:text-text transition-colors"
                            >
                              <span className="font-medium">{product.name}</span>
                              <span className="ml-2 text-xs text-muted">({product.sku})</span>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Varyant secimi */}
                  {selectedProductForVariant && (
                    <div className="space-y-1">
                      <label className="text-xs text-muted">Varyantlari Sec</label>
                      {variantsLoading ? (
                        <p className="text-xs text-muted">Varyantlar yukleniyor...</p>
                      ) : variantOptions.length === 0 ? (
                        <p className="text-xs text-muted">
                          Bu urun icin aktif varyant bulunamadi.
                        </p>
                      ) : (
                        <SearchableMultiSelectDropdown
                          options={variantOptions.filter(
                            (option) =>
                              selectedVariantIds.includes(option.value) ||
                              !items.some((item) => item.productVariantId === option.value),
                          )}
                          values={selectedVariantIds}
                          onChange={setSelectedVariantIds}
                          placeholder="Varyantlari secin..."
                          noResultsText="Secilebilir varyant kalmadi."
                        />
                      )}
                    </div>
                  )}

                  {/* Miktar + Ekle butonu */}
                  {selectedVariantIds.length > 0 && (
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-xs text-muted">
                          Miktar (paket basina adet)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={addItemQuantity}
                          onChange={(e) => setAddItemQuantity(e.target.value)}
                          className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                        />
                      </div>
                      <Button
                        label={`Secilenleri Ekle (${selectedVariantIds.length})`}
                        type="button"
                        onClick={onAddItem}
                        variant="primarySoft"
                        className="h-9 px-4 py-0"
                      />
                    </div>
                  )}

                  {addItemError && <p className="text-xs text-error">{addItemError}</p>}
                </div>
              </div>

              {formError && <p className="text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>
    </div>
  );
}
