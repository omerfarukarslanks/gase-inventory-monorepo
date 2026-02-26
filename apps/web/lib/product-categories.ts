import { apiFetch } from "@/lib/api";

export type ProductCategory = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  parentId?: string | null;
  parent?: ProductCategory | null;
  children?: ProductCategory[] | null;
};

export type CreateProductCategoryRequest = {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  parentId?: string | null;
};

export type UpdateProductCategoryRequest = {
  name?: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
};

export type ProductCategoriesListMeta = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
};

export type ProductCategoriesListResponse = {
  data: ProductCategory[];
  meta: ProductCategoriesListMeta;
};

export type GetProductCategoriesParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

function normalizeCategoriesPayload(
  payload: ProductCategoriesListResponse | ProductCategory[],
  defaultPage = 1,
  defaultLimit = 10,
): ProductCategoriesListResponse {
  if (Array.isArray(payload)) {
    const total = payload.length;
    const safeLimit = total > 0 ? total : defaultLimit;
    return {
      data: payload,
      meta: {
        total,
        limit: safeLimit,
        page: defaultPage,
        totalPages: 1,
      },
    };
  }

  return payload;
}

export async function getProductCategories(
  params: (GetProductCategoriesParams & { includeInactive?: boolean }) = {},
): Promise<ProductCategoriesListResponse | ProductCategory[]> {
  const query = new URLSearchParams();

  if (params.page != null) query.append("page", String(params.page));
  if (params.limit != null) query.append("limit", String(params.limit));
  if (params.search?.trim()) query.append("search", params.search.trim());
  if (params.isActive != null && params.isActive !== "all") {
    query.append("isActive", String(params.isActive));
  }
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);
  if (params.includeInactive != null) {
    query.append("includeInactive", String(params.includeInactive));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<ProductCategoriesListResponse | ProductCategory[]>(`/product-categories${suffix}`);
}

export async function getProductCategoriesPaginated(
  params: Omit<GetProductCategoriesParams, "page" | "limit"> & {
    page?: number;
    limit?: number;
  } = {},
): Promise<ProductCategoriesListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const payload = await getProductCategories({ ...params, page, limit });
  return normalizeCategoriesPayload(payload, page, limit);
}

export async function getAllProductCategories(
  params: Omit<GetProductCategoriesParams, "page" | "limit"> = {},
): Promise<ProductCategory[]> {
  const payload = await getProductCategories(params);
  if (Array.isArray(payload)) return payload;
  return payload.data ?? [];
}

export async function getProductCategoryById(id: string): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/product-categories/${id}`);
}

export async function createProductCategory(
  payload: CreateProductCategoryRequest,
): Promise<ProductCategory> {
  return apiFetch<ProductCategory>("/product-categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductCategory(
  id: string,
  payload: UpdateProductCategoryRequest,
): Promise<ProductCategory> {
  return apiFetch<ProductCategory>(`/product-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductCategory(id: string): Promise<void> {
  await apiFetch<void>(`/product-categories/${id}`, { method: "DELETE" });
}
