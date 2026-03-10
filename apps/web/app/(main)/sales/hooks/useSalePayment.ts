"use client";
import { useState } from "react";
import {
  createSalePayment,
  updateSalePayment,
  deleteSalePayment,
  type PaymentMethod,
  type SalePayment,
} from "@/lib/sales";
import type { Currency } from "@/lib/products";
import { toNumberOrNull } from "@/lib/format";

type Options = {
  onRefreshPayments: (saleId: string, force?: boolean) => Promise<void>;
  onRefreshList: () => Promise<void>;
  onSuccess: (message: string) => void;
};

function normalizePaymentMethod(value?: string | null): PaymentMethod {
  if (value === "CASH" || value === "CARD" || value === "TRANSFER" || value === "OTHER") {
    return value;
  }
  return "OTHER";
}

function normalizeCurrency(value?: string | null): Currency {
  if (value === "TRY" || value === "USD" || value === "EUR") return value;
  return "TRY";
}

function normalizePaidAtInput(value?: string | null): string {
  if (!value) return "";
  const directDate = value.match(/^(\d{4}-\d{2}-\d{2})/);
  if (directDate) return directDate[1];
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function useSalePayment({ onRefreshPayments, onRefreshList, onSuccess }: Options) {
  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentDrawerSaleId, setPaymentDrawerSaleId] = useState("");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPaidAtInput, setPaymentPaidAtInput] = useState("");
  const [paymentMethodInput, setPaymentMethodInput] = useState<PaymentMethod>("CASH");
  const [paymentCurrency, setPaymentCurrency] = useState<Currency>("TRY");
  const [paymentNoteInput, setPaymentNoteInput] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentFormError, setPaymentFormError] = useState("");
  const [paymentDeleteDialogOpen, setPaymentDeleteDialogOpen] = useState(false);
  const [paymentDeleteTarget, setPaymentDeleteTarget] = useState<{
    saleId: string;
    paymentId: string;
  } | null>(null);
  const [deletingPayment, setDeletingPayment] = useState(false);

  const openAddPaymentDrawer = (saleId: string) => {
    setPaymentDrawerSaleId(saleId);
    setEditingPaymentId(null);
    setPaymentAmount("");
    setPaymentPaidAtInput("");
    setPaymentMethodInput("CASH");
    setPaymentCurrency("TRY");
    setPaymentNoteInput("");
    setPaymentFormError("");
    setPaymentDrawerOpen(true);
  };

  const openEditPaymentDrawer = (saleId: string, payment: SalePayment) => {
    setPaymentDrawerSaleId(saleId);
    setEditingPaymentId(payment.id);
    setPaymentAmount(payment.amount != null ? String(payment.amount) : "");
    setPaymentPaidAtInput(normalizePaidAtInput(payment.paidAt));
    setPaymentMethodInput(normalizePaymentMethod(payment.paymentMethod as string | null | undefined));
    setPaymentCurrency(normalizeCurrency(payment.currency as string | null | undefined));
    setPaymentNoteInput(payment.note ?? "");
    setPaymentFormError("");
    setPaymentDrawerOpen(true);
  };

  const closePaymentDrawer = () => {
    if (paymentSubmitting) return;
    setPaymentDrawerOpen(false);
    setPaymentFormError("");
  };

  const submitPayment = async () => {
    const amount = toNumberOrNull(paymentAmount);
    const normalizedPaidAt = paymentPaidAtInput.trim();
    const paidAt =
      normalizedPaidAt.length > 0
        ? new Date(`${normalizedPaidAt}T00:00:00.000Z`).toISOString()
        : undefined;
    if (!paymentDrawerSaleId) {
      setPaymentFormError("Satis kaydi secilmedi.");
      return;
    }
    if (amount == null || amount < 0) {
      setPaymentFormError("Gecerli bir tutar girin.");
      return;
    }

    setPaymentSubmitting(true);
    setPaymentFormError("");
    try {
      if (editingPaymentId) {
        await updateSalePayment(paymentDrawerSaleId, editingPaymentId, {
          amount,
          paymentMethod: paymentMethodInput,
          note: paymentNoteInput.trim() || undefined,
          paidAt,
          currency: paymentCurrency,
        });
        onSuccess("Odeme kaydi guncellendi.");
      } else {
        await createSalePayment(paymentDrawerSaleId, {
          amount,
          paymentMethod: paymentMethodInput,
          note: paymentNoteInput.trim() || undefined,
          paidAt,
          currency: paymentCurrency,
        });
        onSuccess("Odeme kaydi eklendi.");
      }

      setPaymentDrawerOpen(false);
      setEditingPaymentId(null);
      setPaymentAmount("");
      setPaymentPaidAtInput("");
      setPaymentNoteInput("");
      await onRefreshPayments(paymentDrawerSaleId, true);
      await onRefreshList();
    } catch {
      setPaymentFormError(editingPaymentId ? "Odeme guncellenemedi." : "Odeme olusturulamadi.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const openDeletePaymentDialog = (saleId: string, payment: SalePayment) => {
    setPaymentDeleteTarget({ saleId, paymentId: payment.id });
    setPaymentDeleteDialogOpen(true);
  };

  const closeDeletePaymentDialog = () => {
    if (deletingPayment) return;
    setPaymentDeleteDialogOpen(false);
    setPaymentDeleteTarget(null);
  };

  const confirmDeletePayment = async () => {
    if (!paymentDeleteTarget) return;
    setDeletingPayment(true);
    try {
      await deleteSalePayment(paymentDeleteTarget.saleId, paymentDeleteTarget.paymentId);
      onSuccess("Odeme kaydi silindi.");
      setPaymentDeleteDialogOpen(false);
      setPaymentDeleteTarget(null);
      await onRefreshPayments(paymentDeleteTarget.saleId, true);
      await onRefreshList();
    } catch {
      // sessizce gec
    } finally {
      setDeletingPayment(false);
    }
  };

  return {
    paymentDrawerOpen,
    paymentDrawerSaleId,
    editingPaymentId,
    paymentAmount,
    setPaymentAmount,
    paymentPaidAtInput,
    setPaymentPaidAtInput,
    paymentMethodInput,
    setPaymentMethodInput,
    paymentCurrency,
    setPaymentCurrency,
    paymentNoteInput,
    setPaymentNoteInput,
    paymentSubmitting,
    paymentFormError,
    setPaymentFormError,
    paymentDeleteDialogOpen,
    paymentDeleteTarget,
    deletingPayment,
    openAddPaymentDrawer,
    openEditPaymentDrawer,
    closePaymentDrawer,
    submitPayment,
    openDeletePaymentDialog,
    closeDeletePaymentDialog,
    confirmDeletePayment,
    normalizePaymentMethod,
    normalizeCurrency,
  };
}
