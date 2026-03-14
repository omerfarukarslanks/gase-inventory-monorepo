import { getSessionUserStoreIds, getSessionUserStoreType, type SessionStoreType, type SessionUser } from "@/lib/authz";

const TOKEN_STORAGE_KEY = "token";
const USER_STORAGE_KEY = "user";
export const SESSION_CHANGE_EVENT = "stockpulse:session-change";

export type SessionProfileSnapshot = {
  user: SessionUser | null;
  userId: string;
  token: string | null;
  permissions: string[];
  displayName: string;
  displayRole: string;
  initials: string;
  storeType: SessionStoreType | null;
  storeIds: string[];
  activeStoreId: string;
  canSeePackages: boolean;
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function emitSessionChange(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(SESSION_CHANGE_EVENT));
}

export function readSessionToken(): string | null {
  if (!isBrowser()) return null;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token?.trim() ? token : null;
}

export function readSessionUser(): SessionUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSessionToken(token: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  emitSessionChange();
}

export function setSessionUser(user: SessionUser): void {
  if (!isBrowser()) return;
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  emitSessionChange();
}

export function clearSessionStorage(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
  emitSessionChange();
}

export function subscribeToSessionChange(callback: () => void): () => void {
  if (!isBrowser()) return () => {};

  const handleEvent = () => callback();

  window.addEventListener(SESSION_CHANGE_EVENT, handleEvent);
  window.addEventListener("storage", handleEvent);

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, handleEvent);
    window.removeEventListener("storage", handleEvent);
  };
}

export function getSessionProfileSnapshot(): SessionProfileSnapshot {
  const user = readSessionUser();
  const token = readSessionToken();
  const storeType = getSessionUserStoreType(user);
  const storeIds = getSessionUserStoreIds(user);
  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ").trim() || "User";
  const displayRole = user?.role?.trim() || "User";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return {
    user,
    userId: user?.id?.trim() || "",
    token,
    permissions: user?.permissions ?? [],
    displayName,
    displayRole,
    initials: initials || "U",
    storeType,
    storeIds,
    activeStoreId: storeIds[0] ?? "",
    canSeePackages: storeType === "WHOLESALE",
  };
}
