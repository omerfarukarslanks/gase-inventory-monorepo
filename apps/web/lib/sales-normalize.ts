import { asObject, pickString, pickNumberOrNull } from "@/lib/normalize";
import type { Currency } from "@/lib/products";
import type {
  GetSalesResponse,
  SaleListItem,
  SaleListLine,
  SaleDetail,
  SaleDetailLine,
} from "@/lib/sales";

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
        name: pickString(item.name) || undefined,
        surname: pickString(item.surname) || undefined,
        phoneNumber: pickString(item.phoneNumber) || null,
        email: pickString(item.email) || null,
        unitPrice: pickNumberOrNull(item.unitPrice, lineRaw[0] && asObject(lineRaw[0])?.unitPrice),
        lineTotal: pickNumberOrNull(item.lineTotal, item.total, item.totalAmount, item.grandTotal),
        lineCount: pickNumberOrNull(item.lineCount, item.totalLines) ?? lines.length,
        total: pickNumberOrNull(item.total, item.lineTotal, item.totalAmount, item.grandTotal),
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
    name: pickString(root.name) || undefined,
    surname: pickString(root.surname) || undefined,
    phoneNumber: pickString(root.phoneNumber) || null,
    email: pickString(root.email) || null,
    source: pickString(meta?.source) || null,
    note: pickString(meta?.note) || null,
    unitPrice: pickNumberOrNull(root.unitPrice),
    lineTotal: pickNumberOrNull(root.lineTotal, root.total, root.totalAmount, root.grandTotal),
    lines,
    cancelledAt: pickString(root.cancelledAt) || null,
  };
}
