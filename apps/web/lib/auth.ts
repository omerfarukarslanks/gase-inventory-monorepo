import { apiFetch } from "./api";

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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  debugger;
  return data;
}
