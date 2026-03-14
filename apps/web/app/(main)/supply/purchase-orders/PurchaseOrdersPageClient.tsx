"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/PageShell";
import TablePagination from "@/components/ui/TablePagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useAllSuppliers } from "@/hooks/useAllSuppliers";
import {
  approvePurchaseOrder,
  cancelPurchaseOrder,
  createPurchaseOrder,
  createPurchaseOrderReceipt,
  getPurchaseOrder,
  getPurchaseOrderReceipts,
  getPurchaseOrders,
  type CreatePurchaseOrderPayload,
  type PurchaseOrder,
  type PurchaseOrderReceipt,
} from "@/lib/procurement";
import PurchaseOrdersFilters from "@/components/supply/PurchaseOrdersFilters";
import PurchaseOrdersTable, { type PurchaseOrderListItem } from "@/components/supply/PurchaseOrdersTable";
import PurchaseOrdersMobileList from "@/components/supply/PurchaseOrdersMobileList";
import PurchaseOrderCreateDrawer from "@/components/supply/PurchaseOrderCreateDrawer";
import PurchaseOrderDetailDrawer from "@/components/supply/PurchaseOrderDetailDrawer";
import PurchaseOrderReceiptDrawer from "@/components/supply/PurchaseOrderReceiptDrawer";
import GoodsReceiptPutawayDrawer from "@/components/supply/GoodsReceiptPutawayDrawer";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import { createPutawayTasksFromGoodsReceipt, getWarehouses, type Warehouse } from "@/lib/warehouse";

