"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TablePagination from "@/components/ui/TablePagination";
import { useViewportMode } from "@/hooks/useViewportMode";
import { usePermissions } from "@/hooks/usePermissions";
import { useSessionProfile } from "@/hooks/useSessionProfile";
import { useStores } from "@/hooks/useStores";
import { useAllSuppliers } from "@/hooks/useAllSuppliers";
import { useUserLabels } from "@/hooks/useUserLabels";
import { ApiError } from "@/lib/api";
import {
  cancelApproval,
  getApproval,
  getApprovals,
  getApprovalCurrentLevel,
  getApprovalStoreId,
  HISTORY_APPROVAL_STATUSES,
  PENDING_APPROVAL_STATUSES,
  reviewApprovalL1,
  reviewApprovalL2,
  type ApprovalEntityType,
  type ApprovalLevel,
  type ApprovalRequest,
  type ApprovalStatus,
} from "@/lib/approvals";
import ApprovalsFilters from "@/components/approvals/ApprovalsFilters";
import ApprovalsTable, { type ApprovalListItem } from "@/components/approvals/ApprovalsTable";
import ApprovalsMobileList from "@/components/approvals/ApprovalsMobileList";
import ApprovalDetailDrawer from "@/components/approvals/ApprovalDetailDrawer";
import { getApprovalEntityTypeLabel } from "@/components/approvals/status";

type ApprovalsPageClientProps = {
  scope: "pending" | "history";
};

