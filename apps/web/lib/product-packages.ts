import { apiFetch } from "@/lib/api";

/* ── Types ── */

export type ProductPackageVariant = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  name: string;
  code: string;
  isActive?: boolean;
};

export type ProductPackageItem = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  quantity: number;
  productVariant: ProductPackageVariant;
};

export type ProductPackage = {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  name: string;
  code: string;
  description?: string | null;
  defaultSalePrice?: number | string | null;
  defaultPurchasePrice?: number | string | null;
  defaultTaxPercent?: number | string | null;
  defaultDiscountPercent?: number | string | null;
  defaultDiscountAmount?: number | string | null;
  defaultTaxAmount?: number | string | null;
  defaultLineTotal?: number | string | null;
  defaultCurrency?: string | null;
  isActive?: boolean;
  items?: ProductPackageItem[];
};

export type ProductPackagesListMeta = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasMore?: boolean;
};

export type ProductPackagesListResponse = {
  data: ProductPackage[];
  meta: ProductPackagesListMeta;
};

export type GetProductPackagesParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

export type ProductPackageItemInput = {
  productVariantId: string;
  quantity: number;
};

export type CreateProductPackageRequest = {
  name: string;
  code: string;
  description?: string;
  defaultSalePrice?: number;
  defaultPurchasePrice?: number;
  defaultTaxPercent?: number;
  defaultDiscountPercent?: number;
  defaultCurrency?: string;
  isActive?: boolean;
  items: ProductPackageItemInput[];
};

export type UpdateProductPackageRequest = {
  name?: string;
  code?: string;
  description?: string;
  defaultSalePrice?: number;
  defaultPurchasePrice?: number;
  defaultTaxPercent?: number;
  defaultDiscountPercent?: number;
  defaultCurrency?: string;
  isActive?: boolean;
  items?: ProductPackageItemInput[];
};

/* ── API Functions ── */

export async function getProductPackages(
  params: GetProductPackagesParams = {},
): Promise<ProductPackagesListResponse> {
  const { page = 1, limit = 10, search, isActive, sortBy, sortOrder } = params;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });

  if (search?.trim()) query.append("search", search.trim());
  if (isActive != null && isActive !== "all") query.append("isActive", String(isActive));
  if (sortBy) query.append("sortBy", sortBy);
  if (sortOrder) query.append("sortOrder", sortOrder);

  return apiFetch<ProductPackagesListResponse>(`/product-packages?${query.toString()}`);
}

export async function getProductPackageById(id: string): Promise<ProductPackage> {
  return apiFetch<ProductPackage>(`/product-packages/${id}`);
}

export async function createProductPackage(
  payload: CreateProductPackageRequest,
): Promise<ProductPackage> {
  return apiFetch<ProductPackage>("/product-packages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductPackage(
  id: string,
  payload: UpdateProductPackageRequest,
): Promise<ProductPackage> {
  return apiFetch<ProductPackage>(`/product-packages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductPackage(id: string): Promise<void> {
  await apiFetch<void>(`/product-packages/${id}`, { method: "DELETE" });
}

export type ProductPackageStockResponse = {
  packageId: string;
  storeId: string;
  availablePackages: number;
  limitingVariants?: Array<{
    productVariantId: string;
    variantName?: string;
    requiredPerPackage: number;
    availableStock: number;
  }>;
};

export async function getProductPackageStock(
  packageId: string,
  storeId: string,
): Promise<ProductPackageStockResponse> {
  return apiFetch<ProductPackageStockResponse>(
    `/product-packages/${packageId}/stock/${storeId}`,
  );
}
