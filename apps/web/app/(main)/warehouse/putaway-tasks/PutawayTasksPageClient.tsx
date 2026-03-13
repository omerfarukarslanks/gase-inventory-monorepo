"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import TablePagination from "@/components/ui/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useStores } from "@/hooks/useStores";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { useLang } from "@/context/LangContext";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import PutawayTasksFilters from "@/components/warehouse/PutawayTasksFilters";
import PutawayTasksTable, { type PutawayTaskListItem } from "@/components/warehouse/PutawayTasksTable";
import PutawayTasksMobileList from "@/components/warehouse/PutawayTasksMobileList";
import PutawayTaskCreateDrawer from "@/components/warehouse/PutawayTaskCreateDrawer";
import PutawayTaskDetailDrawer from "@/components/warehouse/PutawayTaskDetailDrawer";
import {
  assignPutawayTask,
  cancelPutawayTask,
  completePutawayTask,
  createPutawayTask,
  getPutawayTask,
  getPutawayTasks,
  getWarehouses,
  type PutawayTask,
  type Warehouse,
} from "@/lib/warehouse";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function buildProductLabel(task: PutawayTask, fallback: string) {
  if (task.productName) return `${task.productName}${task.variantName ? ` / ${task.variantName}` : ""}`;
  if (task.variantName) return task.variantName;
  return fallback;
}

