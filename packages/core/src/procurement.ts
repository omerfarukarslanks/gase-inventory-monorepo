import { apiFetch } from "./api";
import type { Currency } from "./products";
import { asObject, pickNumber, pickNumberOrNull, pickString, getPaginationValue } from "./normalize";
import { appendIfDefined } from "./query-builder";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "APPROVED"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type PurchaseOrderStoreRef = {
  id: string;
  name?: string;
  currency?: Currency;
  storeType?: string;
};

export type PurchaseOrderLine = {
  id: string;
  productVariantId: string;
  productName?: string | null;
  variantName?: string | null;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  taxPercent?: number | null;
  lineTotal?: number | null;
  notes?: string | null;
};

export type PurchaseOrder = {
  id: string;
  status: PurchaseOrderStatus;
  supplierId?: string | null;
  supplierName?: string | null;
  expectedAt?: string | null;
  currency?: Currency | null;
  notes?: string | null;
  store?: PurchaseOrderStoreRef | null;
  lines?: PurchaseOrderLine[];
  createdAt?: string;
  updatedAt?: string;
};

export type PurchaseOrdersListResponse = {
  data: PurchaseOrder[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type GetPurchaseOrdersParams = {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus | "";
  storeId?: string;
  supplierId?: string;
};

export type CreatePurchaseOrderLinePayload = {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  notes?: string;
};

export type CreatePurchaseOrderPayload = {
  storeId: string;
  supplierId: string;
  expectedAt: string;
  currency: Currency;
  notes?: string;
  lines: CreatePurchaseOrderLinePayload[];
};

function normalizePurchaseOrderLine(payload: unknown): PurchaseOrderLine | null {
  const line = asObject(payload);
  if (!line) return null;

  const variant = asObject(line.productVariant) ?? asObject(line.variant);
  const product = asObject(line.product) ?? asObject(variant?.product);
  const id = pickString(line.id);
  const productVariantId = pickString(line.productVariantId, line.variantId, variant?.id);
  if (!id || !productVariantId) return null;

  return {
    id,
    productVariantId,
    productName: pickString(line.productName, product?.name) || null,
    variantName: pickString(line.variantName, line.productVariantName, variant?.name) || null,
    quantity: pickNumber(line.quantity),
    receivedQuantity: pickNumber(line.receivedQuantity),
    unitPrice: pickNumber(line.unitPrice),
    taxPercent: pickNumberOrNull(line.taxPercent),
    lineTotal: pickNumberOrNull(line.lineTotal),
    notes: pickString(line.notes) || null,
  };
}

export function normalizePurchaseOrder(payload: unknown): PurchaseOrder | null {
  const root = asObject(payload);
  if (!root) return null;

  const store = asObject(root.store);
  const supplier = asObject(root.supplier);
  const id = pickString(root.id);
  if (!id) return null;

  const lines = Array.isArray(root.lines)
    ? root.lines
        .map((line) => normalizePurchaseOrderLine(line))
        .filter((line): line is PurchaseOrderLine => Boolean(line))
    : [];

  return {
    id,
    status: pickString(root.status) as PurchaseOrderStatus,
    supplierId: pickString(root.supplierId, supplier?.id) || null,
    supplierName: pickString(root.supplierName, supplier?.name) || null,
    expectedAt: pickString(root.expectedAt, root.expectedDeliveryAt) || null,
    currency: (pickString(root.currency, store?.currency) || null) as Currency | null,
    notes: pickString(root.notes) || null,
    store: store
      ? {
          id: pickString(store.id, root.storeId),
          name: pickString(store.name, root.storeName) || undefined,
          currency: (pickString(store.currency) || undefined) as Currency | undefined,
          storeType: pickString(store.storeType, store.type) || undefined,
        }
      : pickString(root.storeId)
        ? {
            id: pickString(root.storeId),
            name: pickString(root.storeName) || undefined,
          }
        : null,
    lines,
    createdAt: pickString(root.createdAt) || undefined,
    updatedAt: pickString(root.updatedAt) || undefined,
  };
}

export async function getPurchaseOrders({
  page = 1,
  limit = 20,
  status,
  storeId,
  supplierId,
}: GetPurchaseOrdersParams = {}): Promise<PurchaseOrdersListResponse> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  appendIfDefined(query, "status", status);
  appendIfDefined(query, "storeId", storeId);
  appendIfDefined(query, "supplierId", supplierId);

  const response = await apiFetch<unknown>(`/procurement/purchase-orders?${query.toString()}`);
  const root = asObject(response);
  const rawItems = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.items)
      ? root.items
      : [];

  return {
    data: rawItems
      .map((item) => normalizePurchaseOrder(item))
      .filter((item): item is PurchaseOrder => Boolean(item)),
    meta: {
      total: getPaginationValue(response, "total") || rawItems.length,
      page: getPaginationValue(response, "page") || page,
      limit: getPaginationValue(response, "limit") || limit,
      totalPages: getPaginationValue(response, "totalPages") || 1,
    },
  };
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const response = await apiFetch<unknown>(`/procurement/purchase-orders/${id}`);
  return normalizePurchaseOrder(response) ?? { id, status: "DRAFT", lines: [] };
}

