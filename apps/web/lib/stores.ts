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
  page: number;
  totalPages: number;
  hasMore?: boolean;
};

export type StoresListResponse = {
  data: Store[];
  meta: StoresListMeta;
};

export type CreateStoreRequest = {
  name: string;
  code?: string;
  address?: string;
  slug?: string;
  logo?: string;
  description?: string;
};

export type UpdateStoreRequest = {
  name: string;
  code?: string;
  address?: string;
  slug?: string;
  logo?: string;
  description?: string;
  isActive: boolean;
};

export type GetStoresParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  token: string;
};

export async function getStores({
  page = 1,
  limit = 10,
  search,
  sortBy,
  sortOrder,
  token,
}: GetStoresParams): Promise<StoresListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) query.append("search", search);
  if (sortBy) query.append("sortBy", sortBy);
  if (sortOrder) query.append("sortOrder", sortOrder);

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
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function getStoreById(id: string, token: string): Promise<Store> {
  return apiFetch<Store>(`/stores/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateStore(
  id: string,
  payload: UpdateStoreRequest,
  token: string,
): Promise<Store> {
  const body = {
    name: payload.name,
    ...(payload.code ? { code: payload.code } : {}),
    ...(payload.address ? { address: payload.address } : {}),
    ...(payload.slug ? { slug: payload.slug } : {}),
    ...(payload.logo ? { logo: payload.logo } : {}),
    ...(payload.description ? { description: payload.description } : {}),
    isActive: payload.isActive,
  };

  return apiFetch<Store>(`/stores/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

export async function deleteStore(id: string, token: string): Promise<void> {
  await apiFetch<unknown>(`/stores/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
