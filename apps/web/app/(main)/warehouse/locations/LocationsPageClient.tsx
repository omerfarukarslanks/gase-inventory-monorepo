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
import LocationDrawer, { type LocationFormState } from "@/components/warehouse/LocationDrawer";
import LocationsFilters from "@/components/warehouse/LocationsFilters";
import LocationsTable from "@/components/warehouse/LocationsTable";
import LocationsMobileList from "@/components/warehouse/LocationsMobileList";
import {
  createWarehouseLocation,
  getWarehouseLocationTypeLabel,
  getWarehouseLocation,
  getWarehouseLocations,
  getWarehouses,
  WAREHOUSE_LOCATION_TYPE_OPTIONS,
  updateWarehouseLocation,
  type Warehouse,
  type WarehouseLocation,
} from "@/lib/warehouse";
import type { IsActiveFilter } from "@/components/products/types";

const EMPTY_FORM: LocationFormState = {
  warehouseId: "",
  code: "",
  name: "",
  type: "BIN",
  isActive: true,
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function LocationsPageClient() {
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("WAREHOUSE_READ");
  const canManage = can("WAREHOUSE_MANAGE");
  const canTenantOnly = can("TENANT_ONLY");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<IsActiveFilter>("all");
  const [storeFilter, setStoreFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<LocationFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  const storeOptions = useMemo(
    () => stores.map((store) => ({ value: store.id, label: store.name })),
    [stores],
  );

  const fetchWarehouses = useCallback(async () => {
    if (!canRead) {
      setWarehouses([]);
      setWarehousesLoading(false);
      return;
    }

    if (!canTenantOnly && !activeStoreId) {
      setWarehouses([]);
      setWarehousesLoading(false);
      return;
    }

    setWarehousesLoading(true);
    try {
      const data = await getWarehouses({ storeId: canTenantOnly ? undefined : activeStoreId });
      setWarehouses(data);
    } catch (loadError) {
      setWarehouses([]);
      setError(getErrorMessage(loadError, t("warehouse.warehouses.loadError")));
    } finally {
      setWarehousesLoading(false);
    }
  }, [activeStoreId, canRead, canTenantOnly, t]);

  useEffect(() => {
    void fetchWarehouses();
  }, [fetchWarehouses]);

  const visibleWarehouses = useMemo(
    () => warehouses.filter((warehouse) => {
      if (!canTenantOnly) return true;
      if (!storeFilter) return true;
      return warehouse.storeId === storeFilter;
    }),
    [canTenantOnly, storeFilter, warehouses],
  );

  const warehouseOptions = useMemo(
    () => visibleWarehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [visibleWarehouses],
  );

  const warehouseNameById = useMemo(
    () => Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses],
  );

  const loadLocations = useCallback(async (targetWarehouseId: string) => {
    if (!targetWarehouseId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await getWarehouseLocations(targetWarehouseId);
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, t("warehouse.locations.loadError")));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadLocations(warehouseFilter);
  }, [loadLocations, warehouseFilter]);

  const typeOptions = useMemo(
    () => WAREHOUSE_LOCATION_TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
    [],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((location) => {
      if (statusFilter !== "all" && location.isActive !== statusFilter) return false;
      if (typeFilter && location.type !== typeFilter) return false;
      if (!normalizedSearch) return true;
      return [location.code, location.name, location.type, getWarehouseLocationTypeLabel(location.type)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [items, searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter, warehouseFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      warehouseId: warehouseFilter || warehouseOptions[0]?.value || "",
    });
    setFormError("");
    setEditingLocationId(null);
  };

  const openCreateDrawer = () => {
    resetForm();
    setDrawerOpen(true);
  };

  const openEditDrawer = async (id: string) => {
    setDrawerOpen(true);
    setEditingLocationId(id);
    setFormError("");
    setSubmitting(true);

    try {
      const detail = await getWarehouseLocation(id);
      setForm({
        warehouseId: detail.warehouseId,
        code: detail.code,
        name: detail.name,
        type: detail.type,
        isActive: detail.isActive,
      });
    } catch (loadError) {
      setFormError(getErrorMessage(loadError, t("warehouse.locations.detailLoadError")));
    } finally {
      setSubmitting(false);
    }
  };

  const closeDrawer = () => {
    if (submitting) return;
    setDrawerOpen(false);
    resetForm();
  };

  const onFormChange = (field: keyof LocationFormState, value: string | boolean) => {
    setFormError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.warehouseId) {
      setFormError(t("warehouse.locations.warehouseRequired"));
      return;
    }
    if (!form.code.trim()) {
      setFormError(t("warehouse.locations.codeRequired"));
      return;
    }
    if (!form.name.trim()) {
      setFormError(t("warehouse.locations.nameRequired"));
      return;
    }
    if (!form.type.trim()) {
      setFormError(t("warehouse.locations.typeRequired"));
      return;
    }

    setSubmitting(true);
    setFormError("");
    setError("");

    try {
      const targetWarehouseId = form.warehouseId;
      if (editingLocationId) {
        await updateWarehouseLocation(editingLocationId, {
          warehouseId: targetWarehouseId,
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
          isActive: form.isActive,
        });
        setSuccess(t("warehouse.locations.updated"));
      } else {
        await createWarehouseLocation({
          warehouseId: form.warehouseId,
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
        });
        setSuccess(t("warehouse.locations.created"));
      }
      closeDrawer();
      setWarehouseFilter(targetWarehouseId);
      await loadLocations(targetWarehouseId);
    } catch (submitError) {
      setFormError(getErrorMessage(submitError, t("warehouse.locations.saveError")));
    } finally {
      setSubmitting(false);
    }
  };

  const onToggleLocationActive = async (location: WarehouseLocation, next: boolean) => {
    setTogglingIds((prev) => [...prev, location.id]);
    setError("");
    try {
      await updateWarehouseLocation(location.id, { isActive: next });
      setItems((prev) => prev.map((item) => (item.id === location.id ? { ...item, isActive: next } : item)));
      setSuccess(t("warehouse.locations.statusUpdated"));
    } catch (toggleError) {
      setError(getErrorMessage(toggleError, t("warehouse.locations.saveError")));
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== location.id));
    }
  };

  if (!canTenantOnly && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("warehouse.blockers.activeStoreTitle")}
        description={t("warehouse.blockers.locationsDescription")}
      />
    );
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <LocationsFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
            canCreate={canManage && Boolean(warehouseFilter)}
            onCreate={openCreateDrawer}
            showStoreFilter={canTenantOnly}
            storeId={storeFilter}
            onStoreIdChange={(value) => {
              setStoreFilter(value);
              setWarehouseFilter("");
            }}
            storeOptions={storeOptions}
            warehouseId={warehouseFilter}
            onWarehouseIdChange={setWarehouseFilter}
            warehouseOptions={warehouseOptions}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            typeOptions={typeOptions}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onClearFilters={() => {
              setStoreFilter("");
              setWarehouseFilter("");
              setTypeFilter("");
              setStatusFilter("all");
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
            {t("warehouse.locations.readRequired")}
          </div>
        ) : !warehouseFilter ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted shadow-glow">
            {t("warehouse.locations.selectWarehouseFirst")}
          </div>
        ) : isMobile ? (
          <LocationsMobileList
            loading={loading || warehousesLoading}
            error={error}
            locations={paginatedItems}
            warehouseNameById={warehouseNameById}
            canManage={canManage}
            togglingIds={togglingIds}
            onEditLocation={(id) => void openEditDrawer(id)}
            onToggleLocationActive={(location, next) => void onToggleLocationActive(location, next)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="locations-page-size"
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
          <LocationsTable
            loading={loading || warehousesLoading}
            error={error}
            locations={paginatedItems}
            warehouseNameById={warehouseNameById}
            canManage={canManage}
            togglingIds={togglingIds}
            onEditLocation={(id) => void openEditDrawer(id)}
            onToggleLocationActive={(location, next) => void onToggleLocationActive(location, next)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="locations-page-size"
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

      <LocationDrawer
        open={drawerOpen}
        editingLocationId={editingLocationId}
        submitting={submitting}
        form={form}
        formError={formError}
        warehouseOptions={warehouseOptions}
        onClose={closeDrawer}
        onSubmit={onSubmit}
        onFormChange={onFormChange}
      />
    </>
  );
}
