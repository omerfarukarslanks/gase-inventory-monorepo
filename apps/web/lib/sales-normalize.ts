import { asObject, pickString, pickNumberOrNull } from "@/lib/normalize";
import type { Currency } from "@/lib/products";
import type {
  GetSalesResponse,
  SalePayment,
  SaleListItem,
  SaleListLine,
  SaleDetail,
  SaleDetailLine,
} from "@/lib/sales";

export function normalizeSalePayment(payload: unknown): SalePayment | null {
  const item = asObject(payload);
  if (!item) return null;

  const id = pickString(item.id);
  if (!id) return null;

  return {
    id,
    createdAt: pickString(item.createdAt) || undefined,
    createdById: pickString(item.createdById) || null,
    updatedAt: pickString(item.updatedAt) || undefined,
    updatedById: pickString(item.updatedById) || null,
    amount: pickNumberOrNull(item.amount),
    paymentMethod: pickString(item.paymentMethod) || null,
    note: typeof item.note === "string" ? item.note : null,
    paidAt: pickString(item.paidAt) || null,
    status: pickString(item.status) || null,
    cancelledAt: pickString(item.cancelledAt) || null,
    cancelledById: pickString(item.cancelledById) || null,
    currency: pickString(item.currency) || null,
    exchangeRate: pickNumberOrNull(item.exchangeRate),
    amountInBaseCurrency: pickNumberOrNull(item.amountInBaseCurrency),
  };
}

export function normalizeSalePaymentsResponse(payload: unknown): SalePayment[] {
  const root = asObject(payload);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.data)
      ? root?.data
      : Array.isArray(root?.items)
        ? root?.items
        : [];

  return rawItems
    .map((item) => normalizeSalePayment(item))
    .filter((item): item is SalePayment => Boolean(item));
}

