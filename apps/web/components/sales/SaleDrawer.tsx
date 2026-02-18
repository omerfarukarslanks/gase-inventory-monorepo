"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ModeToggle from "@/components/ui/ModeToggle";
import { formatPrice } from "@/lib/format";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import { calcLineTotal, type SaleLineForm, type FieldErrors } from "@/components/sales/types";
import VariantInfiniteDropdown from "@/components/sales/VariantInfiniteDropdown";
import type { Currency } from "@/lib/products";

type SaleDrawerProps = {
  open: boolean;
  submitting: boolean;
  scopeReady: boolean;
  loadingVariants: boolean;
  isStoreScopedUser: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  variantOptions: Array<{ value: string; label: string }>;
  loadingMoreVariants: boolean;
  variantHasMore: boolean;
  onLoadMoreVariants: () => void;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  name: string;
  onNameChange: (value: string) => void;
  surname: string;
  onSurnameChange: (value: string) => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
  source: string;
  onSourceChange: (value: string) => void;
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
  submitting,
  scopeReady,
  loadingVariants,
  isStoreScopedUser,
  storeOptions,
  variantOptions,
  loadingMoreVariants,
  variantHasMore,
  onLoadMoreVariants,
  storeId,
  onStoreIdChange,
  name,
  onNameChange,
  surname,
  onSurnameChange,
  phoneNumber,
  onPhoneNumberChange,
  email,
  onEmailChange,
  source,
  onSourceChange,
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
      title="Yeni Satis"
      description="Satis akisini buradan tamamlayabilirsiniz."
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
            label={submitting ? "Kaydediliyor..." : "Satisi Kaydet"}
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
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Ad *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  onClearError("name");
                  onNameChange(e.target.value);
                }}
                className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Soyad *</label>
              <input
                type="text"
                value={surname}
                onChange={(e) => {
                  onClearError("surname");
                  onSurnameChange(e.target.value);
                }}
                className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              {errors.surname && <p className="mt-1 text-xs text-error">{errors.surname}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Telefon</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => onPhoneNumberChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Kaynak</label>
              <input
                type="text"
                value={source}
                onChange={(e) => onSourceChange(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
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
