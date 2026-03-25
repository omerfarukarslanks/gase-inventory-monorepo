"use client";

import type { Currency } from "@/lib/products";
import type { StoreType } from "@/lib/stores";

export type StoreForm = {
  name: string;
  storeType: StoreType;
  currency: Currency;
  code: string;
  address: string;
  country: string;
  city: string;
  district: string;
  slug: string;
  logo: string;
  description: string;
  taxIdType: "tckn" | "taxNumber";
  taxIdValue: string;
};

export const EMPTY_FORM: StoreForm = {
  name: "",
  storeType: "RETAIL",
  currency: "TRY",
  code: "",
  address: "",
  country: "",
  city: "",
  district: "",
  slug: "",
  logo: "",
  description: "",
  taxIdType: "tckn",
  taxIdValue: "",
};
