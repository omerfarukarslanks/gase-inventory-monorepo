"use client";

import TablePagination from "@/components/ui/TablePagination";
import { usePermissions } from "@/hooks/usePermissions";
import { useLang } from "@/context/LangContext";
import AttributesFilters from "@/components/attributes/AttributesFilters";
import AttributesTable from "@/components/attributes/AttributesTable";
import AttributeDrawer from "@/components/attributes/AttributeDrawer";
import { PageShell } from "@/components/layout/PageShell";
import { useAttributeList } from "./hooks/useAttributeList";
import { useAttributeDrawer } from "./hooks/useAttributeDrawer";

export default function AttributesPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const canCreate = can("PRODUCT_ATTRIBUTE_CREATE");
  const canUpdate = can("PRODUCT_ATTRIBUTE_UPDATE");

  const list = useAttributeList({ t });

  const drawer = useAttributeDrawer({
    t,
    onMutated: list.fetchAttributes,
    onSuccess: list.setSuccess,
  });

  return (
    <PageShell
      error={list.error}
      filters={
        <AttributesFilters
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
      }
    >
      {list.success && (
        <div className="animate-fi rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          {list.success}
        </div>
      )}

      <AttributesTable
        loading={list.loading}
        attributes={list.attributes}
        expandedAttributeIds={list.expandedAttributeIds}
        togglingAttributeIds={list.togglingAttributeIds}
        togglingValueIds={list.togglingValueIds}
        canUpdate={canUpdate}
        onToggleExpand={list.toggleExpand}
        onEditAttribute={drawer.openEditDrawer}
        onToggleAttributeStatus={list.toggleAttributeStatus}
        onToggleValueStatus={list.toggleAttributeValueStatus}
        footer={
          list.meta ? (
            <TablePagination
              page={list.currentPage}
              totalPages={list.totalPages}
              total={list.meta.total}
              pageSize={list.pageSize}
              pageSizeId="attributes-page-size"
              loading={list.loading}
              onPageChange={list.handlePageChange}
              onPageSizeChange={list.onChangePageSize}
            />
          ) : null
        }
      />

      <AttributeDrawer
        open={drawer.drawerOpen}
        editingId={drawer.editingId}
        drawerStep={drawer.drawerStep}
        submitting={drawer.submitting}
        detailLoading={drawer.detailLoading}
        formName={drawer.formName}
        originalName={drawer.originalName}
        existingValues={drawer.existingValues}
        newValuesInput={drawer.newValuesInput}
        formError={drawer.formError}
        onClose={drawer.closeDrawer}
        onPrevStep={drawer.goPrevStep}
        onNextStep={drawer.goNextStep}
        onSave={drawer.handleSave}
        onFormNameChange={drawer.setFormName}
        onNewValuesInputChange={drawer.setNewValuesInput}
        onUpdateEditableValue={drawer.updateEditableValue}
      />
    </PageShell>
  );
}
