import { configureApiClient } from "@gase/core";
import { clearAuthCookie } from "./cookie";
import { clearSessionStorage, readSessionToken } from "./session";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://192.168.1.100:8080";

let unauthorizedRedirectInProgress = false;

configureApiClient({
  baseUrl: BASE_URL,
  getToken: () => readSessionToken(),
  onUnauthorized: () => {
    if (typeof window === "undefined") return;
    clearSessionStorage();
    clearAuthCookie();
    if (!unauthorizedRedirectInProgress && !window.location.pathname.startsWith("/auth")) {
      unauthorizedRedirectInProgress = true;
      window.location.href = "/auth/login";
    }
  },
});

export { apiFetch, ApiError } from "@gase/core";
