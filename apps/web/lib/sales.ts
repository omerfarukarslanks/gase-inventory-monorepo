import { apiFetch, BASE_URL, ApiError } from "@/lib/api";
import type { Currency } from "@/lib/products";
import { normalizeSalePayment, normalizeSalePaymentsResponse } from "@/lib/sales-normalize";
import { appendIfDefined, appendArray } from "@/lib/query-builder";
import { asObject, getPaginationValue, pickNumber, pickNumberOrNull, pickString } from "@/lib/normalize";

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

export type SaleDetailPackageItem = {
  productVariantId: string;
  productVariantName?: string;
  qtyPerPackage?: number;
};

export type SaleDetailPackageVariantPool = {
  productVariantId: string;
  productVariantName?: string;
  qtyPerPackage?: number;
  sold?: number | null;
  returned?: number | null;
  remaining?: number | null;
};

export type SaleDetailPartialPackage = {
  exists: boolean;
  incompletePackageCount?: number | null;
  missingVariants: string[];
  presentVariants: string[];
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
  originalQuantity?: number | null;
  returnedQuantity?: number | null;
  completePackagesRemaining?: number | null;
  currency?: Currency | null;
  unitPrice?: number | null;
  discountPercent?: number | null;
  discountAmount?: number | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  lineTotal?: number | null;
  campaignCode?: string | null;
  packageItems?: SaleDetailPackageItem[];
  variantPool?: SaleDetailPackageVariantPool[];
  partialPackage?: SaleDetailPartialPackage | null;
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

export type CentralSalePaymentListItem = {
  id: string;
  paymentReference?: string | null;
  saleId?: string | null;
  saleReference?: string | null;
  customerName?: string | null;
  store?: SaleReturnStoreRef | null;
  paymentMethod?: PaymentMethod | string | null;
  amount?: number | null;
  currency?: Currency | string | null;
  paidAt?: string | null;
  status?: PaymentStatus | null;
  note?: string | null;
};

export type CentralSalePaymentDetail = CentralSalePaymentListItem & {
  exchangeRate?: number | null;
  amountInBaseCurrency?: number | null;
  cancelledAt?: string | null;
  cancelledById?: string | null;
};

export type CentralSalePaymentsResponse = {
  data: CentralSalePaymentListItem[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type GetCentralSalePaymentsParams = {
  page?: number;
  limit?: number;
  storeId?: string;
  paymentMethod?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  q?: string;
};

export type SaleReturnStoreRef = {
  id: string;
  name?: string;
};

export type SaleReturnCustomerRef = {
  id: string;
  name?: string;
  surname?: string;
  phoneNumber?: string | null;
  email?: string | null;
};

export type SaleReturnPackageVariant = {
  productVariantId: string;
  productName?: string | null;
  variantName?: string | null;
  quantity: number;
};

export type SaleReturnLineSaleLine = {
  id: string;
  productType?: string | null;
  productId?: string | null;
  productName?: string | null;
  productVariantId?: string | null;
  variantName?: string | null;
  productPackageId?: string | null;
  packageName?: string | null;
  currency?: Currency | null;
};

export type SaleReturnLine = {
  id: string;
  saleLineId: string;
  quantity?: number | null;
  refundAmount?: number | null;
  packageVariantReturns?: SaleReturnPackageVariant[] | null;
  saleLine?: SaleReturnLineSaleLine | null;
};

export type SaleReturnListItem = {
  id: string;
  returnNo?: string | null;
  saleId?: string | null;
  saleReference?: string | null;
  returnedAt?: string | null;
  notes?: string | null;
  lineCount: number;
  totalRefundAmount?: number | null;
  store?: SaleReturnStoreRef | null;
  customer?: SaleReturnCustomerRef | null;
};

export type SaleReturnDetail = SaleReturnListItem & {
  lines: SaleReturnLine[];
};

export type SaleReturnsListResponse = {
  data: SaleReturnListItem[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type GetCentralSaleReturnsParams = {
  page?: number;
  limit?: number;
  storeId?: string;
  startDate?: string;
  endDate?: string;
  q?: string;
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

  appendArray(query, "storeIds", storeIds);
  appendIfDefined(query, "receiptNo", receiptNo);
  appendIfDefined(query, "name", name);
  appendIfDefined(query, "surname", surname);
  appendArray(query, "status", status);
  appendIfDefined(query, "paymentStatus", paymentStatus);
  appendIfDefined(query, "minUnitPrice", minUnitPrice);
  appendIfDefined(query, "maxUnitPrice", maxUnitPrice);
  appendIfDefined(query, "minLineTotal", minLineTotal);
  appendIfDefined(query, "maxLineTotal", maxLineTotal);

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
  lines?: UpdateSaleLinePayload[];
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
      paidAt: payload.paidAt ?? null,
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

export type PackageVariantReturn = {
  productVariantId: string;
  quantity: number;
};

export type CreateSaleReturnLine = {
  saleLineId: string;
  quantity?: number;
  packageVariantReturns?: PackageVariantReturn[];
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

function normalizeSaleReturnPackageVariant(payload: unknown): SaleReturnPackageVariant | null {
  const item = asObject(payload);
  if (!item) return null;

  const productVariantId = pickString(item.productVariantId, item.variantId);
  if (!productVariantId) return null;

  return {
    productVariantId,
    productName: pickString(item.productName) || null,
    variantName: pickString(item.variantName) || null,
    quantity: pickNumber(item.quantity),
  };
}

function normalizeCentralSalePaymentBase(payload: unknown): CentralSalePaymentListItem | null {
  const item = asObject(payload);
  if (!item) return null;

  const store = asObject(item.store);
  const id = pickString(item.id);
  if (!id) return null;

  return {
    id,
    paymentReference: pickString(item.paymentReference) || null,
    saleId: pickString(item.saleId) || null,
    saleReference: pickString(item.saleReference) || null,
    customerName: pickString(item.customerName) || null,
    store: store
      ? {
          id: pickString(store.id, item.storeId),
          name: pickString(store.name, item.storeName) || undefined,
        }
      : pickString(item.storeId)
        ? {
            id: pickString(item.storeId),
            name: pickString(item.storeName) || undefined,
          }
        : null,
    paymentMethod: (pickString(item.paymentMethod) || null) as PaymentMethod | string | null,
    amount: pickNumberOrNull(item.amount),
    currency: (pickString(item.currency) || null) as Currency | string | null,
    paidAt: pickString(item.paidAt) || null,
    status: (pickString(item.status) || null) as PaymentStatus | null,
    note: pickString(item.note) || null,
  };
}

function normalizeCentralSalePaymentDetail(payload: unknown): CentralSalePaymentDetail | null {
  const base = normalizeCentralSalePaymentBase(payload);
  const item = asObject(payload);
  if (!base || !item) return null;

  return {
    ...base,
    exchangeRate: pickNumberOrNull(item.exchangeRate),
    amountInBaseCurrency: pickNumberOrNull(item.amountInBaseCurrency),
    cancelledAt: pickString(item.cancelledAt) || null,
    cancelledById: pickString(item.cancelledById) || null,
  };
}

function normalizeSaleReturnLine(payload: unknown): SaleReturnLine | null {
  const item = asObject(payload);
  if (!item) return null;

  const saleLine = asObject(item.saleLine);
  const id = pickString(item.id);
  const saleLineId = pickString(item.saleLineId, saleLine?.id);

  if (!id || !saleLineId) return null;

  return {
    id,
    saleLineId,
    quantity: pickNumberOrNull(item.quantity),
    refundAmount: pickNumberOrNull(item.refundAmount),
    packageVariantReturns: Array.isArray(item.packageVariantReturns)
      ? item.packageVariantReturns
          .map((variant) => normalizeSaleReturnPackageVariant(variant))
          .filter((variant): variant is SaleReturnPackageVariant => Boolean(variant))
      : null,
    saleLine: saleLine
      ? {
          id: pickString(saleLine.id, item.saleLineId),
          productType: pickString(saleLine.productType) || null,
          productId: pickString(saleLine.productId) || null,
          productName: pickString(saleLine.productName) || null,
          productVariantId: pickString(saleLine.productVariantId) || null,
          variantName: pickString(saleLine.variantName) || null,
          productPackageId: pickString(saleLine.productPackageId) || null,
          packageName: pickString(saleLine.packageName) || null,
          currency: (pickString(saleLine.currency) || null) as Currency | null,
        }
      : null,
  };
}

function normalizeSaleReturnBase(payload: unknown): SaleReturnListItem | null {
  const item = asObject(payload);
  if (!item) return null;

  const store = asObject(item.store);
  const customer = asObject(item.customer);
  const id = pickString(item.id);

  if (!id) return null;

  return {
    id,
    returnNo: pickString(item.returnNo) || null,
    saleId: pickString(item.saleId) || null,
    saleReference: pickString(item.saleReference, item.receiptNo) || null,
    returnedAt: pickString(item.returnedAt, item.createdAt) || null,
    notes: pickString(item.notes) || null,
    lineCount: pickNumber(item.lineCount, Array.isArray(item.lines) ? item.lines.length : 0),
    totalRefundAmount: pickNumberOrNull(item.totalRefundAmount),
    store: store
      ? {
          id: pickString(store.id, item.storeId),
          name: pickString(store.name, item.storeName) || undefined,
        }
      : pickString(item.storeId)
        ? {
            id: pickString(item.storeId),
            name: pickString(item.storeName) || undefined,
          }
        : null,
    customer: customer
      ? {
          id: pickString(customer.id, item.customerId),
          name: pickString(customer.name) || undefined,
          surname: pickString(customer.surname) || undefined,
          phoneNumber: pickString(customer.phoneNumber) || null,
          email: pickString(customer.email) || null,
        }
      : pickString(item.customerId)
        ? {
            id: pickString(item.customerId),
            name: pickString(item.name) || undefined,
            surname: pickString(item.surname) || undefined,
            phoneNumber: pickString(item.phoneNumber) || null,
            email: pickString(item.email) || null,
          }
        : null,
  };
}

function normalizeSaleReturnDetail(payload: unknown): SaleReturnDetail | null {
  const base = normalizeSaleReturnBase(payload);
  const item = asObject(payload);
  if (!base || !item) return null;

  return {
    ...base,
    lines: Array.isArray(item.lines)
      ? item.lines
          .map((line) => normalizeSaleReturnLine(line))
          .filter((line): line is SaleReturnLine => Boolean(line))
      : [],
  };
}

function buildCentralSaleReturnsQuery({
  page = 1,
  limit = 10,
  storeId,
  startDate,
  endDate,
  q,
}: GetCentralSaleReturnsParams): string {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  appendIfDefined(query, "storeId", storeId);
  appendIfDefined(query, "startDate", startDate);
  appendIfDefined(query, "endDate", endDate);
  appendIfDefined(query, "q", q);

  return query.toString();
}

function buildCentralSalePaymentsQuery({
  page = 1,
  limit = 10,
  storeId,
  paymentMethod,
  status,
  startDate,
  endDate,
  q,
}: GetCentralSalePaymentsParams): string {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  appendIfDefined(query, "storeId", storeId);
  appendIfDefined(query, "paymentMethod", paymentMethod);
  appendIfDefined(query, "status", status);
  appendIfDefined(query, "startDate", startDate);
  appendIfDefined(query, "endDate", endDate);
  appendIfDefined(query, "q", q);

  return query.toString();
}

export async function getCentralSaleReturns(
  params: GetCentralSaleReturnsParams,
): Promise<SaleReturnsListResponse> {
  const query = buildCentralSaleReturnsQuery(params);
  const payload = await apiFetch<unknown>(`/sales/returns?${query}`);
  const root = asObject(payload);
  const rawItems = Array.isArray(root?.data) ? root.data : [];

  return {
    data: rawItems
      .map((item) => normalizeSaleReturnBase(item))
      .filter((item): item is SaleReturnListItem => Boolean(item)),
    meta: {
      total: getPaginationValue(payload, "total") || undefined,
      page: getPaginationValue(payload, "page") || undefined,
      limit: getPaginationValue(payload, "limit") || undefined,
      totalPages: getPaginationValue(payload, "totalPages") || undefined,
    },
  };
}

export async function getCentralSaleReturn(id: string): Promise<SaleReturnDetail | null> {
  const payload = await apiFetch<unknown>(`/sales/returns/${id}`);
  return normalizeSaleReturnDetail(payload);
}

export async function getCentralSalePayments(
  params: GetCentralSalePaymentsParams,
): Promise<CentralSalePaymentsResponse> {
  const query = buildCentralSalePaymentsQuery(params);
  const payload = await apiFetch<unknown>(`/sales/payments?${query}`);
  const root = asObject(payload);
  const rawItems = Array.isArray(root?.data) ? root.data : [];

  return {
    data: rawItems
      .map((item) => normalizeCentralSalePaymentBase(item))
      .filter((item): item is CentralSalePaymentListItem => Boolean(item)),
    meta: {
      total: getPaginationValue(payload, "total") || undefined,
      page: getPaginationValue(payload, "page") || undefined,
      limit: getPaginationValue(payload, "limit") || undefined,
      totalPages: getPaginationValue(payload, "totalPages") || undefined,
    },
  };
}

export async function getCentralSalePayment(id: string): Promise<CentralSalePaymentDetail | null> {
  const payload = await apiFetch<unknown>(`/sales/payments/${id}`);
  return normalizeCentralSalePaymentDetail(payload);
}
