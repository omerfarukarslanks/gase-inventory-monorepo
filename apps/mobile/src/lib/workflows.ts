import type { Currency } from "@gase/core";

export type TabKey = "dashboard" | "sales" | "stock" | "products" | "customers";
export type StockOperationKind = "receive" | "transfer" | "adjust";

export type RequestEnvelope<T> = {
  id: number;
  payload: T;
};

export type SalesDraftSeed = {
  customerId?: string;
  customerLabel?: string;
  variantId?: string;
  variantLabel?: string;
  unitPrice?: string;
  currency?: Currency;
  note?: string;
};

export type SalesRequest =
  | {
      kind: "compose";
      seed?: SalesDraftSeed;
    }
  | {
      kind: "detail";
      saleId: string;
    };

export type StockFocusSeed = {
  productId?: string;
  productName?: string;
  productVariantId?: string;
  variantName?: string;
  operation?: StockOperationKind;
};

export type StockRequest = {
  kind: "focus";
  seed: StockFocusSeed;
};

export type CustomersRequest = {
  kind: "compose";
};
