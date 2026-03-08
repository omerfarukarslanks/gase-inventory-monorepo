import {
  configureApiClient,
  getMe,
  getSessionUserStoreIds,
  hasPermissionFromSession,
  login,
  logout,
  type LoginUserResponse,
  type PermissionName,
} from "@gase/core";
import type { PropsWithChildren } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiBaseUrl, getApiConfigurationError } from "@/src/lib/env";
import {
  clearPersistedSession,
  readAccessToken,
  readPersistedSession,
  writePersistedSession,
} from "@/src/lib/session";

type AuthStatus = "booting" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  apiBaseUrl: string;
  configurationError: string | null;
  status: AuthStatus;
  token: string | null;
  user: LoginUserResponse | null;
  storeIds: string[];
  permissions: string[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  can: (permission: PermissionName) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const configurationError = getApiConfigurationError();
  const [status, setStatus] = useState<AuthStatus>("booting");
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginUserResponse | null>(null);

  const clearSession = useCallback(async () => {
    await clearPersistedSession();
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const refreshSession = useCallback(async () => {
    if (configurationError) {
      setStatus("unauthenticated");
      return;
    }

    setStatus("booting");
    const persisted = await readPersistedSession();
    if (!persisted.token) {
      setToken(null);
      setUser(null);
      setStatus("unauthenticated");
      return;
    }

    try {
      const nextUser = await getMe(persisted.token);
      await writePersistedSession(persisted.token, nextUser);
      setToken(persisted.token);
      setUser(nextUser);
      setStatus("authenticated");
    } catch {
      await clearSession();
    }
  }, [clearSession, configurationError]);

  useEffect(() => {
    configureApiClient({
      baseUrl: apiBaseUrl,
      getToken: readAccessToken,
      onUnauthorized: clearSession,
    });
    void refreshSession();
  }, [clearSession, refreshSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (configurationError) {
      throw new Error(configurationError);
    }

    const response = await login(email.trim(), password);
    const hydratedUser = await getMe(response.access_token).catch(() => response.user);
    await writePersistedSession(response.access_token, hydratedUser);
    setToken(response.access_token);
    setUser(hydratedUser);
    setStatus("authenticated");
  }, [configurationError]);

  const signOut = useCallback(async () => {
    try {
      await logout(token ?? undefined);
    } catch {
      // clear local session even if API logout fails
    } finally {
      await clearSession();
    }
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(() => ({
    apiBaseUrl,
    configurationError,
    status,
    token,
    user,
    storeIds: getSessionUserStoreIds(user as never),
    permissions: user?.permissions ?? [],
    signIn,
    signOut,
    refreshSession,
    can: (permission) => hasPermissionFromSession(user, permission),
  }), [configurationError, refreshSession, signIn, signOut, status, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
