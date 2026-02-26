"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  getProductCategoriesPaginated,
  updateProductCategory,
  type ProductCategory,
  type ProductCategoriesListMeta,
} from "@/lib/product-categories";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getVisiblePages } from "@/lib/pagination";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

const EMPTY_FORM: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[\u00E7]/g, "c")
    .replace(/[\u011F]/g, "g")
    .replace(/[\u0131]/g, "i")
    .replace(/[\u00F6]/g, "o")
    .replace(/[\u015F]/g, "s")
    .replace(/[\u00FC]/g, "u")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProductCategoriesPage() {
  const accessChecked = useAdminGuard();
  const isMobile = !useMediaQuery();

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [meta, setMeta] = useState<ProductCategoriesListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingCategoryDetail, setLoadingCategoryDetail] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [togglingCategoryIds, setTogglingCategoryIds] = useState<string[]>([]);

  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [slugTouched, setSlugTouched] = useState(false);

  const debouncedSearch = useDebounceStr(searchTerm, 500);

  const fetchCategories = useCallback(async () => {
    if (!accessChecked) return;
    setLoading(true);
    setError("");
    try {
      const res = await getProductCategoriesPaginated({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive: statusFilter,
      });
      setCategories(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setError("Urun kategorileri yuklenemedi. Lutfen tekrar deneyin.");
      setCategories([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [accessChecked, currentPage, pageSize, debouncedSearch, statusFilter]);

  const fetchAllCategories = useCallback(async () => {
    if (!accessChecked) return;
    try {
      const res = await getAllProductCategories({ isActive: "all" });
      setAllCategories(res);
    } catch {
      setAllCategories([]);
    }
  }, [accessChecked]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    void fetchAllCategories();
  }, [fetchAllCategories]);

  const totalPages = meta?.totalPages ?? 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goPrev = () => {
    if (!canGoPrev || loading) return;
    setCurrentPage((prev) => prev - 1);
  };

  const goNext = () => {
    if (!canGoNext || loading) return;
    setCurrentPage((prev) => prev + 1);
  };

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const pageItems = getVisiblePages(currentPage, totalPages);

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCategories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [allCategories]);

  const parentOptions = useMemo(
    () =>
      allCategories
        .filter((category) => category.id !== editingCategoryId)
        .map((category) => ({ value: category.id, label: category.name })),
    [allCategories, editingCategoryId],
  );

  const onOpenDrawer = () => {
    setFormError("");
    setNameError("");
    setSlugError("");
    setForm(EMPTY_FORM);
    setSlugTouched(false);
    setEditingCategoryId(null);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingCategoryDetail) return;
    setNameError("");
    setSlugError("");
    setDrawerOpen(false);
  };

  const onFormChange = (field: keyof CategoryForm, value: string) => {
    if (field === "name" && nameError) setNameError("");
    if (field === "slug" && slugError) setSlugError("");

    if (field === "name") {
      setForm((prev) => {
        const nextName = value;
        const nextSlug = !slugTouched ? slugifyText(nextName) : prev.slug;
        return {
          ...prev,
          name: nextName,
          slug: nextSlug,
        };
      });
      return;
    }

    if (field === "slug") {
      setSlugTouched(true);
      setForm((prev) => ({ ...prev, slug: value }));
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditCategory = async (id: string) => {
    setFormError("");
    setNameError("");
    setSlugError("");
    setLoadingCategoryDetail(true);
    try {
      const detail = await getProductCategoryById(id);
      setForm({
        name: detail.name ?? "",
        slug: detail.slug ?? "",
        description: detail.description ?? "",
        parentId: detail.parentId ?? "",
      });
      setEditingCategoryId(detail.id);
      setSlugTouched(true);
      setDrawerOpen(true);
    } catch {
      setFormError("Kategori detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingCategoryDetail(false);
    }
  };

  const onSubmitCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setNameError("");
    setSlugError("");

    const trimmedName = form.name.trim();
    const trimmedSlug = form.slug.trim();

    if (!trimmedName) {
      setNameError("Kategori adi zorunludur.");
      return;
    }

    if (!trimmedSlug) {
      setSlugError("Slug alani zorunludur.");
      return;
    }

    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(trimmedSlug)) {
      setSlugError("Slug sadece kucuk harf, rakam ve tire icerebilir.");
      return;
    }

    if (editingCategoryId && form.parentId && form.parentId === editingCategoryId) {
      setFormError("Bir kategori kendisini ust kategori secemez.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategoryId) {
        await updateProductCategory(editingCategoryId, {
          name: trimmedName,
          slug: trimmedSlug,
          description: form.description.trim() || undefined,
          parentId: form.parentId || null,
        });
      } else {
        await createProductCategory({
          name: trimmedName,
          slug: trimmedSlug,
          description: form.description.trim() || undefined,
          parentId: form.parentId || null,
          isActive: true,
        });
      }

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setNameError("");
      setSlugError("");
      setEditingCategoryId(null);
      setSlugTouched(false);
      await Promise.all([fetchCategories(), fetchAllCategories()]);
    } catch {
      setFormError(
        editingCategoryId
          ? "Kategori guncellenemedi. Lutfen tekrar deneyin."
          : "Kategori olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
  };

  const onToggleCategoryActive = async (category: ProductCategory, next: boolean) => {
    setTogglingCategoryIds((prev) => [...prev, category.id]);
    try {
      await updateProductCategory(category.id, {
        name: category.name,
        slug: category.slug ?? slugifyText(category.name),
        description: category.description ?? undefined,
        parentId: category.parentId ?? null,
        isActive: next,
      });
      await Promise.all([fetchCategories(), fetchAllCategories()]);
    } catch {
      setError("Kategori durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingCategoryIds((prev) => prev.filter((id) => id !== category.id));
    }
  };

  if (!accessChecked) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Urun Kategorileri</h1>
          <p className="text-sm text-muted">Kategori listesi ve yonetimi</p>
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
            onClick={() => setShowAdvancedFilters((prev) => !prev)}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          <Button
            label="Yeni Kategori"
            onClick={onOpenDrawer}
            variant="primarySoft"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
        </div>
      </div>

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
              inputAriaLabel="Kategori durum filtresi"
              toggleAriaLabel="Kategori durum listesini ac"
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

      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        {loading ? (
          <div className="p-6 text-sm text-muted">Kategoriler yukleniyor...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Kategori Adi</th>
                    <th className="px-4 py-3">Slug</th>
                    <th className="px-4 py-3">Aciklama</th>
                    <th className="px-4 py-3">Ust Kategori</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">Islemler</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                        Kayit bulunamadi.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr
                        key={category.id}
                        className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-text">{category.name}</td>
                        <td className="px-4 py-3 text-sm text-text2">{category.slug ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">{category.description ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {category.parent?.name ?? (category.parentId ? parentNameMap.get(category.parentId) ?? "-" : "-")}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              category.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                            }`}
                          >
                            {category.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void onEditCategory(category.id)}
                              disabled={togglingCategoryIds.includes(category.id)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                              aria-label="Kategori duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </button>
                            <ToggleSwitch
                              checked={Boolean(category.isActive)}
                              onChange={(next) => void onToggleCategoryActive(category, next)}
                              disabled={togglingCategoryIds.includes(category.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
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
                  <label htmlFor="categoryPageSize" className="text-xs text-muted">
                    Satir:
                  </label>
                  <select
                    id="categoryPageSize"
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

      <Drawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        side="right"
        title={editingCategoryId ? "Kategori Guncelle" : "Yeni Kategori"}
        description={editingCategoryId ? "Kategori bilgilerini guncelleyin" : "Isim ve slug alanlari zorunludur"}
        closeDisabled={submitting || loadingCategoryDetail}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="Iptal"
              type="button"
              onClick={onCloseDrawer}
              disabled={submitting || loadingCategoryDetail}
              variant="secondary"
            />
            <Button
              label={submitting ? (editingCategoryId ? "Guncelleniyor..." : "Olusturuluyor...") : "Kaydet"}
              type="submit"
              form="category-form"
              disabled={submitting || loadingCategoryDetail}
              variant="primarySolid"
            />
          </div>
        }
      >
        <form id="category-form" onSubmit={onSubmitCategory} className="space-y-4 p-5">
          {loadingCategoryDetail ? (
            <div className="text-sm text-muted">Kategori detayi yukleniyor...</div>
          ) : (
            <>
              <InputField
                label="Kategori Adi *"
                type="text"
                value={form.name}
                onChange={(value) => onFormChange("name", value)}
                placeholder="Elektronik"
                error={nameError}
              />

              <InputField
                label="Slug *"
                type="text"
                value={form.slug}
                onChange={(value) => onFormChange("slug", value)}
                placeholder="elektronik"
                error={slugError}
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Ust Kategori</label>
                <SearchableDropdown
                  options={parentOptions}
                  value={form.parentId}
                  onChange={(value) => onFormChange("parentId", value)}
                  placeholder="Ana kategori"
                  emptyOptionLabel="Ana Kategori"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Aciklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => onFormChange("description", e.target.value)}
                  className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                  placeholder="Tum elektronik urunler"
                />
              </div>

              {formError && <p className="text-sm text-error">{formError}</p>}
            </>
          )}
        </form>
      </Drawer>
    </div>
  );
}
