import { apiFetch } from "@/lib/api";

export type Store = {
  id: string;
  createdAt: string;
  createdById: string;
  updatedAt: string;
  updatedById: string;
  name: string;
  code: string;
  address: string | null;
  isActive: boolean;
  slug: string;
  logo: string | null;
  description: string | null;
};

export type StoresListMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  cursor: string | null;
};

export type StoresListResponse = {
  data: Store[];
  meta: StoresListMeta;
};

export type GetStoresParams = {
  offset?: number;
  limit?: number;
  cursor?: string;
  token: string;
};

export type CreateStoreRequest = {
  name: string;
  code?: string;
  address?: string;
  slug?: string;
  logo?: string;
  description?: string;
};

export async function getStores({
  offset = 0,
  limit = 50,
  cursor,
  token,
}: GetStoresParams): Promise<StoresListResponse> {
  const query = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
    cursor: cursor ?? new Date().toISOString(),
  });

  return apiFetch<StoresListResponse>(`/stores?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function createStore(
  payload: CreateStoreRequest,
  token: string,
): Promise<Store> {
  const body = {
    name: payload.name,
    ...(payload.code ? { code: payload.code } : {}),
    ...(payload.address ? { address: payload.address } : {}),
    ...(payload.slug ? { slug: payload.slug } : {}),
    ...(payload.logo ? { logo: payload.logo } : {}),
    ...(payload.description ? { description: payload.description } : {}),
  };

  return apiFetch<Store>("/stores", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}
