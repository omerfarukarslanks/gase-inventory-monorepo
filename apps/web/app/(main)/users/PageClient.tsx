"use client";

import UsersFilters from "@/components/users/UsersFilters";
import UserDrawer from "@/components/users/UserDrawer";
import UsersMobileList from "@/components/users/UsersMobileList";
import UsersTable from "@/components/users/UsersTable";
import TablePagination from "@/components/ui/TablePagination";
import { PageShell } from "@/components/layout/PageShell";
import { usePermissions } from "@/hooks/usePermissions";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useUserList } from "./hooks/useUserList";
import { useUserDrawer } from "./hooks/useUserDrawer";

export default function UsersPage() {
  const { can } = usePermissions();
  const isMobile = useViewportMode() === "mobile";

  const canCreate = can("USER_CREATE");
  const canUpdate = can("USER_UPDATE");

  const list = useUserList({});

  const drawer = useUserDrawer({ onSaved: list.fetchUsers });

  return (
    <PageShell
      filters={
        <UsersFilters
          searchTerm={list.searchTerm}
          onSearchTermChange={list.setSearchTerm}
          showAdvancedFilters={list.showAdvancedFilters}
          onToggleAdvancedFilters={() => list.setShowAdvancedFilters((prev) => !prev)}
          canCreate={canCreate}
          onCreate={drawer.openCreate}
          storeFilter={list.storeFilter}
          onStoreFilterChange={list.setStoreFilter}
          storeFilterOptions={list.storeFilterOptions}
          statusFilter={list.statusFilter}
          onStatusFilterChange={list.setStatusFilter}
          sortBy={list.sortBy ?? ""}
          onSortByChange={list.onSortByChange}
          sortOrder={list.sortOrder ?? ""}
          onSortOrderChange={list.onSortOrderChange}
          onClearFilters={list.clearAdvancedFilters}
        />
      }
    >
      {isMobile ? (
        <UsersMobileList
          users={list.users}
          loading={list.loading}
          canUpdate={canUpdate}
          togglingUserIds={list.togglingUserIds}
          onEdit={drawer.openEdit}
          onToggleUserActive={(user, next) => void list.onToggleUserActive(user, next)}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.limit}
                pageSizeId="users-page-size"
                loading={list.loading}
                onPageChange={list.handlePageChange}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      ) : (
        <UsersTable
          users={list.users}
          loading={list.loading}
          canUpdate={canUpdate}
          sortBy={list.sortBy}
          sortOrder={list.sortOrder}
          togglingUserIds={list.togglingUserIds}
          onSort={list.handleSort}
          onEdit={drawer.openEdit}
          onToggleUserActive={(user, next) => void list.onToggleUserActive(user, next)}
          footer={
            list.meta ? (
              <TablePagination
                page={list.currentPage}
                totalPages={list.totalPages}
                total={list.meta.total}
                pageSize={list.limit}
                pageSizeId="users-page-size"
                loading={list.loading}
                onPageChange={list.handlePageChange}
                onPageSizeChange={list.onChangePageSize}
              />
            ) : null
          }
        />
      )}

      <UserDrawer
        open={drawer.isDrawerOpen}
        mode={drawer.mode}
        selectedUser={drawer.selectedUser}
        saving={drawer.saving}
        form={drawer.form}
        errors={drawer.formErrors}
        roleOptions={drawer.roleOptions}
        storeOptions={list.storeFilterOptions}
        onClose={drawer.closeDrawer}
        onSave={drawer.handleSave}
        onFormChange={drawer.onFormChange}
      />
    </PageShell>
  );
}
