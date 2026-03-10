"use client";
import { useState, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useStores } from "@/hooks/useStores";
import { useLang } from "@/context/LangContext";
import { downloadSaleReceipt } from "@/lib/sales";

import { useSaleScope } from "./hooks/useSaleScope";
import { useSalesList } from "./hooks/useSalesList";
import { useSaleVariants } from "./hooks/useSaleVariants";
import { useSaleForm } from "./hooks/useSaleForm";
import { useSalePayment } from "./hooks/useSalePayment";
import { useSaleDetail } from "./hooks/useSaleDetail";
import { useSaleLines } from "./hooks/useSaleLines";
import { useSaleReturn } from "./hooks/useSaleReturn";
import { useSaleCancel } from "./hooks/useSaleCancel";

import SalesFilters from "@/components/sales/SalesFilters";
import SalesTable from "@/components/sales/SalesTable";
import SalesPagination from "@/components/sales/SalesPagination";
import SaleDrawer from "@/components/sales/SaleDrawer";
import SaleDetailModal from "@/components/sales/SaleDetailModal";
import SalePaymentDrawer from "@/components/sales/SalePaymentDrawer";
import SaleReturnDrawer from "@/components/sales/SaleReturnDrawer";
import SaleLinesDrawer from "@/components/sales/SaleLinesDrawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { PageShell } from "@/components/layout/PageShell";

