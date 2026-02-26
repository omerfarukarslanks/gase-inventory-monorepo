"use client";

import type { Currency } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { CURRENCY_OPTIONS, type ProductForm, type FormErrors } from "@/components/products/types";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import SupplierInfiniteDropdown from "@/components/products/SupplierInfiniteDropdown";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import ModeToggle from "@/components/ui/ModeToggle";

type ProductDrawerStep1Props = {
  form: ProductForm;
  errors: FormErrors;
  calculatedLineTotal: number | null;
  storeOptions: { value: string; label: string }[];
  categoryOptions: { value: string; label: string }[];
  isStoreScopedUser: boolean;
  productInfoOpen: boolean;
  onToggleProductInfo: () => void;
  storeScopeOpen: boolean;
  onToggleStoreScope: () => void;
  formError: string;
  onFormChange: (field: keyof ProductForm, value: string) => void;
  onFormPatch: (patch: Partial<ProductForm>) => void;
  onClearError: (field: keyof FormErrors) => void;
};

export default function ProductDrawerStep1({
  form,
  errors,
  calculatedLineTotal,
  storeOptions,
  categoryOptions,
  isStoreScopedUser,
  productInfoOpen,
  onToggleProductInfo,
  storeScopeOpen,
  onToggleStoreScope,
  formError,
  onFormChange,
  onFormPatch,
  onClearError,
}: ProductDrawerStep1Props) {
  return (
    <>
      {/* Step indicator */}
      <div className="flex gap-2 mb-2">
        <div className="h-1 flex-1 rounded-full bg-primary" />
        <div className="h-1 flex-1 rounded-full bg-border" />
      </div>

      {!isStoreScopedUser && (
        <CollapsiblePanel
          title="Magaza Kapsami"
          open={storeScopeOpen}
          onToggle={onToggleStoreScope}
          toggleAriaLabel={storeScopeOpen ? "Magaza kapsamini daralt" : "Magaza kapsamini genislet"}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2.5">
              <span className="text-xs font-semibold text-muted">Tum Magazalara Uygula</span>
              <ToggleSwitch
                checked={form.applyToAllStores}
                onChange={(checked) => {
                  onClearError("storeIds");
                  onFormPatch({
                    applyToAllStores: checked,
                    storeIds: checked ? [] : form.storeIds,
                  });
                }}
              />
            </div>

            {!form.applyToAllStores && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Magaza Secimi *</label>
                <SearchableMultiSelectDropdown
                  options={storeOptions}
                  values={form.storeIds}
                  onChange={(values) => {
                    onClearError("storeIds");
                    onFormPatch({ storeIds: values });
                  }}
                  placeholder="Magaza secin"
                />
                {errors.storeIds && (
                  <p className="text-xs text-error">{errors.storeIds}</p>
                )}
              </div>
            )}
          </div>
        </CollapsiblePanel>
      )}

      <CollapsiblePanel
        title="Urun Bilgileri"
        open={productInfoOpen}
        onToggle={onToggleProductInfo}
        toggleAriaLabel={productInfoOpen ? "Urun bilgilerini daralt" : "Urun bilgilerini genislet"}
      >
        <div className="space-y-4">
          <InputField
            label="Urun Adi *"
            type="text"
            value={form.name}
            onChange={(v) => onFormChange("name", v)}
            placeholder="Basic Pantolon"
            error={errors.name}
          />

          <InputField
            label="SKU *"
            type="text"
            value={form.sku}
            onChange={(v) => onFormChange("sku", v)}
            placeholder="Pantolon-BASIC"
            error={errors.sku}
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Urun Kategorisi</label>
            <SearchableDropdown
              options={categoryOptions}
              value={form.categoryId}
              onChange={(v) => onFormChange("categoryId", v)}
              placeholder="Kategori secin"
              emptyOptionLabel="Kategori Yok"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Tedarikci</label>
            <SupplierInfiniteDropdown
              value={form.supplierId}
              onChange={(v) => onFormChange("supplierId", v)}
              placeholder="Tedarikci secin"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Aciklama</label>
            <textarea
              value={form.description}
              onChange={(e) => onFormChange("description", e.target.value)}
              className="min-h-[80px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              placeholder="Pamuklu basic pantolon"
            />
          </div>

          <InputField
            label="Gorsel URL"
            type="text"
            value={form.image}
            onChange={(v) => onFormChange("image", v)}
            placeholder="https://example.com/image.jpg"
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Para Birimi</label>
            <SearchableDropdown
              options={CURRENCY_OPTIONS}
              value={form.currency}
              onChange={(v) => onFormChange("currency", (v || "TRY") as Currency)}
              placeholder="Para birimi secin"
              showEmptyOption={false}
              allowClear={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Birim Satis Fiyati *"
              type="text"
              value={form.unitPrice}
              onChange={(v) => onFormChange("unitPrice", v)}
              placeholder="499.90"
              error={errors.unitPrice}
            />
            <InputField
              label="Alis Fiyati *"
              type="text"
              value={form.purchasePrice}
              onChange={(v) => onFormChange("purchasePrice", v)}
              placeholder="200.00"
              error={errors.purchasePrice}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Vergi</label>
              <div className="flex items-center gap-2">
                <ModeToggle
                  mode={form.taxMode}
                  onToggle={(mode) => {
                    onClearError("lineTotal");
                    onFormPatch({ taxMode: mode, taxPercent: "", taxAmount: "" });
                  }}
                />
                <input
                  type="text"
                  value={form.taxMode === "percent" ? form.taxPercent : form.taxAmount}
                  onChange={(e) =>
                    onFormChange(
                      form.taxMode === "percent" ? "taxPercent" : "taxAmount",
                      e.target.value,
                    )
                  }
                  placeholder={form.taxMode === "percent" ? "% 20" : "100.00"}
                  className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {(form.taxMode === "percent" ? errors.taxPercent : errors.taxAmount) && (
                <p className="text-xs text-error">
                  {form.taxMode === "percent" ? errors.taxPercent : errors.taxAmount}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Indirim</label>
              <div className="flex items-center gap-2">
                <ModeToggle
                  mode={form.discountMode}
                  onToggle={(mode) => {
                    onClearError("lineTotal");
                    onFormPatch({ discountMode: mode, discountPercent: "", discountAmount: "" });
                  }}
                />
                <input
                  type="text"
                  value={form.discountMode === "percent" ? form.discountPercent : form.discountAmount}
                  onChange={(e) =>
                    onFormChange(
                      form.discountMode === "percent" ? "discountPercent" : "discountAmount",
                      e.target.value,
                    )
                  }
                  placeholder={form.discountMode === "percent" ? "% 0" : "0.00"}
                  className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              {(form.discountMode === "percent" ? errors.discountPercent : errors.discountAmount) && (
                <p className="text-xs text-error">
                  {form.discountMode === "percent" ? errors.discountPercent : errors.discountAmount}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Satir Toplami (Otomatik)</label>
            <div className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none flex items-center">
              {calculatedLineTotal == null ? "-" : formatPrice(calculatedLineTotal)}
            </div>
            {errors.lineTotal && <p className="text-xs text-error">{errors.lineTotal}</p>}
          </div>
        </div>
      </CollapsiblePanel>

      {formError && <p className="text-sm text-error">{formError}</p>}
    </>
  );
}
