export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

export type SessionUser = {
  role?: string;
  storeId?: string;
  storeIds?: string[];
  userStores?: Array<{
    storeId?: string;
    store?: {
      id?: string;
    };
  }>;
};

function asRole(role?: string | null): UserRole | null {
  if (!role) return null;
  const normalized = role.toUpperCase();
  if (normalized === UserRole.OWNER) return UserRole.OWNER;
  if (normalized === UserRole.ADMIN) return UserRole.ADMIN;
  if (normalized === UserRole.MANAGER) return UserRole.MANAGER;
  if (normalized === UserRole.STAFF) return UserRole.STAFF;
  return null;
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function getSessionUserRole(): UserRole | null {
  const user = getSessionUser();
  return asRole(user?.role);
}

export function canAccessTenantPages(role: UserRole | null): boolean {
  return role === UserRole.OWNER || role === UserRole.ADMIN;
}

export function isStoreScopedRole(role: UserRole | null): boolean {
  return role === UserRole.MANAGER || role === UserRole.STAFF;
}

export function getSessionUserStoreIds(user: SessionUser | null): string[] {
  if (!user) return [];

  const ids = new Set<string>();
  if (typeof user.storeId === "string" && user.storeId.trim()) {
    ids.add(user.storeId);
  }

  if (Array.isArray(user.storeIds)) {
    for (const storeId of user.storeIds) {
      if (typeof storeId === "string" && storeId.trim()) ids.add(storeId);
    }
  }

  if (Array.isArray(user.userStores)) {
    for (const item of user.userStores) {
      const storeId = item?.storeId ?? item?.store?.id;
      if (typeof storeId === "string" && storeId.trim()) ids.add(storeId);
    }
  }

  return [...ids];
}
