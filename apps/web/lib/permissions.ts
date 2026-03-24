import { apiFetch } from "@/lib/api";

export type Permission = {
  id: string;
  name: string;
  description: string;
  group: string;
  isActive: boolean;
};

export type PermissionListMeta = {
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type PermissionListResponse = {
  data: Permission[];
  meta: PermissionListMeta;
};

export type GetPermissionsParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | "all";
};

export type CreatePermissionDto = {
  name: string;
  description: string;
  group: string;
  isActive?: boolean;
};

export type UpdatePermissionDto = {
  description?: string;
  group?: string;
  isActive?: boolean;
};

export type RolePermission = {
  name: string;
  group: string;
  description: string;
  isActive: boolean;
};

export type RoleEntry = {
  id: string;
  role: string;
  isActive: boolean;
  level?: number;
  permissions: RolePermission[];
};

export type RolesListResponse = {
  data: RoleEntry[];
  meta: PermissionListMeta;
};

export type GetRolesParams = {
  page?: number;
  limit?: number;
  isActive?: boolean | "all";
};

export type ReplaceRolePermissionsDto = {
  permissionNames: string[];
  isActive?: boolean;
};

export async function getPermissions({
  page,
  limit,
  search,
  isActive,
}: GetPermissionsParams = {}): Promise<PermissionListResponse> {
  const query = new URLSearchParams();

  if (page != null) query.append("page", String(page));
  if (limit != null) query.append("limit", String(limit));
  if (search?.trim()) query.append("search", search.trim());
  if (isActive != null && isActive !== "all") query.append("isActive", String(isActive));

  return apiFetch<PermissionListResponse>(`/permissions?${query.toString()}`);
}

export async function createPermission(dto: CreatePermissionDto): Promise<Permission> {
  return apiFetch<Permission>("/permissions", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updatePermission(id: string, dto: UpdatePermissionDto): Promise<Permission> {
  return apiFetch<Permission>(`/permissions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

export async function getRoles({ page, limit, isActive }: GetRolesParams = {}): Promise<RolesListResponse> {
  const query = new URLSearchParams();
  if (page != null) query.append("page", String(page));
  if (limit != null) query.append("limit", String(limit));
  if (isActive != null && isActive !== "all") query.append("isActive", String(isActive));

  const qs = query.toString();
  return apiFetch<RolesListResponse>(`/permissions/roles${qs ? `?${qs}` : ""}`);
}

export async function getRole(role: string): Promise<RolePermission[]> {
  return apiFetch<RolePermission[]>(`/permissions/roles/${role}`);
}

export async function replaceRolePermissions(
  role: string,
  dto: ReplaceRolePermissionsDto,
): Promise<void> {
  return apiFetch<void>(`/permissions/roles/${role}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export type CreateRoleDto = {
  name: string;
  permissionNames: string[];
  level?: number;
};

export type UpdateRoleDto = {
  name: string;
  permissionNames: string[];
  isActive: boolean;
  level?: number;
};

export async function createRole(dto: CreateRoleDto): Promise<RoleEntry> {
  return apiFetch<RoleEntry>("/permissions/roles", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function updateRole(roleName: string, dto: UpdateRoleDto): Promise<RoleEntry> {
  return apiFetch<RoleEntry>(`/permissions/roles/${roleName}`, {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}
