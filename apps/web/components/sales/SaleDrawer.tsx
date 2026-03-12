"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { SaleHeaderSection } from "@/components/sales/SaleHeaderSection";
import { SaleLinesSection } from "@/components/sales/SaleLinesSection";
import type { SaleLineForm, FieldErrors } from "@/components/sales/types";
import type { CreateCustomerRequest, Customer } from "@/lib/customers";
import type { PaymentMethod } from "@/lib/sales";

type SaleDrawerProps = {
  open: boolean;
  editMode: boolean;
  submitting: boolean;
  scopeReady: boolean;
  loadingVariants: boolean;
  canTenantOnly: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  onCustomerSelected: (customer: Customer) => void;
  customerDropdownRefreshKey: number;
  onQuickCreateCustomer: (payload: CreateCustomerRequest) => Promise<Customer>;
  variantOptions: Array<{ value: string; label: string; secondaryLabel?: string }>;
  variantFieldLabel?: string;
  variantPlaceholder?: string;
  loadingMoreVariants: boolean;
  variantHasMore: boolean;
  onLoadMoreVariants: () => void;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  name: string;
  surname: string;
  phoneNumber: string;
  email: string;
  paymentMethod: PaymentMethod | "";
  onPaymentMethodChange: (value: PaymentMethod | "") => void;
  initialPaymentAmount: string;
  onInitialPaymentAmountChange: (value: string) => void;
  note: string;
  onNoteChange: (value: string) => void;
  lines: SaleLineForm[];
  onChangeLine: (rowId: string, patch: Partial<SaleLineForm>) => void;
  onApplyVariantPreset: (rowId: string, variantId: string) => void;
  onAddLine: () => void;
  onRemoveLine: (rowId: string) => void;
  errors: FieldErrors;
  onClearError: (field: keyof FieldErrors) => void;
  formError: string;
  success: string;
  onClose: () => void;
  onSubmit: () => void;
};

export default function SaleDrawer({
  open,
  editMode,
  submitting,
  scopeReady,
  loadingVariants,
  canTenantOnly,
  storeOptions,
  customerId,
  onCustomerIdChange,
  onCustomerSelected,
  customerDropdownRefreshKey,
  onQuickCreateCustomer,
  variantOptions,
  variantFieldLabel = "Varyant *",
  variantPlaceholder = "Varyant secin",
  loadingMoreVariants,
  variantHasMore,
  onLoadMoreVariants,
  storeId,
  onStoreIdChange,
  name,
  surname,
  phoneNumber,
  email,
  paymentMethod,
  onPaymentMethodChange,
  initialPaymentAmount,
  onInitialPaymentAmountChange,
  note,
  onNoteChange,
  lines,
  onChangeLine,
  onApplyVariantPreset,
  onAddLine,
  onRemoveLine,
  errors,
  onClearError,
  formError,
  success,
  onClose,
  onSubmit,
}: SaleDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="top"
      title={editMode ? "Satisi Duzenle" : "Yeni Satis"}
      description={
        editMode
          ? "Bu ekranda sadece musteri ve not bilgisi guncellenir."
          : "Satis akisini buradan tamamlayabilirsiniz."
      }
      closeDisabled={submitting}
      className="!max-h-[90vh]"
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Iptal"
            onClick={onClose}
            variant="secondary"
            className="px-3 py-1.5"
            disabled={submitting}
          />
          <Button
            label={submitting ? "Kaydediliyor..." : editMode ? "Guncelle" : "Satisi Kaydet"}
            onClick={onSubmit}
            loading={submitting}
            variant="primarySolid"
            className="px-3 py-1.5"
            disabled={!scopeReady || (!editMode && loadingVariants)}
          />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <SaleHeaderSection
          open={open}
          editMode={editMode}
          canTenantOnly={canTenantOnly}
          storeOptions={storeOptions}
          storeId={storeId}
          onStoreIdChange={onStoreIdChange}
          customerId={customerId}
          onCustomerIdChange={onCustomerIdChange}
          onCustomerSelected={onCustomerSelected}
          customerDropdownRefreshKey={customerDropdownRefreshKey}
          onQuickCreateCustomer={onQuickCreateCustomer}
          name={name}
          surname={surname}
          phoneNumber={phoneNumber}
          email={email}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={onPaymentMethodChange}
          initialPaymentAmount={initialPaymentAmount}
          onInitialPaymentAmountChange={onInitialPaymentAmountChange}
          note={note}
          onNoteChange={onNoteChange}
          errors={errors}
          onClearError={onClearError}
        />

        {!editMode && (
          <SaleLinesSection
            lines={lines}
            onChangeLine={onChangeLine}
            onApplyVariantPreset={onApplyVariantPreset}
            onAddLine={onAddLine}
            onRemoveLine={onRemoveLine}
            variantOptions={variantOptions}
            variantFieldLabel={variantFieldLabel}
            variantPlaceholder={variantPlaceholder}
            loadingVariants={loadingVariants}
            loadingMoreVariants={loadingMoreVariants}
            variantHasMore={variantHasMore}
            onLoadMoreVariants={onLoadMoreVariants}
            linesError={errors.lines}
          />
        )}

        {(formError || success) && (
          <div className="rounded-xl border border-border bg-surface p-3">
            {formError && <p className="text-sm text-error">{formError}</p>}
            {success && <p className="text-sm text-primary">{success}</p>}
          </div>
        )}
      </div>
    </Drawer>
  );
}
