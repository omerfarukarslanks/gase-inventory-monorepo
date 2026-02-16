import { ApiError, apiFetch } from "@/lib/api";

/* ── Types ── */

export type Currency = "TRY" | "USD" | "EUR";

export type ProductVariant = {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  name: string;
  code: string;
  barcode: string | null;
  isActive?: boolean;
  attributes?: ProductAttributeInput[];
};

export type ProductAttributeInput = {
  id: string;
  values: string[];
};

export type ProductAttributeValueOption = {
  id: string;
  name: string;
  isActive: boolean;
};

export type ProductAttributeDefinition = {
  id: string;
  name: string;
  isActive: boolean;
  values: ProductAttributeValueOption[];
};

export type ProductAttributesResponse = {
  attributes: ProductAttributeDefinition[];
};

export type Product = {
  id: string;
  createdAt: string;
  createdById?: string | null;
  updatedAt: string;
  updatedById?: string | null;
  tenant?: {
    id: string;
  };
  name: string;
  sku: string;
  description: string | null;
  defaultBarcode: string | null;
  image: string | null;
  defaultCurrency: Currency;
  defaultSalePrice: number | string;
  defaultPurchasePrice: number | string;
  defaultTaxPercent: number | string;
  isActive?: boolean;
  variantCount?: number;
  variants?: ProductVariant[];
  attributes?: ProductAttributeInput[];
};

export type ProductsListMeta = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasMore?: boolean;
};

export type ProductsListResponse = {
  data: Product[];
  meta: ProductsListMeta;
};

export type CreateVariantDto = {
  attributes: ProductAttributeInput[];
};

export type CreateProductRequest = {
  name: string;
  sku: string;
  description?: string;
  defaultBarcode?: string;
  image?: string;
  defaultCurrency: Currency;
  defaultSalePrice: number;
  defaultPurchasePrice: number;
  defaultTaxPercent: number;
  attributes?: ProductAttributeInput[];
  variants?: CreateVariantDto[];
};

export type UpdateProductRequest = {
  name?: string;
  sku?: string;
  description?: string;
  defaultBarcode?: string;
  image?: string;
  defaultCurrency?: Currency;
  defaultSalePrice?: number;
  defaultPurchasePrice?: number;
  defaultTaxPercent?: number;
  isActive?: boolean;
  attributes?: ProductAttributeInput[];
  variants?: CreateVariantDto[];
};

export type GetProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
  defaultCurrency?: Currency;
  defaultPurchasePriceMin?: number;
  defaultPurchasePriceMax?: number;
  defaultSalePriceMin?: number;
  defaultSalePriceMax?: number;
  isActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

/* ── API Functions ── */

export async function getProducts({
  page = 1,
  limit = 10,
  search,
  defaultCurrency,
  defaultPurchasePriceMin,
  defaultPurchasePriceMax,
  defaultSalePriceMin,
  defaultSalePriceMax,
  isActive,
  sortBy,
  sortOrder,
}: GetProductsParams): Promise<ProductsListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) query.append("search", search);
  if (defaultCurrency) query.append("defaultCurrency", defaultCurrency);
  if (defaultPurchasePriceMin != null) query.append("defaultPurchasePriceMin", String(defaultPurchasePriceMin));
  if (defaultPurchasePriceMax != null) query.append("defaultPurchasePriceMax", String(defaultPurchasePriceMax));
  if (defaultSalePriceMin != null) query.append("defaultSalePriceMin", String(defaultSalePriceMin));
  if (defaultSalePriceMax != null) query.append("defaultSalePriceMax", String(defaultSalePriceMax));
  if (isActive != null) query.append("isActive", String(isActive));
  if (sortBy) query.append("sortBy", sortBy);
  if (sortOrder) query.append("sortOrder", sortOrder);

  return apiFetch<ProductsListResponse>(`/products?${query.toString()}`);
}

export async function getProductById(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export async function createProduct(
  payload: CreateProductRequest,
): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(
  id: string,
  payload: UpdateProductRequest,
): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getProductVariants(
  productId: string,
  params?: { isActive?: boolean | "all" },
): Promise<ProductVariant[]> {
  const query = new URLSearchParams();
  if (params?.isActive != null) {
    query.append("isActive", String(params.isActive));
  }

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return await apiFetch<ProductVariant[]>(`/products/${productId}/variants${suffix}`);
}

export async function getProductAttributes(
  productId: string,
): Promise<ProductAttributesResponse> {
  return await apiFetch<ProductAttributesResponse>(`/products/${productId}/attributes`);
}

export async function createProductVariant(
  productId: string,
  payload: CreateVariantDto,
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/products/${productId}/variants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductVariant(
  productId: string,
  variantId: string,
  payload: CreateVariantDto & { isActive?: boolean },
): Promise<ProductVariant> {
  return apiFetch<ProductVariant>(`/products/${productId}/variants/${variantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<unknown>(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function deleteProductVariant(
  productId: string,
  variantId: string,
): Promise<void> {
  await apiFetch<unknown>(`/products/${productId}/variants/${variantId}`, {
    method: "DELETE",
  });
}