export default function PutawayTasksPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("WAREHOUSE_READ");
  const canManage = can("WAREHOUSE_MANAGE");
  const canTenantOnly = can("TENANT_ONLY");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<PutawayTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [storeFilter, setStoreFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActing, setDetailActing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PutawayTask | null>(null);
  const closingTaskIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (warehouseFilter && !visibleWarehouses.some((warehouse) => warehouse.id === warehouseFilter)) {
      setWarehouseFilter("");
      return;
    }
    if (!warehouseFilter && visibleWarehouses.length === 1) {
      setWarehouseFilter(visibleWarehouses[0].id);
    }
  }, [visibleWarehouses, warehouseFilter]);

  const warehouseOptions = useMemo(
    () => visibleWarehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [visibleWarehouses],
  );

  const warehouseNameById = useMemo(
    () => Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, warehouse.name])),
    [warehouses],
  );

  const warehouseStoreIdByWarehouseId = useMemo(
    () => Object.fromEntries(warehouses.map((warehouse) => [warehouse.id, warehouse.storeId])),
    [warehouses],
  );

  const loadTasks = useCallback(async (targetWarehouseId: string) => {
    if (!targetWarehouseId || !canRead) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getPutawayTasks({ warehouseId: targetWarehouseId });
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, t("warehouse.putawayTasks.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canRead, t]);

  useEffect(() => {
    void loadTasks(warehouseFilter);
  }, [loadTasks, warehouseFilter]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [
          buildProductLabel(item, t("warehouse.putawayTasks.productUnknown")),
          item.toLocationName,
          item.toLocationCode,
          item.goodsReceiptId,
          item.notes,
          item.warehouseName ?? warehouseNameById[item.warehouseId],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [items, searchTerm, statusFilter, t, warehouseNameById]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, warehouseFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleItems = useMemo<PutawayTaskListItem[]>(
    () => paginatedItems.map((item) => ({
      id: item.id,
      warehouseName: item.warehouseName ?? warehouseNameById[item.warehouseId] ?? item.warehouseId,
      productLabel: buildProductLabel(item, t("warehouse.putawayTasks.productUnknown")),
      quantity: item.quantity,
      destinationLabel: item.toLocationName
        ? `${item.toLocationName}${item.toLocationCode ? ` / ${item.toLocationCode}` : ""}`
        : (item.toLocationCode || t("warehouse.putawayTasks.locationUnknown")),
      status: item.status,
      notes: item.notes,
    })),
    [paginatedItems, t, warehouseNameById],
  );

  const loadDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getPutawayTask(id);
      setSelectedTask(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("putawayTaskId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedTask(null);
      setError(getErrorMessage(detailError, t("warehouse.putawayTasks.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const taskId = searchParams.get("putawayTaskId");
    if (!taskId) {
      closingTaskIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingTaskIdRef.current === taskId) return;
    if (selectedTask?.id === taskId && detailOpen) return;
    void loadDetail(taskId, false);
  }, [canRead, detailOpen, loadDetail, searchParams, selectedTask?.id]);

  const closeDetail = useCallback(() => {
    closingTaskIdRef.current = selectedTask?.id ?? searchParams.get("putawayTaskId");
    setDetailOpen(false);
    setSelectedTask(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("putawayTaskId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedTask?.id]);

  const refreshSelectedTask = useCallback(async (taskId: string, successMessage: string) => {
    await loadDetail(taskId, false);
    await loadTasks(warehouseFilter);
    setSuccess(successMessage);
  }, [loadDetail, loadTasks, warehouseFilter]);

  const handleCreateTask = async (payload: { warehouseId: string; productVariantId: string; quantity: number; toLocationId: string; notes?: string }) => {
    setCreateSubmitting(true);
    setError("");
    try {
      const created = await createPutawayTask(payload);
      setCreateOpen(false);
      setSuccess(t("warehouse.putawayTasks.created"));
      if (payload.warehouseId !== warehouseFilter) {
        setWarehouseFilter(payload.warehouseId);
      } else {
        await loadTasks(payload.warehouseId);
      }
      if (created.id && canRead) {
        await loadDetail(created.id);
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("warehouse.putawayTasks.createError")));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAssignTask = async (userId: string) => {
    if (!selectedTask?.id) throw new Error(t("warehouse.putawayTasks.taskNotSelected"));
    setDetailActing(true);
    try {
      await assignPutawayTask(selectedTask.id, { userId });
      await refreshSelectedTask(selectedTask.id, t("warehouse.putawayTasks.assigned"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask?.id) throw new Error(t("warehouse.putawayTasks.taskNotSelected"));
    setDetailActing(true);
    try {
      await completePutawayTask(selectedTask.id);
      await refreshSelectedTask(selectedTask.id, t("warehouse.putawayTasks.completed"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleCancelTask = async () => {
    if (!selectedTask?.id) throw new Error(t("warehouse.putawayTasks.taskNotSelected"));
    setDetailActing(true);
    try {
      await cancelPutawayTask(selectedTask.id);
      await refreshSelectedTask(selectedTask.id, t("warehouse.putawayTasks.cancelled"));
    } finally {
      setDetailActing(false);
    }
  };

  if (!canTenantOnly && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("warehouse.blockers.activeStoreTitle")}
        description={t("warehouse.blockers.putawayTasksDescription")}
      />
    );
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <PutawayTasksFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            showAdvancedFilters={showAdvancedFilters}
            onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
            canCreate={canManage}
            onCreate={() => setCreateOpen(true)}
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
            status={statusFilter}
            onStatusChange={setStatusFilter}
            onClearFilters={() => {
              setStoreFilter("");
              setWarehouseFilter("");
              setStatusFilter("");
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
            {t("warehouse.putawayTasks.readRequired")}
          </div>
        ) : !warehouseFilter ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted shadow-glow">
            {warehousesLoading ? t("warehouse.warehouses.loading") : t("warehouse.putawayTasks.selectWarehouseFirst")}
          </div>
        ) : isMobile ? (
          <PutawayTasksMobileList
            loading={loading}
            error={error}
            items={visibleItems}
            onOpenDetail={(id) => void loadDetail(id)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="warehouse-putaway-tasks-page-size"
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
          <PutawayTasksTable
            loading={loading}
            error={error}
            items={visibleItems}
            onOpenDetail={(id) => void loadDetail(id)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="warehouse-putaway-tasks-page-size"
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

      <PutawayTaskCreateDrawer
        key={createOpen ? "putaway-create-open" : "putaway-create-closed"}
        open={createOpen}
        submitting={createSubmitting}
        warehouseOptions={warehouseOptions}
        initialWarehouseId={warehouseFilter}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateTask}
      />

      <PutawayTaskDetailDrawer
        key={detailOpen ? (selectedTask?.id ?? "putaway-detail-loading") : "putaway-detail-closed"}
        open={detailOpen}
        loading={detailLoading}
        acting={detailActing}
        task={selectedTask}
        warehouseLabel={selectedTask?.warehouseName ?? warehouseNameById[selectedTask?.warehouseId ?? ""] ?? "-"}
        warehouseStoreId={selectedTask?.warehouseId ? warehouseStoreIdByWarehouseId[selectedTask.warehouseId] : undefined}
        canManage={canManage}
        onClose={closeDetail}
        onAssign={handleAssignTask}
        onComplete={handleCompleteTask}
        onCancel={handleCancelTask}
      />
    </>
  );
}
