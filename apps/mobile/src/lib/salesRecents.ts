import * as SecureStore from "expo-secure-store";
import type { Currency } from "@gase/core";

const SALES_RECENTS_KEY = "gase_mobile_sales_recents";
const MAX_RECENT_ITEMS = 5;

export type SalesRecentCustomer = {
  id: string;
  label: string;
  phoneNumber?: string | null;
  lastUsedAt: string;
};

export type SalesRecentVariant = {
  productVariantId: string;
  label: string;
  code?: string | null;
  unitPrice?: string;
  currency: Currency;
  totalQuantity?: number;
  lastUsedAt: string;
};

export type SalesRecents = {
  customers: SalesRecentCustomer[];
  variants: SalesRecentVariant[];
};

function createEmptyRecents(): SalesRecents {
  return { customers: [], variants: [] };
}

function normalizeCurrency(value: unknown): Currency {
  return value === "USD" || value === "EUR" ? value : "TRY";
}

function clampRecentItems<T>(items: T[]): T[] {
  return items.slice(0, MAX_RECENT_ITEMS);
}

export function upsertRecentCustomer(
  current: SalesRecentCustomer[],
  nextCustomer: Omit<SalesRecentCustomer, "lastUsedAt"> & { lastUsedAt?: string },
): SalesRecentCustomer[] {
  const entry: SalesRecentCustomer = {
    ...nextCustomer,
    lastUsedAt: nextCustomer.lastUsedAt ?? new Date().toISOString(),
  };

  return clampRecentItems([entry, ...current.filter((item) => item.id !== entry.id)]);
}

export function upsertRecentVariant(
  current: SalesRecentVariant[],
  nextVariant: Omit<SalesRecentVariant, "lastUsedAt"> & { lastUsedAt?: string },
): SalesRecentVariant[] {
  const entry: SalesRecentVariant = {
    ...nextVariant,
    lastUsedAt: nextVariant.lastUsedAt ?? new Date().toISOString(),
  };

  return clampRecentItems([
    entry,
    ...current.filter((item) => item.productVariantId !== entry.productVariantId),
  ]);
}

export async function readSalesRecents(): Promise<SalesRecents> {
  const raw = await SecureStore.getItemAsync(SALES_RECENTS_KEY);
  if (!raw) return createEmptyRecents();

  try {
    const parsed = JSON.parse(raw) as Partial<SalesRecents>;
    const customers = Array.isArray(parsed.customers)
      ? parsed.customers
          .filter(
            (item): item is SalesRecentCustomer =>
              Boolean(item?.id) && Boolean(item?.label) && Boolean(item?.lastUsedAt),
          )
          .slice(0, MAX_RECENT_ITEMS)
      : [];

    const variants = Array.isArray(parsed.variants)
      ? parsed.variants
          .filter(
            (item): item is SalesRecentVariant =>
              Boolean(item?.productVariantId) && Boolean(item?.label) && Boolean(item?.lastUsedAt),
          )
          .map((item) => ({
            ...item,
            currency: normalizeCurrency(item.currency),
          }))
          .slice(0, MAX_RECENT_ITEMS)
      : [];

    return { customers, variants };
  } catch {
    return createEmptyRecents();
  }
}

export async function writeSalesRecents(value: SalesRecents): Promise<void> {
  await SecureStore.setItemAsync(
    SALES_RECENTS_KEY,
    JSON.stringify({
      customers: clampRecentItems(value.customers),
      variants: clampRecentItems(value.variants),
    }),
  );
}
