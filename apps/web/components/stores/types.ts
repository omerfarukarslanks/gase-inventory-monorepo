"use client";

import type { Currency } from "@/lib/products";
import type { StoreType } from "@/lib/stores";

export type StoreForm = {
  name: string;
  storeType: StoreType;
  currency: Currency;
  code: string;
  address: string;
  slug: string;
  logo: string;
  description: string;
};

export const EMPTY_FORM: StoreForm = {
  name: "",
  storeType: "RETAIL",
  currency: "TRY",
  code: "",
  address: "",
  slug: "",
  logo: "",
  description: "",
};
