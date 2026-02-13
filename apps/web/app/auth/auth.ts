import { apiFetch } from "../../lib/api";

interface LoginResponse {
  access_token: string;
  user: LoginUserResponse;
}

interface LoginUserResponse {
  email: string;
  id: string;
  name: string;
  role: string;
  surname: string;
  tenantId: string;
}

interface SignupRequest {
  tenantName: string;
  name: string;
  surname: string;
  email: string;
  password: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function signup(request: SignupRequest): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/signup-tenant", {
    method: "POST",
    body: JSON.stringify(request),
  });
  return data;
}

export async function forgotPassword(email: string): Promise<{success: boolean}> {
  const data = await apiFetch<{success: boolean}>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data;
}

export async function resetPassword(token: string, newPassword: string): Promise<{success: boolean}> {
  const data = await apiFetch<{success: boolean}>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
  return data;
}