import * as SecureStore from "expo-secure-store";
import type { LoginUserResponse } from "@gase/core";

const ACCESS_TOKEN_KEY = "gase_mobile_access_token";
const USER_KEY = "gase_mobile_user";

export type PersistedSession = {
  token: string | null;
  user: LoginUserResponse | null;
};

export async function readAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function readSessionUser(): Promise<LoginUserResponse | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as LoginUserResponse;
  } catch {
    return null;
  }
}

export async function readPersistedSession(): Promise<PersistedSession> {
  const [token, user] = await Promise.all([readAccessToken(), readSessionUser()]);
  return { token, user };
}

export async function writePersistedSession(token: string, user: LoginUserResponse): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearPersistedSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}
