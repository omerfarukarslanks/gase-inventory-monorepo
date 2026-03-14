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
  getCentralSalePayment,
  getCentralSalePayments,
  type CentralSalePaymentDetail,
  type CentralSalePaymentListItem,
} from "@/lib/sales";
import { useLang } from "@/context/LangContext";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import PaymentsFilters from "@/components/sales/PaymentsFilters";
import SalesPaymentsTable from "@/components/sales/SalesPaymentsTable";
import SalesPaymentsMobileList from "@/components/sales/SalesPaymentsMobileList";
import SalePaymentDetailDrawer from "@/components/sales/SalePaymentDetailDrawer";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

export default function PaymentsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();

  const canRead = can("SALE_READ");
  const canTenantOnly = can("TENANT_ONLY");

  const [items, setItems] = useState<CentralSalePaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<CentralSalePaymentDetail | null>(null);
  const closingPaymentIdRef = useRef<string | null>(null);

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
      setError(t("salesPayments.readRequired"));
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
      const response = await getCentralSalePayments({
        page,
        limit,
        storeId: scopedStoreId,
        paymentMethod: paymentMethodFilter || undefined,
        status: statusFilter || undefined,
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
      setError(getErrorMessage(loadError, t("salesPayments.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canRead, scopedStoreId, page, limit, paymentMethodFilter, statusFilter, startDate, endDate, searchTerm, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getCentralSalePayment(id);
      if (!detail) {
        setSelectedPayment(null);
        setError(t("salesPayments.detailsNotFound"));
        return;
      }
      setSelectedPayment(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("paymentId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedPayment(null);
      setError(getErrorMessage(detailError, t("salesPayments.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const paymentId = searchParams.get("paymentId");
    if (!paymentId) {
      closingPaymentIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingPaymentIdRef.current === paymentId) return;
    if (detailLoading) return;
    if (selectedPayment?.id === paymentId && detailOpen) return;
    void openDetail(paymentId, false);
  }, [canRead, detailLoading, detailOpen, openDetail, searchParams, selectedPayment?.id]);

  const closeDetail = useCallback(() => {
    closingPaymentIdRef.current = selectedPayment?.id ?? searchParams.get("paymentId");
    setDetailOpen(false);
    setSelectedPayment(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("paymentId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedPayment?.id]);

  if (!activeStoreId) {
    return (
      <SupplyStoreBlocker
        title={t("salesPayments.blockers.activeStoreTitle")}
        description={t("salesPayments.blockers.activeStoreDescription")}
      />
    );
  }

  const footer = !loading && !error && canRead ? (
    <TablePagination
      page={page}
      totalPages={Math.max(1, totalPages)}
      total={total}
      pageSize={limit}
      pageSizeId="sales-payments-page-size"
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
          <PaymentsFilters
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
            paymentMethod={paymentMethodFilter}
            onPaymentMethodChange={(value) => {
              setPaymentMethodFilter(value);
              setPage(1);
            }}
            status={statusFilter}
            onStatusChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
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
          <SalesPaymentsMobileList
            items={items}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        ) : (
          <SalesPaymentsTable
            items={items}
            loading={loading}
            error={error}
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        )}
      </PageShell>

      <SalePaymentDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        detail={selectedPayment}
        onClose={closeDetail}
        onOpenSale={() => {
          if (!selectedPayment?.saleId) return;
          router.push(`/sales?saleId=${selectedPayment.saleId}`);
        }}
        canOpenSale={canRead}
      />
    </>
  );
}
