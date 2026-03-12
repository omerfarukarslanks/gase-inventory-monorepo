"use client";

import TablePagination from "@/components/ui/TablePagination";
import StoresFilters from "@/components/stores/StoresFilters";
import StoreDrawer from "@/components/stores/StoreDrawer";
import StoresMobileList from "@/components/stores/StoresMobileList";
import StoresTable from "@/components/stores/StoresTable";
import { PageShell } from "@/components/layout/PageShell";
import { usePermissions } from "@/hooks/usePermissions";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useLang } from "@/context/LangContext";
import { useStoreList } from "./hooks/useStoreList";
import { useStoreDrawer } from "./hooks/useStoreDrawer";

export default function StoresPage() {
  const { can } = usePermissions();
  const isMobile = useViewportMode() === "mobile";
  const { t } = useLang();

  const canCreate = can("STORE_CREATE");
  const canUpdate = can("STORE_UPDATE");

  const storeTypeOptions = [
    { value: "RETAIL", label: t("stores.storeTypeRetail") },
    { value: "WHOLESALE", label: t("stores.storeTypeWholesale") },
  ] as const;

  const list = useStoreList({ t });

  const drawer = useStoreDrawer({ t, onSuccess: list.fetchStores });

  return (
    <PageShell
      filters={
        <StoresFilters
          searchTerm={list.searchTerm}
          onSearchTermChange={list.setSearchTerm}
          showAdvancedFilters={list.showAdvancedFilters}
          onToggleAdvancedFilters={() => list.setShowAdvancedFilters((prev) => !prev)}
          canCreate={canCreate}
          onCreate={drawer.onOpenDrawer}
          statusFilter={list.statusFilter}
          onStatusFilterChange={list.setStatusFilter}
          onClearFilters={list.clearAdvancedFilters}
        />
      }
    >
      {isMobile ? (
        <StoresMobileList
          loading={list.loading}
          error={list.error}
          stores={list.stores}
          canUpdate={canUpdate}
          togglingStoreIds={list.togglingStoreIds}
          onEditStore={(id) => void drawer.onEditStore(id)}
          onToggleStoreActive={(store, next) => void list.onToggleStoreActive(store, next)}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.pageSize}
                pageSizeId="stores-page-size"
                loading={list.loading}
                onPageChange={list.setCurrentPage}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      ) : (
        <StoresTable
          loading={list.loading}
          error={list.error}
          stores={list.stores}
          canUpdate={canUpdate}
          togglingStoreIds={list.togglingStoreIds}
          onEditStore={(id) => void drawer.onEditStore(id)}
          onToggleStoreActive={(store, next) => void list.onToggleStoreActive(store, next)}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.pageSize}
                pageSizeId="stores-page-size"
                loading={list.loading}
                onPageChange={list.setCurrentPage}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      )}

      <StoreDrawer
        open={drawer.drawerOpen}
        editingStoreId={drawer.editingStoreId}
        submitting={drawer.submitting}
        loadingStoreDetail={drawer.loadingStoreDetail}
        form={drawer.form}
        formError={drawer.formError}
        nameError={drawer.nameError}
        storeTypeOptions={storeTypeOptions}
        onClose={drawer.onCloseDrawer}
        onSubmit={drawer.onSubmitStore}
        onFormChange={drawer.onFormChange}
        normalizeCurrency={drawer.normalizeCurrency}
        normalizeStoreType={drawer.normalizeStoreType}
      />
    </PageShell>
  );
}
