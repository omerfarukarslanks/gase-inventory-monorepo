import type { Currency } from "@/lib/products";
import { toNumberOrNull } from "@/lib/format";
import type { PaymentMethod } from "@/lib/sales";

export type LineMode = "percent" | "amount";

export type SaleLineForm = {
  rowId: string;
  productVariantId: string;
  quantity: string;
  currency: Currency;
  unitPrice: string;
  discountMode: LineMode;
  discountPercent: string;
  discountAmount: string;
  taxMode: LineMode;
  taxPercent: string;
  taxAmount: string;
  campaignCode: string;
};

export type FieldErrors = {
  customerId?: string;
  storeId?: string;
  paymentMethod?: string;
  initialPaymentAmount?: string;
  lines?: string;
};

export type VariantStorePreset = {
  storeId: string;
  currency: Currency;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineTotal: number | null;
};

export type VariantPreset = {
  currency: Currency;
  unitPrice: number | null;
  discountPercent: number | null;
  discountAmount: number | null;
  taxPercent: number | null;
  taxAmount: number | null;
  lineTotal: number | null;
  stores: VariantStorePreset[];
};

export const SALES_STATUS_OPTIONS = [
  { value: "DRAFT", label: "DRAFT" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "CANCELLED", label: "CANCELLED" },
];

export const PAYMENT_METHOD_OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "CASH", label: "Nakit" },
  { value: "CARD", label: "Kart" },
  { value: "TRANSFER", label: "Havale/EFT" },
  { value: "OTHER", label: "Diger" },
];

export function createLineRow(): SaleLineForm {
  return {
    rowId: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    productVariantId: "",
    quantity: "1",
    currency: "TRY",
    unitPrice: "",
    discountMode: "percent",
    discountPercent: "",
    discountAmount: "",
    taxMode: "percent",
    taxPercent: "",
    taxAmount: "",
    campaignCode: "",
  };
}

export function calcLineTotal(line: SaleLineForm): number {
  const quantity = toNumberOrNull(line.quantity) ?? 0;
  const unitPrice = toNumberOrNull(line.unitPrice) ?? 0;
  const subtotal = quantity * unitPrice;

  const taxValue =
    line.taxMode === "percent"
      ? subtotal * ((toNumberOrNull(line.taxPercent) ?? 0) / 100)
      : (toNumberOrNull(line.taxAmount) ?? 0);
  const subtotalWithTax = subtotal + taxValue;
  const discountValue =
    line.discountMode === "percent"
      ? subtotalWithTax * ((toNumberOrNull(line.discountPercent) ?? 0) / 100)
      : (toNumberOrNull(line.discountAmount) ?? 0);

  return Math.max(0, subtotalWithTax - discountValue);
}
