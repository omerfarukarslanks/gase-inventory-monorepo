"use client";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type UserForm = {
  name: string;
  surname: string;
  role: string;
  email: string;
  password: string;
  storeId: string;
  birthDate: string;
  phoneCountry: string;
  phone: string;
  gender: Gender;
  address: string;
  country: string;
  city: string;
  district: string;
  avatar: string;
};

export type UserFormErrors = {
  name: string;
  surname: string;
  email: string;
  password: string;
  role: string;
  storeId: string;
};

export const EMPTY_USER_FORM: UserForm = {
  name: "",
  surname: "",
  role: "",
  email: "",
  password: "",
  storeId: "",
  birthDate: "",
  phoneCountry: "TR",
  phone: "",
  gender: "MALE",
  address: "",
  country: "",
  city: "",
  district: "",
  avatar: "",
};

export const EMPTY_USER_FORM_ERRORS: UserFormErrors = {
  name: "",
  surname: "",
  email: "",
  password: "",
  role: "",
  storeId: "",
};
