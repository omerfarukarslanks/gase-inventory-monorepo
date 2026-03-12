"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import type { SaleDetailLine, SaleListItem } from "@/lib/sales";
import type { SaleLineForm, ManagedLineEditForm } from "@/components/sales/types";

type SaleLinesDrawerProps = {
  open: boolean;
  sale: SaleListItem | null;
  managedLines: SaleDetailLine[];
  loading: boolean;
  error: string;
  editingLineId: string | null;
  editLineForm: ManagedLineEditForm;
  lineOpSubmitting: boolean;
  lineOpError: string;
  deletingLine: boolean;
  addLineExpanded: boolean;
  addLineForm: SaleLineForm;
  isWholesaleStoreType: boolean;
  variantOptions: Array<{ value: string; label: string; secondaryLabel?: string }>;
  onClose: () => void;
  onStartEditLine: (line: SaleDetailLine) => void;
  onRequestDeleteLine: (lineId: string) => void;
  onCancelEditLine: () => void;
  onSubmitEditLine: (lineId: string) => void;
  onEditLineFormChange: (patch: Partial<ManagedLineEditForm>) => void;
  onToggleAddLineExpanded: () => void;
  onAddLineFormChange: (patch: Partial<SaleLineForm>) => void;
  onSubmitAddLine: () => void;
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={expanded ? "rotate-180 transition-transform" : "transition-transform"}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function SaleLinesDrawer({
  open,
  sale,
  managedLines,
  loading,
  error,
  editingLineId,
  editLineForm,
  lineOpSubmitting,
  lineOpError,
  deletingLine,
  addLineExpanded,
  addLineForm,
  isWholesaleStoreType,
  variantOptions,
  onClose,
  onStartEditLine,
  onRequestDeleteLine,
  onCancelEditLine,
  onSubmitEditLine,
  onEditLineFormChange,
  onToggleAddLineExpanded,
  onAddLineFormChange,
  onSubmitAddLine,
}: SaleLinesDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Satirlari Yonet"
      description={sale ? `Fis: ${sale.receiptNo ?? sale.id}` : ""}
      closeDisabled={lineOpSubmitting || deletingLine}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button label="Kapat" onClick={onClose} variant="secondary" disabled={lineOpSubmitting || deletingLine} />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">Satirlar yukleniyor...</p>
        ) : error ? (
          <p className="text-sm text-error">{error}</p>
        ) : (
          <>
            <div className="space-y-2">
              {managedLines.length === 0 && (
                <p className="text-sm text-muted">Bu satisa ait satir bulunamadi.</p>
              )}
              {managedLines.map((line) => {
                const isEditing = editingLineId === line.id;
                const lineName = line.productVariantName ?? line.productPackageName ?? line.productName ?? line.id;

                return (
                  <div key={line.id} className="space-y-2 rounded-xl border border-border bg-surface2/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-text">{lineName}</p>
                        <p className="text-xs text-muted">
                          Adet: {line.quantity ?? "-"} · Birim: {line.unitPrice != null ? line.unitPrice : "-"} · Toplam: {line.lineTotal != null ? line.lineTotal : "-"}
                        </p>
                      </div>
                      {!isEditing && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onStartEditLine(line)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Duzenle"
                          >
                            <EditIcon />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestDeleteLine(line.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-error/10 hover:text-error"
                            title="Sil"
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className="space-y-3 border-t border-border pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted">Adet *</label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={editLineForm.quantity}
                              onChange={(event) => onEditLineFormChange({ quantity: event.target.value })}
                              className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted">Birim Fiyat *</label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={editLineForm.unitPrice}
                              onChange={(event) => onEditLineFormChange({ unitPrice: event.target.value })}
                              className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted">
                              {editLineForm.discountMode === "percent" ? "Indirim %" : "Indirim Tutari"}
                              <button
                                type="button"
                                onClick={() =>
                                  onEditLineFormChange({
                                    discountMode: editLineForm.discountMode === "percent" ? "amount" : "percent",
                                  })
                                }
                                className="ml-1 text-primary hover:underline"
                              >
                                ({editLineForm.discountMode === "percent" ? "tutara gec" : "%'ye gec"})
                              </button>
                            </label>
                            {editLineForm.discountMode === "percent" ? (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={editLineForm.discountPercent}
                                onChange={(event) => onEditLineFormChange({ discountPercent: event.target.value })}
                                className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={editLineForm.discountAmount}
                                onChange={(event) => onEditLineFormChange({ discountAmount: event.target.value })}
                                className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted">
                              {editLineForm.taxMode === "percent" ? "Vergi %" : "Vergi Tutari"}
                              <button
                                type="button"
                                onClick={() =>
                                  onEditLineFormChange({
                                    taxMode: editLineForm.taxMode === "percent" ? "amount" : "percent",
                                  })
                                }
                                className="ml-1 text-primary hover:underline"
                              >
                                ({editLineForm.taxMode === "percent" ? "tutara gec" : "%'ye gec"})
                              </button>
                            </label>
                            {editLineForm.taxMode === "percent" ? (
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step="0.01"
                                value={editLineForm.taxPercent}
                                onChange={(event) => onEditLineFormChange({ taxPercent: event.target.value })}
                                className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={editLineForm.taxAmount}
                                onChange={(event) => onEditLineFormChange({ taxAmount: event.target.value })}
                                className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-muted">Kampanya Kodu</label>
                          <input
                            type="text"
                            value={editLineForm.campaignCode}
                            onChange={(event) => onEditLineFormChange({ campaignCode: event.target.value })}
                            className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            label={lineOpSubmitting ? "Kaydediliyor..." : "Kaydet"}
                            onClick={() => onSubmitEditLine(line.id)}
                            variant="primarySolid"
                            loading={lineOpSubmitting}
                          />
                          <Button
                            label="Vazgec"
                            onClick={onCancelEditLine}
                            variant="secondary"
                            disabled={lineOpSubmitting}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-border">
              <button
                type="button"
                onClick={onToggleAddLineExpanded}
                className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-surface2/40"
              >
                <span>Satir Ekle</span>
                <ChevronIcon expanded={addLineExpanded} />
              </button>
              {addLineExpanded && (
                <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted">{isWholesaleStoreType ? "Paket *" : "Varyant *"}</label>
                    <SearchableDropdown
                      options={variantOptions}
                      value={addLineForm.productVariantId}
                      onChange={(value) => onAddLineFormChange({ productVariantId: value ?? "" })}
                      placeholder={isWholesaleStoreType ? "Paket secin" : "Varyant secin"}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted">Adet *</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={addLineForm.quantity}
                        onChange={(event) => onAddLineFormChange({ quantity: event.target.value })}
                        className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted">Birim Fiyat *</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={addLineForm.unitPrice}
                        onChange={(event) => onAddLineFormChange({ unitPrice: event.target.value })}
                        className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted">
                        {addLineForm.discountMode === "percent" ? "Indirim %" : "Indirim Tutari"}
                        <button
                          type="button"
                          onClick={() =>
                            onAddLineFormChange({
                              discountMode: addLineForm.discountMode === "percent" ? "amount" : "percent",
                            })
                          }
                          className="ml-1 text-primary hover:underline"
                        >
                          ({addLineForm.discountMode === "percent" ? "tutara gec" : "%'ye gec"})
                        </button>
                      </label>
                      {addLineForm.discountMode === "percent" ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={addLineForm.discountPercent}
                          onChange={(event) => onAddLineFormChange({ discountPercent: event.target.value })}
                          className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={addLineForm.discountAmount}
                          onChange={(event) => onAddLineFormChange({ discountAmount: event.target.value })}
                          className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted">
                        {addLineForm.taxMode === "percent" ? "Vergi %" : "Vergi Tutari"}
                        <button
                          type="button"
                          onClick={() =>
                            onAddLineFormChange({
                              taxMode: addLineForm.taxMode === "percent" ? "amount" : "percent",
                            })
                          }
                          className="ml-1 text-primary hover:underline"
                        >
                          ({addLineForm.taxMode === "percent" ? "tutara gec" : "%'ye gec"})
                        </button>
                      </label>
                      {addLineForm.taxMode === "percent" ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="0.01"
                          value={addLineForm.taxPercent}
                          onChange={(event) => onAddLineFormChange({ taxPercent: event.target.value })}
                          className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={addLineForm.taxAmount}
                          onChange={(event) => onAddLineFormChange({ taxAmount: event.target.value })}
                          className="h-9 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </div>
                  </div>
                  <Button
                    label={lineOpSubmitting ? "Ekleniyor..." : "Satiri Ekle"}
                    onClick={onSubmitAddLine}
                    variant="primarySolid"
                    loading={lineOpSubmitting}
                  />
                </div>
              )}
            </div>

            {lineOpError && <p className="text-sm text-error">{lineOpError}</p>}
          </>
        )}
      </div>
    </Drawer>
  );
}
