import { ApiError, apiFetch } from "./api";
import { appendIfDefined } from "./query-builder";

export type Currency = "TRY" | "USD" | "EUR";

export type ProductAttributeInput = {
  id: string;
  values: string[];
};

export type ProductVariant = {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  name: string;
  code: string;
  isActive?: boolean;
  currency?: Currency | null;
  lineTotal?: number | string | null;
  unitPrice?: number | string | null;
  taxPercent?: number | string | null;
  taxAmount?: number | string | null;
  discountPercent?: number | string | null;
  discountAmount?: number | string | null;
  attributes?: ProductAttributeInput[];
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
  tenant?: { id: string };
  name: string;
  sku: string;
  description: string | null;
  image: string | null;
  currency: Currency;
  unitPrice: number | string;
  purchasePrice: number | string;
  discountPercent?: number | string | null;
  discountAmount?: number | string | null;
  taxPercent?: number | string | null;
  taxAmount?: number | string | null;
  lineTotal?: number | string | null;
  isActive?: boolean;
  variantCount?: number;
  variants?: ProductVariant[];
  attributes?: ProductAttributeInput[];
  storeIds?: string[];
  applyToAllStores?: boolean;
  categoryId?: string | null;
  category?: {
    id: string;
    name?: string;
    slug?: string;
    isActive?: boolean;
  } | null;
  supplierId?: string | null;
  supplier?: {
    id: string;
    name?: string;
    surname?: string | null;
    isActive?: boolean;
  } | null;
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
  currency: Currency;
  purchasePrice: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  name: string;
  sku: string;
  description?: string;
  image?: string;
  attributes?: ProductAttributeInput[];
  variants?: CreateVariantDto[];
  storeIds?: string[];
  applyToAllStores?: boolean;
  categoryId?: string;
  supplierId?: string;
};

export type UpdateProductRequest = Partial<CreateProductRequest> & {
  isActive?: boolean;
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
  variantIsActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

function buildProductsQuery({
  page = 1,
  limit = 10,
  search,
  defaultCurrency,
  defaultPurchasePriceMin,
  defaultPurchasePriceMax,
  defaultSalePriceMin,
  defaultSalePriceMax,
  isActive,
  variantIsActive,
  sortBy,
  sortOrder,
}: GetProductsParams): string {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  appendIfDefined(query, "search", search);
  appendIfDefined(query, "defaultCurrency", defaultCurrency);
  appendIfDefined(query, "defaultPurchasePriceMin", defaultPurchasePriceMin);
  appendIfDefined(query, "defaultPurchasePriceMax", defaultPurchasePriceMax);
  appendIfDefined(query, "defaultSalePriceMin", defaultSalePriceMin);
  appendIfDefined(query, "defaultSalePriceMax", defaultSalePriceMax);
  appendIfDefined(query, "isActive", isActive);
  appendIfDefined(query, "variantIsActive", variantIsActive);
  appendIfDefined(query, "sortBy", sortBy);
  appendIfDefined(query, "sortOrder", sortOrder);

  return query.toString();
}

export async function getProducts(params: GetProductsParams): Promise<ProductsListResponse> {
  const query = buildProductsQuery(params);
  return apiFetch<ProductsListResponse>(`/products?${query}`);
}

export async function getProductById(id: string): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

export async function createProduct(payload: CreateProductRequest): Promise<Product> {
  return apiFetch<Product>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProduct(id: string, payload: UpdateProductRequest): Promise<Product> {
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
  return apiFetch<ProductVariant[]>(`/products/${productId}/variants${suffix}`);
}

export async function getProductAttributes(productId: string): Promise<ProductAttributesResponse> {
  return apiFetch<ProductAttributesResponse>(`/products/${productId}/attributes`);
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

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
