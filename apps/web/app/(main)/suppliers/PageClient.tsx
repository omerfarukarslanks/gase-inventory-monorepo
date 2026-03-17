"use client";

import SuppliersFilters from "@/components/suppliers/SuppliersFilters";
import SuppliersMobileList from "@/components/suppliers/SuppliersMobileList";
import SupplierDrawer from "@/components/suppliers/SupplierDrawer";
import SuppliersTable from "@/components/suppliers/SuppliersTable";
import TablePagination from "@/components/ui/TablePagination";
import { PageShell } from "@/components/layout/PageShell";
import { usePermissions } from "@/hooks/usePermissions";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useLang } from "@/context/LangContext";
import { useSupplierList } from "./hooks/useSupplierList";
import { useSupplierDrawer } from "./hooks/useSupplierDrawer";

export default function SuppliersPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const isMobile = useViewportMode() === "mobile";

  const canCreate = can("SUPPLIER_CREATE");
  const canUpdate = can("SUPPLIER_UPDATE");

  const list = useSupplierList({ t });

  const drawer = useSupplierDrawer({ t, onSuccess: list.fetchSuppliers });

  return (
    <PageShell
      error={list.error}
      filters={
        <SuppliersFilters
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
        <SuppliersMobileList
          loading={list.loading}
          error={list.error}
          suppliers={list.suppliers}
          canUpdate={canUpdate}
          togglingSupplierIds={list.togglingSupplierIds}
          onEditSupplier={(id) => void drawer.onEditSupplier(id)}
          onToggleSupplierActive={(supplier, next) => void list.onToggleSupplierActive(supplier, next)}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.pageSize}
                pageSizeId="suppliers-page-size"
                loading={list.loading}
                onPageChange={list.setCurrentPage}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      ) : (
        <SuppliersTable
          loading={list.loading}
          error={list.error}
          suppliers={list.suppliers}
          canUpdate={canUpdate}
          togglingSupplierIds={list.togglingSupplierIds}
          onEditSupplier={(id) => void drawer.onEditSupplier(id)}
          onToggleSupplierActive={(supplier, next) => void list.onToggleSupplierActive(supplier, next)}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.pageSize}
                pageSizeId="suppliers-page-size"
                loading={list.loading}
                onPageChange={list.setCurrentPage}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      )}

      <SupplierDrawer
        open={drawer.drawerOpen}
        editingSupplierId={drawer.editingSupplierId}
        submitting={drawer.submitting}
        loadingSupplierDetail={drawer.loadingSupplierDetail}
        form={drawer.form}
        formError={drawer.formError}
        nameError={drawer.nameError}
        emailError={drawer.emailError}
        taxIdError={drawer.taxIdError}
        editingSupplierIsActive={drawer.editingSupplierIsActive}
        onClose={drawer.onCloseDrawer}
        onSubmit={drawer.onSubmitSupplier}
        onFormChange={drawer.onFormChange}
        onEditingSupplierIsActiveChange={drawer.setEditingSupplierIsActive}
      />
    </PageShell>
  );
}