export default function SalesPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const canTenantOnly = can("TENANT_ONLY");
  const allStores = useStores();
  const stores = canTenantOnly ? allStores : [];

  const [successMessage, setSuccessMessage] = useState("");
  const storeOptions = useMemo(
    () => stores.filter((s) => s.isActive).map((s) => ({ value: s.id, label: s.name })),
    [stores],
  );

  const scope = useSaleScope();
  const list = useSalesList({ scopeReady: scope.scopeReady, canTenantOnly, t });
  const variants = useSaleVariants({
    scopeReady: scope.scopeReady,
    isWholesaleStoreType: scope.isWholesaleStoreType,
    t,
  });

  const form = useSaleForm({
    scopeReady: scope.scopeReady,
    canTenantOnly,
    scopedStoreId: scope.scopedStoreId,
    isWholesaleStoreType: scope.isWholesaleStoreType,
    variantPresetsById: variants.variantPresetsById,
    onSuccess: setSuccessMessage,
    refetchList: list.refetch,
    t,
  });

  const payment = useSalePayment({
    onRefreshPayments: list.fetchSalePayments,
    onRefreshList: list.refetch,
    onSuccess: setSuccessMessage,
  });

  const detail = useSaleDetail();

  const lines = useSaleLines({
    isWholesaleStoreType: scope.isWholesaleStoreType,
    variantOptions: variants.variantOptions,
    onRefreshList: list.refetch,
  });

  const ret = useSaleReturn({
    onRefreshList: list.refetch,
    onSuccess: setSuccessMessage,
  });

  const cancel = useSaleCancel({
    onRefreshList: list.refetch,
    onSuccess: setSuccessMessage,
  });

  const handleDownloadReceipt = async (saleId: string) => {
    try {
      const blob = await downloadSaleReceipt(saleId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fis-${saleId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // sessizce gec
    }
  };

  return (
    <PageShell
      error={list.salesError}
      filters={<SalesFilters
        showAdvancedFilters={list.showSalesAdvancedFilters}
        onToggleAdvancedFilters={() => list.setShowSalesAdvancedFilters((prev) => !prev)}
        onNewSale={form.openSaleDrawer}
        canCreate={can("SALE_CREATE")}
        canTenantOnly={canTenantOnly}
        storeOptions={storeOptions}
        salesStoreIds={list.salesStoreIds}
        onSalesStoreIdsChange={list.setSalesStoreIds}
        receiptNoFilter={list.salesReceiptNoFilter}
        onReceiptNoFilterChange={list.setSalesReceiptNoFilter}
        nameFilter={list.salesNameFilter}
        onNameFilterChange={list.setSalesNameFilter}
        surnameFilter={list.salesSurnameFilter}
        onSurnameFilterChange={list.setSalesSurnameFilter}
        statusFilters={list.salesStatusFilters}
        onStatusFiltersChange={list.setSalesStatusFilters}
        paymentStatusFilter={list.salesPaymentStatusFilter}
        onPaymentStatusFilterChange={list.setSalesPaymentStatusFilter}
        minUnitPriceFilter={list.salesMinUnitPriceFilter}
        onMinUnitPriceFilterChange={list.setSalesMinUnitPriceFilter}
        maxUnitPriceFilter={list.salesMaxUnitPriceFilter}
        onMaxUnitPriceFilterChange={list.setSalesMaxUnitPriceFilter}
        minLineTotalFilter={list.salesMinLineTotalFilter}
        onMinLineTotalFilterChange={list.setSalesMinLineTotalFilter}
        maxLineTotalFilter={list.salesMaxLineTotalFilter}
        onMaxLineTotalFilterChange={list.setSalesMaxLineTotalFilter}
        includeLines={list.salesIncludeLines}
        onIncludeLinesChange={list.setSalesIncludeLines}
        onResetPage={() => list.setSalesPage(1)}
      />}
    >
      <SalesTable
        salesReceipts={list.salesReceipts}
        salesLoading={list.salesLoading}
        salesError={list.salesError}
        expandedPaymentSaleIds={list.expandedPaymentSaleIds}
        paymentsBySaleId={list.paymentsBySaleId}
        paymentLoadingBySaleId={list.paymentLoadingBySaleId}
        paymentErrorBySaleId={list.paymentErrorBySaleId}
        onTogglePayments={list.togglePaymentsCollapse}
        onAddPayment={payment.openAddPaymentDrawer}
        onEditPayment={payment.openEditPaymentDrawer}
        onDeletePayment={payment.openDeletePaymentDialog}
        onOpenDetail={(id) => void detail.openSaleDetailDialog(id)}
        onEdit={(sale) => void form.openEditDrawer(sale)}
        onOpenCancel={cancel.openCancelDialog}
        onReturn={(sale) => void ret.openReturnDrawer(sale)}
        onDownloadReceipt={(id) => void handleDownloadReceipt(id)}
        onManageLines={(sale) => void lines.openManageLinesDrawer(sale)}
        canUpdate={can("SALE_UPDATE")}
        canCancel={can("SALE_CANCEL")}
        canCreateLines={can("SALE_LINE_CREATE")}
        canUpdateLines={can("SALE_LINE_UPDATE")}
        canReturn={can("SALE_RETURN_READ")}
        canDownloadReceipt={can("SALE_RECEIPT_READ")}
        canCreatePayments={can("SALE_PAYMENT_CREATE")}
        canUpdatePayments={can("SALE_PAYMENT_UPDATE")}
        footer={
          list.salesMeta && !list.salesLoading && !list.salesError ? (
            <SalesPagination
              page={list.salesPage}
              totalPages={list.salesMeta.totalPages ?? 1}
              limit={list.salesLimit}
              total={list.salesMeta.total ?? 0}
              loading={list.salesLoading}
              onPageChange={list.setSalesPage}
              onLimitChange={list.setSalesLimit}
            />
          ) : null
        }
      />

      {successMessage && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          {successMessage}
        </div>
      )}

      <SaleDrawer
        open={form.saleDrawerOpen}
        editMode={!!form.editingSaleId}
        submitting={form.submitting}
        scopeReady={scope.scopeReady}
        loadingVariants={variants.loadingVariants}
        canTenantOnly={canTenantOnly}
        storeOptions={storeOptions}
        customerId={form.customerId}
        onCustomerIdChange={(value) => {
          form.setCustomerId(value);
          if (!value) {
            form.setName("");
            form.setSurname("");
            form.setPhoneNumber("");
            form.setEmail("");
          }
        }}
        onCustomerSelected={form.onSelectCustomer}
        customerDropdownRefreshKey={form.customerDropdownRefreshKey}
        onQuickCreateCustomer={form.onQuickCreateCustomer}
        variantOptions={variants.variantOptions}
        variantFieldLabel={scope.isWholesaleStoreType ? "Paket *" : "Varyant *"}
        variantPlaceholder={scope.isWholesaleStoreType ? "Paket secin" : "Varyant secin"}
        loadingMoreVariants={variants.loadingMoreVariants}
        variantHasMore={variants.variantHasMore}
        onLoadMoreVariants={variants.loadMoreVariants}
        storeId={form.storeId}
        onStoreIdChange={form.setStoreId}
        name={form.name}
        surname={form.surname}
        phoneNumber={form.phoneNumber}
        email={form.email}
        paymentMethod={form.paymentMethod}
        onPaymentMethodChange={form.setPaymentMethod}
        initialPaymentAmount={form.initialPaymentAmount}
        onInitialPaymentAmountChange={form.setInitialPaymentAmount}
        note={form.note}
        onNoteChange={form.setNote}
        lines={form.lines}
        onChangeLine={form.onChangeLine}
        onApplyVariantPreset={form.applyVariantPreset}
        onAddLine={form.addLine}
        onRemoveLine={form.removeLine}
        errors={form.errors}
        onClearError={(field) => form.setErrors((prev) => ({ ...prev, [field]: undefined }))}
        formError={form.formError}
        success={successMessage}
        onClose={form.closeSaleDrawer}
        onSubmit={() => void form.onSubmit()}
      />

      <SalePaymentDrawer
        open={payment.paymentDrawerOpen}
        editingPaymentId={payment.editingPaymentId}
        paymentSubmitting={payment.paymentSubmitting}
        paymentAmount={payment.paymentAmount}
        paymentPaidAtInput={payment.paymentPaidAtInput}
        paymentMethodInput={payment.paymentMethodInput}
        paymentCurrency={payment.paymentCurrency}
        paymentNoteInput={payment.paymentNoteInput}
        paymentFormError={payment.paymentFormError}
        onClose={payment.closePaymentDrawer}
        onSubmit={() => void payment.submitPayment()}
        onPaymentAmountChange={(value) => {
          if (payment.paymentFormError) payment.setPaymentFormError("");
          payment.setPaymentAmount(value);
        }}
        onPaymentPaidAtInputChange={(value) => {
          if (payment.paymentFormError) payment.setPaymentFormError("");
          payment.setPaymentPaidAtInput(value);
        }}
        onPaymentMethodInputChange={(value) => {
          if (payment.paymentFormError) payment.setPaymentFormError("");
          payment.setPaymentMethodInput(payment.normalizePaymentMethod(value));
        }}
        onPaymentCurrencyChange={(value) => {
          if (payment.paymentFormError) payment.setPaymentFormError("");
          payment.setPaymentCurrency(payment.normalizeCurrency(value));
        }}
        onPaymentNoteInputChange={(value) => {
          if (payment.paymentFormError) payment.setPaymentFormError("");
          payment.setPaymentNoteInput(value);
        }}
      />

      <ConfirmDialog
        open={cancel.cancelDialogOpen}
        title="Satis Fisini Iptal Et"
        description="Bu satis fisini iptal etmek istiyor musunuz?"
        confirmLabel="Evet"
        cancelLabel="Hayir"
        loading={cancel.cancellingSale}
        loadingLabel="Iptal ediliyor..."
        onConfirm={() => void cancel.confirmCancelSale()}
        onClose={cancel.closeCancelDialog}
      >
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Sebep</label>
            <input
              type="text"
              value={cancel.cancelReason}
              onChange={(e) => cancel.setCancelReason(e.target.value)}
              placeholder="Orn: Musteri vazgecti"
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
            <textarea
              value={cancel.cancelNote}
              onChange={(e) => cancel.setCancelNote(e.target.value)}
              placeholder="Orn: Telefon ile iptal"
              className="min-h-18 w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={payment.paymentDeleteDialogOpen}
        title="Odeme Kaydini Sil"
        description="Bu odeme kaydini silmek istiyor musunuz?"
        confirmLabel="Evet"
        cancelLabel="Hayir"
        loading={payment.deletingPayment}
        loadingLabel="Siliniyor..."
        onConfirm={() => void payment.confirmDeletePayment()}
        onClose={payment.closeDeletePaymentDialog}
      />

      <SaleDetailModal
        open={detail.saleDetailOpen}
        loading={detail.saleDetailLoading}
        error={detail.saleDetailError}
        detail={detail.saleDetail}
        onClose={detail.closeSaleDetailDialog}
      />

      <SaleReturnDrawer
        open={ret.returnDrawerOpen}
        returnTargetSale={ret.returnTargetSale}
        returnSubmitting={ret.returnSubmitting}
        returnDetailLoading={ret.returnDetailLoading}
        returnLines={ret.returnLines}
        returnNotes={ret.returnNotes}
        returnFormError={ret.returnFormError}
        onClose={ret.closeReturnDrawer}
        onSubmit={() => void ret.submitReturn()}
        onReturnModeChange={(lineIndex, value) => {
          if (ret.returnFormError) ret.setReturnFormError("");
          ret.setReturnLines((prev) =>
            prev.map((line, index) => (index === lineIndex ? { ...line, returnMode: value } : line)),
          );
        }}
        onReturnQuantityChange={(lineIndex, value) => {
          if (ret.returnFormError) ret.setReturnFormError("");
          ret.setReturnLines((prev) =>
            prev.map((line, index) => (index === lineIndex ? { ...line, returnQuantity: value } : line)),
          );
        }}
        onRefundAmountChange={(lineIndex, value) => {
          if (ret.returnFormError) ret.setReturnFormError("");
          ret.setReturnLines((prev) =>
            prev.map((line, index) => (index === lineIndex ? { ...line, refundAmount: value } : line)),
          );
        }}
        onPackageVariantReturnQuantityChange={(lineIndex, variantIndex, value) => {
          if (ret.returnFormError) ret.setReturnFormError("");
          ret.setReturnLines((prev) =>
            prev.map((line, index) => {
              if (index !== lineIndex) return line;
              return {
                ...line,
                packageVariantReturns: line.packageVariantReturns.map((variant, innerIndex) =>
                  innerIndex === variantIndex ? { ...variant, returnQuantity: value } : variant,
                ),
              };
            }),
          );
        }}
        onReturnNotesChange={ret.setReturnNotes}
      />

      <SaleLinesDrawer
        open={lines.linesDrawerOpen}
        sale={lines.linesDrawerSale}
        managedLines={lines.managedLines}
        loading={lines.linesDrawerLoading}
        error={lines.linesDrawerError}
        editingLineId={lines.editingLineId}
        editLineForm={lines.editLineForm}
        lineOpSubmitting={lines.lineOpSubmitting}
        lineOpError={lines.lineOpError}
        deletingLine={lines.deletingLine}
        addLineExpanded={lines.addLineExpanded}
        addLineForm={lines.addLineForm}
        isWholesaleStoreType={scope.isWholesaleStoreType}
        variantOptions={variants.variantOptions}
        onClose={lines.closeManageLinesDrawer}
        onStartEditLine={lines.startEditLine}
        onRequestDeleteLine={lines.requestDeleteLine}
        onCancelEditLine={lines.cancelEditLine}
        onSubmitEditLine={(lineId) => void lines.submitEditLine(lineId)}
        onEditLineFormChange={(patch) => {
          lines.setLineOpError("");
          lines.setEditLineForm((prev) => ({ ...prev, ...patch }));
        }}
        onToggleAddLineExpanded={() => {
          lines.setAddLineExpanded((prev) => !prev);
          lines.setLineOpError("");
        }}
        onAddLineFormChange={(patch) => {
          lines.setLineOpError("");
          lines.setAddLineForm((prev) => ({ ...prev, ...patch }));
        }}
        onSubmitAddLine={() => void lines.submitAddLine()}
      />

      <ConfirmDialog
        open={lines.deleteLineDialogOpen}
        title="Satiri Sil"
        description="Bu satir silinecek. Bu islem geri alinamaz."
        confirmLabel="Evet, Sil"
        cancelLabel="Vazgec"
        loading={lines.deletingLine}
        loadingLabel="Siliniyor..."
        onConfirm={() => void lines.confirmDeleteLine()}
        onClose={() => {
          if (lines.deletingLine) return;
          lines.setDeleteLineDialogOpen(false);
          lines.setDeleteLineTarget(null);
        }}
      />
    </PageShell>
  );
}
