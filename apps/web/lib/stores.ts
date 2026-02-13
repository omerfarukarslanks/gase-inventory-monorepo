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
