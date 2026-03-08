"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { formatPrice } from "@/lib/format";
import { PricingModeField } from "@/components/ui/PricingModeField";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import {
  calcLineTotal,
  PAYMENT_METHOD_OPTIONS,
  type SaleLineForm,
  type FieldErrors,
} from "@/components/sales/types";
import VariantInfiniteDropdown from "@/components/sales/VariantInfiniteDropdown";
import CustomerInfinityDropdown from "@/components/sales/CustomerInfinityDropdown";
import { toCurrency } from "@/lib/currency";
import { FieldError } from "@/components/ui/FieldError";
import type { CreateCustomerRequest, Customer } from "@/lib/customers";
import type { PaymentMethod } from "@/lib/sales";
import { QuickCreateCustomerForm } from "@/components/customers/QuickCreateCustomerForm";

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

        {!editMode && (
          <section className="rounded-xl2 border border-border bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text">Satis Satirlari</h2>
              <Button label="+ Satir Ekle" onClick={onAddLine} variant="secondary" className="px-3 py-1.5" />
            </div>

            {loadingVariants ? (
              <p className="text-sm text-muted">Varyantlar yukleniyor...</p>
            ) : (
              <div className="space-y-3">
                {lines.map((line, index) => (
                  <div key={line.rowId} className="rounded-xl border border-border bg-surface2/40 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted">Satir #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveLine(line.rowId)}
                        className="text-xs cursor-pointer text-error hover:text-error/80"
                        disabled={lines.length <= 1}
                      >
                        Kaldir
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="lg:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-muted">{variantFieldLabel}</label>
                        <VariantInfiniteDropdown
                          options={variantOptions}
                          value={line.productVariantId}
                          onChange={(value) => onApplyVariantPreset(line.rowId, value)}
                          placeholder={variantPlaceholder}
                          loading={loadingVariants}
                          loadingMore={loadingMoreVariants}
                          hasMore={variantHasMore}
                          onLoadMore={onLoadMoreVariants}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">Adet *</label>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => onChangeLine(line.rowId, { quantity: e.target.value })}
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">Para Birimi *</label>
                        <SearchableDropdown
                          options={CURRENCY_OPTIONS}
                          value={line.currency}
                          onChange={(value) => onChangeLine(line.rowId, { currency: toCurrency(value) })}
                          showEmptyOption={false}
                          allowClear={false}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">Birim Fiyat *</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => onChangeLine(line.rowId, { unitPrice: e.target.value })}
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <PricingModeField
                        label="Indirim"
                        mode={line.discountMode}
                        value={line.discountMode === "percent" ? line.discountPercent : line.discountAmount}
                        onToggle={(mode) =>
                          onChangeLine(line.rowId, {
                            discountMode: mode,
                            discountPercent: "",
                            discountAmount: "",
                          })
                        }
                        onValueChange={(v) =>
                          onChangeLine(
                            line.rowId,
                            line.discountMode === "percent"
                              ? { discountPercent: v }
                              : { discountAmount: v },
                          )
                        }
                        inputType="number"
                        inputClassName="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />

                      <PricingModeField
                        label="Vergi"
                        mode={line.taxMode}
                        value={line.taxMode === "percent" ? line.taxPercent : line.taxAmount}
                        onToggle={(mode) =>
                          onChangeLine(line.rowId, {
                            taxMode: mode,
                            taxPercent: "",
                            taxAmount: "",
                          })
                        }
                        onValueChange={(v) =>
                          onChangeLine(
                            line.rowId,
                            line.taxMode === "percent"
                              ? { taxPercent: v }
                              : { taxAmount: v },
                          )
                        }
                        inputType="number"
                        inputClassName="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-muted">Satir Toplami (Otomatik)</label>
                        <div className="flex h-10 items-center rounded-xl border border-border bg-surface px-3 text-sm text-text2">
                          {formatPrice(calcLineTotal(line))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-2 text-[11px] text-muted">Gosterilen satir toplamlari degiskenlik gosterebilir. Kesin tutar backend tarafinda hesaplanir.</p>
            <FieldError error={errors.lines} className="mt-2 text-xs text-error" />
          </section>
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