export function normalizeSalesResponse(payload: unknown): GetSalesResponse {
  const root = asObject(payload);
  const metaNode = asObject(root?.meta);
  const rawItems = Array.isArray(root?.data)
    ? root?.data
    : Array.isArray(root?.items)
      ? root?.items
      : Array.isArray(payload)
        ? payload
        : [];

  const data: SaleListItem[] = rawItems
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const customer = asObject(item.customer);
      const payment = asObject(item.payment);
      const initialPayment = asObject(item.initialPayment);
      const lineRaw = Array.isArray(item.lines) ? item.lines : [];
      const lines: SaleListLine[] = lineRaw
        .map((line) => asObject(line))
        .filter((line): line is Record<string, unknown> => Boolean(line))
        .map((line, lineIndex) => ({
          id: pickString(
            line.id,
            line.saleLineId,
            line.productVariantId,
            `line-${lineIndex}`,
          ),
          productVariantId: pickString(line.productVariantId, line.variantId) || undefined,
          productVariantName:
            pickString(
              line.productVariantName,
              line.variantName,
              asObject(line.productVariant)?.name,
            ) || undefined,
          quantity: pickNumberOrNull(line.quantity) ?? undefined,
          currency: (pickString(line.currency) || null) as Currency | null,
          unitPrice: pickNumberOrNull(line.unitPrice),
          discountPercent: pickNumberOrNull(line.discountPercent),
          discountAmount: pickNumberOrNull(line.discountAmount),
          taxPercent: pickNumberOrNull(line.taxPercent),
          taxAmount: pickNumberOrNull(line.taxAmount),
          lineTotal: pickNumberOrNull(line.lineTotal),
        }));

      return {
        id: pickString(item.id),
        receiptNo: pickString(item.receiptNo, item.receiptNumber) || undefined,
        createdAt: pickString(item.createdAt) || undefined,
        updatedAt: pickString(item.updatedAt) || undefined,
        status: pickString(item.status) || undefined,
        storeId: pickString(item.storeId, asObject(item.store)?.id) || undefined,
        storeName: pickString(item.storeName, asObject(item.store)?.name) || undefined,
        name: pickString(item.name, customer?.name) || undefined,
        surname: pickString(item.surname, customer?.surname) || undefined,
        phoneNumber: pickString(item.phoneNumber, customer?.phoneNumber) || null,
        email: pickString(item.email, customer?.email) || null,
        unitPrice: pickNumberOrNull(item.unitPrice, lineRaw[0] && asObject(lineRaw[0])?.unitPrice),
        lineTotal: pickNumberOrNull(item.lineTotal, item.total, item.totalAmount, item.grandTotal),
        lineCount: pickNumberOrNull(item.lineCount, item.totalLines) ?? lines.length,
        total: pickNumberOrNull(item.total, item.lineTotal, item.totalAmount, item.grandTotal),
        paidAmount: pickNumberOrNull(item.paidAmount, payment?.paidAmount, initialPayment?.amount),
        remainingAmount: pickNumberOrNull(item.remainingAmount, payment?.remainingAmount),
        paymentStatus: pickString(item.paymentStatus, payment?.status) || null,
        customerId: pickString(item.customerId, customer?.id) || undefined,
        currency: (pickString(item.currency) || null) as Currency | null,
        lines: lines.length > 0 ? lines : undefined,
      };
    })
    .filter((item) => Boolean(item.id));

  const page = Number(metaNode?.page ?? root?.page ?? 1) || 1;
  const limit = Number(metaNode?.limit ?? root?.limit ?? 10) || 10;
  const total = Number(metaNode?.total ?? root?.total ?? data.length) || data.length;
  const totalPages = Number(metaNode?.totalPages ?? root?.totalPages ?? Math.max(1, Math.ceil(total / limit))) || 1;

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export function normalizeSaleDetail(payload: unknown): SaleDetail | null {
  const root = asObject(payload);
  if (!root) return null;

  const store = asObject(root.store);
  const customer = asObject(root.customer);
  const payment = asObject(root.payment);
  const initialPayment = asObject(root.initialPayment);
  const meta = asObject(root.meta);
  const rawLines = Array.isArray(root.lines) ? root.lines : [];
  const lines: SaleDetailLine[] = rawLines
    .map((line) => asObject(line))
    .filter((line): line is Record<string, unknown> => Boolean(line))
    .map((line, index) => {
      const variant = asObject(line.productVariant);
      return {
        id: pickString(line.id, line.saleLineId, `line-${index}`),
        productName: pickString(line.productName, asObject(line.product)?.name) || undefined,
        productVariantId: pickString(line.productVariantId, variant?.id) || undefined,
        productVariantName: pickString(line.productVariantName, line.variantName, variant?.name) || undefined,
        productVariantCode: pickString(line.productVariantCode, line.variantCode, variant?.code) || undefined,
        quantity: pickNumberOrNull(line.quantity),
        currency: (pickString(line.currency) || null) as Currency | null,
        unitPrice: pickNumberOrNull(line.unitPrice),
        discountPercent: pickNumberOrNull(line.discountPercent),
        discountAmount: pickNumberOrNull(line.discountAmount),
        taxPercent: pickNumberOrNull(line.taxPercent),
        taxAmount: pickNumberOrNull(line.taxAmount),
        lineTotal: pickNumberOrNull(line.lineTotal),
        campaignCode: pickString(line.campaignCode) || null,
      };
    });

  const id = pickString(root.id);
  if (!id) return null;

  return {
    id,
    createdAt: pickString(root.createdAt) || undefined,
    updatedAt: pickString(root.updatedAt) || undefined,
    status: pickString(root.status) || undefined,
    receiptNo: pickString(root.receiptNo) || undefined,
    storeId: pickString(root.storeId, store?.id) || undefined,
    storeName: pickString(root.storeName, store?.name) || undefined,
    storeAddress: pickString(store?.address) || null,
    name: pickString(root.name, customer?.name) || undefined,
    surname: pickString(root.surname, customer?.surname) || undefined,
    phoneNumber: pickString(root.phoneNumber, customer?.phoneNumber) || null,
    email: pickString(root.email, customer?.email) || null,
    source: pickString(meta?.source) || null,
    note: pickString(meta?.note) || null,
    unitPrice: pickNumberOrNull(root.unitPrice),
    lineTotal: pickNumberOrNull(root.lineTotal, root.total, root.totalAmount, root.grandTotal),
    paidAmount: pickNumberOrNull(root.paidAmount, payment?.paidAmount, initialPayment?.amount),
    remainingAmount: pickNumberOrNull(root.remainingAmount, payment?.remainingAmount),
    paymentStatus: pickString(root.paymentStatus, payment?.status) || null,
    currency: (pickString(root.currency, lines[0]?.currency) || null) as Currency | null,
    customerId: pickString(root.customerId, customer?.id) || undefined,
    lines,
    cancelledAt: pickString(root.cancelledAt) || null,
  };
}
