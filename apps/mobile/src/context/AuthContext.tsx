import {
  configureApiClient,
  getMe,
  getSessionUserStoreIds,
  hasPermissionFromSession,
  login,
  logout,
  signup,
  type LoginResponse,
  type LoginUserResponse,
  type PermissionName,
  type SignupRequest,
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
import { trackEvent } from "@/src/lib/analytics";

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
  signUp: (request: SignupRequest) => Promise<void>;
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
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("session_check_timeout")), 8000),
      );
      const nextUser = await Promise.race([getMe(persisted.token), timeoutPromise]);
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
      baseUrl: apiBaseUrl ?? "http://192.168.1.100:8080",
      getToken: readAccessToken,
      onUnauthorized: clearSession,
    });
    void refreshSession();
  }, [clearSession, refreshSession]);

  const completeSession = useCallback(async (response: LoginResponse) => {
    const hydratedUser = await getMe(response.access_token).catch(() => response.user);
    await writePersistedSession(response.access_token, hydratedUser);
    setToken(response.access_token);
    setUser(hydratedUser);
    setStatus("authenticated");
    return hydratedUser;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (configurationError) {
      throw new Error(configurationError);
    }

    const response = await login(email.trim(), password);
    const hydratedUser = await completeSession(response);
    trackEvent("login_success", {
      userId: hydratedUser.id,
      role: hydratedUser.role,
    });
  }, [completeSession, configurationError]);

  const signUp = useCallback(async (request: SignupRequest) => {
    if (configurationError) {
      throw new Error(configurationError);
    }

    const response = await signup(request);
    const hydratedUser = await completeSession(response);
    trackEvent("login_success", {
      userId: hydratedUser.id,
      role: hydratedUser.role,
      source: "signup",
    });
  }, [completeSession, configurationError]);

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
    signUp,
    signOut,
    refreshSession,
    can: (permission) => hasPermissionFromSession(user, permission),
  }), [configurationError, refreshSession, signIn, signOut, signUp, status, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
