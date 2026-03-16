import type { Customer, InventoryVariantStockItem, PaymentMethod } from "@gase/core";
import { normalizeTurkishLookup } from "@gase/core";
import { formatCount, toNullableNumber, toNumber } from "@/src/lib/format";
import type { SalesRecentCustomer, SalesRecentVariant } from "@/src/lib/salesRecents";
import type { SalesDraftSeed } from "@/src/lib/workflows";
import type { SalesComposerDraft, SalesComposerLine, ReturnLineState, VariantQuickPick } from "./types";

export const saleStatusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Onayli", value: "CONFIRMED" as const },
  { label: "Iptal", value: "CANCELLED" as const },
];

export const paymentMethodOptions = [
  { label: "Nakit", value: "CASH" as const },
  { label: "Kart", value: "CARD" as const },
  { label: "Transfer", value: "TRANSFER" as const },
  { label: "Diger", value: "OTHER" as const },
];

export const composerStepOptions = [
  { label: "Musteri", value: "customer" as const },
  { label: "Urunler", value: "items" as const },
  { label: "Odeme", value: "payment" as const },
  { label: "Onay", value: "review" as const },
];

export function createLine(): SalesComposerLine {
  return {
    id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variantId: "",
    label: "Varyant secilmedi",
    quantity: "1",
    unitPrice: "",
    currency: "TRY",
  };
}

export function createDraft(storeId = ""): SalesComposerDraft {
  return {
    storeId,
    customerId: "",
    customerLabel: "Musteri sec",
    note: "",
    paymentAmount: "",
    paymentMethod: "CASH" as PaymentMethod,
    lines: [createLine()],
  };
}

export function applySeedToDraft(
  draft: SalesComposerDraft,
  seed: SalesDraftSeed | undefined,
): SalesComposerDraft {
  if (!seed) return draft;

  const nextDraft = { ...draft, lines: [...draft.lines] };

  if (seed.customerId) {
    nextDraft.customerId = seed.customerId;
    nextDraft.customerLabel = seed.customerLabel ?? "Musteri sec";
  }

  if (seed.note) {
    nextDraft.note = seed.note;
  }

  if (seed.variantId) {
    const targetLine = nextDraft.lines[0] ?? createLine();
    nextDraft.lines = [
      {
        ...targetLine,
        variantId: seed.variantId,
        label: seed.variantLabel ?? targetLine.label,
        unitPrice: seed.unitPrice ?? targetLine.unitPrice,
        currency: seed.currency ?? targetLine.currency,
      },
      ...nextDraft.lines.slice(1),
    ];
  }

  if (seed.variantBarcode) {
    nextDraft.variantBarcodeQuery = seed.variantBarcode;
  }

  return nextDraft;
}

export function normalizeLookupValue(value: string | undefined): string {
  return value != null ? normalizeTurkishLookup(value) : "";
}

export function scoreVariantMatch(query: string, variant: InventoryVariantStockItem): number {
  const lookup = normalizeLookupValue(query);
  if (!lookup) return 0;

  const variantCode = normalizeLookupValue(variant.variantCode);
  const variantName = normalizeLookupValue(variant.variantName);

  if (variantCode && variantCode === lookup) return 500;
  if (variantName === lookup) return 360;
  if (variantCode && variantCode.startsWith(lookup)) return 260;
  if (variantName.startsWith(lookup)) return 180;
  if (variantCode && variantCode.includes(lookup)) return 120;
  if (variantName.includes(lookup)) return 60;
  return 0;
}

export function getPreferredStoreSummary(
  variant: InventoryVariantStockItem,
  storeId: string,
) {
  return variant.stores?.find((item) => item.storeId === storeId) ?? variant.stores?.[0];
}

export function createRecentCustomerEntry(customer: Customer): SalesRecentCustomer {
  return {
    id: customer.id,
    label: `${customer.name} ${customer.surname}`.trim(),
    phoneNumber: customer.phoneNumber,
    lastUsedAt: new Date().toISOString(),
  };
}

export function createVariantQuickPick(
  variant: InventoryVariantStockItem,
  storeId: string,
): VariantQuickPick {
  const storeSummary = getPreferredStoreSummary(variant, storeId);

  return {
    productVariantId: variant.productVariantId,
    label: variant.variantName,
    code: variant.variantCode,
    unitPrice: String(storeSummary?.salePrice ?? storeSummary?.unitPrice ?? ""),
    currency: ((storeSummary?.currency ?? "TRY") as "TRY" | "USD" | "EUR"),
    totalQuantity: variant.totalQuantity,
  };
}

export function createQuickPickFromRecent(variant: SalesRecentVariant): VariantQuickPick {
  return {
    productVariantId: variant.productVariantId,
    label: variant.label,
    code: variant.code,
    unitPrice: variant.unitPrice,
    currency: variant.currency,
    totalQuantity: variant.totalQuantity,
  };
}

export function validateComposerLine(line: SalesComposerLine) {
  if (!line.variantId) {
    return { variant: "Barkod veya varyant secin.", quantity: "", unitPrice: "" };
  }

  if (!line.quantity.trim()) {
    return { variant: "", quantity: "Miktar zorunlu.", unitPrice: "" };
  }

  if (toNumber(line.quantity) <= 0) {
    return { variant: "", quantity: "Miktar sifirdan buyuk olmali.", unitPrice: "" };
  }

  if (!line.unitPrice.trim()) {
    return { variant: "", quantity: "", unitPrice: "Birim fiyat zorunlu." };
  }

  if (toNumber(line.unitPrice) <= 0) {
    return { variant: "", quantity: "", unitPrice: "Birim fiyat sifirdan buyuk olmali." };
  }

  return { variant: "", quantity: "", unitPrice: "" };
}

export function validateReturnQuantity(line: ReturnLineState): string {
  if (!line.quantity.trim()) return "";
  const quantity = toNullableNumber(line.quantity);
  if (quantity === null || !Number.isFinite(quantity)) return "Gecerli bir miktar girin.";
  if (quantity < 0) return "Iade miktari negatif olamaz.";
  if (quantity > line.maxQuantity) {
    return `En fazla ${formatCount(line.maxQuantity)} adet iade edilebilir.`;
  }
  return "";
}
