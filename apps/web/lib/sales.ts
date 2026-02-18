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

export async function createSale(payload: CreateSalePayload): Promise<unknown> {
  return apiFetch<unknown>("/sales", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