function getSupplierLabel(name?: string, surname?: string | null) {
  return [name, surname].filter(Boolean).join(" ").trim();
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function isWithinDateRange(value: string | undefined, startDate: string, endDate: string): boolean {
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

export default function ApprovalsPageClient({ scope }: ApprovalsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const stores = useStores();
  const { suppliers } = useAllSuppliers();
  const { can } = usePermissions();
  const { userId } = useSessionProfile();

  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityType, setEntityType] = useState<ApprovalEntityType | "">("");
  const [level, setLevel] = useState<ApprovalLevel | "">("");
  const [status, setStatus] = useState<ApprovalStatus | "">("");
  const [storeId, setStoreId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActing, setDetailActing] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const closingApprovalIdRef = useRef<string | null>(null);

  const canRead = can("APPROVAL_READ");
  const statusOptions = scope === "pending" ? PENDING_APPROVAL_STATUSES : HISTORY_APPROVAL_STATUSES;

  const storeNameById = useMemo(
    () => Object.fromEntries(stores.map((store) => [store.id, store.name])),
    [stores],
  );

  const supplierNameById = useMemo(
    () => Object.fromEntries(
      suppliers.map((supplier) => [supplier.id, getSupplierLabel(supplier.name, supplier.surname) || supplier.id]),
    ),
    [suppliers],
  );

  const loadApprovals = useCallback(async () => {
    if (!canRead) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await getApprovals();
      setItems(response);
    } catch (loadError) {
      setItems([]);
      setError(getErrorMessage(loadError, "Onay talepleri yuklenemedi."));
    } finally {
      setLoading(false);
    }
  }, [canRead]);

  useEffect(() => {
    void loadApprovals();
  }, [loadApprovals]);

  const allRelevantUserIds = useMemo(() => {
    const ids = new Set<string>();
    items.forEach((item) => {
      if (item.requestedById) ids.add(item.requestedById);
      if (item.l1ReviewedById) ids.add(item.l1ReviewedById);
      if (item.l2ReviewedById) ids.add(item.l2ReviewedById);
    });
    if (selectedApproval?.requestedById) ids.add(selectedApproval.requestedById);
    if (selectedApproval?.l1ReviewedById) ids.add(selectedApproval.l1ReviewedById);
    if (selectedApproval?.l2ReviewedById) ids.add(selectedApproval.l2ReviewedById);
    return [...ids];
  }, [items, selectedApproval]);

  const userLabels = useUserLabels(allRelevantUserIds);

  const filteredApprovals = useMemo(() => {
    const scopedStatuses = scope === "pending" ? PENDING_APPROVAL_STATUSES : HISTORY_APPROVAL_STATUSES;
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items
      .filter((item) => scopedStatuses.includes(item.status))
      .filter((item) => !entityType || item.entityType === entityType)
      .filter((item) => !level || getApprovalCurrentLevel(item) === level)
      .filter((item) => !status || item.status === status)
      .filter((item) => !storeId || getApprovalStoreId(item) === storeId)
      .filter((item) => (!startDate && !endDate) || isWithinDateRange(item.createdAt, startDate, endDate))
      .filter((item) => {
        if (!normalizedSearch) return true;
        const requesterName = userLabels[item.requestedById ?? ""] ?? item.requestedById ?? "";
        const storeName = storeNameById[getApprovalStoreId(item)] ?? getApprovalStoreId(item);
        return [
          item.id,
          item.entityId,
          getApprovalEntityTypeLabel(item.entityType),
          requesterName,
          storeName,
          item.requesterNotes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        const leftTime = new Date(left.createdAt ?? left.updatedAt ?? 0).getTime();
        const rightTime = new Date(right.createdAt ?? right.updatedAt ?? 0).getTime();
        return rightTime - leftTime;
      });
  }, [endDate, entityType, items, level, scope, searchTerm, startDate, status, storeId, storeNameById, userLabels]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, entityType, level, status, storeId, startDate, endDate, scope]);

  const total = filteredApprovals.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedApprovals = useMemo(
    () => filteredApprovals.slice((page - 1) * limit, page * limit),
    [filteredApprovals, limit, page],
  );

  const visibleItems = useMemo<ApprovalListItem[]>(() => (
    paginatedApprovals.map((item) => ({
      id: item.id,
      entityType: item.entityType,
      status: item.status,
      level: getApprovalCurrentLevel(item),
      requesterName: userLabels[item.requestedById ?? ""] ?? item.requestedById ?? "-",
      storeName: storeNameById[getApprovalStoreId(item)] ?? getApprovalStoreId(item) ?? "-",
      createdAt: item.createdAt,
    }))
  ), [paginatedApprovals, storeNameById, userLabels]);

  const openDetail = useCallback(async (id: string, syncUrl = true) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getApproval(id);
      setSelectedApproval(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("approvalId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedApproval(null);
      setError(getErrorMessage(detailError, "Onay detayi yuklenemedi."));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const approvalId = searchParams.get("approvalId");
    if (!approvalId) {
      closingApprovalIdRef.current = null;
      return;
    }
    if (!canRead) return;
    if (closingApprovalIdRef.current === approvalId) return;
    if (selectedApproval?.id === approvalId && detailOpen) return;
    void openDetail(approvalId, false);
  }, [canRead, detailOpen, openDetail, searchParams, selectedApproval?.id]);

  const closeDetail = useCallback(() => {
    closingApprovalIdRef.current = selectedApproval?.id ?? searchParams.get("approvalId");
    setDetailOpen(false);
    setSelectedApproval(null);
    setRejectDialogOpen(false);
    setRejectNotes("");
    setRejectError("");
    setCancelDialogOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("approvalId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedApproval?.id]);

  const refreshAfterAction = useCallback(async (nextApproval: ApprovalRequest, successMessage: string) => {
    setSelectedApproval(nextApproval);
    setSuccess(successMessage);
    await loadApprovals();
  }, [loadApprovals]);

  const handleApprove = useCallback(async () => {
    if (!selectedApproval) return;
    setDetailActing(true);
    setError("");

    try {
      const nextApproval = selectedApproval.status === "PENDING_L2"
        ? await reviewApprovalL2(selectedApproval.id, { action: "APPROVE" })
        : await reviewApprovalL1(selectedApproval.id, { action: "APPROVE" });
      await refreshAfterAction(nextApproval, "Onay talebi guncellendi.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Onay islemi tamamlanamadi."));
    } finally {
      setDetailActing(false);
    }
  }, [refreshAfterAction, selectedApproval]);

  const handleReject = useCallback(async () => {
    if (!selectedApproval) return;
    if (!rejectNotes.trim()) {
      setRejectError("Reddetme notu zorunludur.");
      return;
    }

    setDetailActing(true);
    setError("");
    setRejectError("");

    try {
      const payload = { action: "REJECT" as const, notes: rejectNotes.trim() };
      const nextApproval = selectedApproval.status === "PENDING_L2"
        ? await reviewApprovalL2(selectedApproval.id, payload)
        : await reviewApprovalL1(selectedApproval.id, payload);
      setRejectDialogOpen(false);
      setRejectNotes("");
      await refreshAfterAction(nextApproval, "Onay talebi reddedildi.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Reddetme islemi tamamlanamadi."));
    } finally {
      setDetailActing(false);
    }
  }, [refreshAfterAction, rejectNotes, selectedApproval]);

  const handleCancel = useCallback(async () => {
    if (!selectedApproval) return;
    setDetailActing(true);
    setError("");

    try {
      const nextApproval = await cancelApproval(selectedApproval.id);
      setCancelDialogOpen(false);
      await refreshAfterAction(nextApproval, "Onay talebi iptal edildi.");
    } catch (actionError) {
      setError(getErrorMessage(actionError, "Iptal islemi tamamlanamadi."));
    } finally {
      setDetailActing(false);
    }
  }, [refreshAfterAction, selectedApproval]);

  const canApprove = Boolean(
    selectedApproval
    && ((selectedApproval.status === "PENDING_L1" && can("APPROVAL_REVIEW"))
      || (selectedApproval.status === "PENDING_L2" && can("APPROVAL_REVIEW_L2"))),
  );

  const canReject = canApprove;
  const canCancel = Boolean(
    selectedApproval
    && (selectedApproval.status === "PENDING_L1" || selectedApproval.status === "PENDING_L2")
    && userId
    && selectedApproval.requestedById === userId,
  );

  const footer = !loading && !error && canRead ? (
    <TablePagination
      page={page}
      totalPages={totalPages}
      total={total}
      pageSize={limit}
      pageSizeId={`approvals-${scope}-page-size`}
      loading={loading}
      onPageChange={setPage}
      onPageSizeChange={(next) => {
        setLimit(next);
        setPage(1);
      }}
    />
  ) : null;

  const storeOptions = stores.map((store) => ({ value: store.id, label: store.name }));

  return (
    <>
      <PageShell
        error={error}
        filters={
          <ApprovalsFilters
            scope={scope}
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            entityType={entityType}
            onEntityTypeChange={setEntityType}
            level={level}
            onLevelChange={setLevel}
            status={status}
            onStatusChange={setStatus}
            storeId={storeId}
            onStoreIdChange={setStoreId}
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
            storeOptions={storeOptions}
            statusOptions={statusOptions}
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
            Onay taleplerini goruntulemek icin okuma yetkisi gerekli.
          </div>
        ) : isMobile ? (
          <ApprovalsMobileList
            items={visibleItems}
            loading={loading}
            error=""
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        ) : (
          <ApprovalsTable
            items={visibleItems}
            loading={loading}
            error=""
            onOpenDetail={(id) => void openDetail(id)}
            footer={footer}
          />
        )}
      </PageShell>

      <ApprovalDetailDrawer
        open={detailOpen}
        loading={detailLoading}
        acting={detailActing}
        approval={selectedApproval}
        requesterName={userLabels[selectedApproval?.requestedById ?? ""] ?? selectedApproval?.requestedById ?? "-"}
        l1ReviewerName={userLabels[selectedApproval?.l1ReviewedById ?? ""] ?? selectedApproval?.l1ReviewedById ?? "-"}
        l2ReviewerName={userLabels[selectedApproval?.l2ReviewedById ?? ""] ?? selectedApproval?.l2ReviewedById ?? "-"}
        storeNameById={storeNameById}
        supplierNameById={supplierNameById}
        onClose={closeDetail}
        onApprove={() => void handleApprove()}
        onReject={() => {
          setRejectError("");
          setRejectDialogOpen(true);
        }}
        onCancel={() => setCancelDialogOpen(true)}
        canApprove={canApprove}
        canReject={canReject}
        canCancel={canCancel}
      />

      <ConfirmDialog
        open={rejectDialogOpen}
        title="Onay talebini reddet"
        description="Reddetme notu zorunludur."
        confirmLabel="Reddet"
        cancelLabel="Vazgec"
        loading={detailActing}
        loadingLabel="Isleniyor..."
        onClose={() => {
          setRejectDialogOpen(false);
          setRejectError("");
        }}
        onConfirm={() => void handleReject()}
      >
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
          <textarea
            value={rejectNotes}
            onChange={(event) => {
              setRejectNotes(event.target.value);
              if (rejectError) setRejectError("");
            }}
            rows={4}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="Reddetme nedenini yazin..."
          />
          {rejectError ? <p className="mt-2 text-xs text-error">{rejectError}</p> : null}
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelDialogOpen}
        title="Onay talebini iptal et"
        description="Bu islem yalnizca talep sahibi icin kullanilabilir."
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
