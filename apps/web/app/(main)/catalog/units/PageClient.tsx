"use client";

import TablePagination from "@/components/ui/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useLang } from "@/context/LangContext";
import { useViewportMode } from "@/hooks/useViewportMode";
import UnitsFilters from "@/components/units/UnitsFilters";
import UnitsMobileList from "@/components/units/UnitsMobileList";
import UnitsTable from "@/components/units/UnitsTable";
import UnitDrawer from "@/components/units/UnitDrawer";
import { PageShell } from "@/components/layout/PageShell";
import { useUnitList } from "./hooks/useUnitList";
import { useUnitDrawer } from "./hooks/useUnitDrawer";

export default function UnitsPageClient() {
  const { t } = useLang();
  const { can } = usePermissions();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const canCreate = can("UNIT_CREATE");
  const canUpdate = can("UNIT_UPDATE");

  const list = useUnitList({ t });
  const drawer = useUnitDrawer({
    t,
    onMutated: list.fetchUnits,
    onSuccess: list.setSuccess,
  });

  return (
    <PageShell error={list.error}>
      {list.success && (
        <div className="animate-fi rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {list.success}
        </div>
      )}

      <UnitsFilters
        searchTerm={list.searchTerm}
        onSearchTermChange={list.setSearchTerm}
        showAdvancedFilters={list.showAdvancedFilters}
        onToggleAdvancedFilters={() => list.setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={drawer.openCreateDrawer}
        statusFilter={list.statusFilter}
        onStatusFilterChange={list.setStatusFilter}
        onClearFilters={() => list.setStatusFilter("all")}
      />

      {isMobile ? (
        <UnitsMobileList
          loading={list.loading}
          units={list.units}
          togglingUnitIds={list.togglingUnitIds}
          canUpdate={canUpdate}
          onEditUnit={drawer.openEditDrawer}
          onToggleUnitStatus={list.toggleUnitStatus}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.pageSize}
                pageSizeId="units-page-size"
                loading={list.loading}
                onPageChange={list.handlePageChange}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      ) : (
        <UnitsTable
          loading={list.loading}
          units={list.units}
          togglingUnitIds={list.togglingUnitIds}
          canUpdate={canUpdate}
          onEditUnit={drawer.openEditDrawer}
          onToggleUnitStatus={list.toggleUnitStatus}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.pageSize}
                pageSizeId="units-page-size"
                loading={list.loading}
                onPageChange={list.handlePageChange}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      )}

      <UnitDrawer
        open={drawer.drawerOpen}
        editingId={drawer.editingId}
        editingUnit={drawer.editingUnit}
        form={drawer.form}
        submitting={drawer.submitting}
        detailLoading={drawer.detailLoading}
        formError={drawer.formError}
        nameError={drawer.nameError}
        abbreviationError={drawer.abbreviationError}
        onClose={drawer.closeDrawer}
        onSave={drawer.handleSave}
        onFormChange={drawer.onFormChange}
      />
    </PageShell>
  );
}
