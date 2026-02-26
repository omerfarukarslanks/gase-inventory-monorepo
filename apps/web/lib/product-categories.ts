import { apiFetch } from "@/lib/api";

/* ── Types ── */

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
  children?: ProductCategory[];
};

export type ProductCategoryTree = ProductCategory & {
  children: ProductCategoryTree[];
};

export type CreateProductCategoryRequest = {
  name: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
};

export type UpdateProductCategoryRequest = {
  name?: string;
  description?: string;
  parentId?: string | null;
  isActive?: boolean;
};

/* ── API Functions ── */

export async function getProductCategories(params?: {
  includeInactive?: boolean;
}): Promise<ProductCategory[]> {
  const query = new URLSearchParams();
  if (params?.includeInactive != null) {
    query.append("includeInactive", String(params.includeInactive));
  }
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<ProductCategory[]>(`/product-categories${suffix}`);
}

export async function getProductCategoryTree(): Promise<ProductCategoryTree[]> {
  return apiFetch<ProductCategoryTree[]>("/product-categories/tree");
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
