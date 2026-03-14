import { apiFetch } from "@/lib/api";

export type ReplenishmentSuggestionStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

export type ReplenishmentRule = {
  id: string;
  storeId?: string;
  productVariantId?: string;
  productName?: string;
  variantName?: string;
  supplierId?: string;
  minStock?: number;
  targetStock?: number;
  leadTimeDays?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ReplenishmentRuleRef = ReplenishmentRule;

export type ReplenishmentSuggestion = {
  id: string;
  status: ReplenishmentSuggestionStatus;
  suggestedQuantity: number;
  currentQuantity: number;
  autoCreatedPoId?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  rule?: ReplenishmentRuleRef;
};

export type ReplenishmentSuggestionListResponse = {
  data: ReplenishmentSuggestion[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type ReplenishmentRuleListResponse = {
  data: ReplenishmentRule[];
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
};

export type GetReplenishmentSuggestionsParams = {
  page?: number;
  limit?: number;
  status?: ReplenishmentSuggestionStatus | "";
  storeId?: string;
};

export type GetReplenishmentRulesParams = {
  page?: number;
  limit?: number;
  storeId?: string;
  isActive?: boolean;
};

export type CreateReplenishmentRulePayload = {
  storeId: string;
  productVariantId: string;
  minStock: number;
  targetStock: number;
  supplierId?: string;
  leadTimeDays?: number;
};

export type UpdateReplenishmentRulePayload = Partial<{
  minStock: number;
  targetStock: number;
  supplierId: string | null;
  leadTimeDays: number | null;
  isActive: boolean;
}>;

export async function getReplenishmentSuggestions({
  page = 1,
  limit = 20,
  status,
  storeId,
}: GetReplenishmentSuggestionsParams = {}): Promise<ReplenishmentSuggestionListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status) query.set("status", status);
  if (storeId) query.set("storeId", storeId);

  return apiFetch<ReplenishmentSuggestionListResponse>(`/replenishment/suggestions?${query.toString()}`);
}

export async function getReplenishmentSuggestion(id: string): Promise<ReplenishmentSuggestion> {
  return apiFetch<ReplenishmentSuggestion>(`/replenishment/suggestions/${id}`);
}

export async function acceptReplenishmentSuggestion(id: string): Promise<ReplenishmentSuggestion> {
  return apiFetch<ReplenishmentSuggestion>(`/replenishment/suggestions/${id}/accept`, {
    method: "POST",
  });
}

export async function dismissReplenishmentSuggestion(id: string, notes: string): Promise<ReplenishmentSuggestion> {
  return apiFetch<ReplenishmentSuggestion>(`/replenishment/suggestions/${id}/dismiss`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
}

export async function getReplenishmentRules({
  page = 1,
  limit = 20,
  storeId,
  isActive,
}: GetReplenishmentRulesParams = {}): Promise<ReplenishmentRuleListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (storeId) query.set("storeId", storeId);
  if (typeof isActive === "boolean") query.set("isActive", String(isActive));

  return apiFetch<ReplenishmentRuleListResponse>(`/replenishment/rules?${query.toString()}`);
}

export async function getReplenishmentRule(id: string): Promise<ReplenishmentRule> {
  return apiFetch<ReplenishmentRule>(`/replenishment/rules/${id}`);
}

export async function createReplenishmentRule(payload: CreateReplenishmentRulePayload): Promise<ReplenishmentRule> {
  return apiFetch<ReplenishmentRule>("/replenishment/rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateReplenishmentRule(
  id: string,
  payload: UpdateReplenishmentRulePayload,
): Promise<ReplenishmentRule> {
  return apiFetch<ReplenishmentRule>(`/replenishment/rules/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deactivateReplenishmentRule(id: string): Promise<void> {
  await apiFetch<unknown>(`/replenishment/rules/${id}`, {
    method: "DELETE",
  });
}
