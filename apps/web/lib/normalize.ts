import type { Currency } from "@/lib/products";
import type {
  InventoryStoreStockItem,
  InventoryProductStockItem,
  InventoryVariantStockItem,
} from "@/lib/inventory";

export function asObject(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  return input as Record<string, unknown>;
}

export function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

export function pickNumber(...values: unknown[]) {
  for (const value of values) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return 0;
}

export function pickNumberOrNull(...values: unknown[]): number | null {
  for (const value of values) {
    const numeric = Number(value);
    if (!Number.isNaN(numeric)) return numeric;
  }
  return null;
}

export function normalizeStoreItems(payload: unknown): InventoryStoreStockItem[] {
  const root = asObject(payload);
  const dataNode = asObject(root?.data);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.items)
      ? root?.items
      : Array.isArray(dataNode?.items)
        ? dataNode?.items
        : Array.isArray(root?.data)
          ? root?.data
          : [];

  return rawItems
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      storeId: pickString(item.storeId, asObject(item.store)?.id),
      storeName: pickString(item.storeName, asObject(item.store)?.name, "-"),
      quantity: pickNumber(item.quantity, item.totalQuantity),
      totalQuantity: pickNumber(item.totalQuantity, item.quantity),
      unitPrice:
        item.unitPrice == null
          ? item.salePrice == null
            ? null
            : pickNumber(item.salePrice)
          : pickNumber(item.unitPrice),
      salePrice:
        item.salePrice == null
          ? item.unitPrice == null
            ? null
            : pickNumber(item.unitPrice)
          : pickNumber(item.salePrice),
      purchasePrice: item.purchasePrice == null ? null : pickNumber(item.purchasePrice),
      currency: (pickString(item.currency) || null) as Currency | null,
      taxPercent: item.taxPercent == null ? null : pickNumber(item.taxPercent),
      taxAmount: item.taxAmount == null ? null : pickNumber(item.taxAmount),
      discountPercent: item.discountPercent == null ? null : pickNumber(item.discountPercent),
      discountAmount: item.discountAmount == null ? null : pickNumber(item.discountAmount),
      lineTotal: item.lineTotal == null ? null : pickNumber(item.lineTotal),
      isStoreOverride: Boolean(item.isStoreOverride),
    }));
}

export function normalizeProducts(payload: unknown): InventoryProductStockItem[] {
  const root = asObject(payload);
  const dataNode = asObject(root?.data);
  const rawItems = Array.isArray(root?.items)
    ? root?.items
    : Array.isArray(dataNode?.items)
      ? dataNode?.items
      : Array.isArray(root?.data)
        ? root?.data
        : [];

  return rawItems
    .map((item) => asObject(item))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => {
      const rawVariants = Array.isArray(item.variants) ? item.variants : [];
      const variants: InventoryVariantStockItem[] = rawVariants
        .map((variant) => asObject(variant))
        .filter((variant): variant is Record<string, unknown> => Boolean(variant))
        .map((variant) => ({
          productVariantId: pickString(variant.productVariantId, variant.variantId),
          variantName: pickString(variant.variantName, variant.name, "-"),
          variantCode: pickString(variant.variantCode, variant.code),
          totalQuantity: pickNumber(variant.totalQuantity, variant.quantity),
          stores: normalizeStoreItems(variant.stores),
        }))
        .filter((variant) => Boolean(variant.productVariantId));

      return {
        productId: pickString(item.productId, item.id),
        productName: pickString(item.productName, item.name, "-"),
        totalQuantity: pickNumber(item.totalQuantity, item.quantity),
        variants,
      };
    })
    .filter((product) => Boolean(product.productId));
}

export function getPaginationValue(
  payload: unknown,
  key: "totalPages" | "total" | "page" | "limit",
): number {
  const root = asObject(payload);
  const metaNode = asObject(root?.meta);
  const dataNode = asObject(root?.data);

  const fromRoot = Number(root?.[key]);
  if (!Number.isNaN(fromRoot) && fromRoot > 0) return fromRoot;

  const fromMeta = Number(metaNode?.[key]);
  if (!Number.isNaN(fromMeta) && fromMeta > 0) return fromMeta;

  const fromData = Number(dataNode?.[key]);
  if (!Number.isNaN(fromData) && fromData > 0) return fromData;

  return 0;
}
