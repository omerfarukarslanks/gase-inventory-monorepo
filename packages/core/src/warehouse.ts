import { apiFetch } from "./api";
import { appendIfDefined } from "./query-builder";

export type Warehouse = {
  id: string;
  storeId?: string;
  storeName?: string | null;
  name: string;
  address?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type WarehouseLocationType = "RACK" | "BIN" | "SHELF" | "ZONE" | string;

export type WarehouseLocation = {
  id: string;
  warehouseId?: string;
  warehouseName?: string | null;
  code: string;
  name: string;
  type?: WarehouseLocationType | null;
  isActive?: boolean;
};

export type CountSessionStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";

export type CountSessionLine = {
  id: string;
  productVariantId?: string;
  productName?: string | null;
  variantName?: string | null;
  lotNumber?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  expectedQuantity?: number | null;
  countedQuantity?: number | null;
  difference?: number | null;
  isAdjusted?: boolean;
  adjustmentMovementId?: string | null;
};

export type CountSession = {
  id: string;
  storeId?: string;
  storeName?: string | null;
  warehouseId?: string;
  warehouseName?: string | null;
  status?: CountSessionStatus;
  notes?: string | null;
  startedAt?: string | null;
  closedAt?: string | null;
  lines?: CountSessionLine[];
};

export type PutawayTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type PutawayTask = {
  id: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  productVariantId?: string | null;
  productName?: string | null;
  variantName?: string | null;
  quantity?: number | null;
  goodsReceiptId?: string | null;
  goodsReceiptLineId?: string | null;
  toLocationId?: string | null;
  toLocationCode?: string | null;
  toLocationName?: string | null;
  status?: PutawayTaskStatus;
  assignedToUserId?: string | null;
  completedAt?: string | null;
  notes?: string | null;
};

export type PickingTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "SHORT_PICK";

export type PickingTask = {
  id: string;
  warehouseId?: string | null;
  warehouseName?: string | null;
  productVariantId?: string | null;
  productName?: string | null;
  variantName?: string | null;
  requestedQuantity?: number | null;
  pickedQuantity?: number | null;
  fromLocationId?: string | null;
  fromLocationCode?: string | null;
  fromLocationName?: string | null;
  waveId?: string | null;
  waveCode?: string | null;
  saleId?: string | null;
  status?: PickingTaskStatus;
  assignedToUserId?: string | null;
  completedAt?: string | null;
  notes?: string | null;
};

export type CreateCountSessionPayload = {
  storeId: string;
  warehouseId: string;
  notes?: string;
};

export type AddCountSessionLinePayload = {
  productVariantId: string;
  lotNumber?: string;
  locationId: string;
  expectedQuantity: number;
  countedQuantity: number;
};

export type UpdateCountSessionLinePayload = {
  countedQuantity: number;
};

export type GetCountSessionsParams = {
  storeId?: string;
};

export type GetWarehousesParams = {
  storeId?: string;
};

export type GetPutawayTasksParams = {
  warehouseId: string;
};

export type GetPickingTasksParams = {
  warehouseId: string;
  waveId?: string;
};

export type CompletePickingTaskPayload = {
  pickedQuantity: number;
};

type WarehouseLike = Record<string, unknown>;

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function normalizeWarehouse(payload: WarehouseLike): Warehouse {
  return {
    id: asString(payload.id) ?? "",
    storeId: asString(payload.storeId) ?? asString((payload.store as WarehouseLike | undefined)?.id) ?? undefined,
    storeName: asString(payload.storeName) ?? asString((payload.store as WarehouseLike | undefined)?.name),
    name: asString(payload.name) ?? "-",
    address: asString(payload.address),
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : undefined,
    createdAt: asString(payload.createdAt) ?? undefined,
    updatedAt: asString(payload.updatedAt) ?? undefined,
  };
}

function normalizeWarehouseLocation(payload: WarehouseLike): WarehouseLocation {
  const warehouse = payload.warehouse as WarehouseLike | undefined;
  return {
    id: asString(payload.id) ?? "",
    warehouseId: asString(payload.warehouseId) ?? asString(warehouse?.id) ?? undefined,
    warehouseName: asString(payload.warehouseName) ?? asString(warehouse?.name),
    code: asString(payload.code) ?? "-",
    name: asString(payload.name) ?? "-",
    type: asString(payload.type) ?? undefined,
    isActive: typeof payload.isActive === "boolean" ? payload.isActive : undefined,
  };
}

function normalizeCountSessionLine(payload: WarehouseLike): CountSessionLine {
  return {
    id: asString(payload.id) ?? "",
    productVariantId: asString(payload.productVariantId) ?? asString((payload.purchaseOrderLine as WarehouseLike | undefined)?.productVariantId) ?? undefined,
    productName: asString(payload.productName),
    variantName: asString(payload.variantName),
    lotNumber: asString(payload.lotNumber),
    locationId: asString(payload.locationId) ?? undefined,
    locationName: asString(payload.locationName),
    expectedQuantity: asNumber(payload.expectedQuantity),
    countedQuantity: asNumber(payload.countedQuantity),
    difference: asNumber(payload.difference),
    isAdjusted: typeof payload.isAdjusted === "boolean" ? payload.isAdjusted : undefined,
    adjustmentMovementId: asString(payload.adjustmentMovementId),
  };
}

function normalizeCountSession(payload: WarehouseLike): CountSession {
  const lines = Array.isArray(payload.lines)
    ? payload.lines.map((item) => normalizeCountSessionLine((item ?? {}) as WarehouseLike))
    : undefined;

  return {
    id: asString(payload.id) ?? "",
    storeId: asString(payload.storeId) ?? asString((payload.store as WarehouseLike | undefined)?.id) ?? undefined,
    storeName: asString(payload.storeName) ?? asString((payload.store as WarehouseLike | undefined)?.name),
    warehouseId: asString(payload.warehouseId) ?? asString(payload.wareHouseId) ?? undefined,
    warehouseName: asString(payload.warehouseName) ?? asString(payload.wareHouseName),
    status: asString(payload.status) as CountSessionStatus | undefined,
    notes: asString(payload.notes),
    startedAt: asString(payload.startedAt),
    closedAt: asString(payload.closedAt),
    lines,
  };
}

function normalizePutawayTask(payload: WarehouseLike): PutawayTask {
  const toLocation = payload.toLocation as WarehouseLike | undefined;
  return {
    id: asString(payload.id) ?? "",
    warehouseId: asString(payload.warehouseId) ?? undefined,
    warehouseName: asString(payload.warehouseName),
    productVariantId: asString(payload.productVariantId),
    productName: asString(payload.productName),
    variantName: asString(payload.variantName) ?? asString((payload.productVariant as WarehouseLike | undefined)?.name),
    quantity: asNumber(payload.quantity),
    goodsReceiptId: asString(payload.goodsReceiptId),
    goodsReceiptLineId: asString(payload.goodsReceiptLineId),
    toLocationId: asString(payload.toLocationId) ?? asString(toLocation?.id),
    toLocationCode: asString(payload.toLocationCode) ?? asString(toLocation?.code),
    toLocationName: asString(payload.toLocationName) ?? asString(toLocation?.name),
    status: asString(payload.status) as PutawayTaskStatus | undefined,
    assignedToUserId: asString(payload.assignedToUserId),
    completedAt: asString(payload.completedAt),
    notes: asString(payload.notes),
  };
}

function normalizePickingTask(payload: WarehouseLike): PickingTask {
  const fromLocation = payload.fromLocation as WarehouseLike | undefined;
  const wave = payload.wave as WarehouseLike | undefined;
  return {
    id: asString(payload.id) ?? "",
    warehouseId: asString(payload.warehouseId) ?? undefined,
    warehouseName: asString(payload.warehouseName),
    productVariantId: asString(payload.productVariantId),
    productName: asString(payload.productName),
    variantName: asString(payload.variantName) ?? asString((payload.productVariant as WarehouseLike | undefined)?.name),
    requestedQuantity: asNumber(payload.requestedQuantity),
    pickedQuantity: asNumber(payload.pickedQuantity),
    fromLocationId: asString(payload.fromLocationId) ?? asString(fromLocation?.id),
    fromLocationCode: asString(payload.fromLocationCode) ?? asString(fromLocation?.code),
    fromLocationName: asString(payload.fromLocationName) ?? asString(fromLocation?.name),
    waveId: asString(payload.waveId) ?? asString(wave?.id),
    waveCode: asString(payload.waveCode) ?? asString(wave?.code),
    saleId: asString(payload.saleId),
    status: asString(payload.status) as PickingTaskStatus | undefined,
    assignedToUserId: asString(payload.assignedToUserId),
    completedAt: asString(payload.completedAt),
    notes: asString(payload.notes),
  };
}

export async function getWarehouses({ storeId }: GetWarehousesParams = {}): Promise<Warehouse[]> {
  const query = new URLSearchParams();
  appendIfDefined(query, "storeId", storeId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const payload = await apiFetch<unknown>(`/warehouse/warehouses${suffix}`);
  return Array.isArray(payload) ? payload.map((item) => normalizeWarehouse((item ?? {}) as WarehouseLike)) : [];
}

export async function getWarehouseLocations(warehouseId: string): Promise<WarehouseLocation[]> {
  const payload = await apiFetch<unknown>(`/warehouse/warehouses/${warehouseId}/locations`);
  return Array.isArray(payload)
    ? payload.map((item) => normalizeWarehouseLocation((item ?? {}) as WarehouseLike))
    : [];
}

export async function getCountSessions({ storeId }: GetCountSessionsParams = {}): Promise<CountSession[]> {
  const query = new URLSearchParams();
  appendIfDefined(query, "storeId", storeId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const payload = await apiFetch<unknown>(`/warehouse/count-sessions${suffix}`);
  return Array.isArray(payload)
    ? payload.map((item) => normalizeCountSession((item ?? {}) as WarehouseLike))
    : [];
}

export async function getCountSession(id: string): Promise<CountSession> {
  const payload = await apiFetch<unknown>(`/warehouse/count-sessions/${id}`);
  return normalizeCountSession((payload ?? {}) as WarehouseLike);
}

export async function createCountSession(payload: CreateCountSessionPayload): Promise<CountSession> {
  const result = await apiFetch<unknown>("/warehouse/count-sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeCountSession((result ?? {}) as WarehouseLike);
}

export async function addCountSessionLine(
  id: string,
  payload: AddCountSessionLinePayload,
): Promise<CountSessionLine> {
  const result = await apiFetch<unknown>(`/warehouse/count-sessions/${id}/lines`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeCountSessionLine((result ?? {}) as WarehouseLike);
}

export async function updateCountSessionLine(
  sessionId: string,
  lineId: string,
  payload: UpdateCountSessionLinePayload,
): Promise<CountSessionLine> {
  const result = await apiFetch<unknown>(`/warehouse/count-sessions/${sessionId}/lines/${lineId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return normalizeCountSessionLine((result ?? {}) as WarehouseLike);
}

export async function closeCountSession(id: string): Promise<CountSession> {
  const payload = await apiFetch<unknown>(`/warehouse/count-sessions/${id}/close`, {
    method: "POST",
  });
  return normalizeCountSession((payload ?? {}) as WarehouseLike);
}

export async function getPutawayTasks({ warehouseId }: GetPutawayTasksParams): Promise<PutawayTask[]> {
  const query = new URLSearchParams();
  appendIfDefined(query, "warehouseId", warehouseId);
  const payload = await apiFetch<unknown>(`/warehouse/putaway-tasks?${query.toString()}`);
  return Array.isArray(payload)
    ? payload.map((item) => normalizePutawayTask((item ?? {}) as WarehouseLike))
    : [];
}

export async function getPutawayTask(id: string): Promise<PutawayTask> {
  const payload = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}`);
  return normalizePutawayTask((payload ?? {}) as WarehouseLike);
}

export async function assignPutawayTask(id: string, userId: string): Promise<PutawayTask> {
  const payload = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return normalizePutawayTask((payload ?? {}) as WarehouseLike);
}

export async function completePutawayTask(id: string): Promise<PutawayTask> {
  const payload = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}/complete`, {
    method: "POST",
  });
  return normalizePutawayTask((payload ?? {}) as WarehouseLike);
}

export async function cancelPutawayTask(id: string): Promise<PutawayTask> {
  const payload = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}/cancel`, {
    method: "POST",
  });
  return normalizePutawayTask((payload ?? {}) as WarehouseLike);
}

export async function getPickingTasks({
  warehouseId,
  waveId,
}: GetPickingTasksParams): Promise<PickingTask[]> {
  const query = new URLSearchParams();
  appendIfDefined(query, "warehouseId", warehouseId);
  appendIfDefined(query, "waveId", waveId);
  const payload = await apiFetch<unknown>(`/warehouse/picking-tasks?${query.toString()}`);
  return Array.isArray(payload)
    ? payload.map((item) => normalizePickingTask((item ?? {}) as WarehouseLike))
    : [];
}

export async function getPickingTask(id: string): Promise<PickingTask> {
  const payload = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}`);
  return normalizePickingTask((payload ?? {}) as WarehouseLike);
}

export async function assignPickingTask(id: string, userId: string): Promise<PickingTask> {
  const payload = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  return normalizePickingTask((payload ?? {}) as WarehouseLike);
}

export async function completePickingTask(
  id: string,
  payload: CompletePickingTaskPayload,
): Promise<PickingTask> {
  const result = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizePickingTask((result ?? {}) as WarehouseLike);
}

export async function cancelPickingTask(id: string): Promise<PickingTask> {
  const payload = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}/cancel`, {
    method: "POST",
  });
  return normalizePickingTask((payload ?? {}) as WarehouseLike);
}
