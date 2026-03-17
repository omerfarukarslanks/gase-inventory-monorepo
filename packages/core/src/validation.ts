export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Minimum 8 characters, at least one lowercase letter, one uppercase letter, one digit. */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isValidPassword(value: string): boolean {
  return PASSWORD_PATTERN.test(value);
}

export function normalizePhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidPhone(value: string, minDigits = 10): boolean {
  return normalizePhoneDigits(value).length >= minDigits;
}

export function normalizeTurkishLookup(value: string): string {
  return value.trim().toLocaleLowerCase("tr-TR");
}

/** Exactly 11 digits — Turkish national ID (TCKN). */
export const TCKN_PATTERN = /^\d{11}$/;

/** Exactly 10 digits — Turkish tax number (Vergi No / VKN). */
export const TAX_NUMBER_PATTERN = /^\d{10}$/;

export function isValidTckn(value: string): boolean {
  return TCKN_PATTERN.test(value.trim());
}

export function isValidTaxNumber(value: string): boolean {
  return TAX_NUMBER_PATTERN.test(value.trim());
}
