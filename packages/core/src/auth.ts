import { apiFetch, getConfiguredApiBaseUrl } from "./api";

export interface LoginResponse {
  access_token: string;
  user: LoginUserResponse;
}

export interface LoginUserResponse {
  email: string;
  id: string;
  name: string;
  role: string;
  surname: string;
  tenantId: string;
  storeId?: string;
  storeIds?: string[];
  permissions?: string[];
  userStores?: Array<{
    storeId?: string;
    store?: {
      id?: string;
      name?: string;
      storeType?: string;
    };
  }>;
  store?: {
    id?: string;
    storeType?: string;
  };
  storeType?: string;
}

export interface SignupRequest {
  tenantName: string;
  name: string;
  surname: string;
  email: string;
  password: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
}

export async function signup(request: SignupRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/signup-tenant", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify(request),
  });
}

export async function forgotPassword(email: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/auth/forgot-password", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/auth/reset-password", {
    method: "POST",
    skipAuth: true,
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getGoogleAuthUrl(): string {
  return `${getConfiguredApiBaseUrl()}/auth/google`;
}

export function getMicrosoftAuthUrl(): string {
  return `${getConfiguredApiBaseUrl()}/auth/microsoft`;
}

export async function getMe(token?: string): Promise<LoginUserResponse> {
  return apiFetch<LoginUserResponse>("/auth/me", {
    token,
    cache: "no-store",
  });
}

export async function logout(token?: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/auth/logout", {
    method: "POST",
    token,
    cache: "no-store",
  });
}
