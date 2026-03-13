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
import CountSessionsFilters from "@/components/warehouse/CountSessionsFilters";
import CountSessionsTable, { type CountSessionListItem } from "@/components/warehouse/CountSessionsTable";
import CountSessionsMobileList from "@/components/warehouse/CountSessionsMobileList";
import CountSessionCreateDrawer from "@/components/warehouse/CountSessionCreateDrawer";
import CountSessionDetailDrawer from "@/components/warehouse/CountSessionDetailDrawer";
import {
  addCountSessionLine,
  closeCountSession,
  createCountSession,
  getCountSession,
  getCountSessions,
  getWarehouseLocations,
  getWarehouses,
  updateCountSessionLine,
  type CountSession,
  type CreateCountSessionPayload,
  type Warehouse,
} from "@/lib/warehouse";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function isWithinDateRange(value: string | null | undefined, startDate: string, endDate: string) {
  if (!value) return false;
  const targetDate = new Date(value);
  if (Number.isNaN(targetDate.getTime())) return false;

  if (startDate) {
    const from = new Date(`${startDate}T00:00:00`);
    if (targetDate < from) return false;
  }

  if (endDate) {
    const until = new Date(`${endDate}T23:59:59.999`);
    if (targetDate > until) return false;
  }

  return true;
}

