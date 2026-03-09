import { configureApiClient } from "@gase/core";
import { clearAuthCookie } from "./cookie";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

let unauthorizedRedirectInProgress = false;

configureApiClient({
  baseUrl: BASE_URL,
  getToken: () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  },
  onUnauthorized: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    clearAuthCookie();
    if (!unauthorizedRedirectInProgress && !window.location.pathname.startsWith("/auth")) {
      unauthorizedRedirectInProgress = true;
      window.location.href = "/auth/login";
    }
  },
});

export { apiFetch, ApiError } from "@gase/core";
