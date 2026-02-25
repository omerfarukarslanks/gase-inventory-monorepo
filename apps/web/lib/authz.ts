export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

export type SessionUser = {
  role?: string;
  storeType?: string;
  storeId?: string;
  store?: {
    id?: string;
    storeType?: string;
  };
  stores?: Array<{
    id?: string;
    storeId?: string;
  }>;
  storeIds?: string[];
  userStores?: Array<{
    storeId?: string;
    storeType?: string;
    store?: {
      id?: string;
      storeType?: string;
    };
  }>;
};

export type SessionStoreType = "RETAIL" | "WHOLESALE";

export type SessionListScope =
  | {
      scope: "tenant";
    }
  | {
      scope: "store";
      storeIds: string[];
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

function asStoreType(storeType?: string | null): SessionStoreType | null {
  if (!storeType) return null;
  const normalized = storeType.toUpperCase();
  if (normalized === "WHOLESALE") return "WHOLESALE";
  if (normalized === "RETAIL") return "RETAIL";
  return null;
}

export function getSessionUserRole(): UserRole | null {
  const user = getSessionUser();
  return asRole(user?.role);
}

export function getSessionUserStoreType(user?: SessionUser | null): SessionStoreType | null {
  const resolvedUser = user ?? getSessionUser();
  if (!resolvedUser) return null;

  const direct = asStoreType(resolvedUser.storeType);
  if (direct) return direct;

  const fromStore = asStoreType(resolvedUser.store?.storeType);
  if (fromStore) return fromStore;

  if (Array.isArray(resolvedUser.userStores)) {
    for (const item of resolvedUser.userStores) {
      const fromUserStore = asStoreType(item?.storeType ?? item?.store?.storeType);
      if (fromUserStore) return fromUserStore;
    }
  }

  return null;
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
  const singleStoreId = user.store?.id;
  if (typeof singleStoreId === "string" && singleStoreId.trim()) {
    ids.add(singleStoreId);
  }

  if (Array.isArray(user.stores)) {
    for (const item of user.stores) {
      const storeId = item?.storeId ?? item?.id;
      if (typeof storeId === "string" && storeId.trim()) ids.add(storeId);
    }
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

export function getSessionListScope(user?: SessionUser | null): SessionListScope {
  const resolvedUser = user ?? getSessionUser();
  const role = asRole(resolvedUser?.role);
  if (isStoreScopedRole(role)) {
    return {
      scope: "store",
      storeIds: getSessionUserStoreIds(resolvedUser),
    };
  }
  return { scope: "tenant" };
}
