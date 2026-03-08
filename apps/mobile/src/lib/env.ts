const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";

export const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, "");

export function getApiConfigurationError(): string | null {
  if (!apiBaseUrl) {
    return "EXPO_PUBLIC_API_BASE_URL tanimli degil.";
  }

  if (/localhost|127\.0\.0\.1/.test(apiBaseUrl)) {
    return "Fiziksel cihaz icin EXPO_PUBLIC_API_BASE_URL localhost olamaz.";
  }

  return null;
}
