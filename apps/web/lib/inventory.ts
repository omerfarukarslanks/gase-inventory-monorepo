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

export type InventoryTransferPayload = {
  fromStoreId: string;
  toStoreId: string;
  productVariantId: string;
  quantity: number;
  reference?: string;
  meta?: {
    note?: string;
  };
};

export type InventoryAdjustPayload = {
  storeId: string;
  productVariantId: string;
  newQuantity: number;
  reference?: string;
  meta?: {
    reason?: string;
    note?: string;
  };
};

export type InventorySellPayload = {
  storeId: string;
  productVariantId: string;
  quantity: number;
  reference?: string;
  meta?: {
    posTerminal?: string;
  };
  currency: Currency;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineTotal: number;
  campaignCode?: string;
  saleId?: string;
  saleLineId?: string;
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

export async function getTenantStockSummary(): Promise<unknown> {
  return apiFetch<unknown>("/inventory/tenant/stock");
}

export async function getStoreStockSummary(storeId: string): Promise<unknown> {
  return apiFetch<unknown>(`/inventory/store/${storeId}/stock`);
}

export async function transferInventory(
  payload: InventoryTransferPayload,
): Promise<unknown> {
  return apiFetch<unknown>("/inventory/transfer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adjustInventory(
  payload: InventoryAdjustPayload,
): Promise<unknown> {
  return apiFetch<unknown>("/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sellInventory(
  payload: InventorySellPayload,
): Promise<unknown> {
  return apiFetch<unknown>("/inventory/sell", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
