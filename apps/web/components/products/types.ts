import type { Currency, CreateVariantDto, ProductAttributeInput, ProductVariant } from "@/lib/products";

/* ── Mode types ── */

export type TaxMode = "percent" | "amount";
export type DiscountMode = "percent" | "amount";
export type IsActiveFilter = boolean | "all";

/* ── Form types ── */

export type ProductForm = {
  currency: Currency;
  purchasePrice: string;
  unitPrice: string;
  discountMode: DiscountMode;
  discountPercent: string;
  discountAmount: string;
  taxMode: TaxMode;
  taxPercent: string;
  taxAmount: string;
  name: string;
  sku: string;
  description: string;
  image: string;
  storeIds: string[];
  applyToAllStores: boolean;
  categoryId: string;
  supplierId: string;
};

export type VariantForm = {
  clientKey: string;
  id?: string;
  isActive?: boolean;
  attributes: ProductAttributeInput[];
};

export type FormErrors = Partial<Record<keyof ProductForm | "lineTotal", string>>;

export type VariantErrors = {
  attributes?: string;
};

export type VariantSnapshot = {
  payload: CreateVariantDto;
  isActive: boolean;
};

/* ── Constants ── */

export const EMPTY_PRODUCT_FORM: ProductForm = {
  currency: "TRY",
  purchasePrice: "",
  unitPrice: "",
  discountMode: "percent",
  discountPercent: "",
  discountAmount: "",
  taxMode: "percent",
  taxPercent: "",
  taxAmount: "",
  name: "",
  sku: "",
  description: "",
  image: "",
  storeIds: [],
  applyToAllStores: false,
  categoryId: "",
  supplierId: "",
};

export const CURRENCY_OPTIONS = [
  { value: "TRY", label: "TRY - Turk Lirasi" },
  { value: "USD", label: "USD - Amerikan Dolari" },
  { value: "EUR", label: "EUR - Euro" },
];

export const CURRENCY_FILTER_OPTIONS = [
  { value: "TRY", label: "TRY" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

export const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tum Durumlar" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Pasif" },
];

/* ── Helpers ── */

export function createVariantClientKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `variant-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function areVariantAttributesEqual(a: ProductAttributeInput[], b: ProductAttributeInput[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].id !== b[i].id) return false;
    if (a[i].values.length !== b[i].values.length) return false;
    for (let j = 0; j < a[i].values.length; j++) {
      if (a[i].values[j] !== b[i].values[j]) return false;
    }
  }
  return true;
}

export function normalizeVariantsResponse(payload: unknown): ProductVariant[] {
  if (Array.isArray(payload)) return payload as ProductVariant[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    if (Array.isArray(obj.data)) return obj.data as ProductVariant[];
    if (Array.isArray(obj.items)) return obj.items as ProductVariant[];
  }
  return [];
}

export function parseIsActiveFilter(value: string): IsActiveFilter {
  if (value === "all") return "all";
  return value === "true";
}
