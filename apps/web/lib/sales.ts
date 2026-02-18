import { apiFetch } from "@/lib/api";
import type { Currency } from "@/lib/products";

export type CreateSaleLinePayload = {
  productVariantId: string;
  quantity: number;
  currency: Currency;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineTotal: number;
  campaignCode?: string;
};

export type CreateSalePayload = {
  storeId?: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  email?: string;
  meta?: {
    source?: string;
    note?: string;
  };
  lines: CreateSaleLinePayload[];
};

export type SaleListLine = {
  id: string;
  productVariantId?: string;
  productVariantName?: string;
  quantity?: number;
  currency?: Currency | null;
  unitPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  lineTotal?: number | null;
};

export type SaleListItem = {
  id: string;
  receiptNo?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  storeId?: string;
  storeName?: string;
  name?: string;
  surname?: string;
  phoneNumber?: string | null;
  email?: string | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  lineCount?: number;
  total?: number | null;
  lines?: SaleListLine[];
};

export type SalesListMeta = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
};

export type GetSalesResponse = {
  data: SaleListItem[];
  meta: SalesListMeta;
};

export type SaleDetailLine = {
  id: string;
  productName?: string;
  productVariantId?: string;
  productVariantName?: string;
  productVariantCode?: string;
  quantity?: number | null;
  currency?: Currency | null;
  unitPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  lineTotal?: number | null;
  campaignCode?: string | null;
};

export type SaleDetail = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
  receiptNo?: string;
  storeId?: string;
  storeName?: string;
  storeAddress?: string | null;
  name?: string;
  surname?: string;
  phoneNumber?: string | null;
  email?: string | null;
  source?: string | null;
  note?: string | null;
  unitPrice?: number | null;
  lineTotal?: number | null;
  lines: SaleDetailLine[];
  cancelledAt?: string | null;
};

export type GetSalesParams = {
  storeIds?: string[];
  page?: number;
  limit?: number;
  includeLines?: boolean;
  receiptNo?: string;
  name?: string;
  surname?: string;
  status?: string[];
  minUnitPrice?: number;
  maxUnitPrice?: number;
  minLineTotal?: number;
  maxLineTotal?: number;
};

function buildSalesQuery({
  storeIds,
  page = 1,
  limit = 10,
  includeLines = false,
  receiptNo,
  name,
  surname,
  status,
  minUnitPrice,
  maxUnitPrice,
  minLineTotal,
  maxLineTotal,
}: GetSalesParams): string {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    includeLines: String(includeLines),
  });

  (storeIds ?? []).forEach((storeId) => {
    if (storeId) query.append("storeIds", storeId);
  });
  if (receiptNo) query.append("receiptNo", receiptNo);
  if (name) query.append("name", name);
  if (surname) query.append("surname", surname);
  (status ?? []).forEach((statusValue) => {
    if (statusValue) query.append("status", statusValue);
  });
  if (minUnitPrice != null) query.append("minUnitPrice", String(minUnitPrice));
  if (maxUnitPrice != null) query.append("maxUnitPrice", String(maxUnitPrice));
  if (minLineTotal != null) query.append("minLineTotal", String(minLineTotal));
  if (maxLineTotal != null) query.append("maxLineTotal", String(maxLineTotal));

  return query.toString();
}

export async function createSale(payload: CreateSalePayload): Promise<unknown> {
  return apiFetch<unknown>("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getSales(params: GetSalesParams): Promise<GetSalesResponse> {
  const query = buildSalesQuery(params);
  return apiFetch<GetSalesResponse>(`/sales?${query}`);
}

export async function cancelSale(id: string): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${id}/cancel`, {
    method: "POST",
  });
}

export async function getSaleById(id: string): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${id}`);
}
