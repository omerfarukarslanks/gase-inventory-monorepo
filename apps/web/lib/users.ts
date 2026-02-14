
import { apiFetch } from "./api";

export interface User {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  email: string;
  passwordHash?: string;
  name: string;
  surname: string;
  authProvider?: string;
  authProviderId?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  address?: string | null;
  avatar?: string | null;
  role: string;
  isActive?: boolean;
  tenantId?: string;
  userStores?: {
    id: string;
    role?: string;
    store: {
      id: string;
      name: string;
      code?: string;
      address?: string | null;
      isActive?: boolean;
      slug?: string;
      logo?: string | null;
      description?: string | null;
    };
  }[];
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersResponse {
  data: User[];
  meta: Meta;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  storeId?: string;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export interface UpdateUserDto {
  name?: string;
  surname?: string;
  email?: string; 
  role?: string;
  storeIds?: string[];
}

export interface CreateUserDto {
  email: string;
  password?: string;
  name: string;
  surname: string;
  role: string;
  storeIds: string[];
}

export async function getUsers(params: GetUsersParams): Promise<UsersResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.search) searchParams.append("search", params.search);
  if (params.storeId) searchParams.append("storeId", params.storeId);
  if (params.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

  return apiFetch<UsersResponse>(`/users?${searchParams.toString()}`);
}

export async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  return apiFetch<User>(`/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function createUser(data: CreateUserDto): Promise<User> {
  return apiFetch<User>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Tek bir kullanıcı getirmek gerekirse
export async function getUser(id: string): Promise<User> {
  return apiFetch<User>(`/users/${id}`);
}
