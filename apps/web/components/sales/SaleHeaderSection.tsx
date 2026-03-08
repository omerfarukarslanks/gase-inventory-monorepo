"use client";

import SearchableDropdown from "@/components/ui/SearchableDropdown";
import CustomerInfinityDropdown from "@/components/sales/CustomerInfinityDropdown";
import { FieldError } from "@/components/ui/FieldError";
import { QuickCreateCustomerForm } from "@/components/customers/QuickCreateCustomerForm";
import { PAYMENT_METHOD_OPTIONS, type FieldErrors } from "@/components/sales/types";
import type { CreateCustomerRequest, Customer } from "@/lib/customers";
import type { PaymentMethod } from "@/lib/sales";

type SaleHeaderSectionProps = {
  open: boolean;
  editMode: boolean;
  canTenantOnly: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  onCustomerSelected: (customer: Customer) => void;
  customerDropdownRefreshKey: number;
  onQuickCreateCustomer: (payload: CreateCustomerRequest) => Promise<Customer>;
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
  errors: FieldErrors;
  onClearError: (field: keyof FieldErrors) => void;
};

export function SaleHeaderSection({
  open,
  editMode,
  canTenantOnly,
  storeOptions,
  storeId,
  onStoreIdChange,
  customerId,
  onCustomerIdChange,
  onCustomerSelected,
  customerDropdownRefreshKey,
  onQuickCreateCustomer,
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
  errors,
  onClearError,
}: SaleHeaderSectionProps) {
  return (
    <section className="rounded-xl2 border border-border bg-surface p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {!editMode && canTenantOnly && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Magaza *</label>
            <SearchableDropdown
              options={storeOptions}
              value={storeId}
              onChange={(value) => {
                onClearError("storeId");
                onStoreIdChange(value);
              }}
              placeholder="Magaza secin"
              showEmptyOption={false}
            />
            <FieldError error={errors.storeId} className="mt-1 text-xs text-error" />
          </div>
        )}

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-muted">Musteri *</label>

          <CustomerInfinityDropdown
            value={customerId}
            onChange={(value) => {
              onClearError("customerId");
              onCustomerIdChange(value);
            }}
            onSelectCustomer={onCustomerSelected}
            refreshKey={customerDropdownRefreshKey}
            placeholder="Musteri secin"
          />
          <FieldError error={errors.customerId} className="mt-1 text-xs text-error" />

          {customerId && (
            <div className="mt-2 rounded-xl border border-border bg-surface2/40 p-2 text-xs text-text2">
              <div>Ad Soyad: {[name, surname].filter(Boolean).join(" ") || "-"}</div>
              <div>Telefon: {phoneNumber || "-"}</div>
              <div>E-posta: {email || "-"}</div>
            </div>
          )}

          <QuickCreateCustomerForm
            drawerOpen={open}
            onSuccess={(customer) => {
              onCustomerIdChange(customer.id);
              onCustomerSelected(customer);
              onClearError("customerId");
            }}
            onQuickCreateCustomer={onQuickCreateCustomer}
          />
        </div>

        {!editMode && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Odeme Yontemi *</label>
              <SearchableDropdown
                options={PAYMENT_METHOD_OPTIONS}
                value={paymentMethod}
                onChange={(value) => {
                  onClearError("paymentMethod");
                  onPaymentMethodChange((value || "") as PaymentMethod | "");
                }}
                placeholder="Odeme yontemi secin"
                showEmptyOption={false}
                allowClear={false}
              />
              <FieldError error={errors.paymentMethod} className="mt-1 text-xs text-error" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Odenen Tutar *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={initialPaymentAmount}
                onChange={(e) => {
                  onClearError("initialPaymentAmount");
                  onInitialPaymentAmountChange(e.target.value);
                }}
                className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <FieldError error={errors.initialPaymentAmount} className="mt-1 text-xs text-error" />
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
          <textarea
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            className="min-h-[72px] w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>
    </section>
  );
}
