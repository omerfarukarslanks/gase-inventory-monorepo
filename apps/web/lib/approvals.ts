import { apiFetch } from "@/lib/api";
import { asObject, pickNumber, pickString } from "@/lib/normalize";

export type ApprovalStatus = "PENDING_L1" | "PENDING_L2" | "APPROVED" | "REJECTED" | "CANCELLED";
export type ApprovalEntityType =
  | "STOCK_ADJUSTMENT"
  | "PRICE_OVERRIDE"
  | "PURCHASE_ORDER"
  | "SALE_RETURN"
  | "COUNT_ADJUSTMENT";
export type ApprovalReviewAction = "APPROVE" | "REJECT";
export type ApprovalLevel = "L1" | "L2";
export type ApprovalRequestData = Record<string, unknown> | null;

export type ApprovalRequest = {
  id: string;
  tenantId?: string;
  entityType: ApprovalEntityType;
  entityId: string;
  status: ApprovalStatus;
  maxLevel: number;
  requestedById?: string | null;
  requestData: ApprovalRequestData;
  requesterNotes?: string | null;
  l1ReviewedById?: string | null;
  l1ReviewedAt?: string | null;
  l1ReviewNotes?: string | null;
  l2ReviewedById?: string | null;
  l2ReviewedAt?: string | null;
  l2ReviewNotes?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const PENDING_APPROVAL_STATUSES: ApprovalStatus[] = ["PENDING_L1", "PENDING_L2"];
export const HISTORY_APPROVAL_STATUSES: ApprovalStatus[] = ["APPROVED", "REJECTED", "CANCELLED"];

function normalizeApprovalRequestData(payload: unknown): ApprovalRequestData {
  const requestData = asObject(payload);
  return requestData ? { ...requestData } : null;
}

function normalizeApproval(payload: unknown): ApprovalRequest | null {
  const root = asObject(payload);
  if (!root) return null;

  const id = pickString(root.id);
  const entityType = pickString(root.entityType) as ApprovalEntityType;
  const entityId = pickString(root.entityId);
  const status = pickString(root.status) as ApprovalStatus;
  if (!id || !entityType || !entityId || !status) return null;

  return {
    id,
    tenantId: pickString(root.tenantId) || undefined,
    entityType,
    entityId,
    status,
    maxLevel: Math.max(1, pickNumber(root.maxLevel, 1)),
    requestedById: pickString(root.requestedById) || null,
    requestData: normalizeApprovalRequestData(root.requestData),
    requesterNotes: pickString(root.requesterNotes) || null,
    l1ReviewedById: pickString(root.l1ReviewedById) || null,
    l1ReviewedAt: pickString(root.l1ReviewedAt) || null,
    l1ReviewNotes: pickString(root.l1ReviewNotes) || null,
    l2ReviewedById: pickString(root.l2ReviewedById) || null,
    l2ReviewedAt: pickString(root.l2ReviewedAt) || null,
    l2ReviewNotes: pickString(root.l2ReviewNotes) || null,
    expiresAt: pickString(root.expiresAt) || null,
    createdAt: pickString(root.createdAt) || undefined,
    updatedAt: pickString(root.updatedAt) || undefined,
  };
}

export function getApprovalCurrentLevel(approval: ApprovalRequest): ApprovalLevel {
  if (approval.status === "PENDING_L2" || approval.l2ReviewedAt || approval.l2ReviewedById || approval.l2ReviewNotes) {
    return "L2";
  }
  return "L1";
}

export function getApprovalStoreId(approval: ApprovalRequest): string {
  return pickString(approval.requestData?.storeId);
}

export function getApprovalSupplierId(approval: ApprovalRequest): string {
  return pickString(approval.requestData?.supplierId);
}

export function isPendingApproval(approval: ApprovalRequest): boolean {
  return PENDING_APPROVAL_STATUSES.includes(approval.status);
}

export async function getApprovals(): Promise<ApprovalRequest[]> {
  const response = await apiFetch<unknown>("/approvals");
  const rawItems = Array.isArray(response)
    ? response
    : Array.isArray(asObject(response)?.data)
      ? (asObject(response)?.data as unknown[])
      : [];

  return rawItems
    .map((item) => normalizeApproval(item))
    .filter((item): item is ApprovalRequest => Boolean(item));
}

export async function getApproval(id: string): Promise<ApprovalRequest> {
  const response = await apiFetch<unknown>(`/approvals/${id}`);
  const approval = normalizeApproval(response);
  if (!approval) {
    throw new Error("Onay talebi normalize edilemedi.");
  }
  return approval;
}

export async function cancelApproval(id: string): Promise<ApprovalRequest> {
  const response = await apiFetch<unknown>(`/approvals/${id}/cancel`, {
    method: "POST",
  });
  const approval = normalizeApproval(response);
  if (!approval) {
    throw new Error("Onay talebi guncellenemedi.");
  }
  return approval;
}

export async function reviewApprovalL1(
  id: string,
  payload: { action: ApprovalReviewAction; notes?: string },
): Promise<ApprovalRequest> {
  const response = await apiFetch<unknown>(`/approvals/${id}/review-l1`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const approval = normalizeApproval(response);
  if (!approval) {
    throw new Error("L1 inceleme sonucu okunamadi.");
  }
  return approval;
}

export async function reviewApprovalL2(
  id: string,
  payload: { action: ApprovalReviewAction; notes?: string },
): Promise<ApprovalRequest> {
  const response = await apiFetch<unknown>(`/approvals/${id}/review-l2`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const approval = normalizeApproval(response);
  if (!approval) {
    throw new Error("L2 inceleme sonucu okunamadi.");
  }
  return approval;
}
