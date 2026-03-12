"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import type { SaleListItem } from "@/lib/sales";
import type { ReturnLineForm } from "@/components/sales/types";

type SaleReturnDrawerProps = {
  open: boolean;
  returnTargetSale: SaleListItem | null;
  returnSubmitting: boolean;
  returnDetailLoading: boolean;
  returnLines: ReturnLineForm[];
  returnNotes: string;
  returnFormError: string;
  onClose: () => void;
  onSubmit: () => void;
  onReturnModeChange: (lineIndex: number, value: "quantity" | "variants") => void;
  onReturnQuantityChange: (lineIndex: number, value: string) => void;
  onRefundAmountChange: (lineIndex: number, value: string) => void;
  onPackageVariantReturnQuantityChange: (lineIndex: number, variantIndex: number, value: string) => void;
  onReturnNotesChange: (value: string) => void;
};

export default function SaleReturnDrawer({
  open,
  returnTargetSale,
  returnSubmitting,
  returnDetailLoading,
  returnLines,
  returnNotes,
  returnFormError,
  onClose,
  onSubmit,
  onReturnModeChange,
  onReturnQuantityChange,
  onRefundAmountChange,
  onPackageVariantReturnQuantityChange,
  onReturnNotesChange,
}: SaleReturnDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Iade Olustur"
      description={
        returnTargetSale
          ? `Fis: ${returnTargetSale.receiptNo ?? returnTargetSale.id}`
          : "Iade edilecek satirlari ve adetleri secin."
      }
      closeDisabled={returnSubmitting}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Iptal"
            onClick={onClose}
            variant="secondary"
            disabled={returnSubmitting}
          />
          <Button
            label={returnSubmitting ? "Gonderiliyor..." : "Iadeyi Onayla"}
            onClick={onSubmit}
            variant="primarySolid"
            loading={returnSubmitting}
          />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {returnDetailLoading ? (
          <p className="text-sm text-muted">Satis satirlari yukleniyor...</p>
        ) : returnLines.length === 0 && !returnFormError ? (
          <p className="text-sm text-muted">Bu satisa ait satir bulunamadi.</p>
        ) : (
          <>
            <div className="space-y-3">
              {returnLines.map((line, idx) => (
                <div
                  key={line.saleLineId}
                  className="space-y-2 rounded-xl border border-border bg-surface2/40 p-3"
                >
                  <p className="text-sm font-medium text-text">
                    {line.lineName}
                    {!line.isPackageLine && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        (Satılan: {line.originalQuantity}
                        {line.returnedQuantity > 0 && `, İade: ${line.returnedQuantity}`})
                      </span>
                    )}
                    {line.isPackageLine && (
                      <span className="ml-2 text-xs font-normal text-muted">
                        ({line.completePackagesRemaining ?? 0} tam paket
                        {line.partialPackage?.exists && `, ${line.partialPackage.incompletePackageCount ?? 1} eksik paket`})
                      </span>
                    )}
                  </p>

                  {line.isPackageLine && line.partialPackage?.exists && (
                    <div className="space-y-1 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
                      <p className="text-xs font-semibold text-warning">Eksik Paket</p>
                      {line.partialPackage.presentVariants.length > 0 && (
                        <p className="text-xs text-muted">
                          <span className="font-medium text-text">Mevcut:</span>{" "}
                          {line.partialPackage.presentVariants.join(", ")}
                        </p>
                      )}
                      {line.partialPackage.missingVariants.length > 0 && (
                        <p className="text-xs text-muted">
                          <span className="font-medium text-text">Eksik:</span>{" "}
                          {line.partialPackage.missingVariants.join(", ")}
                        </p>
                      )}
                    </div>
                  )}

                  {line.isPackageLine && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onReturnModeChange(idx, "quantity")}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
                          line.returnMode === "quantity"
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface2 text-muted"
                        }`}
                      >
                        Tam Paket (Adet)
                      </button>
                      <button
                        type="button"
                        onClick={() => onReturnModeChange(idx, "variants")}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-colors ${
                          line.returnMode === "variants"
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface2 text-muted"
                        }`}
                      >
                        Varyant Bazli
                      </button>
                    </div>
                  )}

                  {(!line.isPackageLine || line.returnMode === "quantity") && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">
                          {line.isPackageLine
                            ? `Iade Adedi (maks. ${line.completePackagesRemaining ?? line.originalQuantity})`
                            : `Iade Adedi (maks. ${line.originalQuantity - line.returnedQuantity})`}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={
                            line.isPackageLine
                              ? (line.completePackagesRemaining ?? line.originalQuantity)
                              : line.originalQuantity - line.returnedQuantity
                          }
                          step={1}
                          value={line.returnQuantity}
                          onChange={(event) => onReturnQuantityChange(idx, event.target.value)}
                          placeholder="0"
                          className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">
                          Iade Tutari (opsiyonel)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.refundAmount}
                          onChange={(event) => onRefundAmountChange(idx, event.target.value)}
                          placeholder="0.00"
                          className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  {line.isPackageLine && line.returnMode === "variants" && (
                    <div className="space-y-2">
                      {line.packageVariantReturns.length === 0 ? (
                        <p className="text-xs text-muted">Bu paket icin varyant bilgisi bulunamadi.</p>
                      ) : (
                        line.packageVariantReturns.map((variant, variantIndex) => (
                          <div key={variant.productVariantId} className="flex items-center gap-2">
                            <span className="flex-1 truncate text-xs text-text">
                              {variant.name}
                              {variant.qtyPerPackage != null && (
                                <span className="ml-1 font-normal text-muted">(x{variant.qtyPerPackage})</span>
                              )}
                              {variant.remaining != null && (
                                <span className="ml-1 text-xs font-normal text-muted">(kalan: {variant.remaining})</span>
                              )}
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={variant.remaining ?? undefined}
                              step={1}
                              value={variant.returnQuantity}
                              onChange={(event) =>
                                onPackageVariantReturnQuantityChange(idx, variantIndex, event.target.value)
                              }
                              placeholder="0"
                              className="h-9 w-24 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        ))
                      )}
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-semibold text-muted">
                          Iade Tutari (opsiyonel)
                        </label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.refundAmount}
                          onChange={(event) => onRefundAmountChange(idx, event.target.value)}
                          placeholder="0.00"
                          className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Notlar</label>
              <textarea
                value={returnNotes}
                onChange={(event) => onReturnNotesChange(event.target.value)}
                placeholder="Iade nedeni veya ek aciklama..."
                className="min-h-20 w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </>
        )}

        {returnFormError && <p className="text-sm text-error">{returnFormError}</p>}
      </div>
    </Drawer>
  );
}
