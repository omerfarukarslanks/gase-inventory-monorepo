import { apiFetch } from "@/lib/api";
import type { Currency } from "@/lib/products";
import { asObject, pickNumber, pickNumberOrNull, pickString, getPaginationValue } from "@/lib/normalize";

export type PurchaseOrderStatus = "DRAFT" | "APPROVED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

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

export type GetPurchaseOrdersParams = {
  page?: number;
  limit?: number;
  status?: PurchaseOrderStatus | "";
  storeId?: string;
  supplierId?: string;
};

export type PurchaseOrderReceiptLinePayload = {
  purchaseOrderLineId: string;
  receivedQuantity: number;
  lotNumber?: string;
  expiryDate?: string;
};

export type CreatePurchaseOrderReceiptPayload = {
  warehouseId: string;
  notes?: string;
  lines: PurchaseOrderReceiptLinePayload[];
};

export type PurchaseOrderReceiptLine = {
  id: string;
  productName?: string | null;
  variantName?: string | null;
  receivedQuantity: number;
  lotNumber?: string | null;
  expiryDate?: string | null;
  purchaseOrderLine?: {
    id: string;
    productVariantId: string;
    productName?: string | null;
    variantName?: string | null;
    quantity: number;
    receivedQuantity: number;
  };
};

export type PurchaseOrderReceipt = {
  id: string;
  purchaseOrderId?: string | null;
  purchaseOrderReference?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  receivedAt?: string;
  notes?: string | null;
  lineCount?: number;
  totalReceivedQuantity?: number;
  store?: PurchaseOrderStoreRef | null;
  lines?: PurchaseOrderReceiptLine[];
};

export type CentralGoodsReceiptListItem = PurchaseOrderReceipt & {
  purchaseOrderId: string;
  purchaseOrderReference?: string | null;
  warehouseId: string;
  warehouseName?: string | null;
  lineCount: number;
  totalReceivedQuantity: number;
};

export type CentralGoodsReceiptListResponse = {
  data: CentralGoodsReceiptListItem[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type GetCentralGoodsReceiptsParams = {
  page?: number;
  limit?: number;
  storeId?: string;
  warehouseId?: string;
  startDate?: string;
  endDate?: string;
  q?: string;
};

function normalizePurchaseOrderLine(payload: unknown): PurchaseOrderLine | null {
  const line = asObject(payload);
  if (!line) return null;

  const product = asObject(line.product);
  const variant = asObject(line.productVariant) ?? asObject(line.variant);
  const variantProduct = asObject(variant?.product);
  const id = pickString(line.id, line.purchaseOrderLineId);
  const productVariantId = pickString(line.productVariantId, line.variantId, variant?.id);

  if (!id || !productVariantId) return null;

  return {
    id,
    productVariantId,
    productName: pickString(line.productName, product?.name, variantProduct?.name) || undefined,
    variantName: pickString(line.variantName, line.productVariantName, variant?.name) || undefined,
    quantity: pickNumber(line.quantity),
    receivedQuantity: pickNumber(line.receivedQuantity),
    unitPrice: pickNumber(line.unitPrice),
    taxPercent: pickNumberOrNull(line.taxPercent),
    lineTotal: pickNumberOrNull(line.lineTotal),
    notes: pickString(line.notes) || null,
  };
}

function normalizePurchaseOrder(payload: unknown): PurchaseOrder | null {
  const root = asObject(payload);
  if (!root) return null;

  const store = asObject(root.store);
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
    supplierId: pickString(root.supplierId, asObject(root.supplier)?.id) || null,
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
            currency: (pickString(root.currency) || undefined) as Currency | undefined,
          }
        : null,
    lines,
    createdAt: pickString(root.createdAt) || undefined,
    updatedAt: pickString(root.updatedAt) || undefined,
  };
}

function normalizePurchaseOrderReceiptLine(payload: unknown): PurchaseOrderReceiptLine | null {
  const line = asObject(payload);
  if (!line) return null;

  const purchaseOrderLine = asObject(line.purchaseOrderLine);
  const variant = asObject(line.productVariant)
    ?? asObject(purchaseOrderLine?.productVariant)
    ?? asObject(line.variant);
  const product = asObject(line.product)
    ?? asObject(purchaseOrderLine?.product)
    ?? asObject(variant?.product);
  const id = pickString(line.id, line.receiptLineId);
  if (!id) return null;

  return {
    id,
    productName: pickString(
      line.productName,
      purchaseOrderLine?.productName,
      product?.name,
    ) || undefined,
    variantName: pickString(
      line.variantName,
      line.productVariantName,
      purchaseOrderLine?.variantName,
      purchaseOrderLine?.productVariantName,
      variant?.name,
    ) || undefined,
    receivedQuantity: pickNumber(line.receivedQuantity),
    lotNumber: pickString(line.lotNumber) || null,
    expiryDate: pickString(line.expiryDate) || null,
    purchaseOrderLine: purchaseOrderLine
      ? {
          id: pickString(purchaseOrderLine.id),
          productVariantId: pickString(
            purchaseOrderLine.productVariantId,
            purchaseOrderLine.variantId,
            variant?.id,
          ),
          productName: pickString(
            purchaseOrderLine.productName,
            product?.name,
          ) || undefined,
          variantName: pickString(
            purchaseOrderLine.variantName,
            purchaseOrderLine.productVariantName,
            variant?.name,
          ) || undefined,
          quantity: pickNumber(purchaseOrderLine.quantity),
          receivedQuantity: pickNumber(purchaseOrderLine.receivedQuantity),
        }
      : undefined,
  };
}