function getSupplierLabel(name?: string, surname?: string | null) {
  return [name, surname].filter(Boolean).join(" ").trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function PurchaseOrdersPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const { suppliers } = useAllSuppliers();

  const [items, setItems] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActing, setDetailActing] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [receipts, setReceipts] = useState<PurchaseOrderReceipt[]>([]);
  const [receiptWarehouses, setReceiptWarehouses] = useState<Warehouse[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptSubmitting, setReceiptSubmitting] = useState(false);
  const [receiptPutawayOpen, setReceiptPutawayOpen] = useState(false);
  const [selectedReceiptForPutaway, setSelectedReceiptForPutaway] = useState<PurchaseOrderReceipt | null>(null);
  const [receiptPutawaySubmitting, setReceiptPutawaySubmitting] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const closingPurchaseOrderIdRef = useRef<string | null>(null);

  const canRead = can("PO_READ");
  const canCreate = can("PO_CREATE");
  const canApprove = can("PO_APPROVE");
  const canCancel = can("PO_CANCEL");
  const canCreateReceipt = can("PO_RECEIPT_CREATE");
  const canCreatePutaway = can("WAREHOUSE_MANAGE");
  const canTenantOnly = can("TENANT_ONLY");

  const activeStoreName = useMemo(
    () => {
      const current = selectedPurchaseOrder?.store?.name;
      if (current) return current;
      return activeStoreId ? "Aktif Magaza" : "Magaza baglami yok";
    },
    [activeStoreId, selectedPurchaseOrder?.store?.name],
  );

  const supplierNameById = useMemo(
    () =>
      Object.fromEntries(
        suppliers.map((supplier) => [supplier.id, getSupplierLabel(supplier.name, supplier.surname) || supplier.id]),
      ),
    [suppliers],
  );

  const receiptWarehouseNameById = useMemo(
    () => Object.fromEntries(receiptWarehouses.map((warehouse) => [warehouse.id, warehouse.name])),
    [receiptWarehouses],
  );

  const fetchList = useCallback(async (targetPage = page, targetLimit = limit) => {
    if (!activeStoreId || !canRead) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getPurchaseOrders({
        page: targetPage,
        limit: targetLimit,
        status: statusFilter as never,
        storeId: activeStoreId,
        supplierId: supplierFilter || undefined,
      });
      setItems(response.data ?? []);
      setTotal(response.meta?.total ?? response.data?.length ?? 0);
      setTotalPages(response.meta?.totalPages ?? 1);
    } catch {
      setItems([]);
      setError("Satin alma siparisleri yuklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [activeStoreId, canRead, limit, page, statusFilter, supplierFilter]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!detailOpen) {
      setReceiptWarehouses([]);
      return;
    }

    const storeId = selectedPurchaseOrder?.store?.id ?? activeStoreId;
    if (!storeId) {
      setReceiptWarehouses([]);
      return;
    }

    let mounted = true;
    void (async () => {
      try {
        const data = await getWarehouses({ storeId });
        if (!mounted) return;
        setReceiptWarehouses(data);
      } catch {
        if (!mounted) return;
        setReceiptWarehouses([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeStoreId, detailOpen, selectedPurchaseOrder?.store?.id]);

  const visibleItems = useMemo<PurchaseOrderListItem[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items
      .map((item) => {
        const lines = item.lines ?? [];
        return {
          id: item.id,
          status: item.status,
          supplierName: supplierNameById[item.supplierId ?? ""] ?? item.supplierId ?? "-",
          storeName: item.store?.name ?? "Aktif Magaza",
          expectedAt: item.expectedAt,
          currency: item.currency,
          notes: item.notes,
          lineCount: lines.length,
          totalQuantity: lines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0),
          totalAmount: lines.reduce((sum, line) => sum + Number(line.lineTotal ?? 0), 0),
        };
      })
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.id, item.supplierName, item.notes]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [items, searchTerm, supplierNameById]);

  const footer =
    !loading && !error && canRead ? (
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={limit}
        pageSizeId="supply-po-page-size"
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setLimit(next);
          setPage(1);
        }}
      />
    ) : null;

  const openDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);

    try {
      const [po, poReceipts] = await Promise.all([
        getPurchaseOrder(id),
        getPurchaseOrderReceipts(id),
      ]);
      setSelectedPurchaseOrder(po);
      setReceipts(poReceipts ?? []);
      if (syncUrl) {
        router.replace(`${pathname}?purchaseOrderId=${encodeURIComponent(id)}`, { scroll: false });
      }
    } catch {
      setSelectedPurchaseOrder(null);
      setReceipts([]);
      setError("Siparis detayi yuklenemedi.");
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    const purchaseOrderId = searchParams.get("purchaseOrderId");
    if (!purchaseOrderId) {
      closingPurchaseOrderIdRef.current = null;
      return;
    }
    if (!purchaseOrderId || !canRead) return;
    if (closingPurchaseOrderIdRef.current === purchaseOrderId) return;
    if (selectedPurchaseOrder?.id === purchaseOrderId && detailOpen) return;
    void openDetail(purchaseOrderId, false);
  }, [canRead, detailOpen, openDetail, searchParams, selectedPurchaseOrder?.id]);

  const closeDetail = () => {
    closingPurchaseOrderIdRef.current = selectedPurchaseOrder?.id ?? searchParams.get("purchaseOrderId");
    setDetailOpen(false);
    setSelectedPurchaseOrder(null);
    setReceipts([]);
    setReceiptOpen(false);
    setReceiptPutawayOpen(false);
    setSelectedReceiptForPutaway(null);
    router.replace(pathname, { scroll: false });
  };

  const handleCreatePurchaseOrder = async (payload: CreatePurchaseOrderPayload) => {
    setCreateSubmitting(true);
    setError("");
    try {
      const created = await createPurchaseOrder(payload);
      setCreateOpen(false);
      setSuccess("Satin alma siparisi olusturuldu.");
      await fetchList(1, limit);
      setPage(1);
      if (created.id && canRead) {
        await openDetail(created.id);
      }
    } catch {
      setError("Satin alma siparisi olusturulamadi.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedPurchaseOrder?.id) return;
    setDetailActing(true);
    try {
      await approvePurchaseOrder(selectedPurchaseOrder.id);
      await openDetail(selectedPurchaseOrder.id);
      await fetchList();
      setSuccess("Siparis onaylandi.");
      setApproveDialogOpen(false);
    } catch {
      setError("Siparis onaylanamadi.");
    } finally {
      setDetailActing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedPurchaseOrder?.id) return;
    setDetailActing(true);
    try {
      await cancelPurchaseOrder(selectedPurchaseOrder.id);
      await openDetail(selectedPurchaseOrder.id);
      await fetchList();
      setSuccess("Siparis iptal edildi.");
      setCancelDialogOpen(false);
    } catch {
      setError("Siparis iptal edilemedi.");
    } finally {
      setDetailActing(false);
    }
  };

  const handleCreateReceipt = async (payload: { warehouseId: string; notes?: string; lines: Array<{ purchaseOrderLineId: string; receivedQuantity: number; lotNumber?: string; expiryDate?: string }> }) => {
    if (!selectedPurchaseOrder?.id) return;
    setReceiptSubmitting(true);
    try {
      await createPurchaseOrderReceipt(selectedPurchaseOrder.id, payload);
      await openDetail(selectedPurchaseOrder.id);
      await fetchList();
      setReceiptOpen(false);
      setSuccess("Mal kabul kaydi olusturuldu.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Mal kabul kaydi olusturulamadi."));
    } finally {
      setReceiptSubmitting(false);
    }
  };

  const handleCreateReceiptPutaway = async (
    receiptId: string,
    payload: { notes?: string; lines: Array<{ goodsReceiptLineId: string; toLocationId: string }> },
  ) => {
    setReceiptPutawaySubmitting(true);
    try {
      await createPutawayTasksFromGoodsReceipt(receiptId, payload);
      setReceiptPutawayOpen(false);
      setSelectedReceiptForPutaway(null);
      setSuccess("Putaway gorevleri olusturuldu.");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Putaway gorevleri olusturulamadi."));
    } finally {
      setReceiptPutawaySubmitting(false);
    }
  };

  if (!activeStoreId && canTenantOnly) {
    return <SupplyStoreBlocker />;
  }

  const supplierOptions = suppliers.map((supplier) => ({
    value: supplier.id,
    label: getSupplierLabel(supplier.name, supplier.surname) || supplier.id,
  }));

  return (
    <>
      <PageShell
        error={error}
        filters={
          <PurchaseOrdersFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            status={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            supplierId={supplierFilter}
            onSupplierIdChange={(value) => {
              setSupplierFilter(value);
              setPage(1);
            }}
            supplierOptions={supplierOptions}
            canCreate={canCreate && !!activeStoreId}
            onCreate={() => setCreateOpen(true)}
          />
        }
      >
        {success ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        {!canRead ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted shadow-glow">
            Siparis listesini goruntulemek icin okuma yetkisi gerekli.
          </div>
        ) : isMobile ? (
          <PurchaseOrdersMobileList
            items={visibleItems}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        ) : (
          <PurchaseOrdersTable
            items={visibleItems}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        )}
      </PageShell>

      <PurchaseOrderCreateDrawer
        open={createOpen}
        submitting={createSubmitting}
        activeStoreId={activeStoreId}
        activeStoreName={activeStoreName}
        suppliers={suppliers}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreatePurchaseOrder}
      />

      <PurchaseOrderDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        acting={detailActing}
        purchaseOrder={selectedPurchaseOrder}
        receipts={receipts}
        suppliers={suppliers}
        receiptWarehouseNameById={receiptWarehouseNameById}
        onClose={closeDetail}
        onApprove={() => setApproveDialogOpen(true)}
        onCancel={() => setCancelDialogOpen(true)}
        onOpenReceipt={() => setReceiptOpen(true)}
        onOpenReceiptPutaway={(receipt) => {
          setSelectedReceiptForPutaway(receipt);
          setReceiptPutawayOpen(true);
        }}
        canApprove={canApprove}
        canCancel={canCancel}
        canCreateReceipt={canCreateReceipt}
        canCreatePutaway={canCreatePutaway}
      />

      <PurchaseOrderReceiptDrawer
        open={receiptOpen}
        submitting={receiptSubmitting}
        purchaseOrder={selectedPurchaseOrder}
        fallbackStoreId={activeStoreId}
        onClose={() => setReceiptOpen(false)}
        onSubmit={handleCreateReceipt}
      />

      <GoodsReceiptPutawayDrawer
        open={receiptPutawayOpen}
        submitting={receiptPutawaySubmitting}
        receipt={selectedReceiptForPutaway}
        warehouseLabel={
          selectedReceiptForPutaway?.warehouseId
            ? (receiptWarehouseNameById[selectedReceiptForPutaway.warehouseId] ?? selectedReceiptForPutaway.warehouseId)
            : null
        }
        onClose={() => {
          setReceiptPutawayOpen(false);
          setSelectedReceiptForPutaway(null);
        }}
        onSubmit={handleCreateReceiptPutaway}
      />

      <ConfirmDialog
        open={approveDialogOpen}
        title="Siparisi onayla"
        description="Bu islem siparisi DRAFT durumundan APPROVED durumuna tasir."
        confirmLabel="Onayla"
        cancelLabel="Vazgec"
        loading={detailActing}
        loadingLabel="Isleniyor..."
        onClose={() => setApproveDialogOpen(false)}
        onConfirm={() => void handleApprove()}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Siparisi iptal et"
        description="Bu islem siparisi iptal eder ve daha sonra geri alinmaz."
        confirmLabel="Iptal Et"
        cancelLabel="Vazgec"
        loading={detailActing}
        loadingLabel="Isleniyor..."
        onClose={() => setCancelDialogOpen(false)}
        onConfirm={() => void handleCancel()}
      />
    </>
  );
}
