import { apiFetch } from "./api";
import type { Currency } from "./products";
import { asObject, pickNumber, pickString } from "./normalize";
import { appendIfDefined } from "./query-builder";

export type InventoryReceiveItem = {
  storeId: string;
  productVariantId?: string;
  productId?: string;
  supplierId?: string;
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
  campaignCode?: string;
};

export type InventoryTransferPayload = {
  fromStoreId: string;
  toStoreId: string;
  productVariantId?: string;
  productId?: string;
  quantity: number;
  meta?: {
    reason?: string;
    note?: string;
  };
};

export type InventoryTransferItem = {
  fromStoreId: string;
  toStoreId: string;
  productVariantId: string;
  quantity: number;
  meta?: {
    reason?: string;
    note?: string;
  };
};

export type InventoryTransferBulkPayload = {
  items: InventoryTransferItem[];
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
  productVariantId?: string;
  productId?: string;
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

export async function receiveInventory(payload: InventoryReceiveItem): Promise<unknown> {
  return apiFetch<unknown>("/inventory/receive", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function receiveInventoryBulk(items: InventoryReceiveItem[]): Promise<unknown> {
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

  if (params?.storeIds?.length) payload.storeIds = params.storeIds.filter(Boolean);
  if (params?.search) payload.search = params.search;

  return apiFetch<InventoryTenantStockResponse>("/inventory/stock/summary", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getVariantStockByStore(
  variantId: string,
  params?: { page?: number; limit?: number },
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

export async function transferInventory(payload: InventoryTransferPayload): Promise<unknown> {
  return apiFetch<unknown>("/inventory/transfer", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adjustInventory(payload: InventoryAdjustPayload): Promise<unknown> {
  return apiFetch<unknown>("/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Inventory Movements ───────────────────────────────────────────────────

export type InventoryMovementType =
  | "ADJUSTMENT"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "OUT"
  | "IN"
  | string;

export type InventoryMovement = {
  id: string;
  storeId?: string | null;
  storeName?: string | null;
  productId?: string | null;
  productName?: string | null;
  productVariantId?: string | null;
  variantName?: string | null;
  type: InventoryMovementType;
  quantity: number;
  reference?: string | null;
  reason?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  createdAt?: string | null;
};

export type InventoryMovementsResponse = {
  data: InventoryMovement[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
};

export type GetInventoryMovementsParams = {
  storeId?: string;
  warehouseId?: string;
  productVariantId?: string;
  type?: InventoryMovementType;
  search?: string;
  limit?: number;
  offset?: number;
};

function normalizeInventoryMovement(payload: unknown): InventoryMovement | null {
  const item = asObject(payload);
  if (!item) return null;

  const store = asObject(item.store);
  const productVariant = asObject(item.productVariant);
  const meta = asObject(item.meta);
  const id = pickString(item.id);
  if (!id) return null;

  return {
    id,
    storeId: pickString(item.storeId, store?.id) || null,
    storeName: pickString(item.storeName, store?.name) || null,
    productId: pickString(item.productId) || null,
    productName: pickString(item.productName) || null,
    productVariantId: pickString(item.productVariantId, productVariant?.id) || null,
    variantName: pickString(item.variantName, productVariant?.name) || null,
    type: pickString(item.type) || "-",
    quantity: pickNumber(item.quantity),
    reference: pickString(item.reference, meta?.reference) || null,
    reason: pickString(item.reason, meta?.reason) || null,
    locationId: pickString(item.locationId) || null,
    locationName: pickString(item.locationName) || null,
    warehouseId: pickString(item.warehouseId) || null,
    warehouseName: pickString(item.warehouseName) || null,
    createdAt: pickString(item.createdAt) || null,
  };
}

export async function getInventoryMovements(
  params: GetInventoryMovementsParams = {},
): Promise<InventoryMovementsResponse> {
  const query = new URLSearchParams({
    limit: String(params.limit ?? 30),
    offset: String(params.offset ?? 0),
  });
  appendIfDefined(query, "storeId", params.storeId);
  appendIfDefined(query, "warehouseId", params.warehouseId);
  appendIfDefined(query, "productVariantId", params.productVariantId);
  appendIfDefined(query, "type", params.type);
  appendIfDefined(query, "search", params.search);

  const payload = await apiFetch<unknown>(`/inventory/movements?${query.toString()}`);
  const root = asObject(payload);
  const meta = asObject(root?.meta);
  const rawItems = Array.isArray(root?.data) ? root.data : [];

  return {
    data: rawItems
      .map((item) => normalizeInventoryMovement(item))
      .filter((item): item is InventoryMovement => Boolean(item)),
    meta: {
      total: pickNumber(meta?.total),
      limit: pickNumber(meta?.limit, params.limit, 30),
      offset: pickNumber(meta?.offset, params.offset, 0),
      hasMore: Boolean(meta?.hasMore),
    },
  };
}
