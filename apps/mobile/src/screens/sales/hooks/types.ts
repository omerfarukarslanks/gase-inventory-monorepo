import type { PaymentMethod } from "@gase/core";
import type { RequestEnvelope, SalesRequest } from "@/src/lib/workflows";

export type SalesView = "list" | "detail" | "compose";
export type ComposerStep = "customer" | "items" | "payment" | "review";
export type SaleStatusFilter = "all" | "CONFIRMED" | "CANCELLED";

export type SalesComposerLine = {
  id: string;
  variantId: string;
  label: string;
  quantity: string;
  unitPrice: string;
  currency: "TRY" | "USD" | "EUR";
};

export type SalesComposerDraft = {
  storeId: string;
  customerId: string;
  customerLabel: string;
  note: string;
  paymentAmount: string;
  paymentMethod: PaymentMethod;
  lines: SalesComposerLine[];
};

export type PaymentEditorState = {
  saleId: string;
  paymentId?: string;
  amount: string;
  note: string;
  paymentMethod: PaymentMethod;
  currency: "TRY" | "USD" | "EUR";
};

export type ReturnLineState = {
  saleLineId: string;
  label: string;
  maxQuantity: number;
  quantity: string;
};

export type VariantQuickPick = {
  productVariantId: string;
  label: string;
  code?: string | null;
  unitPrice?: string;
  currency: "TRY" | "USD" | "EUR";
  totalQuantity?: number;
};

export type SalesScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<SalesRequest> | null;
};