export async function approvePurchaseOrder(
  id: string,
): Promise<{ id: string; status: PurchaseOrderStatus }> {
  return apiFetch(`/procurement/purchase-orders/${id}/approve`, { method: "PATCH" });
}

export async function cancelPurchaseOrder(
  id: string,
): Promise<{ id: string; status: PurchaseOrderStatus }> {
  return apiFetch(`/procurement/purchase-orders/${id}/cancel`, { method: "PATCH" });
}

// ─── Goods Receipts ──────────────────────────────────────────────────────────

export type GoodsReceiptLine = {
  id: string;
  purchaseOrderLineId: string;
  productName?: string | null;
  variantName?: string | null;
  quantity: number;
  lotNumber?: string | null;
  expiryDate?: string | null;
};

export type GoodsReceipt = {
  id: string;
  purchaseOrderId: string;
  storeId?: string | null;
  warehouseId?: string | null;
  notes?: string | null;
  receivedAt?: string | null;
  createdAt?: string | null;
  lines: GoodsReceiptLine[];
};

export type CreateGoodsReceiptLinePayload = {
  purchaseOrderLineId: string;
  quantity: number;
  lotNumber?: string;
  expiryDate?: string;
};

export type CreateGoodsReceiptPayload = {
  lines: CreateGoodsReceiptLinePayload[];
  notes?: string;
  receivedAt?: string;
};

function normalizeGoodsReceiptLine(payload: unknown): GoodsReceiptLine | null {
  const item = asObject(payload);
  if (!item) return null;
  const id = pickString(item.id);
  const purchaseOrderLineId = pickString(item.purchaseOrderLineId, item.poLineId);
  if (!id || !purchaseOrderLineId) return null;
  const variant = asObject(item.productVariant) ?? asObject(item.variant);
  return {
    id,
    purchaseOrderLineId,
    productName: pickString(item.productName) || null,
    variantName: pickString(item.variantName, variant?.name) || null,
    quantity: pickNumber(item.quantity),
    lotNumber: pickString(item.lotNumber) || null,
    expiryDate: pickString(item.expiryDate) || null,
  };
}

function normalizeGoodsReceipt(payload: unknown): GoodsReceipt | null {
  const root = asObject(payload);
  if (!root) return null;
  const id = pickString(root.id);
  const purchaseOrderId = pickString(root.purchaseOrderId, root.poId);
  if (!id || !purchaseOrderId) return null;
  const lines = Array.isArray(root.lines)
    ? root.lines
        .map((l) => normalizeGoodsReceiptLine(l))
        .filter((l): l is GoodsReceiptLine => Boolean(l))
    : [];
  return {
    id,
    purchaseOrderId,
    storeId: pickString(root.storeId) || null,
    warehouseId: pickString(root.warehouseId) || null,
    notes: pickString(root.notes) || null,
    receivedAt: pickString(root.receivedAt) || null,
    createdAt: pickString(root.createdAt) || null,
    lines,
  };
}

/**
 * Record a goods receipt (mal kabul) for a purchase order.
 */
export async function createPurchaseOrderReceipt(
  purchaseOrderId: string,
  payload: CreateGoodsReceiptPayload,
): Promise<GoodsReceipt> {
  const response = await apiFetch<unknown>(
    `/procurement/purchase-orders/${purchaseOrderId}/receipts`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return normalizeGoodsReceipt(response) ?? {
    id: "",
    purchaseOrderId,
    lines: [],
  };
}

/**
 * List all receipts for a given purchase order.
 */
export async function getPurchaseOrderReceipts(
  purchaseOrderId: string,
): Promise<GoodsReceipt[]> {
  const response = await apiFetch<unknown>(
    `/procurement/purchase-orders/${purchaseOrderId}/receipts`,
  );
  const root = asObject(response);
  const rawItems = Array.isArray(root?.data) ? root.data : Array.isArray(response) ? response : [];
  return rawItems
    .map((item) => normalizeGoodsReceipt(item))
    .filter((item): item is GoodsReceipt => Boolean(item));
}
