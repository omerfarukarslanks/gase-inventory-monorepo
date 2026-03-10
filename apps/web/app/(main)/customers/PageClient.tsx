"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLang } from "@/context/LangContext";
import { PageShell } from "@/components/layout/PageShell";
import CustomersFilters from "@/components/customers/CustomersFilters";
import CustomersTable from "@/components/customers/CustomersTable";
import CustomerDrawer from "@/components/customers/CustomerDrawer";
import CustomerBalanceDrawer from "@/components/customers/CustomerBalanceDrawer";
import TablePagination from "@/components/ui/TablePagination";
import { useCustomerList } from "./hooks/useCustomerList";
import { useCustomerDrawer } from "./hooks/useCustomerDrawer";
import { useCustomerBalance } from "./hooks/useCustomerBalance";

export default function CustomersPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const isMobile = !useMediaQuery();

  const list = useCustomerList({ t });
  const drawer = useCustomerDrawer({ onSuccess: list.fetchCustomers, t });
  const balance = useCustomerBalance({ t });

  return (
    <PageShell
      error={list.error}
      filters={
        <CustomersFilters
          searchTerm={list.searchTerm}
          onSearchTermChange={list.setSearchTerm}
          showAdvancedFilters={list.showAdvancedFilters}
          onToggleAdvancedFilters={() => list.setShowAdvancedFilters((prev) => !prev)}
          canCreate={can("CUSTOMER_CREATE")}
          onCreate={drawer.onOpenDrawer}
          statusFilter={list.statusFilter}
          onStatusFilterChange={list.setStatusFilter}
          onClearFilters={() => list.setStatusFilter("all")}
        />
      }
    >
      <CustomersTable
        loading={list.loading}
        error={list.error}
        customers={list.customers}
        togglingCustomerIds={list.togglingCustomerIds}
        canUpdate={can("CUSTOMER_UPDATE")}
        onOpenBalanceDrawer={(customer) => void balance.onOpenBalanceDrawer(customer)}
        onEditCustomer={(id) => void drawer.onEditCustomer(id)}
        onToggleCustomerActive={(customer, next) => void list.onToggleCustomerActive(customer, next)}
        footer={
          list.meta ? (
            <TablePagination
              page={list.currentPage}
              totalPages={list.meta.totalPages ?? 1}
              total={list.meta.total}
              pageSize={list.pageSize}
              pageSizeId="customers-page-size"
              loading={list.loading}
              onPageChange={list.setCurrentPage}
              onPageSizeChange={list.onChangePageSize}
            />
          ) : null
        }
      />

      <CustomerDrawer
        open={drawer.drawerOpen}
        editingCustomerId={drawer.editingCustomerId}
        submitting={drawer.submitting}
        loadingCustomerDetail={drawer.loadingCustomerDetail}
        isMobile={isMobile}
        form={drawer.form}
        formError={drawer.formError}
        nameError={drawer.nameError}
        surnameError={drawer.surnameError}
        emailError={drawer.emailError}
        editingCustomerIsActive={drawer.editingCustomerIsActive}
        onClose={drawer.onCloseDrawer}
        onSubmit={drawer.onSubmitCustomer}
        onFormChange={drawer.onFormChange}
        onEditingCustomerIsActiveChange={drawer.setEditingCustomerIsActive}
      />

      <CustomerBalanceDrawer
        open={balance.balanceDrawerOpen}
        onClose={balance.onCloseBalanceDrawer}
        isMobile={isMobile}
        customerBalanceLoading={balance.customerBalanceLoading}
        customerBalanceError={balance.customerBalanceError}
        customerBalance={balance.customerBalance}
        selectedBalanceCustomerId={balance.selectedBalanceCustomerId}
        selectedBalanceCustomerName={balance.selectedBalanceCustomerName}
        onRefresh={() => {
          if (!balance.selectedBalanceCustomerId) return;
          void balance.loadCustomerBalance(balance.selectedBalanceCustomerId);
        }}
      />
    </PageShell>
  );
}
