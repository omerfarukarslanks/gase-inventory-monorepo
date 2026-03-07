"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoryById,
  getProductCategoriesPaginated,
  updateProductCategory,
  type ProductCategory,
  type ProductCategoriesListMeta,
} from "@/lib/product-categories";
import { useDebounceStr } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";
import ProductCategoryFilters from "@/components/product-categories/ProductCategoryFilters";
import ProductCategoryTable from "@/components/product-categories/ProductCategoryTable";
import ProductCategoryDrawer from "@/components/product-categories/ProductCategoryDrawer";
import { EMPTY_FORM, slugifyText, type CategoryForm } from "@/components/product-categories/types";

export default function ProductCategoriesPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const canCreate = can("PRODUCT_CATEGORY_CREATE");
  const canUpdate = can("PRODUCT_CATEGORY_UPDATE");
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
      setError(t("productCategories.loadError"));
      setCategories([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, t]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const res = await getAllProductCategories({ isActive: "all" });
      setAllCategories(res);
    } catch {
      setAllCategories([]);
    }
  }, []);

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

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

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
      setFormError(t("common.loadError"));
    } finally {
      setLoadingCategoryDetail(false);
    }
  };

  const onSubmitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setFormError(t("common.loadError"));
    } finally {
      setSubmitting(false);
    }
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
      setError(t("common.loadError"));
    } finally {
      setTogglingCategoryIds((prev) => prev.filter((id) => id !== category.id));
    }
  };

  return (
    <div className="space-y-4">
      <ProductCategoryFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={onOpenDrawer}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => setStatusFilter("all")}
      />

      <ProductCategoryTable
        loading={loading}
        error={error}
        categories={categories}
        parentNameMap={parentNameMap}
        canUpdate={canUpdate}
        togglingCategoryIds={togglingCategoryIds}
        onEditCategory={(id) => void onEditCategory(id)}
        onToggleCategoryActive={(category, next) => void onToggleCategoryActive(category, next)}
        footer={
          meta ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={meta.total}
              pageSize={pageSize}
              pageSizeId="product-categories-page-size"
              loading={loading}
              onPageChange={setCurrentPage}
              onPageSizeChange={onChangePageSize}
            />
          ) : null
        }
      />

      <ProductCategoryDrawer
        open={drawerOpen}
        editingCategoryId={editingCategoryId}
        submitting={submitting}
        loadingCategoryDetail={loadingCategoryDetail}
        isMobile={isMobile}
        form={form}
        parentOptions={parentOptions}
        formError={formError}
        nameError={nameError}
        slugError={slugError}
        onClose={onCloseDrawer}
        onSubmit={onSubmitCategory}
        onFormChange={onFormChange}
      />
    </div>
  );
}
