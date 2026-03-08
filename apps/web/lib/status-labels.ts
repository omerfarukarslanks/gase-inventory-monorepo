import type { StatusVariant } from "@/components/ui/StatusBadge";

type TFn = (key: string) => string;

export function getPaymentStatusLabel(status?: string | null, t?: TFn): string {
  if (!t) return status ?? "-";
  if (status === "PARTIAL") return t("sales.paymentPartial");
  if (status === "PAID") return t("sales.paymentPaid");
  if (status === "UNPAID") return t("sales.paymentUnpaid");
  if (status === "PENDING") return t("sales.paymentPending");
  if (status === "CANCELLED") return t("sales.paymentCancelled");
  if (status === "UPDATED") return t("sales.paymentUpdated");
  if (status === "ACTIVE") return t("common.active");
  return status ?? "-";
}

export function getPaymentStatusVariant(status?: string | null): StatusVariant {
  if (status === "PAID" || status === "ACTIVE") return "success";
  if (status === "CANCELLED" || status === "UNPAID") return "error";
  return "neutral";
}

export function getSaleStatusLabel(status?: string | null, t?: TFn): string {
  if (!t) return status ?? "-";
  if (status === "CONFIRMED") return t("sales.statusConfirmed");
  if (status === "CANCELLED") return t("sales.statusCancelled");
  if (status === "DRAFT") return t("sales.statusDraft");
  return status ?? "-";
}

export function getSaleStatusVariant(status?: string | null): StatusVariant {
  if (status === "CONFIRMED") return "success";
  if (status === "CANCELLED") return "error";
  return "neutral";
}

export function getPaymentMethodLabel(paymentMethod?: string | null, t?: TFn): string {
  if (!t) return paymentMethod ?? "-";
  if (paymentMethod === "CASH") return t("sales.methodCash");
  if (paymentMethod === "CARD") return t("sales.methodCard");
  if (paymentMethod === "TRANSFER") return t("sales.methodTransfer");
  if (paymentMethod === "OTHER") return t("sales.methodOther");
  return paymentMethod ?? "-";
}
