// Status label utilities are now canonical in @gase/core.
// Re-exported here so existing imports (`@/lib/status-labels`) keep working.
export {
  getPaymentStatusLabel,
  getPaymentStatusVariant,
  getSaleStatusLabel,
  getSaleStatusVariant,
  getPaymentMethodLabel,
  SALE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from "@gase/core";
export type { StatusVariant } from "@gase/core";
