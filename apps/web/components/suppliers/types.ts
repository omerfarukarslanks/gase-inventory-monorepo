"use client";

export type SupplierForm = {
  name: string;
  surname: string;
  address: string;
  phoneNumber: string;
  email: string;
  taxIdType: "tckn" | "taxNumber";
  taxIdValue: string;
};

export const EMPTY_FORM: SupplierForm = {
  name: "",
  surname: "",
  address: "",
  phoneNumber: "",
  email: "",
  taxIdType: "tckn",
  taxIdValue: "",
};
