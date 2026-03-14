"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import TablePagination from "@/components/ui/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useStores } from "@/hooks/useStores";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { useLang } from "@/context/LangContext";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import WarehouseDrawer, { type WarehouseFormState } from "@/components/warehouse/WarehouseDrawer";
import WarehousesFilters from "@/components/warehouse/WarehousesFilters";
import WarehousesTable from "@/components/warehouse/WarehousesTable";
import WarehousesMobileList from "@/components/warehouse/WarehousesMobileList";
import {
  createWarehouse,
  getWarehouse,
  getWarehouses,
  updateWarehouse,
  type Warehouse,
} from "@/lib/warehouse";
import type { IsActiveFilter } from "@/components/products/types";

const EMPTY_FORM: WarehouseFormState = {
  storeId: "",
  name: "",
  address: "",
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function WarehousesPageClient() {
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("WAREHOUSE_READ");
  const canManage = can("WAREHOUSE_MANAGE");
  const canTenantOnly = can("TENANT_ONLY");

  const [items, setItems] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IsActiveFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingWarehouseId, setEditingWarehouseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<WarehouseFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  const storeOptions = useMemo(
    () => stores.map((store) => ({ value: store.id, label: store.name })),
    [stores],
  );

  const storeNameById = useMemo(
    () => Object.fromEntries(stores.map((store) => [store.id, store.name])),
    [stores],
  );

  const fetchWarehouses = useCallback(async () => {
    if (!canRead) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!canTenantOnly && !activeStoreId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getWarehouses({ storeId: canTenantOnly ? undefined : activeStoreId });
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, t("warehouse.warehouses.loadError")));
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, canRead, canTenantOnly, t]);

  useEffect(() => {
    void fetchWarehouses();
  }, [fetchWarehouses]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((warehouse) => {
      if (statusFilter !== "all" && warehouse.isActive !== statusFilter) return false;
      if (canTenantOnly && storeFilter && warehouse.storeId !== storeFilter) return false;
      if (!normalizedSearch) return true;

      return [
        warehouse.name,
        warehouse.address,
        warehouse.storeName,
        storeNameById[warehouse.storeId],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [canTenantOnly, items, searchTerm, statusFilter, storeFilter, storeNameById]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, storeFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      storeId: canTenantOnly ? (storeFilter || activeStoreId || storeOptions[0]?.value || "") : activeStoreId,
    });
    setFormError("");
    setEditingWarehouseId(null);
  };

  const openCreateDrawer = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEditDrawer = async (id: string) => {
    setDrawerOpen(true);
    setEditingWarehouseId(id);
    setFormError("");
    setSubmitting(true);

    try {
      const detail = await getWarehouse(id);
      setForm({
        storeId: detail.storeId,
        name: detail.name,
        address: detail.address ?? "",
        isActive: detail.isActive,
      });
    } catch (loadError) {
      setFormError(getErrorMessage(loadError, t("warehouse.warehouses.detailLoadError")));
    } finally {
      setSubmitting(false);
    }
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
    resetForm();
  };

  const onFormChange = (field: keyof WarehouseFormState, value: string | boolean) => {
    setFormError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const targetStoreId = canTenantOnly ? form.storeId : activeStoreId;
    if (!targetStoreId) {
      setFormError(t("warehouse.warehouses.storeRequired"));
      return;
    }
    if (!form.name.trim()) {
      setFormError(t("warehouse.warehouses.nameRequired"));
      return;
    }

    setSubmitting(true);
    setFormError("");
    setError("");

    try {
      if (editingWarehouseId) {
        await updateWarehouse(editingWarehouseId, {
          name: form.name.trim(),
          address: form.address.trim() || undefined,
          isActive: form.isActive,
        });
        setSuccess(t("warehouse.warehouses.updated"));
      } else {
        await createWarehouse({
          storeId: targetStoreId,
          name: form.name.trim(),
          address: form.address.trim() || undefined,
        });
        setSuccess(t("warehouse.warehouses.created"));
      }
      closeDrawer();
      await fetchWarehouses();
    } catch (submitError) {
      setFormError(getErrorMessage(submitError, t("warehouse.warehouses.saveError")));
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleWarehouseActive = async (warehouse: Warehouse, next: boolean) => {
    setTogglingIds((prev) => [...prev, warehouse.id]);
    setError("");
    try {
      await updateWarehouse(warehouse.id, { isActive: next });
      setItems((prev) => prev.map((item) => (item.id === warehouse.id ? { ...item, isActive: next } : item)));
      setSuccess(t("warehouse.warehouses.statusUpdated"));
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, t("warehouse.warehouses.saveError")));
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== warehouse.id));
    }
  };

  if (!canTenantOnly && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("warehouse.blockers.activeStoreTitle")}
        description={t("warehouse.blockers.warehousesDescription")}
      />
    );
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <WarehousesFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
            canCreate={canManage}
            onCreate={openCreateDrawer}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            showStoreFilter={canTenantOnly}
            storeId={storeFilter}
            onStoreIdChange={setStoreFilter}
            storeOptions={storeOptions}
            onClearFilters={() => {
              setStatusFilter("all");
              setStoreFilter("");
            }}
          />
        )}
      >
        {success ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        {!canRead ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted shadow-glow">
            {t("warehouse.warehouses.readRequired")}
          </div>
        ) : isMobile ? (
          <WarehousesMobileList
            loading={loading}
            error={error}
            warehouses={paginatedItems}
            storeNameById={storeNameById}
            canManage={canManage}
            togglingIds={togglingIds}
            onEditWarehouse={(id) => void openEditDrawer(id)}
            onToggleWarehouseActive={(warehouse, next) => void onToggleWarehouseActive(warehouse, next)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="warehouses-page-size"
                loading={loading}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          />
        ) : (
          <WarehousesTable
            loading={loading}
            error={error}
            warehouses={paginatedItems}
            storeNameById={storeNameById}
            canManage={canManage}
            togglingIds={togglingIds}
            onEditWarehouse={(id) => void openEditDrawer(id)}
            onToggleWarehouseActive={(warehouse, next) => void onToggleWarehouseActive(warehouse, next)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="warehouses-page-size"
                loading={loading}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            )}
          />
        )}
      </PageShell>

      <WarehouseDrawer
        open={drawerOpen}
        editingWarehouseId={editingWarehouseId}
        submitting={submitting}
        form={form}
        formError={formError}
        storeOptions={storeOptions}
        showStoreSelector={canTenantOnly}
        fixedStoreId={activeStoreId}
        onClose={closeDrawer}
        onSubmit={onSubmit}
        onFormChange={onFormChange}
      />
    </>
  );
}
