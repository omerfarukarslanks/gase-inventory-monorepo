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
import { getCentralSaleReturn, getCentralSaleReturns, type SaleReturnDetail, type SaleReturnListItem } from "@/lib/sales";
import { useLang } from "@/context/LangContext";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import ReturnsFilters from "@/components/sales/ReturnsFilters";
import SaleReturnsTable from "@/components/sales/SaleReturnsTable";
import SaleReturnsMobileList from "@/components/sales/SaleReturnsMobileList";
import SaleReturnDetailDrawer from "@/components/sales/SaleReturnDetailDrawer";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function ReturnsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("SALE_RETURN_READ");
  const canOpenSales = can("SALE_READ");
  const canTenantOnly = can("TENANT_ONLY");

  const [items, setItems] = useState<SaleReturnListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SaleReturnDetail | null>(null);
  const closingReturnIdRef = useRef<string | null>(null);

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

  const fetchList = useCallback(async () => {
    if (!canRead) {
      setItems([]);
      setError(t("salesReturns.readRequired"));
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
      const response = await getCentralSaleReturns({
        page,
        limit,
        storeId: scopedStoreId,
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
      setError(getErrorMessage(loadError, t("salesReturns.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canRead, scopedStoreId, page, limit, startDate, endDate, searchTerm, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getCentralSaleReturn(id);
      if (!detail) {
        setSelectedReturn(null);
        setError(t("salesReturns.detailsNotFound"));
        return;
      }
      setSelectedReturn(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("returnId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedReturn(null);
      setError(getErrorMessage(detailError, t("salesReturns.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const returnId = searchParams.get("returnId");
    if (!returnId) {
      closingReturnIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingReturnIdRef.current === returnId) return;
    if (detailLoading) return;
    if (selectedReturn?.id === returnId && detailOpen) return;
    void openDetail(returnId, false);
  }, [canRead, detailLoading, detailOpen, openDetail, searchParams, selectedReturn?.id]);

  const closeDetail = useCallback(() => {
    closingReturnIdRef.current = selectedReturn?.id ?? searchParams.get("returnId");
    setDetailOpen(false);
    setSelectedReturn(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("returnId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedReturn?.id]);

  if (!activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("salesReturns.blockers.activeStoreTitle")}
        description={t("salesReturns.blockers.activeStoreDescription")}
      />
    );
  }

  const footer = !loading && !error && canRead ? (
    <TablePagination
      page={page}
      totalPages={Math.max(1, totalPages)}
      total={total}
      pageSize={limit}
      pageSizeId="sales-returns-page-size"
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
          <ReturnsFilters
            searchTerm={searchTerm}
            onSearchTermChange={(value) => {
              setSearchTerm(value);
              setPage(1);
            }}
            showStoreFilter={canTenantOnly}
            storeId={storeFilter}
            onStoreIdChange={(value) => {
              setStoreFilter(value);
              setPage(1);
            }}
            storeOptions={storeOptions}
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
        {isMobile ? (
          <SaleReturnsMobileList
            items={items}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        ) : (
          <SaleReturnsTable
            items={items}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        )}
      </PageShell>

      <SaleReturnDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        detail={selectedReturn}
        onClose={closeDetail}
        onOpenSale={() => {
          if (!selectedReturn?.saleId) return;
          router.push(`/sales?saleId=${selectedReturn.saleId}`);
        }}
        canOpenSale={canOpenSales}
      />
    </>
  );
}
