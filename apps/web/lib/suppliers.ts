import { apiFetch } from "@/lib/api";

export type Supplier = {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  name: string;
  surname?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  isActive?: boolean;
};

export type SuppliersListMeta = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasMore?: boolean;
};

export type SuppliersListResponse = {
  data: Supplier[];
  meta: SuppliersListMeta;
};

export type GetSuppliersParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

export type CreateSupplierRequest = {
  name: string;
  surname?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
};

export type UpdateSupplierRequest = {
  name?: string;
  surname?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  isActive?: boolean;
};

export async function getSuppliers({
  page = 1,
  limit = 10,
  search,
  isActive,
  sortBy,
  sortOrder,
}: GetSuppliersParams = {}): Promise<SuppliersListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search?.trim()) query.append("search", search.trim());
  if (isActive != null) query.append("isActive", String(isActive));
  if (sortBy) query.append("sortBy", sortBy);
  if (sortOrder) query.append("sortOrder", sortOrder);

  return apiFetch<SuppliersListResponse>(`/suppliers?${query.toString()}`);
}

export async function getAllSuppliers(params?: {
  search?: string;
  isActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  pageSize?: number;
  maxPages?: number;
}): Promise<Supplier[]> {
  const pageSize = params?.pageSize ?? 100;
  const maxPages = params?.maxPages ?? 50;
  const all: Supplier[] = [];

  let page = 1;
  let totalPages = 1;

  do {
    const res = await getSuppliers({
      page,
      limit: pageSize,
      search: params?.search,
      isActive: params?.isActive,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
    });

    all.push(...(res.data ?? []));
    totalPages = res.meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages && page <= maxPages);

  return all;
}

export async function getSupplierById(id: string): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`);
}

export async function createSupplier(payload: CreateSupplierRequest): Promise<Supplier> {
  return apiFetch<Supplier>("/suppliers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSupplier(
  id: string,
  payload: UpdateSupplierRequest,
): Promise<Supplier> {
  return apiFetch<Supplier>(`/suppliers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
