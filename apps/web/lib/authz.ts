export enum UserRole {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  STAFF = "STAFF",
}

export type PermissionName =
  // Satış
  | "SALE_READ"
  | "SALE_CREATE"
  | "SALE_UPDATE"
  | "SALE_CANCEL"
  | "SALE_LINE_MANAGE"
  | "SALE_RETURN"
  | "SALE_RECEIPT_READ"
  | "SALE_PAYMENT_MANAGE"
  // Ürün
  | "PRODUCT_READ"
  | "PRODUCT_CREATE"
  | "PRODUCT_UPDATE"
  | "PRODUCT_DELETE"
  | "PRODUCT_VARIANT_MANAGE"
  | "PRODUCT_BARCODE_LOOKUP"
  | "PRODUCT_ATTRIBUTE_MANAGE"
  | "PRODUCT_CATEGORY_MANAGE"
  | "PRODUCT_PACKAGE_MANAGE"
  // Stok
  | "STOCK_LIST_READ"
  | "STOCK_MOVEMENTS_READ"
  | "STOCK_LOW_ALERTS_READ"
  | "STOCK_SUMMARY_READ"
  | "STOCK_RECEIVE"
  | "STOCK_ADJUST"
  | "STOCK_TRANSFER"
  // Fiyat
  | "PRICE_READ"
  | "PRICE_MANAGE"
  // Mağaza
  | "STORE_READ"
  | "STORE_CREATE"
  | "STORE_UPDATE"
  | "STORE_DELETE"
  // Tedarikçi
  | "SUPPLIER_READ"
  | "SUPPLIER_MANAGE"
  // Müşteri
  | "CUSTOMER_READ"
  | "CUSTOMER_MANAGE"
  // Kullanıcı
  | "USER_READ"
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "USER_STORE_ASSIGN"
  // Raporlar
  | "REPORT_STOCK_READ"
  | "REPORT_SALES_READ"
  | "REPORT_FINANCIAL_READ"
  | "REPORT_EMPLOYEE_READ"
  | "REPORT_CUSTOMER_READ"
  | "REPORT_INVENTORY_READ"
  // Sistem
  | "EXCHANGE_RATE_READ"
  | "AI_CHAT"
  | "PERMISSION_MANAGE";

export type SessionUser = {
  role?: string;
  storeType?: string;
  storeId?: string;
  permissions?: string[];
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

export function getSessionUserPermissions(): string[] {
  const user = getSessionUser();
  return user?.permissions ?? [];
}

export function hasPermission(permission: PermissionName): boolean {
  const permissions = getSessionUserPermissions();
  return permissions.includes(permission);
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
  void role;
  return true;
}

export function isStoreScopedRole(role: UserRole | null): boolean {
  void role;
  return false;
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
  void user;
  return { scope: "tenant" };
}
