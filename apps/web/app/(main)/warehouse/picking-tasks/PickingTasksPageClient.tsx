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
import PickingTasksFilters from "@/components/warehouse/PickingTasksFilters";
import PickingTasksTable, { type PickingTaskListItem } from "@/components/warehouse/PickingTasksTable";
import PickingTasksMobileList from "@/components/warehouse/PickingTasksMobileList";
import PickingTaskCreateDrawer from "@/components/warehouse/PickingTaskCreateDrawer";
import PickingTaskDetailDrawer from "@/components/warehouse/PickingTaskDetailDrawer";
import {
  assignPickingTask,
  cancelPickingTask,
  completePickingTask,
  createPickingTask,
  getPickingTask,
  getPickingTasks,
  getWarehouses,
  getWaves,
  type PickingTask,
  type Warehouse,
  type Wave,
} from "@/lib/warehouse";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function buildProductLabel(task: PickingTask, fallback: string) {
  if (task.productName) return `${task.productName}${task.variantName ? ` / ${task.variantName}` : ""}`;
  if (task.variantName) return task.variantName;
  return fallback;
}

export default function PickingTasksPageClient() {
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
  const [waves, setWaves] = useState<Wave[]>([]);
  const [items, setItems] = useState<PickingTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [storeFilter, setStoreFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [waveFilter, setWaveFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActing, setDetailActing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PickingTask | null>(null);
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

  const loadWaves = useCallback(async (targetWarehouseId: string) => {
    if (!targetWarehouseId || !canRead) {
      setWaves([]);
      return;
    }

    try {
      const data = await getWaves({ warehouseId: targetWarehouseId });
      setWaves(data);
    } catch {
      setWaves([]);
    }
  }, [canRead]);

  useEffect(() => {
    void loadWaves(warehouseFilter);
  }, [loadWaves, warehouseFilter]);

  useEffect(() => {
    if (waveFilter && !waves.some((wave) => wave.id === waveFilter)) {
      setWaveFilter("");
    }
  }, [waveFilter, waves]);

  const waveOptions = useMemo(
    () => waves.map((wave) => ({ value: wave.id, label: wave.code })),
    [waves],
  );

  const waveCodeById = useMemo(
    () => Object.fromEntries(waves.map((wave) => [wave.id, wave.code])),
    [waves],
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
      const data = await getPickingTasks({ warehouseId: targetWarehouseId });
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, t("warehouse.pickingTasks.loadError")));
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
      .filter((item) => !waveFilter || item.waveId === waveFilter)
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [
          buildProductLabel(item, t("warehouse.pickingTasks.productUnknown")),
          item.fromLocationName,
          item.fromLocationCode,
          item.notes,
          item.waveCode ?? waveCodeById[item.waveId ?? ""],
          item.warehouseName ?? warehouseNameById[item.warehouseId],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [items, searchTerm, statusFilter, t, warehouseNameById, waveCodeById, waveFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, warehouseFilter, waveFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleItems = useMemo<PickingTaskListItem[]>(
    () => paginatedItems.map((item) => ({
      id: item.id,
      warehouseName: item.warehouseName ?? warehouseNameById[item.warehouseId] ?? item.warehouseId,
      productLabel: buildProductLabel(item, t("warehouse.pickingTasks.productUnknown")),
      requestedQuantity: item.requestedQuantity,
      pickedQuantity: item.pickedQuantity,
      sourceLabel: item.fromLocationName
        ? `${item.fromLocationName}${item.fromLocationCode ? ` / ${item.fromLocationCode}` : ""}`
        : (item.fromLocationCode || t("warehouse.pickingTasks.locationUnknown")),
      waveCode: item.waveCode ?? waveCodeById[item.waveId ?? ""] ?? "-",
      status: item.status,
      notes: item.notes,
    })),
    [paginatedItems, t, warehouseNameById, waveCodeById],
  );

  const loadDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getPickingTask(id);
      setSelectedTask(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("pickingTaskId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedTask(null);
      setError(getErrorMessage(detailError, t("warehouse.pickingTasks.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const taskId = searchParams.get("pickingTaskId");
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
    closingTaskIdRef.current = selectedTask?.id ?? searchParams.get("pickingTaskId");
    setDetailOpen(false);
    setSelectedTask(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pickingTaskId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedTask?.id]);

  const refreshSelectedTask = useCallback(async (taskId: string, successMessage: string) => {
    await loadDetail(taskId, false);
    await loadTasks(warehouseFilter);
    await loadWaves(warehouseFilter);
    setSuccess(successMessage);
  }, [loadDetail, loadTasks, loadWaves, warehouseFilter]);

  const handleCreateTask = async (payload: { warehouseId: string; productVariantId: string; requestedQuantity: number; fromLocationId: string; saleId?: string; waveId: string; notes?: string }) => {
    setCreateSubmitting(true);
    setError("");
    try {
      const created = await createPickingTask(payload);
      setCreateOpen(false);
      setSuccess(t("warehouse.pickingTasks.created"));
      if (payload.warehouseId !== warehouseFilter) {
        setWarehouseFilter(payload.warehouseId);
      } else {
        await Promise.all([loadTasks(payload.warehouseId), loadWaves(payload.warehouseId)]);
      }
      if (created.id && canRead) {
        await loadDetail(created.id);
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("warehouse.pickingTasks.createError")));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAssignTask = async (userId: string) => {
    if (!selectedTask?.id) throw new Error(t("warehouse.pickingTasks.taskNotSelected"));
    setDetailActing(true);
    try {
      await assignPickingTask(selectedTask.id, { userId });
      await refreshSelectedTask(selectedTask.id, t("warehouse.pickingTasks.assigned"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleCompleteTask = async (pickedQuantity: number) => {
    if (!selectedTask?.id) throw new Error(t("warehouse.pickingTasks.taskNotSelected"));
    setDetailActing(true);
    try {
      await completePickingTask(selectedTask.id, { pickedQuantity });
      await refreshSelectedTask(selectedTask.id, t("warehouse.pickingTasks.completed"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleCancelTask = async () => {
    if (!selectedTask?.id) throw new Error(t("warehouse.pickingTasks.taskNotSelected"));
    setDetailActing(true);
    try {
      await cancelPickingTask(selectedTask.id);
      await refreshSelectedTask(selectedTask.id, t("warehouse.pickingTasks.cancelled"));
    } finally {
      setDetailActing(false);
    }
  };

  if (!canTenantOnly && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("warehouse.blockers.activeStoreTitle")}
        description={t("warehouse.blockers.pickingTasksDescription")}
      />
    );
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <PickingTasksFilters
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
              setWaveFilter("");
            }}
            storeOptions={storeOptions}
            warehouseId={warehouseFilter}
            onWarehouseIdChange={(value) => {
              setWarehouseFilter(value);
              setWaveFilter("");
            }}
            warehouseOptions={warehouseOptions}
            waveId={waveFilter}
            onWaveIdChange={setWaveFilter}
            waveOptions={waveOptions}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            onClearFilters={() => {
              setStoreFilter("");
              setWarehouseFilter("");
              setWaveFilter("");
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
            {t("warehouse.pickingTasks.readRequired")}
          </div>
        ) : !warehouseFilter ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted shadow-glow">
            {warehousesLoading ? t("warehouse.warehouses.loading") : t("warehouse.pickingTasks.selectWarehouseFirst")}
          </div>
        ) : isMobile ? (
          <PickingTasksMobileList
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
                pageSizeId="warehouse-picking-tasks-page-size"
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
          <PickingTasksTable
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
                pageSizeId="warehouse-picking-tasks-page-size"
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

      <PickingTaskCreateDrawer
        key={createOpen ? "picking-create-open" : "picking-create-closed"}
        open={createOpen}
        submitting={createSubmitting}
        warehouseOptions={warehouseOptions}
        initialWarehouseId={warehouseFilter}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateTask}
      />

      <PickingTaskDetailDrawer
        key={detailOpen ? (selectedTask?.id ?? "picking-detail-loading") : "picking-detail-closed"}
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
