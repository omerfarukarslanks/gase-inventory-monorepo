import { asObject, pickNumberOrNull, pickString } from "./normalize";
import type {
  GetSalesResponse,
  SaleDetail,
  SaleDetailLine,
  SaleDetailPackageItem,
  SaleDetailPackageVariantPool,
  SaleDetailPartialPackage,
  SaleListItem,
  SaleListLine,
  SalePayment,
} from "./sales";
import type { Currency } from "./products";

function getPackageItemsSummary(items: unknown): string | undefined {
  if (!Array.isArray(items)) return undefined;

  const parts = items
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const variantName = pickString(
        item.variantName,
        asObject(item.productVariant)?.name,
        asObject(item.variant)?.name,
      );
      if (!variantName) return null;
      const qty = pickString(item.qtyPerPackage, item.quantity, item.qty);
      return qty ? `${variantName} (x${qty})` : variantName;
    })
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) return undefined;
  return parts.join(", ");
}

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
      ? root.data
      : Array.isArray(root?.items)
        ? root.items
        : [];

  return rawItems
    .map((item) => normalizeSalePayment(item))
    .filter((item): item is SalePayment => Boolean(item));
}

export function normalizeSalesResponse(payload: unknown): GetSalesResponse {
  const root = asObject(payload);
  const metaNode = asObject(root?.meta);
  const rawItems = Array.isArray(root?.data)
    ? root.data
    : Array.isArray(root?.items)
      ? root.items
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
        .map((line, lineIndex) => {
          const packageNode = asObject(line.productPackage);
          const packageItemsSummary = getPackageItemsSummary(packageNode?.items);

          return {
            id: pickString(
              line.id,
              line.saleLineId,
              line.productVariantId,
              line.productPackageId,
              `line-${lineIndex}`,
            ),
            productVariantId: pickString(line.productVariantId, line.variantId) || undefined,
            productPackageId: pickString(line.productPackageId, line.packageId) || undefined,
            productVariantName:
              pickString(
                line.productVariantName,
                line.variantName,
                asObject(line.productVariant)?.name,
                packageItemsSummary,
              ) || undefined,
            productPackageName:
              pickString(
                line.productPackageName,
                line.packageName,
                packageNode?.name,
              ) || undefined,
            quantity: pickNumberOrNull(line.quantity) ?? undefined,
            currency: (pickString(line.currency) || null) as Currency | null,
            unitPrice: pickNumberOrNull(line.unitPrice),
            discountPercent: pickNumberOrNull(line.discountPercent),
            discountAmount: pickNumberOrNull(line.discountAmount),
            taxPercent: pickNumberOrNull(line.taxPercent),
            taxAmount: pickNumberOrNull(line.taxAmount),
            lineTotal: pickNumberOrNull(line.lineTotal),
          };
        });

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
      const packageNode = asObject(line.productPackage);
      const packageItemsSummary = getPackageItemsSummary(packageNode?.items);
      const rawPackageItems = Array.isArray(packageNode?.items) ? (packageNode.items as unknown[]) : [];
      const packageItems: SaleDetailPackageItem[] = rawPackageItems
        .map((item) => asObject(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .reduce<SaleDetailPackageItem[]>((acc, item) => {
          const itemVariant = asObject(item.productVariant);
          const productVariantId = pickString(item.productVariantId, item.variantId, itemVariant?.id);
          if (!productVariantId) return acc;
          acc.push({
            productVariantId,
            productVariantName: pickString(item.variantName, itemVariant?.name) || undefined,
            qtyPerPackage: pickNumberOrNull(item.qtyPerPackage, item.quantity, item.qty) ?? undefined,
          });
          return acc;
        }, []);

      const rawVariantPool = Array.isArray(packageNode?.variantPool) ? (packageNode.variantPool as unknown[]) : [];
      const variantPool: SaleDetailPackageVariantPool[] = rawVariantPool
        .map((item) => asObject(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .reduce<SaleDetailPackageVariantPool[]>((acc, item) => {
          const productVariantId = pickString(item.variantId, item.productVariantId);
          if (!productVariantId) return acc;
          acc.push({
            productVariantId,
            productVariantName: pickString(item.variantName, item.productVariantName) || undefined,
            qtyPerPackage: pickNumberOrNull(item.qtyPerPackage) ?? undefined,
            sold: pickNumberOrNull(item.sold),
            returned: pickNumberOrNull(item.returned),
            remaining: pickNumberOrNull(item.remaining),
          });
          return acc;
        }, []);

      const partialPackageNode = asObject(packageNode?.partialPackage);
      const partialPackage: SaleDetailPartialPackage | null = partialPackageNode
        ? {
            exists: Boolean(partialPackageNode.exists),
            incompletePackageCount: pickNumberOrNull(partialPackageNode.incompletePackageCount),
            missingVariants: Array.isArray(partialPackageNode.missingVariants)
              ? partialPackageNode.missingVariants.filter((value): value is string => typeof value === "string")
              : [],
            presentVariants: Array.isArray(partialPackageNode.presentVariants)
              ? partialPackageNode.presentVariants.filter((value): value is string => typeof value === "string")
              : [],
          }
        : null;

      return {
        id: pickString(line.id, line.saleLineId, `line-${index}`),
        productName: pickString(line.productName, asObject(line.product)?.name, packageNode?.name) || undefined,
        productVariantId: pickString(line.productVariantId, variant?.id) || undefined,
        productPackageId: pickString(line.productPackageId, packageNode?.id) || undefined,
        productVariantName:
          pickString(
            line.productVariantName,
            line.variantName,
            variant?.name,
            packageItemsSummary,
          ) || undefined,
        productPackageName:
          pickString(line.productPackageName, line.packageName, packageNode?.name) || undefined,
        productVariantCode: pickString(line.productVariantCode, variant?.code) || undefined,
        quantity: pickNumberOrNull(line.quantity),
        originalQuantity: pickNumberOrNull(line.originalQuantity),
        returnedQuantity: pickNumberOrNull(line.returnedQuantity),
        completePackagesRemaining: pickNumberOrNull(packageNode?.completePackagesRemaining),
        currency: (pickString(line.currency) || null) as Currency | null,
        unitPrice: pickNumberOrNull(line.unitPrice),
        discountPercent: pickNumberOrNull(line.discountPercent),
        discountAmount: pickNumberOrNull(line.discountAmount),
        taxPercent: pickNumberOrNull(line.taxPercent),
        taxAmount: pickNumberOrNull(line.taxAmount),
        lineTotal: pickNumberOrNull(line.lineTotal),
        campaignCode: pickString(line.campaignCode) || null,
        packageItems,
        variantPool,
        partialPackage,
      };
    });

  return {
    id: pickString(root.id),
    createdAt: pickString(root.createdAt) || undefined,
    updatedAt: pickString(root.updatedAt) || undefined,
    status: pickString(root.status) || undefined,
    receiptNo: pickString(root.receiptNo, root.receiptNumber) || undefined,
    storeId: pickString(root.storeId, store?.id) || undefined,
    storeName: pickString(root.storeName, store?.name) || undefined,
    storeAddress: pickString(root.storeAddress, store?.address) || null,
    name: pickString(root.name, customer?.name) || undefined,
    surname: pickString(root.surname, customer?.surname) || undefined,
    phoneNumber: pickString(root.phoneNumber, customer?.phoneNumber) || null,
    email: pickString(root.email, customer?.email) || null,
    source: pickString(root.source, meta?.source) || null,
    note: pickString(root.note, meta?.note) || null,
    unitPrice: pickNumberOrNull(root.unitPrice),
    lineTotal: pickNumberOrNull(root.lineTotal, root.total, root.totalAmount, root.grandTotal),
    paidAmount: pickNumberOrNull(root.paidAmount, payment?.paidAmount, initialPayment?.amount),
    remainingAmount: pickNumberOrNull(root.remainingAmount, payment?.remainingAmount),
    paymentStatus: pickString(root.paymentStatus, payment?.status) || null,
    currency: (pickString(root.currency) || null) as Currency | null,
    customerId: pickString(root.customerId, customer?.id) || undefined,
    lines,
    cancelledAt: pickString(root.cancelledAt) || null,
  };
}
