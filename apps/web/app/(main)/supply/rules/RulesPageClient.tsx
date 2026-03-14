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
import { useAllSuppliers } from "@/hooks/useAllSuppliers";
import { useLang } from "@/context/LangContext";
import SupplyStoreBlocker from "@/components/supply/SupplyStoreBlocker";
import RulesFilters from "@/components/supply/RulesFilters";
import RulesTable, { type ReplenishmentRuleListItem } from "@/components/supply/RulesTable";
import RulesMobileList from "@/components/supply/RulesMobileList";
import RuleDrawer from "@/components/supply/RuleDrawer";
import {
  createReplenishmentRule,
  deactivateReplenishmentRule,
  getReplenishmentRule,
  getReplenishmentRules,
  updateReplenishmentRule,
  type CreateReplenishmentRulePayload,
  type ReplenishmentRule,
  type UpdateReplenishmentRulePayload,
} from "@/lib/replenishment";

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.message.trim()) return error.message;
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
}

function getSupplierLabel(name?: string, surname?: string | null) {
  return [name, surname].filter(Boolean).join(" ").trim();
}

export default function RulesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();
  const { can } = usePermissions();
  const { activeStoreId } = useSessionProfile();
  const stores = useStores();
  const { suppliers } = useAllSuppliers();

  const canManage = can("REPLENISHMENT_RULE_MANAGE");
  const canTenantOnly = can("TENANT_ONLY");
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive">("active");
  const [storeFilter, setStoreFilter] = useState("");
  const [items, setItems] = useState<ReplenishmentRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverTotalPages, setServerTotalPages] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);
  const [selectedRule, setSelectedRule] = useState<ReplenishmentRule | null>(null);
  const closingRuleIdRef = useRef<string | null>(null);

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

  const storeNameById = useMemo(
    () => Object.fromEntries(stores.map((store) => [store.id, store.name])),
    [stores],
  );

  const supplierNameById = useMemo(
    () => Object.fromEntries(suppliers.map((supplier) => [supplier.id, getSupplierLabel(supplier.name, supplier.surname) || supplier.id])),
    [suppliers],
  );

  const hasClientFilters = Boolean(searchTerm.trim() || supplierFilter);

  const fetchRules = useCallback(async () => {
    if (!canManage) {
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

    const requestPage = hasClientFilters ? 1 : page;
    const requestLimit = hasClientFilters ? Math.max(pageSize, 100) : pageSize;

    try {
      const response = await getReplenishmentRules({
        page: requestPage,
        limit: requestLimit,
        storeId: scopedStoreId,
        isActive: statusFilter === "active",
      });
      setItems(response.data ?? []);
      setServerTotal(response.meta?.total ?? response.data?.length ?? 0);
      setServerTotalPages(response.meta?.totalPages ?? 1);
    } catch (loadError) {
      setItems([]);
      setServerTotal(0);
      setServerTotalPages(1);
      setError(getErrorMessage(loadError, t("supply.rules.loadError")));
    } finally {
      setLoading(false);
    }
  }, [canManage, hasClientFilters, page, pageSize, scopedStoreId, statusFilter, t]);

  useEffect(() => {
    void fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, supplierFilter, statusFilter, storeFilter]);

  const mappedItems = useMemo<ReplenishmentRuleListItem[]>(
    () =>
      items.map((item) => {
        const supplierName = supplierNameById[item.supplierId ?? ""] ?? (item.supplierId ? item.supplierId : t("supply.common.noSupplier"));
        const storeName = storeNameById[item.storeId ?? ""] ?? item.storeId ?? "-";

        return {
          id: item.id,
          storeId: item.storeId ?? "",
          productVariantId: item.productVariantId ?? "",
          supplierId: item.supplierId ?? "",
          productName: item.productName ?? t("supply.rules.productLabel"),
          variantName: item.variantName ?? item.productVariantId ?? "-",
          supplierName,
          storeName,
          minStock: item.minStock ?? 0,
          targetStock: item.targetStock ?? 0,
          leadTimeDays: item.leadTimeDays ?? null,
          isActive: item.isActive !== false,
          createdAt: item.createdAt,
        };
      }),
    [items, supplierNameById, storeNameById, t],
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return mappedItems
      .filter((item) => !supplierFilter || item.supplierId === supplierFilter)
      .filter((item) => {
        if (!normalizedSearch) return true;
        return [item.productName, item.variantName, item.supplierName, item.storeName]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [mappedItems, searchTerm, supplierFilter]);

  const total = hasClientFilters ? filteredItems.length : serverTotal;
  const totalPages = hasClientFilters ? Math.max(1, Math.ceil(filteredItems.length / pageSize)) : Math.max(1, serverTotalPages);
  const visibleItems = hasClientFilters
    ? filteredItems.slice((page - 1) * pageSize, page * pageSize)
    : filteredItems;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setSelectedRule(null);
    setDetailLoading(false);
    setDrawerOpen(true);
  };

  const openRuleDetail = useCallback(async (id: string, syncUrl = true) => {
    setDrawerMode("edit");
    setDrawerOpen(true);
    setDetailLoading(true);
    setError("");

    try {
      const detail = await getReplenishmentRule(id);
      setSelectedRule(detail);
      if (syncUrl) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("ruleId", id);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } catch (detailError) {
      setSelectedRule(null);
      setError(getErrorMessage(detailError, t("supply.rules.detailLoadError")));
    } finally {
      setDetailLoading(false);
    }
  }, [pathname, router, searchParams, t]);

  useEffect(() => {
    const ruleId = searchParams.get("ruleId");
    if (!ruleId) {
      closingRuleIdRef.current = null;
      return;
    }
    if (!canManage) return;
    if (closingRuleIdRef.current === ruleId) return;
    if (selectedRule?.id === ruleId && drawerOpen) return;
    void openRuleDetail(ruleId, false);
  }, [canManage, drawerOpen, openRuleDetail, searchParams, selectedRule?.id]);

  const closeDrawer = useCallback((force = false) => {
    if (submitting && !force) return;
    closingRuleIdRef.current = selectedRule?.id ?? searchParams.get("ruleId");
    setDrawerOpen(false);
    setSelectedRule(null);
    setDetailLoading(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("ruleId");
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, selectedRule?.id, submitting]);

  const selectedItem = useMemo(
    () => visibleItems.find((item) => item.id === selectedRule?.id) ?? mappedItems.find((item) => item.id === selectedRule?.id) ?? null,
    [mappedItems, selectedRule?.id, visibleItems],
  );

  const handleCreate = async (payload: CreateReplenishmentRulePayload) => {
    setSubmitting(true);
    setError("");
    try {
      await createReplenishmentRule(payload);
      setSuccess(t("supply.rules.created"));
      closeDrawer(true);
      setPage(1);
      await fetchRules();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, payload: UpdateReplenishmentRulePayload) => {
    setSubmitting(true);
    setError("");
    try {
      const updated = await updateReplenishmentRule(id, payload);
      setSelectedRule(updated);
      setSuccess(t("supply.rules.updated"));
      closeDrawer(true);
      await fetchRules();
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRuleActive = async (item: ReplenishmentRuleListItem, next: boolean) => {
    if (togglingIds.includes(item.id)) return;

    setTogglingIds((current) => [...current, item.id]);
    setError("");
    try {
      const baseRule = selectedRule?.id === item.id
        ? selectedRule
        : items.find((rule) => rule.id === item.id) ?? null;
      const updated = next
        ? await updateReplenishmentRule(item.id, { isActive: true })
        : {
            id: item.id,
            storeId: baseRule?.storeId ?? item.storeId,
            productVariantId: baseRule?.productVariantId ?? item.productVariantId,
            supplierId: baseRule?.supplierId ?? item.supplierId,
            minStock: baseRule?.minStock ?? item.minStock,
            targetStock: baseRule?.targetStock ?? item.targetStock,
            leadTimeDays: baseRule?.leadTimeDays ?? item.leadTimeDays ?? undefined,
            isActive: false,
            createdAt: baseRule?.createdAt ?? item.createdAt,
            updatedAt: baseRule?.updatedAt,
          };

      if (!next) {
        await deactivateReplenishmentRule(item.id);
      }

      setItems((current) => current.map((rule) => (rule.id === item.id ? updated : rule)));
      setSelectedRule((current) => (current?.id === item.id ? updated : current));
      setSuccess(t(next ? "supply.rules.activated" : "supply.rules.deactivated"));
      await fetchRules();
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("supply.rules.statusUpdateError")));
    } finally {
      setTogglingIds((current) => current.filter((id) => id !== item.id));
    }
  };

  if (!activeStoreId) {
    return <SupplyStoreBlocker />;
  }

  return (
    <>
      <PageShell
        error={error}
        filters={(
          <RulesFilters
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            supplierId={supplierFilter}
            onSupplierIdChange={setSupplierFilter}
            supplierOptions={suppliers.map((supplier) => ({
              value: supplier.id,
              label: getSupplierLabel(supplier.name, supplier.surname) || supplier.id,
            }))}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            showStoreFilter={canTenantOnly}
            storeId={storeFilter}
            onStoreIdChange={setStoreFilter}
            storeOptions={storeOptions}
            canCreate={canManage}
            onCreate={openCreateDrawer}
          />
        )}
      >
        {success ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">
            {success}
          </div>
        ) : null}

        {!canManage ? (
          <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted shadow-glow">
            {t("supply.rules.readRequired")}
          </div>
        ) : isMobile ? (
          <RulesMobileList
            items={visibleItems}
            loading={loading}
            error={error}
            canManage={canManage}
            togglingIds={togglingIds}
            onOpenDetail={(id) => void openRuleDetail(id)}
            onToggleActive={(item, next) => void handleToggleRuleActive(item, next)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="supply-rules-page-size"
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
          <RulesTable
            items={visibleItems}
            loading={loading}
            error={error}
            canManage={canManage}
            togglingIds={togglingIds}
            onOpenDetail={(id) => void openRuleDetail(id)}
            onToggleActive={(item, next) => void handleToggleRuleActive(item, next)}
            footer={(
              <TablePagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                pageSizeId="supply-rules-page-size"
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

      <RuleDrawer
        open={drawerOpen}
        mode={drawerMode}
        loading={detailLoading}
        submitting={submitting}
        rule={selectedRule}
        productLabel={selectedItem?.productName ?? selectedRule?.productName ?? t("supply.rules.productLabel")}
        variantLabel={selectedItem?.variantName ?? selectedRule?.variantName ?? selectedRule?.productVariantId ?? "-"}
        suppliers={suppliers}
        storeOptions={storeOptions}
        showStoreSelector={canTenantOnly && drawerMode === "create"}
        fixedStoreId={scopedStoreId}
        onClose={closeDrawer}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
    </>
  );
}
