import { apiFetch } from "@/lib/api";
import { asObject, pickNumber, pickNumberOrNull, pickString } from "@/lib/normalize";

export type Warehouse = {
  id: string;
  storeId: string;
  storeName?: string | null;
  name: string;
  address?: string | null;
  isActive: boolean;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type WarehouseLocationType = "RACK" | "BIN" | "SHELF" | "ZONE";

export const WAREHOUSE_LOCATION_TYPE_OPTIONS: Array<{ value: WarehouseLocationType; label: string }> = [
  { value: "RACK", label: "Raf Sistemi" },
  { value: "BIN", label: "Kutu / Goz" },
  { value: "SHELF", label: "Raf" },
  { value: "ZONE", label: "Bolge" },
];

const WAREHOUSE_LOCATION_TYPE_LABELS: Record<WarehouseLocationType, string> = Object.fromEntries(
  WAREHOUSE_LOCATION_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<WarehouseLocationType, string>;

export function getWarehouseLocationTypeLabel(type: string | null | undefined) {
  if (!type) return "-";
  return WAREHOUSE_LOCATION_TYPE_LABELS[type as WarehouseLocationType] ?? type;
}

export type WarehouseLocation = {
  id: string;
  warehouseId: string;
  warehouseName?: string | null;
  code: string;
  name: string;
  type: WarehouseLocationType;
  isActive: boolean;
};

export type CountSessionStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
export type PutawayTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type WaveStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PickingTaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "SHORT_PICK";

export type CountSessionLine = {
  id: string;
  productVariantId: string;
  productName?: string | null;
  variantName?: string | null;
  lotNumber?: string | null;
  locationId?: string | null;
  locationName?: string | null;
  locationCode?: string | null;
  expectedQuantity: number;
  countedQuantity: number;
  difference?: number | null;
  isAdjusted: boolean;
  adjustmentMovementId?: string | null;
};

export type CountSession = {
  id: string;
  storeId: string;
  storeName?: string | null;
  warehouseId: string;
  warehouseName?: string | null;
  status: CountSessionStatus;
  notes?: string | null;
  startedAt?: string | null;
  closedAt?: string | null;
  lines?: CountSessionLine[];
};

export type PutawayTask = {
  id: string;
  warehouseId: string;
  warehouseName?: string | null;
  productVariantId: string;
  productName?: string | null;
  variantName?: string | null;
  quantity: number;
  toLocationId?: string | null;
  toLocationCode?: string | null;
  toLocationName?: string | null;
  goodsReceiptId?: string | null;
  goodsReceiptLineId?: string | null;
  status: PutawayTaskStatus;
  assignedToUserId?: string | null;
  completedAt?: string | null;
  notes?: string | null;
};

export type Wave = {
  id: string;
  warehouseId: string;
  warehouseName?: string | null;
  code: string;
  status: WaveStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
};

export type PickingTask = {
  id: string;
  warehouseId: string;
  warehouseName?: string | null;
  productVariantId: string;
  productName?: string | null;
  variantName?: string | null;
  requestedQuantity: number;
  pickedQuantity?: number | null;
  fromLocationId?: string | null;
  fromLocationCode?: string | null;
  fromLocationName?: string | null;
  saleId?: string | null;
  waveId?: string | null;
  waveCode?: string | null;
  status: PickingTaskStatus;
  assignedToUserId?: string | null;
  completedAt?: string | null;
  notes?: string | null;
};

export type CreateWarehousePayload = {
  storeId: string;
  name: string;
  address?: string;
};

export type UpdateWarehousePayload = {
  name?: string;
  address?: string;
  isActive?: boolean;
};

export type CreateWarehouseLocationPayload = {
  warehouseId: string;
  code: string;
  name: string;
  type: WarehouseLocationType;
};

export type UpdateWarehouseLocationPayload = {
  warehouseId?: string;
  code?: string;
  name?: string;
  type?: WarehouseLocationType;
  isActive?: boolean;
};

export type CreateCountSessionPayload = {
  storeId: string;
  warehouseId: string;
  notes?: string;
};

export type CreateCountSessionLinePayload = {
  productVariantId: string;
  lotNumber?: string;
  locationId?: string;
  expectedQuantity: number;
  countedQuantity: number;
};

export type UpdateCountSessionLinePayload = {
  countedQuantity: number;
};

export type CreatePutawayTaskPayload = {
  warehouseId: string;
  productVariantId: string;
  quantity: number;
  toLocationId: string;
  notes?: string;
};

export type CreateGoodsReceiptPutawayTaskLinePayload = {
  goodsReceiptLineId: string;
  toLocationId: string;
};

export type CreateGoodsReceiptPutawayTasksPayload = {
  lines: CreateGoodsReceiptPutawayTaskLinePayload[];
  notes?: string;
};

export type AssignWarehouseTaskPayload = {
  userId: string;
};

export type CreateWavePayload = {
  warehouseId: string;
  code: string;
  notes?: string;
};

export type CreatePickingTaskPayload = {
  warehouseId: string;
  productVariantId: string;
  requestedQuantity: number;
  fromLocationId: string;
  saleId?: string;
  waveId: string;
  notes?: string;
};

export type CompletePickingTaskPayload = {
  pickedQuantity: number;
};

function normalizeWarehouse(payload: unknown): Warehouse | null {
  const root = asObject(payload);
  if (!root) return null;

  const id = pickString(root.id);
  const store = asObject(root.store);
  const storeId = pickString(root.storeId, store?.id);
  const name = pickString(root.name);
  if (!id || !storeId || !name) return null;

  return {
    id,
    storeId,
    storeName: pickString(root.storeName, store?.name) || null,
    name,
    address: pickString(root.address) || null,
    isActive: root.isActive === false ? false : true,
    createdById: pickString(root.createdById) || null,
    updatedById: pickString(root.updatedById) || null,
    createdAt: pickString(root.createdAt) || undefined,
    updatedAt: pickString(root.updatedAt) || undefined,
  };
}

function normalizeLocation(payload: unknown): WarehouseLocation | null {
  const root = asObject(payload);
  if (!root) return null;

  const warehouse = asObject(root.warehouse);
  const id = pickString(root.id);
  const warehouseId = pickString(root.warehouseId, warehouse?.id);
  const code = pickString(root.code);
  const name = pickString(root.name);
  const type = pickString(root.type) as WarehouseLocationType | "";
  if (!id || !warehouseId || !code || !name || !type) return null;

  return {
    id,
    warehouseId,
    warehouseName: pickString(root.warehouseName, warehouse?.name) || null,
    code,
    name,
    type,
    isActive: root.isActive === false ? false : true,
  };
}

function normalizeCountSessionLine(payload: unknown): CountSessionLine | null {
  const root = asObject(payload);
  if (!root) return null;

  const location = asObject(root.location);
  const product = asObject(root.product);
  const variant = asObject(root.productVariant);
  const id = pickString(root.id);
  const productVariantId = pickString(root.productVariantId, variant?.id);
  if (!id || !productVariantId) return null;

  return {
    id,
    productVariantId,
    productName: pickString(root.productName, product?.name) || null,
    variantName: pickString(root.variantName, variant?.name) || null,
    lotNumber: pickString(root.lotNumber) || null,
    locationId: pickString(root.locationId, location?.id) || null,
    locationName: pickString(root.locationName, location?.name) || null,
    locationCode: pickString(root.locationCode, location?.code) || null,
    expectedQuantity: pickNumber(root.expectedQuantity),
    countedQuantity: pickNumber(root.countedQuantity),
    difference: root.difference == null ? null : pickNumberOrNull(root.difference),
    isAdjusted: Boolean(root.isAdjusted),
    adjustmentMovementId: pickString(root.adjustmentMovementId) || null,
  };
}

function normalizeCountSession(payload: unknown): CountSession | null {
  const root = asObject(payload);
  if (!root) return null;

  const warehouse = asObject(root.warehouse);
  const wareHouse = asObject(root.wareHouse);
  const store = asObject(root.store);
  const id = pickString(root.id);
  const storeId = pickString(root.storeId, store?.id);
  const warehouseId = pickString(root.warehouseId, root.wareHouseId, warehouse?.id, wareHouse?.id);
  const status = pickString(root.status) as CountSessionStatus;
  if (!id || !storeId || !warehouseId || !status) return null;

  const rawLines = Array.isArray(root.lines) ? root.lines : [];
  return {
    id,
    storeId,
    storeName: pickString(root.storeName, store?.name) || null,
    warehouseId,
    warehouseName: pickString(root.warehouseName, root.wareHouseName, warehouse?.name, wareHouse?.name) || null,
    status,
    notes: pickString(root.notes) || null,
    startedAt: pickString(root.startedAt) || null,
    closedAt: pickString(root.closedAt) || null,
    lines: rawLines
      .map((line) => normalizeCountSessionLine(line))
      .filter((line): line is CountSessionLine => Boolean(line)),
  };
}

function normalizePutawayTask(payload: unknown): PutawayTask | null {
  const root = asObject(payload);
  if (!root) return null;

  const warehouse = asObject(root.warehouse);
  const product = asObject(root.product);
  const variant = asObject(root.productVariant);
  const toLocation = asObject(root.toLocation);
  const id = pickString(root.id);
  const warehouseId = pickString(root.warehouseId, warehouse?.id);
  const productVariantId = pickString(root.productVariantId, variant?.id);
  const status = pickString(root.status) as PutawayTaskStatus;
  if (!id || !warehouseId || !productVariantId || !status) return null;

  return {
    id,
    warehouseId,
    warehouseName: pickString(root.warehouseName, warehouse?.name) || null,
    productVariantId,
    productName: pickString(root.productName, product?.name) || null,
    variantName: pickString(root.variantName, variant?.name) || null,
    quantity: pickNumber(root.quantity),
    toLocationId: pickString(root.toLocationId, toLocation?.id) || null,
    toLocationCode: pickString(root.toLocationCode, toLocation?.code) || null,
    toLocationName: pickString(root.toLocationName, toLocation?.name) || null,
    goodsReceiptId: pickString(root.goodsReceiptId) || null,
    goodsReceiptLineId: pickString(root.goodsReceiptLineId) || null,
    status,
    assignedToUserId: pickString(root.assignedToUserId) || null,
    completedAt: pickString(root.completedAt) || null,
    notes: pickString(root.notes) || null,
  };
}

function normalizeWave(payload: unknown): Wave | null {
  const root = asObject(payload);
  if (!root) return null;

  const warehouse = asObject(root.warehouse);
  const id = pickString(root.id);
  const warehouseId = pickString(root.warehouseId, warehouse?.id);
  const code = pickString(root.code);
  const status = pickString(root.status) as WaveStatus;
  if (!id || !warehouseId || !code || !status) return null;

  return {
    id,
    warehouseId,
    warehouseName: pickString(root.warehouseName, warehouse?.name) || null,
    code,
    status,
    startedAt: pickString(root.startedAt) || null,
    completedAt: pickString(root.completedAt) || null,
    notes: pickString(root.notes) || null,
  };
}

function normalizePickingTask(payload: unknown): PickingTask | null {
  const root = asObject(payload);
  if (!root) return null;

  const warehouse = asObject(root.warehouse);
  const product = asObject(root.product);
  const variant = asObject(root.productVariant);
  const fromLocation = asObject(root.fromLocation);
  const wave = asObject(root.wave);
  const id = pickString(root.id);
  const warehouseId = pickString(root.warehouseId, warehouse?.id);
  const productVariantId = pickString(root.productVariantId, variant?.id);
  const status = pickString(root.status) as PickingTaskStatus;
  if (!id || !warehouseId || !productVariantId || !status) return null;

  return {
    id,
    warehouseId,
    warehouseName: pickString(root.warehouseName, warehouse?.name) || null,
    productVariantId,
    productName: pickString(root.productName, product?.name) || null,
    variantName: pickString(root.variantName, variant?.name) || null,
    requestedQuantity: pickNumber(root.requestedQuantity),
    pickedQuantity: root.pickedQuantity == null ? null : pickNumberOrNull(root.pickedQuantity),
    fromLocationId: pickString(root.fromLocationId, fromLocation?.id) || null,
    fromLocationCode: pickString(root.fromLocationCode, fromLocation?.code) || null,
    fromLocationName: pickString(root.fromLocationName, fromLocation?.name) || null,
    saleId: pickString(root.saleId) || null,
    waveId: pickString(root.waveId, wave?.id) || null,
    waveCode: pickString(root.waveCode, wave?.code) || null,
    status,
    assignedToUserId: pickString(root.assignedToUserId) || null,
    completedAt: pickString(root.completedAt) || null,
    notes: pickString(root.notes) || null,
  };
}

function normalizeList<T>(payload: unknown, normalizeItem: (item: unknown) => T | null): T[] {
  const root = asObject(payload);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(root?.data)
      ? root.data
      : Array.isArray(root?.items)
        ? root.items
        : [];

  return rawItems
    .map((item) => normalizeItem(item))
    .filter((item): item is T => Boolean(item));
}

export async function getWarehouses(params?: { storeId?: string }): Promise<Warehouse[]> {
  const query = new URLSearchParams();
  if (params?.storeId) query.set("storeId", params.storeId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<unknown>(`/warehouse/warehouses${suffix}`);
  return normalizeList(response, normalizeWarehouse);
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  const response = await apiFetch<unknown>(`/warehouse/warehouses/${id}`);
  const item = normalizeWarehouse(response);
  if (!item) throw new Error("Depo detayi okunamadi.");
  return item;
}

export async function createWarehouse(payload: CreateWarehousePayload): Promise<Warehouse> {
  const response = await apiFetch<unknown>("/warehouse/warehouses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizeWarehouse(response);
  if (!item) throw new Error("Depo olusturulamadi.");
  return item;
}

export async function updateWarehouse(id: string, payload: UpdateWarehousePayload): Promise<Warehouse> {
  const response = await apiFetch<unknown>(`/warehouse/warehouses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const item = normalizeWarehouse(response);
  if (!item) throw new Error("Depo guncellenemedi.");
  return item;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiFetch<unknown>(`/warehouse/warehouses/${id}`, {
    method: "DELETE",
  });
}

export async function getWarehouseLocations(warehouseId: string): Promise<WarehouseLocation[]> {
  const response = await apiFetch<unknown>(`/warehouse/warehouses/${warehouseId}/locations`);
  return normalizeList(response, normalizeLocation);
}

export async function getWarehouseLocation(id: string): Promise<WarehouseLocation> {
  const response = await apiFetch<unknown>(`/warehouse/locations/${id}`);
  const item = normalizeLocation(response);
  if (!item) throw new Error("Lokasyon detayi okunamadi.");
  return item;
}

export async function createWarehouseLocation(payload: CreateWarehouseLocationPayload): Promise<WarehouseLocation> {
  const response = await apiFetch<unknown>("/warehouse/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizeLocation(response);
  if (!item) throw new Error("Lokasyon olusturulamadi.");
  return item;
}

export async function updateWarehouseLocation(id: string, payload: UpdateWarehouseLocationPayload): Promise<WarehouseLocation> {
  const response = await apiFetch<unknown>(`/warehouse/locations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const item = normalizeLocation(response);
  if (!item) throw new Error("Lokasyon guncellenemedi.");
  return item;
}

export async function deleteWarehouseLocation(id: string): Promise<void> {
  await apiFetch<unknown>(`/warehouse/locations/${id}`, {
    method: "DELETE",
  });
}

export async function getCountSessions(params?: { storeId?: string }): Promise<CountSession[]> {
  const query = new URLSearchParams();
  if (params?.storeId) query.set("storeId", params.storeId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<unknown>(`/warehouse/count-sessions${suffix}`);
  return normalizeList(response, normalizeCountSession);
}

export async function getCountSession(id: string): Promise<CountSession> {
  const response = await apiFetch<unknown>(`/warehouse/count-sessions/${id}`);
  const item = normalizeCountSession(response);
  if (!item) throw new Error("Sayim oturumu detayi okunamadi.");
  return item;
}

export async function createCountSession(payload: CreateCountSessionPayload): Promise<CountSession> {
  const response = await apiFetch<unknown>("/warehouse/count-sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizeCountSession(response);
  if (!item) throw new Error("Sayim oturumu olusturulamadi.");
  return item;
}

export async function addCountSessionLine(sessionId: string, payload: CreateCountSessionLinePayload): Promise<CountSessionLine> {
  const response = await apiFetch<unknown>(`/warehouse/count-sessions/${sessionId}/lines`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizeCountSessionLine(response);
  if (!item) throw new Error("Sayim satiri eklenemedi.");
  return item;
}

export async function updateCountSessionLine(
  sessionId: string,
  lineId: string,
  payload: UpdateCountSessionLinePayload,
): Promise<CountSessionLine> {
  const response = await apiFetch<unknown>(`/warehouse/count-sessions/${sessionId}/lines/${lineId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  const item = normalizeCountSessionLine(response);
  if (!item) throw new Error("Sayim satiri guncellenemedi.");
  return item;
}

export async function closeCountSession(id: string): Promise<CountSession> {
  const response = await apiFetch<unknown>(`/warehouse/count-sessions/${id}/close`, {
    method: "POST",
  });
  const item = normalizeCountSession(response);
  if (!item) throw new Error("Sayim oturumu kapatilamadi.");
  return item;
}

export async function getPutawayTasks(params?: { warehouseId?: string }): Promise<PutawayTask[]> {
  const query = new URLSearchParams();
  if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<unknown>(`/warehouse/putaway-tasks${suffix}`);
  return normalizeList(response, normalizePutawayTask);
}

export async function getPutawayTask(id: string): Promise<PutawayTask> {
  const response = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}`);
  const item = normalizePutawayTask(response);
  if (!item) throw new Error("Yerlestirme gorevi okunamadi.");
  return item;
}

export async function createPutawayTask(payload: CreatePutawayTaskPayload): Promise<PutawayTask> {
  const response = await apiFetch<unknown>("/warehouse/putaway-tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizePutawayTask(response);
  if (!item) throw new Error("Yerlestirme gorevi olusturulamadi.");
  return item;
}

export async function createPutawayTasksFromGoodsReceipt(
  id: string,
  payload: CreateGoodsReceiptPutawayTasksPayload,
): Promise<PutawayTask[]> {
  const response = await apiFetch<unknown>(`/warehouse/goods-receipts/${id}/putaway-tasks`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return normalizeList(response, normalizePutawayTask);
}

export async function assignPutawayTask(id: string, payload: AssignWarehouseTaskPayload): Promise<PutawayTask> {
  const response = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizePutawayTask(response);
  if (!item) throw new Error("Yerlestirme gorevi atanamadi.");
  return item;
}

export async function completePutawayTask(id: string): Promise<PutawayTask> {
  const response = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}/complete`, {
    method: "POST",
  });
  const item = normalizePutawayTask(response);
  if (!item) throw new Error("Yerlestirme gorevi tamamlanamadi.");
  return item;
}

export async function cancelPutawayTask(id: string): Promise<PutawayTask> {
  const response = await apiFetch<unknown>(`/warehouse/putaway-tasks/${id}/cancel`, {
    method: "POST",
  });
  const item = normalizePutawayTask(response);
  if (!item) throw new Error("Yerlestirme gorevi iptal edilemedi.");
  return item;
}

export async function getWaves(params?: { warehouseId?: string }): Promise<Wave[]> {
  const query = new URLSearchParams();
  if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<unknown>(`/warehouse/waves${suffix}`);
  return normalizeList(response, normalizeWave);
}

export async function getWave(id: string): Promise<Wave> {
  const response = await apiFetch<unknown>(`/warehouse/waves/${id}`);
  const item = normalizeWave(response);
  if (!item) throw new Error("Wave detayi okunamadi.");
  return item;
}

export async function createWave(payload: CreateWavePayload): Promise<Wave> {
  const response = await apiFetch<unknown>("/warehouse/waves", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizeWave(response);
  if (!item) throw new Error("Wave olusturulamadi.");
  return item;
}

export async function startWave(id: string): Promise<Wave> {
  const response = await apiFetch<unknown>(`/warehouse/waves/${id}/start`, {
    method: "POST",
  });
  const item = normalizeWave(response);
  if (!item) throw new Error("Wave baslatilamadi.");
  return item;
}

export async function completeWave(id: string): Promise<Wave> {
  const response = await apiFetch<unknown>(`/warehouse/waves/${id}/complete`, {
    method: "POST",
  });
  const item = normalizeWave(response);
  if (!item) throw new Error("Wave tamamlanamadi.");
  return item;
}

export async function getPickingTasks(params?: { warehouseId?: string; waveId?: string }): Promise<PickingTask[]> {
  const query = new URLSearchParams();
  if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
  if (params?.waveId) query.set("waveId", params.waveId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await apiFetch<unknown>(`/warehouse/picking-tasks${suffix}`);
  return normalizeList(response, normalizePickingTask);
}

export async function getPickingTask(id: string): Promise<PickingTask> {
  const response = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}`);
  const item = normalizePickingTask(response);
  if (!item) throw new Error("Toplama gorevi okunamadi.");
  return item;
}

export async function createPickingTask(payload: CreatePickingTaskPayload): Promise<PickingTask> {
  const response = await apiFetch<unknown>("/warehouse/picking-tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizePickingTask(response);
  if (!item) throw new Error("Toplama gorevi olusturulamadi.");
  return item;
}

export async function assignPickingTask(id: string, payload: AssignWarehouseTaskPayload): Promise<PickingTask> {
  const response = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizePickingTask(response);
  if (!item) throw new Error("Toplama gorevi atanamadi.");
  return item;
}

export async function completePickingTask(id: string, payload: CompletePickingTaskPayload): Promise<PickingTask> {
  const response = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}/complete`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const item = normalizePickingTask(response);
  if (!item) throw new Error("Toplama gorevi tamamlanamadi.");
  return item;
}

export async function cancelPickingTask(id: string): Promise<PickingTask> {
  const response = await apiFetch<unknown>(`/warehouse/picking-tasks/${id}/cancel`, {
    method: "POST",
  });
  const item = normalizePickingTask(response);
  if (!item) throw new Error("Toplama gorevi iptal edilemedi.");
  return item;
}
