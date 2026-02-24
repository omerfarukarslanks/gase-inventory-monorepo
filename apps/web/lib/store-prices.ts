import { apiFetch } from "@/lib/api";
import type { Currency } from "@/lib/products";

/* ── Types ── */

export type StorePricePayload = {
  storeId?: string;
  unitPrice: number;
  currency: Currency;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineTotal: number;
  campaignCode?: string;
  storeIds?: string[];
  applyToAllStores?: boolean;
};

/* ── API ── */

export async function updateStorePrice(
  variantId: string,
  payload: StorePricePayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/store-prices/${variantId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateProductStorePrice(
  productId: string,
  payload: StorePricePayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/store-prices/product/${productId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
