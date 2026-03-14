"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import TablePagination from "@/components/ui/TablePagination";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useStores } from "@/hooks/useStores";
import {
  getCentralGoodsReceipt,
  getCentralGoodsReceipts,
  type CentralGoodsReceiptListItem,
  type PurchaseOrderReceipt,
} from "@/lib/procurement";
import { createPutawayTasksFromGoodsReceipt, getWarehouses, type Warehouse } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";
import ReceiptsFilters from "@/components/supply/ReceiptsFilters";
import GoodsReceiptsTable from "@/components/supply/GoodsReceiptsTable";
import GoodsReceiptsMobileList from "@/components/supply/GoodsReceiptsMobileList";
import GoodsReceiptDetailDrawer from "@/components/supply/GoodsReceiptDetailDrawer";
import GoodsReceiptPutawayDrawer from "@/components/supply/GoodsReceiptPutawayDrawer";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function ReceiptsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("PO_READ");
  const canCreatePutaway = can("WAREHOUSE_MANAGE");
  const canTenantOnly = can("TENANT_ONLY");

  const [items, setItems] = useState<CentralGoodsReceiptListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PurchaseOrderReceipt | null>(null);
  const [putawayOpen, setPutawayOpen] = useState(false);
  const [putawaySubmitting, setPutawaySubmitting] = useState(false);
  const closingReceiptIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (canTenantOnly && activeStoreId && !storeFilter) {
      setStoreFilter(activeStoreId);
    }
  }, [activeStoreId, canTenantOnly, storeFilter]);

  const scopedStoreId = canTenantOnly ? (storeFilter || activeStoreId || "") : (activeStoreId || "");

  const storeOptions = useMemo(
    () => stores.map((store) => ({ value: store.id, label: store.name })),
    [stores],
  );

  const warehouseOptions = useMemo(
    () => warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.name })),
    [warehouses],
  );

  const fetchList = useCallback(async () => {
    if (!canRead) {
      setItems([]);
      setLoading(false);
      return;
    }

    if (!scopedStoreId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getCentralGoodsReceipts({
        page,
        limit,
        storeId: scopedStoreId,
        warehouseId: warehouseFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        q: searchTerm.trim() || undefined,
      });
      setItems(response.data ?? []);
      setTotal(response.meta?.total ?? response.data?.length ?? 0);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch (loadError) {
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(getErrorMessage(loadError, t("supply.receipts.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canRead, scopedStoreId, page, limit, warehouseFilter, startDate, endDate, searchTerm, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!scopedStoreId) {
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
  }, [scopedStoreId]);

  const openDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getCentralGoodsReceipt(id);
      setSelectedReceipt(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("receiptId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedReceipt(null);
      setError(getErrorMessage(detailError, t("supply.receipts.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const receiptId = searchParams.get("receiptId");
    if (!receiptId) {
      closingReceiptIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingReceiptIdRef.current === receiptId) return;
    if (selectedReceipt?.id === receiptId && detailOpen) return;
    void openDetail(receiptId, false);
  }, [canRead, detailOpen, openDetail, searchParams, selectedReceipt?.id]);

  const closeDetail = useCallback(() => {
    closingReceiptIdRef.current = selectedReceipt?.id ?? searchParams.get("receiptId");
    setDetailOpen(false);
    setSelectedReceipt(null);
    setPutawayOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("receiptId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedReceipt?.id]);

  const handleCreatePutaway = async (
    receiptId: string,
    payload: { notes?: string; lines: Array<{ goodsReceiptLineId: string; toLocationId: string }> },
  ) => {
    setPutawaySubmitting(true);
    setError("");
    try {
      await createPutawayTasksFromGoodsReceipt(receiptId, payload);
      setSuccess(t("supply.receipts.putawayCreated"));
      setPutawayOpen(false);
      await Promise.all([
        fetchList(),
        openDetail(receiptId, false),
      ]);
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("supply.receipts.putawayError")));
    } finally {
      setPutawaySubmitting(false);
    }
  };

  if (!activeStoreId) {
    return <SupplyStoreBlocker />;
  }

  const footer = !loading && !error && canRead ? (
    <TablePagination
      page={page}
      totalPages={Math.max(1, totalPages)}
      total={total}
      pageSize={limit}
      pageSizeId="supply-receipts-page-size"
      loading={loading}
      onPageChange={setPage}
      onPageSizeChange={(next) => {
        setLimit(next);
        setPage(1);
      }}
    />
  ) : null;

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <ReceiptsFilters
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
            warehouseDisabled={!scopedStoreId}
            startDate={startDate}
            onStartDateChange={(value) => {
              setStartDate(value);
              setPage(1);
            }}
            endDate={endDate}
            onEndDateChange={(value) => {
              setEndDate(value);
              setPage(1);
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
            {t("supply.receipts.readRequired")}
          </div>
        ) : isMobile ? (
          <GoodsReceiptsMobileList
            items={items.map((item) => ({
              id: item.id,
              purchaseOrderId: item.purchaseOrderId ?? "",
              purchaseOrderReference: item.purchaseOrderReference ?? item.purchaseOrderId ?? item.id,
              warehouseId: item.warehouseId ?? "",
              warehouseName: item.warehouseName ?? item.warehouseId ?? "-",
              storeName: item.store?.name ?? "-",
              receivedAt: item.receivedAt,
              notes: item.notes,
              lineCount: item.lineCount ?? 0,
              totalReceivedQuantity: item.totalReceivedQuantity ?? 0,
            }))}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        ) : (
          <GoodsReceiptsTable
            items={items.map((item) => ({
              id: item.id,
              purchaseOrderId: item.purchaseOrderId ?? "",
              purchaseOrderReference: item.purchaseOrderReference ?? item.purchaseOrderId ?? item.id,
              warehouseId: item.warehouseId ?? "",
              warehouseName: item.warehouseName ?? item.warehouseId ?? "-",
              storeName: item.store?.name ?? "-",
              receivedAt: item.receivedAt,
              notes: item.notes,
              lineCount: item.lineCount ?? 0,
              totalReceivedQuantity: item.totalReceivedQuantity ?? 0,
            }))}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        )}
      </PageShell>

      <GoodsReceiptDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        acting={putawaySubmitting}
        receipt={selectedReceipt}
        onClose={closeDetail}
        onOpenPurchaseOrder={() => {
          if (!selectedReceipt?.purchaseOrderId) return;
          router.push(`/supply/purchase-orders?purchaseOrderId=${encodeURIComponent(selectedReceipt.purchaseOrderId)}`);
        }}
        onOpenPutaway={() => setPutawayOpen(true)}
        canCreatePutaway={canCreatePutaway}
      />

      <GoodsReceiptPutawayDrawer
        open={putawayOpen}
        submitting={putawaySubmitting}
        receipt={selectedReceipt}
        warehouseLabel={selectedReceipt?.warehouseName ?? selectedReceipt?.warehouseId ?? null}
        onClose={() => setPutawayOpen(false)}
        onSubmit={handleCreatePutaway}
      />
    </>
  );
}
