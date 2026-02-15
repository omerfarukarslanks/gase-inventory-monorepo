import { ApiError, apiFetch } from "@/lib/api";

export type AttributeValue = {
  id: string;
  createdAt: string;
  createdById?: string | null;
  updatedAt: string;
  updatedById?: string | null;
  value: string;
  isActive: boolean;
};

export type Attribute = {
  id: string;
  createdAt: string;
  createdById?: string | null;
  updatedAt: string;
  updatedById?: string | null;
  name: string;
  isActive: boolean;
  values: AttributeValue[];
};

export type AttributeDetail = Attribute & {
  tenant?: {
    id: string;
    name: string;
    slug?: string;
    logo?: string | null;
    description?: string | null;
    isActive?: boolean;
  };
};

export type AttributesPaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AttributesPaginatedResponse = {
  data: Attribute[];
  meta: AttributesPaginatedMeta;
};

export type GetAttributesPaginatedParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortOrder?: "ASC" | "DESC";
  sortBy?: string;
  isActive?: boolean | "all";
};

export async function getAttributes(): Promise<Attribute[]> {
  return apiFetch<Attribute[]>("/attributes");
}

export async function getAttributesPaginated({
  page = 1,
  limit = 10,
  search,
  sortOrder = "DESC",
  sortBy = "createdAt",
  isActive = "all",
}: GetAttributesPaginatedParams): Promise<AttributesPaginatedResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortOrder,
    sortBy,
    isActive: String(isActive),
  });

  if (search?.trim()) {
    query.set("search", search.trim());
  }

  return apiFetch<AttributesPaginatedResponse>(`/attributes/paginated?${query.toString()}`);
}

export async function getAttributeById(id: string): Promise<AttributeDetail> {
  return apiFetch<AttributeDetail>(`/attributes/${id}`);
}

export async function createAttribute(payload: { name: string }): Promise<Attribute> {
  return apiFetch<Attribute>("/attributes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAttribute(
  id: string,
  payload: { name?: string; isActive?: boolean },
): Promise<Attribute> {
  return apiFetch<Attribute>(`/attributes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function createAttributeValues(
  attributeId: string,
  payload: Array<{ value: string }>,
): Promise<AttributeDetail> {
  return apiFetch<AttributeDetail>(`/attributes/${attributeId}/values`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAttributeValue(
  valueId: string,
  payload: { value?: string; isActive?: boolean },
): Promise<unknown> {
  try {
    return await apiFetch<unknown>(`/attributes/values/${valueId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return apiFetch<unknown>(`/attributes/${valueId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    }
    throw error;
  }
}
