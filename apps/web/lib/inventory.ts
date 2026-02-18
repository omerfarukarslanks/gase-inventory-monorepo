import { apiFetch } from "@/lib/api";
import type { Currency } from "@/lib/products";

/* ── Types ── */

export type InventoryReceiveItem = {
  storeId: string;
  productVariantId: string;
  quantity: number;
  meta?: {
    reason?: string;
    note?: string;
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
  meta?: {
    reason?: string;
    note?: string;
  };
};

export type InventoryAdjustItem = {
  storeId: string;
  productVariantId: string;
  newQuantity: number;
  meta?: {
    reason?: string;
    note?: string;
  };
};

export type InventoryAdjustSinglePayload = {
  storeId?: string;
  productVariantId: string;
  newQuantity: number;
  applyToAllStores?: boolean;
  meta?: {
    reason?: string;
    note?: string;
  };
};

export type InventoryAdjustBulkPayload = {
  items: InventoryAdjustItem[];
};

export type InventoryAdjustPayload =
  | InventoryAdjustSinglePayload
  | InventoryAdjustBulkPayload;

export type InventorySellPayload = {
  storeId: string;
  productVariantId: string;
  quantity: number;
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

export type InventoryStoreStockItem = {
  storeId: string;
  storeName: string;
  quantity: number;
  totalQuantity?: number;
  unitPrice?: number | null;
  salePrice?: number | null;
  purchasePrice?: number | null;
  currency?: Currency | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  lineTotal?: number | null;
  isStoreOverride?: boolean;
};

export type InventoryVariantStockItem = {
  productVariantId: string;
  variantName: string;
  variantCode?: string;
  totalQuantity: number;
  stores?: InventoryStoreStockItem[];
};

export type InventoryProductStockItem = {
  productId: string;
  productName: string;
  totalQuantity: number;
  variants?: InventoryVariantStockItem[];
};

export type InventoryTenantStockResponse = {
  items: InventoryProductStockItem[];
  totalQuantity?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type InventoryVariantByStoreResponse = {
  items: InventoryStoreStockItem[];
  totalQuantity?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
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

export async function getTenantStockSummary(params?: {
  page?: number;
  limit?: number;
  storeIds?: string[];
  search?: string;
}): Promise<InventoryTenantStockResponse> {
  const payload: {
    page?: number;
    limit?: number;
    storeIds?: string[];
    search?: string;
  } = {};

  const enablePagination = params?.page != null || params?.limit != null;
  if (enablePagination) {
    payload.page = params?.page ?? 1;
    payload.limit = params?.limit ?? 10;
  }

  if (params?.storeIds?.length) {
    payload.storeIds = params.storeIds.filter(Boolean);
  }
  if (params?.search) payload.search = params.search;

  return apiFetch<InventoryTenantStockResponse>("/inventory/stock/summary", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getVariantStockByStore(
  variantId: string,
  params?: {
    page?: number;
    limit?: number;
  },
): Promise<InventoryVariantByStoreResponse> {
  const query = new URLSearchParams();
  const enablePagination = params?.page != null || params?.limit != null;
  if (enablePagination) {
    query.set("page", String(params?.page ?? 1));
    query.set("limit", String(params?.limit ?? 10));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<InventoryVariantByStoreResponse>(`/inventory/variant/${variantId}/by-store${suffix}`);
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
