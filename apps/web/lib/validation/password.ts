/** Minimum 8 characters, at least one uppercase letter, one digit. */
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isValidPassword(value: string): boolean {
  return PASSWORD_PATTERN.test(value);
}
