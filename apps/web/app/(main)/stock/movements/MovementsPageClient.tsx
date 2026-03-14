"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import TablePagination from "@/components/ui/TablePagination";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useStores } from "@/hooks/useStores";
import { getInventoryMovements, type InventoryMovement } from "@/lib/inventory";
import { getWarehouses, type Warehouse } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import StockMovementsFilters from "@/components/stock/StockMovementsFilters";
import StockMovementsTable from "@/components/stock/StockMovementsTable";
import StockMovementsMobileList from "@/components/stock/StockMovementsMobileList";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function MovementsPageClient() {
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("STOCK_MOVEMENTS_READ");
  const canTenantOnly = can("TENANT_ONLY");
  const productVariantId = searchParams.get("productVariantId")?.trim() || "";

  const [items, setItems] = useState<InventoryMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (canTenantOnly && activeStoreId && !storeFilter) {
      setStoreFilter(activeStoreId);
    }
  }, [activeStoreId, canTenantOnly, storeFilter]);

  const scopedStoreId = canTenantOnly ? (storeFilter || activeStoreId || "") : (activeStoreId || "");

  const storeOptions = useMemo(
    () => stores.filter((store) => store.isActive).map((store) => ({ value: store.id, label: store.name })),
    [stores],
  );

  const warehouseOptions = useMemo(
    () => warehouses.filter((warehouse) => warehouse.isActive).map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [warehouses],
  );

  const fetchList = useCallback(async () => {
    if (!canRead) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(t("stockMovements.readRequired"));
      setLoading(false);
      return;
    }

    if (!scopedStoreId) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const offset = (page - 1) * limit;
      const response = await getInventoryMovements({
        storeId: scopedStoreId,
        warehouseId: warehouseFilter || undefined,
        productVariantId: productVariantId || undefined,
        type: typeFilter || undefined,
        search: searchTerm.trim() || undefined,
        limit,
        offset,
      });

      const nextTotal = response.meta.total ?? 0;
      const nextLimit = response.meta.limit || limit;
      setItems(response.data ?? []);
      setTotal(nextTotal);
      setTotalPages(Math.max(1, Math.ceil(nextTotal / Math.max(1, nextLimit))));
    } catch (loadError) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(getErrorMessage(loadError, t("stockMovements.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canRead, scopedStoreId, page, limit, warehouseFilter, productVariantId, typeFilter, searchTerm, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!canRead || !scopedStoreId) {
      setWarehouses([]);
      setWarehouseFilter("");
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const data = await getWarehouses({ storeId: scopedStoreId });
        if (!mounted) return;
        setWarehouses(data);
        setWarehouseFilter((current) => (data.some((warehouse) => warehouse.id === current) ? current : ""));
      } catch {
        if (!mounted) return;
        setWarehouses([]);
        setWarehouseFilter("");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [canRead, scopedStoreId]);

  if (canRead && !activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("stockMovements.blockers.activeStoreTitle")}
        description={t("stockMovements.blockers.activeStoreDescription")}
      />
    );
  }

  const footer = !loading && !error && canRead ? (
    <TablePagination
      page={page}
      totalPages={Math.max(1, totalPages)}
      total={total}
      pageSize={limit}
      pageSizeId="stock-movements-page-size"
      loading={loading}
      onPageChange={setPage}
      onPageSizeChange={(next) => {
        setLimit(next);
        setPage(1);
      }}
    />
  ) : null;

  return (
    <PageShell
      filters={(
        <StockMovementsFilters
          searchTerm={searchTerm}
          onSearchTermChange={(value) => {
            setSearchTerm(value);
            setPage(1);
          }}
          showStoreFilter={canTenantOnly}
          storeId={storeFilter}
          onStoreIdChange={(value) => {
            setStoreFilter(value);
            setWarehouseFilter("");
            setPage(1);
          }}
          storeOptions={storeOptions}
          warehouseId={warehouseFilter}
          onWarehouseIdChange={(value) => {
            setWarehouseFilter(value);
            setPage(1);
          }}
          warehouseOptions={warehouseOptions}
          type={typeFilter}
          onTypeChange={(value) => {
            setTypeFilter(value);
            setPage(1);
          }}
          warehouseDisabled={!scopedStoreId || warehouseOptions.length === 0}
        />
      )}
      error={error}
    >
      {isMobile ? (
        <StockMovementsMobileList
          items={items}
          loading={loading}
          error={error}
          footer={footer}
        />
      ) : (
        <StockMovementsTable
          items={items}
          loading={loading}
          error={error}
          footer={footer}
        />
      )}
    </PageShell>
  );
}
