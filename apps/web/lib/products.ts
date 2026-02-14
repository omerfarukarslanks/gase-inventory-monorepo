import { apiFetch } from "@/lib/api";

/* ── Types ── */

export type Currency = "TRY" | "USD" | "EUR";

export type VariantAttribute = {
  [key: string]: string;
};

export type ProductVariant = {
  id: string;
  name: string;
  code: string;
  barcode: string;
  attributes: VariantAttribute;
};

export type Product = {
  id: string;
  createdAt: string;
  createdById: string;
  updatedAt: string;
  updatedById: string;
  name: string;
  sku: string;
  description: string | null;
  defaultBarcode: string | null;
  image: string | null;
  defaultCurrency: Currency;
  defaultSalePrice: number;
  defaultPurchasePrice: number;
  defaultTaxPercent: number;
  variants: ProductVariant[];
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
  name: string;
  code: string;
  barcode: string;
  attributes: VariantAttribute;
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
  variants?: CreateVariantDto[];
};

export type GetProductsParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

/* ── API Functions ── */

export async function getProducts({
  page = 1,
  limit = 10,
  search,
  sortBy,
  sortOrder,
}: GetProductsParams): Promise<ProductsListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) query.append("search", search);
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

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<unknown>(`/products/${id}`, {
    method: "DELETE",
  });
}
