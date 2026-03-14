import type { StatusVariant } from "@/components/ui/StatusBadge";
import type { ApprovalEntityType, ApprovalLevel, ApprovalStatus } from "@/lib/approvals";

export function getApprovalStatusLabel(status: ApprovalStatus): string {
  switch (status) {
    case "PENDING_L1":
      return "L1 Bekliyor";
    case "PENDING_L2":
      return "L2 Bekliyor";
    case "APPROVED":
      return "Onaylandi";
    case "REJECTED":
      return "Reddedildi";
    case "CANCELLED":
      return "Iptal Edildi";
    default:
      return status;
  }
}

export function getApprovalStatusVariant(status: ApprovalStatus): StatusVariant {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
    case "CANCELLED":
      return "error";
    default:
      return "neutral";
  }
}

export function getApprovalEntityTypeLabel(entityType: ApprovalEntityType): string {
  switch (entityType) {
    case "STOCK_ADJUSTMENT":
      return "Stok Duzeltme";
    case "PRICE_OVERRIDE":
      return "Fiyat Override";
    case "PURCHASE_ORDER":
      return "Satin Alma Siparisi";
    case "SALE_RETURN":
      return "Satis Iadesi";
    case "COUNT_ADJUSTMENT":
      return "Sayim Duzeltme";
    default:
      return entityType;
  }
}

export function getApprovalLevelLabel(level: ApprovalLevel): string {
  return level;
}
