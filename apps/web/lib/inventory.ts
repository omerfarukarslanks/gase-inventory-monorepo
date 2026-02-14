import { apiFetch } from "@/lib/api";
import type { Currency } from "@/lib/products";

/* ── Types ── */

export type InventoryReceiveItem = {
  storeId: string;
  productVariantId: string;
  quantity: number;
  reference?: string;
  meta?: {
    supplier?: string;
  };
  currency: Currency;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineTotal: number;
  campaignCode?: string;
};

/* ── API Functions ── */

export async function receiveInventory(
  payload: InventoryReceiveItem,
): Promise<unknown> {
  return apiFetch<unknown>("/inventory/receive", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function receiveInventoryBulk(
  items: InventoryReceiveItem[],
): Promise<unknown> {
  return apiFetch<unknown>("/inventory/receive/bulk", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}
