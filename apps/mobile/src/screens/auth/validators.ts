// ─── Auth form validation ──────────────────────────────────────────────────

import { EMAIL_PATTERN, PASSWORD_PATTERN } from "@gase/core";

/** @deprecated Use EMAIL_PATTERN from @gase/core */
export const EMAIL_REGEX = EMAIL_PATTERN;
/** @deprecated Use PASSWORD_PATTERN from @gase/core */
export const STRONG_PASSWORD_REGEX = PASSWORD_PATTERN;

export type LoginFormState = { email: string; password: string };
export type SignupFormState = {
  tenantName: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  confirmPassword: string;
};
export type RecoveryFormState = {
  email: string;
  token: string;
  password: string;
  confirmPassword: string;
};

export function validateLoginForm(
  form: LoginFormState,
  normalizedEmail: string,
  attempted: boolean,
) {
  return {
    email:
      !attempted && !form.email.trim()
        ? ""
        : !form.email.trim()
          ? "E-posta zorunlu."
          : EMAIL_REGEX.test(normalizedEmail)
            ? ""
            : "Gecerli bir e-posta girin.",
    password:
      !attempted && !form.password.trim()
        ? ""
        : !form.password.trim()
          ? "Sifre zorunlu."
          : form.password.trim().length >= 6
            ? ""
            : "Sifre en az 6 karakter olmali.",
  };
}

export function validateSignupForm(
  form: SignupFormState,
  normalizedEmail: string,
  attempted: boolean,
) {
  return {
    tenantName:
      !attempted && !form.tenantName.trim()
        ? ""
        : form.tenantName.trim().length >= 2
          ? ""
          : "Sirket adi en az 2 karakter olmali.",
    name:
      !attempted && !form.name.trim()
        ? ""
        : form.name.trim().length >= 2
          ? ""
          : "Ad en az 2 karakter olmali.",
    surname:
      !attempted && !form.surname.trim()
        ? ""
        : form.surname.trim().length >= 2
          ? ""
          : "Soyad en az 2 karakter olmali.",
    email:
      !attempted && !form.email.trim()
        ? ""
        : EMAIL_REGEX.test(normalizedEmail)
          ? ""
          : "Gecerli bir e-posta girin.",
    password:
      !attempted && !form.password
        ? ""
        : STRONG_PASSWORD_REGEX.test(form.password)
          ? ""
          : "Sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli.",
    confirmPassword:
      !attempted && !form.confirmPassword
        ? ""
        : form.password === form.confirmPassword
          ? ""
          : "Sifreler eslesmiyor.",
  };
}

export function validateRecoveryForm(
  form: RecoveryFormState,
  normalizedEmail: string,
  recoveryMode: "request" | "reset",
  attempted: boolean,
) {
  return {
    email:
      !attempted && !form.email.trim()
        ? ""
        : EMAIL_REGEX.test(normalizedEmail)
          ? ""
          : "Gecerli bir e-posta girin.",
    token:
      recoveryMode !== "reset"
        ? ""
        : !attempted && !form.token.trim()
          ? ""
          : form.token.trim()
            ? ""
            : "Token zorunlu.",
    password:
      recoveryMode !== "reset"
        ? ""
        : !attempted && !form.password
          ? ""
          : STRONG_PASSWORD_REGEX.test(form.password)
            ? ""
            : "Yeni sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli.",
    confirmPassword:
      recoveryMode !== "reset"
        ? ""
        : !attempted && !form.confirmPassword
          ? ""
          : form.password === form.confirmPassword
            ? ""
            : "Sifreler eslesmiyor.",
  };
}
