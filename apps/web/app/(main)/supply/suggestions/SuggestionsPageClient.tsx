"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import TablePagination from "@/components/ui/TablePagination";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { usePermissions } from "@/hooks/usePermissions";
import { useAllSuppliers } from "@/hooks/useAllSuppliers";
import { useLowStockVariantMap } from "@/hooks/useLowStockVariantMap";
import { useStores } from "@/hooks/useStores";
import {
  acceptReplenishmentSuggestion,
  dismissReplenishmentSuggestion,
  getReplenishmentSuggestion,
  getReplenishmentSuggestions,
  type ReplenishmentSuggestion,
} from "@/lib/replenishment";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import SuggestionsFilters from "@/components/supply/SuggestionsFilters";
import SuggestionsTable, { type SuggestionListItem } from "@/components/supply/SuggestionsTable";
import SuggestionsMobileList from "@/components/supply/SuggestionsMobileList";
import SuggestionDetailDrawer from "@/components/supply/SuggestionDetailDrawer";

function getSupplierLabel(name?: string, surname?: string | null) {
  return [name, surname].filter(Boolean).join(" ").trim();
}

export default function SuggestionsPageClient() {
  const router = useRouter();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();
  const { suppliers } = useAllSuppliers();
  const { metaByVariantId } = useLowStockVariantMap(activeStoreId);

  const [items, setItems] = useState<ReplenishmentSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailSubmitting, setDetailSubmitting] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ReplenishmentSuggestion | null>(null);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [dismissNotes, setDismissNotes] = useState("");

  const canAccept = can("REPLENISHMENT_ACCEPT");
  const canDismiss = can("REPLENISHMENT_DISMISS");
  const canTenantOnly = can("TENANT_ONLY");

  const storeNameById = useMemo(
    () =>
      Object.fromEntries(
        stores.map((store) => [store.id, store.name]),
      ),
    [stores],
  );

  const supplierNameById = useMemo(
    () =>
      Object.fromEntries(
        suppliers.map((supplier) => [supplier.id, getSupplierLabel(supplier.name, supplier.surname) || supplier.id]),
      ),
    [suppliers],
  );

  useEffect(() => {
    let cancelled = false;

    if (!activeStoreId) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    void getReplenishmentSuggestions({
      page,
      limit,
      status: statusFilter as never,
      storeId: activeStoreId,
    })
      .then((response) => {
        if (cancelled) return;
        setItems(response.data ?? []);
        setTotal(response.meta?.total ?? response.data?.length ?? 0);
        setTotalPages(response.meta?.totalPages ?? 1);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setError("Ikmal onerileri yuklenemedi.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeStoreId, limit, page, statusFilter]);

  const visibleItems = useMemo<SuggestionListItem[]>(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items
      .map((item) => {
        const variantId = item.rule?.productVariantId ?? "";
        const variantMeta = metaByVariantId[variantId] ?? {};
        const supplierId = item.rule?.supplierId ?? "";
        const storeId = item.rule?.storeId ?? activeStoreId;

        return {
          id: item.id,
          supplierId,
          productName: variantMeta.productName ?? "Urun",
          variantName: variantMeta.variantName ?? (variantId || "-"),
          supplierName: supplierNameById[supplierId] ?? (supplierId || "-"),
          storeName: storeNameById[storeId] ?? variantMeta.storeName ?? "Aktif Magaza",
          currentQuantity: item.currentQuantity ?? variantMeta.quantity ?? 0,
          suggestedQuantity: item.suggestedQuantity ?? 0,
          status: item.status,
          autoCreatedPoId: item.autoCreatedPoId,
        };
      })
      .filter((item) => !supplierFilter || item.supplierId === supplierFilter)
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.productName, item.variantName, item.supplierName, item.storeName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [activeStoreId, items, metaByVariantId, searchTerm, storeNameById, supplierFilter, supplierNameById]);

  const footer =
    !loading && !error ? (
      <TablePagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={limit}
        pageSizeId="supply-suggestions-page-size"
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={(next) => {
          setLimit(next);
          setPage(1);
        }}
      />
    ) : null;

  const selectedListItem = useMemo(
    () => visibleItems.find((item) => item.id === selectedSuggestion?.id) ?? null,
    [selectedSuggestion?.id, visibleItems],
  );

  const openSuggestionDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const detail = await getReplenishmentSuggestion(id);
      setSelectedSuggestion(detail);
    } catch {
      setSelectedSuggestion(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setDetailSubmitting(true);
    try {
      const result = await acceptReplenishmentSuggestion(id);
      if (result.autoCreatedPoId) {
        router.push(`/supply/purchase-orders?purchaseOrderId=${encodeURIComponent(result.autoCreatedPoId)}`);
        return;
      }
      setDetailOpen(false);
      setSelectedSuggestion(result);
      setPage(1);
      const refreshed = await getReplenishmentSuggestions({
        page: 1,
        limit,
        status: statusFilter as never,
        storeId: activeStoreId,
      });
      setItems(refreshed.data ?? []);
      setTotal(refreshed.meta?.total ?? refreshed.data?.length ?? 0);
      setTotalPages(refreshed.meta?.totalPages ?? 1);
    } catch {
      setError("Oneri kabul edilemedi.");
    } finally {
      setDetailSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedSuggestion?.id) return;
    if (!dismissNotes.trim()) return;

    setDetailSubmitting(true);
    try {
      await dismissReplenishmentSuggestion(selectedSuggestion.id, dismissNotes.trim());
      setDismissDialogOpen(false);
      setDismissNotes("");
      setDetailOpen(false);
      const refreshed = await getReplenishmentSuggestions({
        page,
        limit,
        status: statusFilter as never,
        storeId: activeStoreId,
      });
      setItems(refreshed.data ?? []);
      setTotal(refreshed.meta?.total ?? refreshed.data?.length ?? 0);
      setTotalPages(refreshed.meta?.totalPages ?? 1);
    } catch {
      setError("Oneri reddedilemedi.");
    } finally {
      setDetailSubmitting(false);
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
        filters={
          <SuggestionsFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            status={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            supplierId={supplierFilter}
            onSupplierIdChange={setSupplierFilter}
            supplierOptions={supplierOptions}
          />
        }
      >
        {isMobile ? (
          <SuggestionsMobileList
            items={visibleItems}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openSuggestionDetail(id)}
            footer={footer}
          />
        ) : (
          <SuggestionsTable
            items={visibleItems}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openSuggestionDetail(id)}
            footer={footer}
          />
        )}
      </PageShell>

      <SuggestionDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        submitting={detailSubmitting}
        suggestion={selectedSuggestion}
        productName={selectedListItem?.productName ?? metaByVariantId[selectedSuggestion?.rule?.productVariantId ?? ""]?.productName ?? "Urun"}
        variantName={selectedListItem?.variantName ?? metaByVariantId[selectedSuggestion?.rule?.productVariantId ?? ""]?.variantName ?? selectedSuggestion?.rule?.productVariantId ?? "-"}
        supplierName={selectedListItem?.supplierName ?? supplierNameById[selectedSuggestion?.rule?.supplierId ?? ""] ?? "-"}
        storeName={selectedListItem?.storeName ?? storeNameById[selectedSuggestion?.rule?.storeId ?? activeStoreId] ?? "Aktif Magaza"}
        onClose={() => setDetailOpen(false)}
        onAccept={() => void handleAccept(selectedSuggestion?.id ?? "")}
        onDismiss={() => setDismissDialogOpen(true)}
        canAccept={canAccept}
        canDismiss={canDismiss}
      />

      <ConfirmDialog
        open={dismissDialogOpen}
        title="Oneriyi reddet"
        description="Red nedenini girin. Bu bilgi kayda not olarak eklenecektir."
        confirmLabel="Reddet"
        cancelLabel="Vazgec"
        loading={detailSubmitting}
        loadingLabel="Kaydediliyor..."
        onClose={() => {
          if (detailSubmitting) return;
          setDismissDialogOpen(false);
        }}
        onConfirm={() => void handleDismiss()}
      >
        <textarea
          value={dismissNotes}
          onChange={(event) => setDismissNotes(event.target.value)}
          placeholder="Bu hafta siparis acma..."
          className="min-h-[96px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
        />
      </ConfirmDialog>
    </>
  );
}
