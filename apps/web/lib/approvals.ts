import { apiFetch } from "@/lib/api";
import { asObject } from "@/lib/normalize";
import type { ApprovalRequest, ApprovalReviewAction } from "@gase/core";
import {
  normalizeApproval,
  getApprovalCurrentLevel,
  getApprovalStoreId,
  getApprovalSupplierId,
  isPendingApproval,
  PENDING_APPROVAL_STATUSES,
  HISTORY_APPROVAL_STATUSES,
} from "@gase/core";

// Pure types and helpers are now canonical in @gase/core. Re-exported for backward compatibility.
export type {
  ApprovalStatus,
  ApprovalEntityType,
  ApprovalReviewAction,
  ApprovalLevel,
  ApprovalRequestData,
  ApprovalRequest,
} from "@gase/core";
export {
  PENDING_APPROVAL_STATUSES,
  HISTORY_APPROVAL_STATUSES,
  normalizeApproval,
  getApprovalCurrentLevel,
  getApprovalStoreId,
  getApprovalSupplierId,
  isPendingApproval,
};

// ─── API functions (web-only, use apiFetch) ───────────────────────────────────

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
