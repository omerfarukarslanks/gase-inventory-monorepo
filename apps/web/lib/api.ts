export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";
let unauthorizedRedirectInProgress = false;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  // Client-side only check for token
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options?.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message =
      body?.message ?? body?.error ?? `İstek başarısız (${res.status})`;

    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!unauthorizedRedirectInProgress && !window.location.pathname.startsWith("/auth")) {
        unauthorizedRedirectInProgress = true;
        window.location.href = "/auth/login";
      }
    }

    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}
