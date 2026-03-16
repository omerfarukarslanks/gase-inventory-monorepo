import type { Currency } from "@gase/core";

export type TabKey = "dashboard" | "sales" | "stock" | "tasks" | "more";
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
  /** Barcode taranınca ürün araması için — composer açılınca variant picker'a uygulanır */
  variantBarcode?: string;
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
  /** Barcode taranınca arama kutusuna uygulanır */
  barcode?: string;
};

export type StockRequest = {
  kind: "focus";
  seed: StockFocusSeed;
};

export type CustomersRequest = {
  kind: "compose";
};

export type TasksRequest =
  | { kind: "approval"; approvalId: string }
  | { kind: "supply"; suggestionId: string };

/**
 * Push notification payload shapes sent from the backend.
 * The `kind` field discriminates which screen to open.
 *
 * Backend sends this as the notification `data` object:
 *   { kind: "sale",       saleId: "abc123" }
 *   { kind: "approval",   approvalId: "abc123" }
 *   { kind: "low-stock",  variantId: "abc123", variantName: "..." }
 *   { kind: "replenishment", suggestionId: "abc123" }
 *   { kind: "stock-count", sessionId: "abc123" }
 */
export type NotificationPayload =
  | { kind: "sale"; saleId: string }
  | { kind: "approval"; approvalId: string }
  | { kind: "low-stock"; variantId: string; variantName?: string; productName?: string }
  | { kind: "replenishment"; suggestionId: string }
  | { kind: "stock-count"; sessionId: string };

/**
 * Guards whether an unknown object is a valid NotificationPayload.
 */
export function isNotificationPayload(value: unknown): value is NotificationPayload {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  const kind = obj["kind"];
  if (kind === "sale") return typeof obj["saleId"] === "string";
  if (kind === "approval") return typeof obj["approvalId"] === "string";
  if (kind === "low-stock") return typeof obj["variantId"] === "string";
  if (kind === "replenishment") return typeof obj["suggestionId"] === "string";
  if (kind === "stock-count") return typeof obj["sessionId"] === "string";
  return false;
}
