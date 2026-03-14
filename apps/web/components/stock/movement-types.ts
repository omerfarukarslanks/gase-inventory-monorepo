"use client";

export function getMovementTypeLabel(t: (key: string) => string, type?: string | null) {
  if (type === "ADJUSTMENT") return t("stockMovements.types.ADJUSTMENT");
  if (type === "TRANSFER_OUT") return t("stockMovements.types.TRANSFER_OUT");
  if (type === "TRANSFER_IN") return t("stockMovements.types.TRANSFER_IN");
  if (type === "OUT") return t("stockMovements.types.OUT");
  if (type === "IN") return t("stockMovements.types.IN");
  return type ?? "-";
}

export function getMovementTypeOptions(t: (key: string) => string) {
  return [
    { value: "", label: t("stockMovements.typePlaceholder") },
    { value: "ADJUSTMENT", label: t("stockMovements.types.ADJUSTMENT") },
    { value: "TRANSFER_OUT", label: t("stockMovements.types.TRANSFER_OUT") },
    { value: "TRANSFER_IN", label: t("stockMovements.types.TRANSFER_IN") },
    { value: "OUT", label: t("stockMovements.types.OUT") },
    { value: "IN", label: t("stockMovements.types.IN") },
  ];
}
