"use client";

import type { PickingTaskStatus, PutawayTaskStatus, WaveStatus } from "@/lib/warehouse";
import type { StatusVariant } from "@/components/ui/StatusBadge";

export function getPutawayTaskStatusVariant(status: PutawayTaskStatus): StatusVariant {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  return "neutral";
}

export function getPickingTaskStatusVariant(status: PickingTaskStatus): StatusVariant {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED" || status === "SHORT_PICK") return "error";
  return "neutral";
}

export function getWaveStatusVariant(status: WaveStatus): StatusVariant {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "error";
  return "neutral";
}
