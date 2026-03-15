import type { RequestEnvelope, CustomersRequest, SalesDraftSeed } from "@/src/lib/workflows";
import { useCustomerForm } from "./hooks/useCustomerForm";
import { useCustomerList } from "./hooks/useCustomerList";
import { CustomerDetailView } from "./views/CustomerDetailView";
import { CustomerFormSheet } from "./views/CustomerFormSheet";
import { CustomerListView } from "./views/CustomerListView";

type CustomersScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<CustomersRequest> | null;
  onStartSale?: (seed?: SalesDraftSeed) => void;
  onBack?: () => void;
};

export default function CustomersScreen({
  isActive = true,
  onStartSale,
  request,
  onBack,
}: CustomersScreenProps = {}) {
  const list = useCustomerList({ isActive });
  const form = useCustomerForm({ fetchCustomers: list.fetchCustomers, request });

  if (list.selectedCustomer) {
    return (
      <>
        <CustomerDetailView
          selectedCustomer={list.selectedCustomer}
          balance={list.balance}
          balanceLoading={list.balanceLoading}
          error={list.error}
          onBack={() => {
            list.setSelectedCustomer(null);
            list.setBalance(null);
          }}
          onStartSale={onStartSale}
          openCustomer={list.openCustomer}
        />
        <CustomerFormSheet
          visible={form.composerOpen}
          onClose={form.closeComposerModal}
          form={form.form}
          composerError={form.composerError}
          nameError={form.nameError}
          surnameError={form.surnameError}
          phoneError={form.phoneError}
          emailError={form.emailError}
          canSubmit={form.canSubmit}
          submitting={form.submitting}
          surnameRef={form.surnameRef}
          phoneRef={form.phoneRef}
          emailRef={form.emailRef}
          handleFieldChange={form.handleFieldChange}
          onCreateCustomer={form.onCreateCustomer}
        />
      </>
    );
  }

  return (
    <>
      <CustomerListView
        search={list.search}
        setSearch={list.setSearch}
        statusFilter={list.statusFilter}
        setStatusFilter={list.setStatusFilter}
        customers={list.customers}
        loading={list.loading}
        error={list.error}
        activeFilterLabel={list.activeFilterLabel}
        hasCustomerFilters={list.hasCustomerFilters}
        fetchCustomers={list.fetchCustomers}
        openCustomer={list.openCustomer}
        resetFilters={list.resetFilters}
        openComposerModal={form.openComposerModal}
      />
      <CustomerFormSheet
        visible={form.composerOpen}
        onClose={form.closeComposerModal}
        form={form.form}
        composerError={form.composerError}
        nameError={form.nameError}
        surnameError={form.surnameError}
        phoneError={form.phoneError}
        emailError={form.emailError}
        canSubmit={form.canSubmit}
        submitting={form.submitting}
        surnameRef={form.surnameRef}
        phoneRef={form.phoneRef}
        emailRef={form.emailRef}
        handleFieldChange={form.handleFieldChange}
        onCreateCustomer={form.onCreateCustomer}
      />
    </>
  );
}
