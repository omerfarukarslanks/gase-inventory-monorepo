import { apiFetch } from "./api";

export type Unit = {
  id: string;
  name: string;
  abbreviation: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UnitsPaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UnitsPaginatedResponse = {
  data: Unit[];
  meta: UnitsPaginatedMeta;
};

export type GetUnitsPaginatedParams = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "abbreviation" | "createdAt";
  sortOrder?: "ASC" | "DESC";
  isActive?: boolean | "all";
};

export type CreateUnitPayload = {
  name: string;
  abbreviation: string;
};

export type UpdateUnitPayload = {
  name?: string;
  abbreviation?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export async function getUnits(): Promise<Unit[]> {
  return apiFetch<Unit[]>("/units");
}

export async function getUnitsPaginated(
  params: GetUnitsPaginatedParams = {},
): Promise<UnitsPaginatedResponse> {
  const { page = 1, limit = 10, search, sortBy = "createdAt", sortOrder = "DESC", isActive = "all" } = params;

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
    isActive: String(isActive),
  });

  if (search?.trim()) {
    query.set("search", search.trim());
  }

  return apiFetch<UnitsPaginatedResponse>(`/units/paginated?${query.toString()}`);
}

export async function getUnitById(id: string): Promise<Unit> {
  return apiFetch<Unit>(`/units/${id}`);
}

export async function createUnit(payload: CreateUnitPayload): Promise<Unit> {
  return apiFetch<Unit>("/units", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUnit(id: string, payload: UpdateUnitPayload): Promise<Unit> {
  return apiFetch<Unit>(`/units/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUnit(id: string): Promise<void> {
  return apiFetch<void>(`/units/${id}`, {
    method: "DELETE",
  });
}
