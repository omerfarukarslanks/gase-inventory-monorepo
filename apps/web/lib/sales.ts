import { apiFetch, BASE_URL, ApiError } from "@/lib/api";
import type { Currency } from "@/lib/products";
import { normalizeSalePayment, normalizeSalePaymentsResponse } from "@/lib/sales-normalize";

export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "OTHER";
export type PaymentStatus = "ACTIVE" | "CANCELLED" | string;

type SaleLineCommonPayload = {
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

export type CreateSaleLinePayload =
  | (SaleLineCommonPayload & {
      productVariantId: string;
      productPackageId?: never;
    })
  | (SaleLineCommonPayload & {
      productPackageId: string;
      productVariantId?: never;
    });

export type CreateSalePayload = {
  storeId?: string;
  customerId: string;
  meta?: {
    source?: string;
    note?: string;
  };
  lines: CreateSaleLinePayload[];
  initialPayment: {
    amount: number;
    paymentMethod: PaymentMethod;
    note?: string;
    paidAt?: string;
  };
};

export type SaleListLine = {
  id: string;
  productVariantId?: string;
  productPackageId?: string;
  productVariantName?: string;
  productPackageName?: string;
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
  paidAmount?: number | null;
  remainingAmount?: number | null;
  paymentStatus?: string | null;
  customerId?: string;
  currency?: Currency | null;
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
  productPackageId?: string;
  productVariantName?: string;
  productPackageName?: string;
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
  paidAmount?: number | null;
  remainingAmount?: number | null;
  paymentStatus?: string | null;
  currency?: Currency | null;
  customerId?: string;
  lines: SaleDetailLine[];
  cancelledAt?: string | null;
};

export type SalePayment = {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  amount?: number | null;
  paymentMethod?: PaymentMethod | string | null;
  note?: string | null;
  paidAt?: string | null;
  status?: PaymentStatus | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
  currency?: Currency | string | null;
  exchangeRate?: number | null;
  amountInBaseCurrency?: number | null;
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
  paymentStatus?: string;
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
  paymentStatus,
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
  if (paymentStatus) query.append("paymentStatus", paymentStatus);
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

export type CancelSaleMeta = {
  reason?: string;
  note?: string;
};

export async function cancelSale(id: string, meta?: CancelSaleMeta): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ meta }),
  });
}

export type UpdateSaleLinePayload = CreateSaleLinePayload;

export type UpdateSalePayload = {
  storeId?: string;
  customerId: string;
  meta?: {
    source?: string;
    note?: string;
  };
  lines: UpdateSaleLinePayload[];
  initialPayment?: {
    amount: number;
    paymentMethod: PaymentMethod;
    note?: string;
    paidAt?: string;
  };
};

export async function getSaleById(id: string): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${id}`);
}

export async function updateSale(id: string, payload: UpdateSalePayload): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export type CreateSalePaymentPayload = {
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  paidAt?: string;
  currency: Currency;
};

export type UpdateSalePaymentPayload = {
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  paidAt?: string;
  currency: Currency;
};

export async function getSalePayments(saleId: string): Promise<SalePayment[]> {
  const payload = await apiFetch<unknown>(`/sales/${saleId}/payments`);
  return normalizeSalePaymentsResponse(payload);
}

export async function createSalePayment(
  saleId: string,
  payload: CreateSalePaymentPayload,
): Promise<SalePayment> {
  const result = await apiFetch<unknown>(`/sales/${saleId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return (
    normalizeSalePayment(result) ?? {
      id: "",
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      note: payload.note ?? null,
      paidAt: payload.paidAt ?? null,
      currency: payload.currency,
      status: "ACTIVE",
      cancelledAt: null,
    }
  );
}

export async function updateSalePayment(
  saleId: string,
  paymentId: string,
  payload: UpdateSalePaymentPayload,
): Promise<SalePayment> {
  const result = await apiFetch<unknown>(`/sales/${saleId}/payments/${paymentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return (
    normalizeSalePayment(result) ?? {
      id: paymentId,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      note: payload.note ?? null,
      currency: payload.currency,
    }
  );
}

export async function deleteSalePayment(saleId: string, paymentId: string): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${saleId}/payments/${paymentId}`, {
    method: "DELETE",
  });
}

export type AddSaleLinePayload = CreateSaleLinePayload;

export type PatchSaleLinePayload = {
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  lineTotal?: number;
  currency?: Currency;
  campaignCode?: string;
};

export async function addSaleLine(
  saleId: string,
  payload: AddSaleLinePayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${saleId}/lines`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSaleLine(
  saleId: string,
  lineId: string,
  payload: PatchSaleLinePayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${saleId}/lines/${lineId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function removeSaleLine(saleId: string, lineId: string): Promise<void> {
  await apiFetch<void>(`/sales/${saleId}/lines/${lineId}`, { method: "DELETE" });
}

export type CreateSaleReturnLine = {
  saleLineId: string;
  quantity: number;
  refundAmount?: number;
};

export type CreateSaleReturnPayload = {
  lines: CreateSaleReturnLine[];
  notes?: string;
};

export async function createSaleReturn(
  saleId: string,
  payload: CreateSaleReturnPayload,
): Promise<unknown> {
  return apiFetch<unknown>(`/sales/${saleId}/returns`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function downloadSaleReceipt(saleId: string): Promise<Blob> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(`${BASE_URL}/sales/${saleId}/receipt`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new ApiError(`Fis indirilemedi (${res.status})`, res.status);
  }
  return res.blob();
}
