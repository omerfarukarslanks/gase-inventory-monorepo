import type { StatusVariant } from "@/components/ui/StatusBadge";
import type { PurchaseOrderStatus } from "@/lib/procurement";
import type { ReplenishmentSuggestionStatus } from "@/lib/replenishment";

export function getSuggestionStatusLabel(status?: ReplenishmentSuggestionStatus | null): string {
  switch (status) {
    case "ACCEPTED":
      return "Kabul Edildi";
    case "DISMISSED":
      return "Reddedildi";
    case "PENDING":
    default:
      return "Bekliyor";
  }
}

export function getSuggestionStatusVariant(status?: ReplenishmentSuggestionStatus | null): StatusVariant {
  switch (status) {
    case "ACCEPTED":
      return "success";
    case "DISMISSED":
      return "error";
    case "PENDING":
    default:
      return "neutral";
  }
}

export function getPurchaseOrderStatusLabel(status?: PurchaseOrderStatus | null): string {
  switch (status) {
    case "APPROVED":
      return "Onaylandi";
    case "PARTIALLY_RECEIVED":
      return "Kismi Kabul";
    case "RECEIVED":
      return "Kabul Edildi";
    case "CANCELLED":
      return "Iptal";
    case "DRAFT":
    default:
      return "Taslak";
  }
}

export function getPurchaseOrderStatusVariant(status?: PurchaseOrderStatus | null): StatusVariant {
  switch (status) {
    case "RECEIVED":
      return "success";
    case "CANCELLED":
      return "error";
    case "APPROVED":
    case "PARTIALLY_RECEIVED":
    case "DRAFT":
    default:
      return "neutral";
  }
}

export function formatPoStatusStep(status?: PurchaseOrderStatus | null) {
  const order: PurchaseOrderStatus[] = [
    "DRAFT",
    "APPROVED",
    "PARTIALLY_RECEIVED",
    "RECEIVED",
    "CANCELLED",
  ];

  const index = order.indexOf(status ?? "DRAFT");
  return order.map((item, itemIndex) => ({
    key: item,
    label: getPurchaseOrderStatusLabel(item),
    active: item === status,
    completed:
      status === "CANCELLED"
        ? item === "CANCELLED"
        : itemIndex <= Math.max(index, 0),
  }));
}
