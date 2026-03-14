"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { CURRENCY_OPTIONS } from "@/components/products/types";
import { PAYMENT_METHOD_OPTIONS } from "@/components/sales/types";
import type { Currency } from "@/lib/products";
import type { PaymentMethod } from "@/lib/sales";

type SalePaymentDrawerProps = {
  open: boolean;
  editingPaymentId: string | null;
  paymentSubmitting: boolean;
  paymentAmount: string;
  paymentPaidAtInput: string;
  paymentMethodInput: PaymentMethod;
  paymentCurrency: Currency;
  paymentNoteInput: string;
  paymentFormError: string;
  onClose: () => void;
  onSubmit: () => void;
  onPaymentAmountChange: (value: string) => void;
  onPaymentPaidAtInputChange: (value: string) => void;
  onPaymentMethodInputChange: (value: string) => void;
  onPaymentCurrencyChange: (value: string) => void;
  onPaymentNoteInputChange: (value: string) => void;
};

export default function SalePaymentDrawer({
  open,
  editingPaymentId,
  paymentSubmitting,
  paymentAmount,
  paymentPaidAtInput,
  paymentMethodInput,
  paymentCurrency,
  paymentNoteInput,
  paymentFormError,
  onClose,
  onSubmit,
  onPaymentAmountChange,
  onPaymentPaidAtInputChange,
  onPaymentMethodInputChange,
  onPaymentCurrencyChange,
  onPaymentNoteInputChange,
}: SalePaymentDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingPaymentId ? "Odeme Guncelle" : "Odeme Ekle"}
      description="Satis fisine odeme adimi ekleyin veya duzenleyin."
      closeDisabled={paymentSubmitting}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label="Iptal"
            onClick={onClose}
            variant="secondary"
            disabled={paymentSubmitting}
          />
          <Button
            label={paymentSubmitting ? "Kaydediliyor..." : "Kaydet"}
            onClick={onSubmit}
            variant="primarySolid"
            loading={paymentSubmitting}
          />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Tutar *</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={paymentAmount}
            onChange={(event) => onPaymentAmountChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Odeme Tarihi</label>
          <input
            type="date"
            value={paymentPaidAtInput}
            onChange={(event) => onPaymentPaidAtInputChange(event.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Odeme Yontemi *</label>
          <SearchableDropdown
            options={PAYMENT_METHOD_OPTIONS}
            value={paymentMethodInput}
            onChange={onPaymentMethodInputChange}
            placeholder="Odeme yontemi secin"
            showEmptyOption={false}
            allowClear={false}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Para Birimi *</label>
          <SearchableDropdown
            options={CURRENCY_OPTIONS}
            value={paymentCurrency}
            onChange={onPaymentCurrencyChange}
            showEmptyOption={false}
            allowClear={false}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted">Not</label>
          <textarea
            value={paymentNoteInput}
            onChange={(event) => onPaymentNoteInputChange(event.target.value)}
            className="min-h-22 w-full rounded-xl border border-border bg-surface2 px-3 py-2 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        {paymentFormError && <p className="text-sm text-error">{paymentFormError}</p>}
      </div>
    </Drawer>
  );
}
