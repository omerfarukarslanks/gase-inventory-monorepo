import { apiFetch } from "@/lib/api";

export type ReplenishmentSuggestionStatus = "PENDING" | "ACCEPTED" | "DISMISSED";

export type ReplenishmentRuleRef = {
  id: string;
  storeId?: string;
  productVariantId?: string;
  supplierId?: string;
  minStock?: number;
  targetStock?: number;
  leadTimeDays?: number;
  isActive?: boolean;
};

export type ReplenishmentSuggestion = {
  id: string;
  status: ReplenishmentSuggestionStatus;
  suggestedQuantity: number;
  currentQuantity: number;
  autoCreatedPoId?: string | null;
  notes?: string | null;
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

export type GetReplenishmentSuggestionsParams = {
  page?: number;
  limit?: number;
  status?: ReplenishmentSuggestionStatus | "";
  storeId?: string;
};

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