export default function CountSessionsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("COUNT_SESSION_READ");
  const canManage = can("COUNT_SESSION_MANAGE");
  const canCloseSession = can("COUNT_SESSION_ADJUST");
  const canTenantOnly = can("TENANT_ONLY");

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<CountSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [storeFilter, setStoreFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActing, setDetailActing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<CountSession | null>(null);
  const [locationOptions, setLocationOptions] = useState<Array<{ value: string; label: string }>>([]);
  const closingSessionIdRef = useRef<string | null>(null);

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
      setWarehouses([]);
      return;
    }
    if (!canTenantOnly && !activeStoreId) {
      setWarehouses([]);
      return;
    }

    try {
      const data = await getWarehouses({ storeId: canTenantOnly ? undefined : activeStoreId });
      setWarehouses(data);
    } catch {
      setWarehouses([]);
    }
  }, [activeStoreId, canRead, canTenantOnly]);

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

  const fetchSessions = useCallback(async () => {
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
      const data = await getCountSessions({ storeId: canTenantOnly ? undefined : activeStoreId });
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, t("warehouse.countSessions.loadError")));
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, canRead, canTenantOnly, t]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items
      .filter((item) => (!canTenantOnly ? true : !storeFilter || item.storeId === storeFilter))
      .filter((item) => !warehouseFilter || item.warehouseId === warehouseFilter)
      .filter((item) => !statusFilter || item.status === statusFilter)
      .filter((item) => (!startDate && !endDate) || isWithinDateRange(item.startedAt ?? item.closedAt, startDate, endDate))
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [
          item.id,
          item.notes,
          item.storeName ?? storeNameById[item.storeId],
          item.warehouseName ?? warehouseNameById[item.warehouseId],
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.startedAt ?? left.closedAt ?? 0).getTime();
        const rightTime = new Date(right.startedAt ?? right.closedAt ?? 0).getTime();
        return rightTime - leftTime;
      });
  }, [canTenantOnly, endDate, items, searchTerm, startDate, statusFilter, storeFilter, storeNameById, warehouseFilter, warehouseNameById]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, storeFilter, warehouseFilter, statusFilter, startDate, endDate]);

  const total = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const visibleItems = useMemo<CountSessionListItem[]>(
    () =>
      paginatedItems.map((item) => ({
        id: item.id,
        storeName: item.storeName ?? storeNameById[item.storeId] ?? item.storeId,
        warehouseName: item.warehouseName ?? warehouseNameById[item.warehouseId] ?? item.warehouseId,
        status: item.status,
        startedAt: item.startedAt,
        closedAt: item.closedAt,
        notes: item.notes,
        lineCount: item.lines?.length ?? 0,
      })),
    [paginatedItems, storeNameById, warehouseNameById],
  );

  const loadDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getCountSession(id);
      const locations = detail.warehouseId ? await getWarehouseLocations(detail.warehouseId) : [];
      setSelectedSession(detail);
      setLocationOptions(locations.map((location) => ({
        value: location.id,
        label: `${location.code} / ${location.name}`,
      })));
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sessionId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedSession(null);
      setLocationOptions([]);
      setError(getErrorMessage(detailError, t("warehouse.countSessions.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) {
      closingSessionIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingSessionIdRef.current === sessionId) return;
    if (selectedSession?.id === sessionId && detailOpen) return;
    void loadDetail(sessionId, false);
  }, [canRead, detailOpen, loadDetail, searchParams, selectedSession?.id]);

  const closeDetail = useCallback(() => {
    closingSessionIdRef.current = selectedSession?.id ?? searchParams.get("sessionId");
    setDetailOpen(false);
    setSelectedSession(null);
    setLocationOptions([]);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("sessionId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedSession?.id]);

  const handleCreateSession = async (payload: CreateCountSessionPayload) => {
    setCreateSubmitting(true);
    setError("");
    try {
      const created = await createCountSession(payload);
      setCreateOpen(false);
      setSuccess(t("warehouse.countSessions.created"));
      await fetchSessions();
      if (created.id && canRead) {
        await loadDetail(created.id);
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("warehouse.countSessions.createError")));
    } finally {
      setCreateSubmitting(false);
    }
  };

  const refreshSelectedSession = useCallback(async (sessionId: string, successMessage: string) => {
    await loadDetail(sessionId, false);
    await fetchSessions();
    setSuccess(successMessage);
  }, [fetchSessions, loadDetail]);

  const handleAddLine = async (payload: { productVariantId: string; lotNumber?: string; locationId?: string; expectedQuantity: number; countedQuantity: number }) => {
    if (!selectedSession?.id) throw new Error(t("warehouse.countSessions.sessionNotSelected"));
    setDetailActing(true);
    try {
      await addCountSessionLine(selectedSession.id, payload);
      await refreshSelectedSession(selectedSession.id, t("warehouse.countSessions.lineAdded"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleUpdateLine = async (lineId: string, countedQuantity: number) => {
    if (!selectedSession?.id) throw new Error(t("warehouse.countSessions.sessionNotSelected"));
    setDetailActing(true);
    try {
      await updateCountSessionLine(selectedSession.id, lineId, { countedQuantity });
      await refreshSelectedSession(selectedSession.id, t("warehouse.countSessions.lineUpdated"));
    } finally {
      setDetailActing(false);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession?.id) throw new Error(t("warehouse.countSessions.sessionNotSelected"));
    setDetailActing(true);
    try {
      await closeCountSession(selectedSession.id);
      await refreshSelectedSession(selectedSession.id, t("warehouse.countSessions.closed"));
    } finally {
      setDetailActing(false);
    }
  };

  if (!canTenantOnly && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("warehouse.blockers.activeStoreTitle")}
        description={t("warehouse.blockers.countSessionsDescription")}
      />
    );
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <CountSessionsFilters
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
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            onClearFilters={() => {
              setStoreFilter("");
              setWarehouseFilter("");
              setStatusFilter("");
              setStartDate("");
              setEndDate("");
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
            {t("warehouse.countSessions.readRequired")}
          </div>
        ) : isMobile ? (
          <CountSessionsMobileList
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
                pageSizeId="count-sessions-page-size"
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
          <CountSessionsTable
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
                pageSizeId="count-sessions-page-size"
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

      <CountSessionCreateDrawer
        key={createOpen ? "count-session-create-open" : "count-session-create-closed"}
        open={createOpen}
        submitting={createSubmitting}
        showStoreSelector={canTenantOnly}
        fixedStoreId={activeStoreId}
        storeOptions={storeOptions}
        warehouses={visibleWarehouses}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreateSession}
      />

      <CountSessionDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        acting={detailActing}
        session={selectedSession}
        canManage={canManage}
        canCloseSession={canCloseSession}
        locationOptions={locationOptions}
        onClose={closeDetail}
        onAddLine={handleAddLine}
        onUpdateLine={handleUpdateLine}
        onCloseSession={handleCloseSession}
      />
    </>
  );
}
