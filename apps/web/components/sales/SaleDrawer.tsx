"use client";

import { useEffect, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ModeToggle from "@/components/ui/ModeToggle";
import { formatPrice } from "@/lib/format";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import {
  calcLineTotal,
  PAYMENT_METHOD_OPTIONS,
  type SaleLineForm,
  type FieldErrors,
} from "@/components/sales/types";
import VariantInfiniteDropdown from "@/components/sales/VariantInfiniteDropdown";
import CustomerInfinityDropdown from "@/components/sales/CustomerInfinityDropdown";
import type { Currency } from "@/lib/products";
import type { CreateCustomerRequest, Customer, CustomerGender } from "@/lib/customers";
import type { PaymentMethod } from "@/lib/sales";

type SaleDrawerProps = {
  open: boolean;
  editMode: boolean;
  submitting: boolean;
  scopeReady: boolean;
  loadingVariants: boolean;
  isStoreScopedUser: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  customerId: string;
  onCustomerIdChange: (value: string) => void;
  onCustomerSelected: (customer: Customer) => void;
  customerDropdownRefreshKey: number;
  onQuickCreateCustomer: (payload: CreateCustomerRequest) => Promise<Customer>;
  variantOptions: Array<{ value: string; label: string }>;
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

type QuickCustomerForm = {
  name: string;
  surname: string;
  address: string;
  country: string;
  city: string;
  district: string;
  phoneNumber: string;
  email: string;
  gender: string;
  birthDate: string;
};

const EMPTY_QUICK_CUSTOMER_FORM: QuickCustomerForm = {
  name: "",
  surname: "",
  address: "",
  country: "",
  city: "",
  district: "",
  phoneNumber: "",
  email: "",
  gender: "",
  birthDate: "",
};

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function SaleDrawer({
  open,
  editMode,
  submitting,
  scopeReady,
  loadingVariants,
  isStoreScopedUser,
  storeOptions,
  customerId,
  onCustomerIdChange,
  onCustomerSelected,
  customerDropdownRefreshKey,
  onQuickCreateCustomer,
  variantOptions,
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
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [quickCreateSubmitting, setQuickCreateSubmitting] = useState(false);
  const [quickCreateError, setQuickCreateError] = useState("");
  const [quickForm, setQuickForm] = useState<QuickCustomerForm>(EMPTY_QUICK_CUSTOMER_FORM);

  useEffect(() => {
    if (open) return;
    setQuickCreateOpen(false);
    setQuickCreateError("");
    setQuickForm(EMPTY_QUICK_CUSTOMER_FORM);
  }, [open]);

  const onChangeQuickField = (field: keyof QuickCustomerForm, value: string) => {
    if (quickCreateError) setQuickCreateError("");
    setQuickForm((prev) => ({ ...prev, [field]: value }));
  };

  const onCloseQuickCreate = () => {
    if (quickCreateSubmitting) return;
    setQuickCreateOpen(false);
    setQuickCreateError("");
    setQuickForm(EMPTY_QUICK_CUSTOMER_FORM);
  };

  const onSubmitQuickCreate = async () => {
    if (!quickForm.name.trim() || !quickForm.surname.trim()) {
      setQuickCreateError("Isim ve soyisim zorunludur.");
      return;
    }

    setQuickCreateSubmitting(true);
    setQuickCreateError("");
    try {
      const created = await onQuickCreateCustomer({
        name: quickForm.name.trim(),
        surname: quickForm.surname.trim(),
        address: quickForm.address.trim() || undefined,
        country: quickForm.country.trim() || undefined,
        city: quickForm.city.trim() || undefined,
        district: quickForm.district.trim() || undefined,
        phoneNumber: quickForm.phoneNumber.trim() || undefined,
        email: quickForm.email.trim() || undefined,
        gender: (quickForm.gender || undefined) as CustomerGender | undefined,
        birthDate: quickForm.birthDate || undefined,
      });

      onCustomerIdChange(created.id);
      onCustomerSelected(created);
      onClearError("customerId");
      setQuickCreateOpen(false);
      setQuickCreateError("");
      setQuickForm(EMPTY_QUICK_CUSTOMER_FORM);
    } catch {
      setQuickCreateError("Musteri olusturulamadi. Lutfen tekrar deneyin.");
    } finally {
      setQuickCreateSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="top"
      title={editMode ? "Satisi Duzenle" : "Yeni Satis"}
      description={editMode ? "Satis fisini buradan guncelleyebilirsiniz." : "Satis akisini buradan tamamlayabilirsiniz."}
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
            disabled={!scopeReady || loadingVariants}
          />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <section className="rounded-xl2 border border-border bg-surface p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {!isStoreScopedUser && (
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
                {errors.storeId && <p className="mt-1 text-xs text-error">{errors.storeId}</p>}
              </div>
            )}

            <div className="md:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-muted">Musteri *</label>
                <button
                  type="button"
                  onClick={() => setQuickCreateOpen((prev) => !prev)}
                  disabled={quickCreateSubmitting}
                  className="rounded-lg border border-border bg-surface2 px-2 py-1 text-[11px] font-semibold text-text2 transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-60"
                >
                  {quickCreateOpen ? "Kapat" : "+ Musteri Ekle"}
                </button>
              </div>

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
              {errors.customerId && <p className="mt-1 text-xs text-error">{errors.customerId}</p>}

              {customerId && (
                <div className="mt-2 rounded-xl border border-border bg-surface2/40 p-2 text-xs text-text2">
                  <div>Ad Soyad: {[name, surname].filter(Boolean).join(" ") || "-"}</div>
                  <div>Telefon: {phoneNumber || "-"}</div>
                  <div>E-posta: {email || "-"}</div>
                </div>
              )}

              {quickCreateOpen && (
                <div className="mt-3 rounded-xl border border-border bg-surface2/40 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Isim *</label>
                      <input
                        type="text"
                        value={quickForm.name}
                        onChange={(e) => onChangeQuickField("name", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Soyisim *</label>
                      <input
                        type="text"
                        value={quickForm.surname}
                        onChange={(e) => onChangeQuickField("surname", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Telefon</label>
                      <input
                        type="text"
                        value={quickForm.phoneNumber}
                        onChange={(e) => onChangeQuickField("phoneNumber", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">E-posta</label>
                      <input
                        type="email"
                        value={quickForm.email}
                        onChange={(e) => onChangeQuickField("email", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Ulke</label>
                      <input
                        type="text"
                        value={quickForm.country}
                        onChange={(e) => onChangeQuickField("country", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Sehir</label>
                      <input
                        type="text"
                        value={quickForm.city}
                        onChange={(e) => onChangeQuickField("city", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Ilce</label>
                      <input
                        type="text"
                        value={quickForm.district}
                        onChange={(e) => onChangeQuickField("district", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Cinsiyet</label>
                      <SearchableDropdown
                        options={GENDER_OPTIONS}
                        value={quickForm.gender}
                        onChange={(value) => onChangeQuickField("gender", value)}
                        placeholder="Cinsiyet secin"
                        emptyOptionLabel="Cinsiyet secin"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Dogum Tarihi</label>
                      <input
                        type="date"
                        value={quickForm.birthDate}
                        onChange={(e) => onChangeQuickField("birthDate", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-muted">Adres</label>
                      <input
                        type="text"
                        value={quickForm.address}
                        onChange={(e) => onChangeQuickField("address", e.target.value)}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {quickCreateError && <p className="mt-2 text-xs text-error">{quickCreateError}</p>}

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <Button
                      label="Vazgec"
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                      onClick={onCloseQuickCreate}
                      disabled={quickCreateSubmitting}
                    />
                    <Button
                      label={quickCreateSubmitting ? "Ekleniyor..." : "Musteri Ekle"}
                      variant="primarySolid"
                      className="px-2 py-1 text-xs"
                      onClick={onSubmitQuickCreate}
                      disabled={quickCreateSubmitting}
                    />
                  </div>
                </div>
              )}
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
                  {errors.paymentMethod && <p className="mt-1 text-xs text-error">{errors.paymentMethod}</p>}
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
                  {errors.initialPaymentAmount && (
                    <p className="mt-1 text-xs text-error">{errors.initialPaymentAmount}</p>
                  )}
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
                      <label className="mb-1 block text-xs font-semibold text-muted">Varyant *</label>
                      <VariantInfiniteDropdown
                        options={variantOptions}
                        value={line.productVariantId}
                        onChange={(value) => onApplyVariantPreset(line.rowId, value)}
                        placeholder="Varyant secin"
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
                        onChange={(value) => onChangeLine(line.rowId, { currency: (value || "TRY") as Currency })}
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

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Indirim</label>
                      <div className="flex items-center gap-2">
                        <ModeToggle
                          mode={line.discountMode}
                          onToggle={(mode) =>
                            onChangeLine(line.rowId, {
                              discountMode: mode,
                              discountPercent: "",
                              discountAmount: "",
                            })
                          }
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.discountMode === "percent" ? line.discountPercent : line.discountAmount}
                          onChange={(e) =>
                            onChangeLine(
                              line.rowId,
                              line.discountMode === "percent"
                                ? { discountPercent: e.target.value }
                                : { discountAmount: e.target.value },
                            )
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Vergi</label>
                      <div className="flex items-center gap-2">
                        <ModeToggle
                          mode={line.taxMode}
                          onToggle={(mode) =>
                            onChangeLine(line.rowId, {
                              taxMode: mode,
                              taxPercent: "",
                              taxAmount: "",
                            })
                          }
                        />
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.taxMode === "percent" ? line.taxPercent : line.taxAmount}
                          onChange={(e) =>
                            onChangeLine(
                              line.rowId,
                              line.taxMode === "percent"
                                ? { taxPercent: e.target.value }
                                : { taxAmount: e.target.value },
                            )
                          }
                          className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

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

          {errors.lines && <p className="mt-2 text-xs text-error">{errors.lines}</p>}
        </section>

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
