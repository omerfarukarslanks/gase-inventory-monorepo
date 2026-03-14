"use client";

export type PackageItemRow = {
  rowId: string;
  productVariantId: string;
  variantLabel: string;
  quantity: string;
};

export type PackageForm = {
  name: string;
  code: string;
  description: string;
};

export type FormErrors = Partial<Record<keyof PackageForm | "items", string>>;

export const EMPTY_FORM: PackageForm = {
  name: "",
  code: "",
  description: "",
};

export type SessionUserForStoreType = {
  storeType?: string;
  store?: {
    storeType?: string;
  };
  userStores?: Array<{
    storeType?: string;
    store?: {
      storeType?: string;
    };
  }>;
};

function normalizeStoreType(value?: string | null): "RETAIL" | "WHOLESALE" | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  if (normalized === "WHOLESALE") return "WHOLESALE";
  if (normalized === "RETAIL") return "RETAIL";
  return null;
}

export function resolveStoreType(user: SessionUserForStoreType | null): "RETAIL" | "WHOLESALE" | null {
  if (!user) return null;
  const direct = normalizeStoreType(user.storeType);
  if (direct) return direct;
  const fromStore = normalizeStoreType(user.store?.storeType);
  if (fromStore) return fromStore;
  if (Array.isArray(user.userStores)) {
    for (const item of user.userStores) {
      const fromUserStore = normalizeStoreType(item?.storeType ?? item?.store?.storeType);
      if (fromUserStore) return fromUserStore;
    }
  }
  return null;
}

export function createRowId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
