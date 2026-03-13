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
import WavesFilters from "@/components/warehouse/WavesFilters";
import WavesTable, { type WaveListItem } from "@/components/warehouse/WavesTable";
import WavesMobileList from "@/components/warehouse/WavesMobileList";
import WaveCreateDrawer from "@/components/warehouse/WaveCreateDrawer";
import WaveDetailDrawer from "@/components/warehouse/WaveDetailDrawer";
import {
  completeWave,
  createWave,
  getWave,
  getWaves,
  getWarehouses,
  startWave,
  type Wave,
  type Warehouse,
} from "@/lib/warehouse";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function WavesPageClient() {
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
  const [items, setItems] = useState<Wave[]>([]);
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
  const [selectedWave, setSelectedWave] = useState<Wave | null>(null);
  const closingWaveIdRef = useRef<string | null>(null);

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

  const loadWaves = useCallback(async (targetWarehouseId: string) => {
    if (!targetWarehouseId || !canRead) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await getWaves({ warehouseId: targetWarehouseId });
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, t("warehouse.waves.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canRead, t]);

  useEffect(() => {
    void loadWaves(warehouseFilter);
  }, [loadWaves, warehouseFilter]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return items
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.code, item.notes, item.warehouseName ?? warehouseNameById[item.warehouseId]]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.startedAt ?? left.completedAt ?? 0).getTime();
        const rightTime = new Date(right.startedAt ?? right.completedAt ?? 0).getTime();
        return rightTime - leftTime;
      });
  }, [items, searchTerm, statusFilter, warehouseNameById]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, warehouseFilter]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleItems = useMemo<WaveListItem[]>(
    () => paginatedItems.map((item) => ({
      id: item.id,
      warehouseName: item.warehouseName ?? warehouseNameById[item.warehouseId] ?? item.warehouseId,
      code: item.code,
      status: item.status,
      startedAt: item.startedAt,
      completedAt: item.completedAt,
      notes: item.notes,
    })),
    [paginatedItems, warehouseNameById],
  );

  const loadDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getWave(id);
      setSelectedWave(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("waveId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedWave(null);
      setError(getErrorMessage(detailError, t("warehouse.waves.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const waveId = searchParams.get("waveId");
    if (!waveId) {
      closingWaveIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingWaveIdRef.current === waveId) return;
    if (selectedWave?.id === waveId && detailOpen) return;
    void loadDetail(waveId, false);
  }, [canRead, detailOpen, loadDetail, searchParams, selectedWave?.id]);

  const closeDetail = useCallback(() => {
    closingWaveIdRef.current = selectedWave?.id ?? searchParams.get("waveId");
    setDetailOpen(false);
    setSelectedWave(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("waveId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedWave?.id]);

  const refreshSelectedWave = useCallback(async (waveId: string, successMessage: string) => {
    await loadDetail(waveId, false);
    await loadWaves(warehouseFilter);
    setSuccess(successMessage);
  }, [loadDetail, loadWaves, warehouseFilter]);

  const handleCreateWave = async (payload: { warehouseId: string; code: string; notes?: string }) => {
    setCreateSubmitting(true);
    setError("");
    try {
      const created = await createWave(payload);
      setCreateOpen(false);
      setSuccess(t("warehouse.waves.created"));
      if (payload.warehouseId !== warehouseFilter) {
        setWarehouseFilter(payload.warehouseId);
      } else {
        await loadWaves(payload.warehouseId);
      }
      if (created.id && canRead) {
        await loadDetail(created.id);
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("warehouse.waves.createError")));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleStartWave = async () => {
    if (!selectedWave?.id) throw new Error(t("warehouse.waves.waveNotSelected"));
    setDetailActing(true);
    try {
      await startWave(selectedWave.id);
      await refreshSelectedWave(selectedWave.id, t("warehouse.waves.started"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleCompleteWave = async () => {
    if (!selectedWave?.id) throw new Error(t("warehouse.waves.waveNotSelected"));
    setDetailActing(true);
    try {
      await completeWave(selectedWave.id);
      await refreshSelectedWave(selectedWave.id, t("warehouse.waves.completed"));
    } finally {
      setDetailActing(false);
    }
  };

  if (!canTenantOnly && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("warehouse.blockers.activeStoreTitle")}
        description={t("warehouse.blockers.wavesDescription")}
      />
    );
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <WavesFilters
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
            {t("warehouse.waves.readRequired")}
          </div>
        ) : !warehouseFilter ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-6 text-sm text-muted shadow-glow">
            {warehousesLoading ? t("warehouse.warehouses.loading") : t("warehouse.waves.selectWarehouseFirst")}
          </div>
        ) : isMobile ? (
          <WavesMobileList
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
                pageSizeId="warehouse-waves-page-size"
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
          <WavesTable
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
                pageSizeId="warehouse-waves-page-size"
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

      <WaveCreateDrawer
        key={createOpen ? "wave-create-open" : "wave-create-closed"}
        open={createOpen}
        submitting={createSubmitting}
        warehouseOptions={warehouseOptions}
        initialWarehouseId={warehouseFilter}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateWave}
      />

      <WaveDetailDrawer
        key={detailOpen ? (selectedWave?.id ?? "wave-detail-loading") : "wave-detail-closed"}
        open={detailOpen}
        loading={detailLoading}
        acting={detailActing}
        wave={selectedWave}
        warehouseLabel={selectedWave?.warehouseName ?? warehouseNameById[selectedWave?.warehouseId ?? ""] ?? "-"}
        canManage={canManage}
        onClose={closeDetail}
        onStart={handleStartWave}
        onComplete={handleCompleteWave}
      />
    </>
  );
}