function normalizePurchaseOrderReceipt(payload: unknown): PurchaseOrderReceipt | null {
  const root = asObject(payload);
  if (!root) return null;

  const store = asObject(root.store);
  const purchaseOrder = asObject(root.purchaseOrder);
  const id = pickString(root.id);
  if (!id) return null;

  const lines = Array.isArray(root.lines)
    ? root.lines
        .map((line) => normalizePurchaseOrderReceiptLine(line))
        .filter((line): line is PurchaseOrderReceiptLine => Boolean(line))
    : [];

  return {
    id,
    purchaseOrderId: pickString(root.purchaseOrderId, purchaseOrder?.id) || null,
    purchaseOrderReference: pickString(root.purchaseOrderReference, purchaseOrder?.reference, purchaseOrder?.code) || null,
    warehouseId: pickString(root.warehouseId, asObject(root.warehouse)?.id) || null,
    warehouseName: pickString(root.warehouseName, asObject(root.warehouse)?.name) || null,
    receivedAt: pickString(root.receivedAt, root.createdAt) || undefined,
    notes: pickString(root.notes) || null,
    lineCount: pickNumberOrNull(root.lineCount) ?? lines.length,
    totalReceivedQuantity: pickNumberOrNull(root.totalReceivedQuantity) ?? lines.reduce((sum, line) => sum + Number(line.receivedQuantity ?? 0), 0),
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
  };
}

export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
  const response = await apiFetch<unknown>("/procurement/purchase-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizePurchaseOrder(response) ?? {
    id: "",
    status: "DRAFT",
    lines: [],
  };
}

export async function getPurchaseOrders({
  page = 1,
  limit = 20,
  status,
  storeId,
  supplierId,
}: GetPurchaseOrdersParams = {}): Promise<PurchaseOrdersListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status) query.set("status", status);
  if (storeId) query.set("storeId", storeId);
  if (supplierId) query.set("supplierId", supplierId);

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
  return normalizePurchaseOrder(response) ?? {
    id,
    status: "DRAFT",
    lines: [],
  };
}

export async function approvePurchaseOrder(id: string): Promise<{ id: string; status: PurchaseOrderStatus; updatedAt?: string }> {
  return apiFetch<{ id: string; status: PurchaseOrderStatus; updatedAt?: string }>(
    `/procurement/purchase-orders/${id}/approve`,
    { method: "PATCH" },
  );
}

export async function cancelPurchaseOrder(id: string): Promise<{ id: string; status: PurchaseOrderStatus; updatedAt?: string }> {
  return apiFetch<{ id: string; status: PurchaseOrderStatus; updatedAt?: string }>(
    `/procurement/purchase-orders/${id}/cancel`,
    { method: "PATCH" },
  );
}

export async function createPurchaseOrderReceipt(
  id: string,
  payload: CreatePurchaseOrderReceiptPayload,
): Promise<PurchaseOrderReceipt> {
  const response = await apiFetch<unknown>(`/procurement/purchase-orders/${id}/receipts`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizePurchaseOrderReceipt(response) ?? {
    id: "",
    lines: [],
  };
}

export async function getPurchaseOrderReceipts(id: string): Promise<PurchaseOrderReceipt[]> {
  const response = await apiFetch<unknown>(`/procurement/purchase-orders/${id}/receipts`);
  const root = asObject(response);
  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.items)
        ? root.items
        : [];

  return rawItems
    .map((item) => normalizePurchaseOrderReceipt(item))
    .filter((item): item is PurchaseOrderReceipt => Boolean(item));
}

export async function getCentralGoodsReceipts({
  page = 1,
  limit = 20,
  storeId,
  warehouseId,
  startDate,
  endDate,
  q,
}: GetCentralGoodsReceiptsParams = {}): Promise<CentralGoodsReceiptListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (storeId) query.set("storeId", storeId);
  if (warehouseId) query.set("warehouseId", warehouseId);
  if (startDate) query.set("startDate", startDate);
  if (endDate) query.set("endDate", endDate);
  if (q) query.set("q", q);

  const response = await apiFetch<unknown>(`/procurement/goods-receipts?${query.toString()}`);
  const root = asObject(response);
  const rawItems = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.items)
      ? root.items
      : Array.isArray(response)
        ? response
        : [];

  return {
    data: rawItems
      .map((item) => normalizePurchaseOrderReceipt(item))
      .filter((item): item is CentralGoodsReceiptListItem => Boolean(item?.id && item.purchaseOrderId && item.warehouseId)),
    meta: {
      total: getPaginationValue(response, "total") || rawItems.length,
      page: getPaginationValue(response, "page") || page,
      limit: getPaginationValue(response, "limit") || limit,
      totalPages: getPaginationValue(response, "totalPages") || 1,
    },
  };
}

export async function getCentralGoodsReceipt(id: string): Promise<PurchaseOrderReceipt> {
  const response = await apiFetch<unknown>(`/procurement/goods-receipts/${id}`);
  return normalizePurchaseOrderReceipt(response) ?? {
    id,
    lines: [],
  };
}
