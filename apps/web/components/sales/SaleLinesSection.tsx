"use client";

import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import { PricingModeField } from "@/components/ui/PricingModeField";
import VariantInfiniteDropdown from "@/components/sales/VariantInfiniteDropdown";
import { formatPrice } from "@/lib/format";
import { calcLineTotal, type SaleLineForm } from "@/components/sales/types";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import { toCurrency } from "@/lib/currency";

const LINE_INPUT_CLASS =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary";

type SaleLinesSectionProps = {
  lines: SaleLineForm[];
  onChangeLine: (rowId: string, patch: Partial<SaleLineForm>) => void;
  onApplyVariantPreset: (rowId: string, variantId: string) => void;
  onAddLine: () => void;
  onRemoveLine: (rowId: string) => void;
  variantOptions: Array<{ value: string; label: string; secondaryLabel?: string }>;
  variantFieldLabel: string;
  variantPlaceholder: string;
  loadingVariants: boolean;
  loadingMoreVariants: boolean;
  variantHasMore: boolean;
  onLoadMoreVariants: () => void;
  linesError?: string;
};

export function SaleLinesSection({
  lines,
  onChangeLine,
  onApplyVariantPreset,
  onAddLine,
  onRemoveLine,
  variantOptions,
  variantFieldLabel,
  variantPlaceholder,
  loadingVariants,
  loadingMoreVariants,
  variantHasMore,
  onLoadMoreVariants,
  linesError,
}: SaleLinesSectionProps) {
  return (
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
                    className={LINE_INPUT_CLASS}
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
                    className={LINE_INPUT_CLASS}
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
                  inputClassName={LINE_INPUT_CLASS}
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
                  inputClassName={LINE_INPUT_CLASS}
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

      <p className="mt-2 text-[11px] text-muted">
        Gosterilen satir toplamlari degiskenlik gosterebilir. Kesin tutar backend tarafinda hesaplanir.
      </p>
      <FieldError error={linesError} className="mt-2 text-xs text-error" />
    </section>
  );
}
