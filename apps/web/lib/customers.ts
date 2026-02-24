import { apiFetch } from "@/lib/api";

export type CustomerGender = "male" | "female" | "other" | string;

export type Customer = {
  id: string;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string;
  updatedById?: string | null;
  name: string;
  surname: string;
  address?: string | null;
  country?: string | null;
  city?: string | null;
  district?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  gender?: CustomerGender | null;
  birthDate?: string | null;
  isActive?: boolean;
};

export type CustomersListMeta = {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasMore?: boolean;
};

export type CustomersListResponse = {
  data: Customer[];
  meta: CustomersListMeta;
};

export type GetCustomersParams = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean | "all";
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
};

export type CreateCustomerRequest = {
  name: string;
  surname: string;
  address?: string;
  country?: string;
  city?: string;
  district?: string;
  phoneNumber?: string;
  email?: string;
  gender?: CustomerGender;
  birthDate?: string;
};

export type UpdateCustomerRequest = {
  name?: string;
  surname?: string;
  address?: string;
  country?: string;
  city?: string;
  district?: string;
  phoneNumber?: string;
  email?: string;
  gender?: CustomerGender;
  birthDate?: string;
  isActive?: boolean;
};

export async function getCustomers({
  page = 1,
  limit = 10,
  search,
  isActive,
  sortBy,
  sortOrder,
}: GetCustomersParams = {}): Promise<CustomersListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search?.trim()) query.append("search", search.trim());
  if (isActive != null) query.append("isActive", String(isActive));
  if (sortBy) query.append("sortBy", sortBy);
  if (sortOrder) query.append("sortOrder", sortOrder);

  return apiFetch<CustomersListResponse>(`/customers?${query.toString()}`);
}

export async function getCustomerById(id: string): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`);
}

export async function createCustomer(payload: CreateCustomerRequest): Promise<Customer> {
  return apiFetch<Customer>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateCustomer(
  id: string,
  payload: UpdateCustomerRequest,
): Promise<Customer> {
  return apiFetch<Customer>(`/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
