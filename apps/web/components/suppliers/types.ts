"use client";

export type SupplierForm = {
  name: string;
  surname: string;
  address: string;
  phoneNumber: string;
  email: string;
};

export const EMPTY_FORM: SupplierForm = {
  name: "",
  surname: "",
  address: "",
  phoneNumber: "",
  email: "",
};
