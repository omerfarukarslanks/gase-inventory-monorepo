"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
import StoresFilters from "@/components/stores/StoresFilters";
import StoreDrawer from "@/components/stores/StoreDrawer";
import StoresTable from "@/components/stores/StoresTable";
import { EMPTY_FORM, type StoreForm } from "@/components/stores/types";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";
import type { Currency } from "@/lib/products";
import {
  createStore,
  getStoreById,
  getStores,
  updateStore,
  type Store,
  type StoreType,
  type StoresListMeta,
} from "@/lib/stores";

export default function StoresPage() {
  const accessChecked = useAdminGuard();
  const { can } = usePermissions();
  const isMobile = !useMediaQuery();
  const { t } = useLang();

  const [stores, setStores] = useState<Store[]>([]);
  const [meta, setMeta] = useState<StoresListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingStoreIds, setTogglingStoreIds] = useState<string[]>([]);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreIsActive, setEditingStoreIsActive] = useState(true);
  const [loadingStoreDetail, setLoadingStoreDetail] = useState(false);
  const [formError, setFormError] = useState("");
  const [nameError, setNameError] = useState("");
  const [form, setForm] = useState<StoreForm>(EMPTY_FORM);

  const debouncedSearch = useDebounceStr(searchTerm, 500);
  const canCreate = can("STORE_CREATE");
  const canUpdate = can("STORE_UPDATE");
  const storeTypeOptions = [
    { value: "RETAIL", label: t("stores.storeTypeRetail") },
    { value: "WHOLESALE", label: t("stores.storeTypeWholesale") },
  ] as const;

  const normalizeCurrency = (value: string): Currency =>
    value === "USD" || value === "EUR" ? value : "TRY";

  const normalizeStoreType = (value: string): StoreType =>
    value === "WHOLESALE" ? "WHOLESALE" : "RETAIL";

  const fetchStores = useCallback(async () => {
    if (!accessChecked) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("common.sessionNotFound"));
        setStores([]);
        setMeta(null);
        return;
      }

      const res = await getStores({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        isActive: statusFilter,
        token,
      });

      setStores(res.data);
      setMeta(res.meta);
    } catch {
      setError(t("stores.loadError"));
      setStores([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [accessChecked, currentPage, debouncedSearch, pageSize, statusFilter, t]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    void fetchStores();
  }, [fetchStores]);

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const onOpenDrawer = () => {
    setFormError("");
    setNameError("");
    setForm(EMPTY_FORM);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingStoreDetail) return;
    setNameError("");
    setDrawerOpen(false);
  };

  const onFormChange = <K extends keyof StoreForm>(field: K, value: StoreForm[K]) => {
    if (field === "name" && nameError) {
      setNameError("");
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onEditStore = async (id: string) => {
    setFormError("");
    setNameError("");
    setLoadingStoreDetail(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setFormError(t("common.sessionNotFound"));
        return;
      }

      const detail = await getStoreById(id, token);
      setForm({
        name: detail.name ?? "",
        storeType: normalizeStoreType(String(detail.storeType ?? "RETAIL")),
        currency: normalizeCurrency(String(detail.currency ?? "TRY")),
        code: detail.code ?? "",
        address: detail.address ?? "",
        slug: detail.slug ?? "",
        logo: detail.logo ?? "",
        description: detail.description ?? "",
      });
      setEditingStoreId(detail.id);
      setEditingStoreIsActive(detail.isActive);
      setDrawerOpen(true);
    } catch {
      setFormError(t("stores.detailLoadError"));
    } finally {
      setLoadingStoreDetail(false);
    }
  };

  const onSubmitStore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setNameError("");

    if (!form.name.trim()) {
      setNameError(t("stores.nameRequired"));
      return;
    }

    if (form.name.trim().length < 2) {
      setNameError(t("stores.nameMinLength"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setFormError(t("common.sessionNotFound"));
      return;
    }

    setSubmitting(true);

    try {
      if (editingStoreId) {
        await updateStore(
          editingStoreId,
          {
            name: form.name.trim(),
            code: form.code.trim() || undefined,
            address: form.address.trim() || undefined,
            slug: form.slug.trim() || undefined,
            logo: form.logo.trim() || undefined,
            description: form.description.trim() || undefined,
            isActive: editingStoreIsActive,
          },
          token,
        );
      } else {
        await createStore(
          {
            name: form.name.trim(),
            storeType: form.storeType,
            currency: form.currency,
            code: form.code.trim() || undefined,
            address: form.address.trim() || undefined,
            slug: form.slug.trim() || undefined,
            logo: form.logo.trim() || undefined,
            description: form.description.trim() || undefined,
          },
          token,
        );
      }

      setDrawerOpen(false);
      setForm(EMPTY_FORM);
      setNameError("");
      setEditingStoreId(null);
      setEditingStoreIsActive(true);
      await fetchStores();
    } catch {
      setFormError(editingStoreId ? t("stores.updateError") : t("stores.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const clearAdvancedFilters = () => {
    setStatusFilter("all");
  };

  const onToggleStoreActive = async (store: Store, next: boolean) => {
    setTogglingStoreIds((prev) => [...prev, store.id]);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError(t("common.sessionNotFound"));
        return;
      }

      await updateStore(
        store.id,
        {
          name: store.name,
          code: store.code || undefined,
          address: store.address || undefined,
          slug: store.slug || undefined,
          logo: store.logo || undefined,
          description: store.description || undefined,
          isActive: next,
        },
        token,
      );
      await fetchStores();
    } catch {
      setError(t("stores.toggleError"));
    } finally {
      setTogglingStoreIds((prev) => prev.filter((id) => id !== store.id));
    }
  };

  return (
    <div className="space-y-4">
      <StoresFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={onOpenDrawer}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={clearAdvancedFilters}
      />

      <StoresTable
        loading={loading}
        error={error}
        stores={stores}
        canUpdate={canUpdate}
        togglingStoreIds={togglingStoreIds}
        onEditStore={(id) => void onEditStore(id)}
        onToggleStoreActive={(store, next) => void onToggleStoreActive(store, next)}
        footer={
          meta ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={meta.total}
              pageSize={pageSize}
              pageSizeId="stores-page-size"
              loading={loading}
              onPageChange={setCurrentPage}
              onPageSizeChange={onChangePageSize}
            />
          ) : null
        }
      />

      <StoreDrawer
        open={drawerOpen}
        editingStoreId={editingStoreId}
        submitting={submitting}
        loadingStoreDetail={loadingStoreDetail}
        isMobile={isMobile}
        form={form}
        formError={formError}
        nameError={nameError}
        storeTypeOptions={storeTypeOptions}
        onClose={onCloseDrawer}
        onSubmit={onSubmitStore}
        onFormChange={onFormChange}
        normalizeCurrency={normalizeCurrency}
        normalizeStoreType={normalizeStoreType}
      />
    </div>
  );
}
