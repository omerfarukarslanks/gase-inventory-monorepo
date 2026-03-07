import { clearAuthCookie } from "./cookie";

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
let unauthorizedRedirectInProgress = false;

type ApiFetchOptions = RequestInit & {
  skipAuth?: boolean;
  token?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: ApiFetchOptions,
): Promise<T> {
  const { skipAuth, token: explicitToken, headers: optionHeaders, ...requestOptions } = options ?? {};
  const storageToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const authToken = explicitToken ?? (!skipAuth ? storageToken : null);

  const headers = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...optionHeaders,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...requestOptions,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.message ?? body?.error ?? `İstek başarısız (${res.status})`;

    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearAuthCookie();

      if (!unauthorizedRedirectInProgress && !window.location.pathname.startsWith("/auth")) {
        unauthorizedRedirectInProgress = true;
        window.location.href = "/auth/login";
      }
    }

    throw new ApiError(message, res.status);
  }

  if (res.status === 204 || res.status === 205) {
    return undefined as T;
  }

  const raw = await res.text();
  if (!raw.trim()) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return JSON.parse(raw) as T;
  }

  return raw as T;
}
