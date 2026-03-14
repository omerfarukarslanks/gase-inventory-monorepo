"use client";

import { useEffect, useEffectEvent, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import type { CreatePurchaseOrderReceiptPayload, PurchaseOrder } from "@/lib/procurement";
import { getWarehouses, type Warehouse } from "@/lib/warehouse";

type ReceiptDraftLine = {
  purchaseOrderLineId: string;
  label: string;
  remainingQuantity: number;
  receivedQuantity: string;
  lotNumber: string;
  expiryDate: string;
};

type PurchaseOrderReceiptDrawerProps = {
  open: boolean;
  submitting: boolean;
  purchaseOrder: PurchaseOrder | null;
  fallbackStoreId?: string | null;
  onClose: () => void;
  onSubmit: (payload: CreatePurchaseOrderReceiptPayload) => Promise<void>;
};

function buildDraftLines(purchaseOrder: PurchaseOrder): ReceiptDraftLine[] {
  return (purchaseOrder.lines ?? [])
    .map((line) => ({
      purchaseOrderLineId: line.id,
      label: [line.productName, line.variantName].filter(Boolean).join(" / ") || "Urun / Varyant",
      remainingQuantity: Math.max((line.quantity ?? 0) - (line.receivedQuantity ?? 0), 0),
      receivedQuantity: "",
      lotNumber: "",
      expiryDate: "",
    }))
    .filter((line) => line.remainingQuantity > 0);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export default function PurchaseOrderReceiptDrawer({
  open,
  submitting,
  purchaseOrder,
  fallbackStoreId,
  onClose,
  onSubmit,
}: PurchaseOrderReceiptDrawerProps) {
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [draftLines, setDraftLines] = useState<ReceiptDraftLine[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  const resolvedStoreId = purchaseOrder?.store?.id ?? fallbackStoreId ?? "";

  const resetDraft = useEffectEvent((currentPurchaseOrder: PurchaseOrder) => {
    setWarehouseId("");
    setNotes("");
    setFormError("");
    setDraftLines(buildDraftLines(currentPurchaseOrder));
  });

  useEffect(() => {
    if (!open || !purchaseOrder) return;
    resetDraft(purchaseOrder);
  }, [open, purchaseOrder]);

  useEffect(() => {
    if (!open) return;
    if (!resolvedStoreId) {
      setWarehouses([]);
      setWarehouseId("");
      return;
    }

    let mounted = true;
    setWarehousesLoading(true);
    setFormError("");

    void (async () => {
      try {
        const data = await getWarehouses({ storeId: resolvedStoreId });
        if (!mounted) return;
        setWarehouses(data);
        setWarehouseId((current) => {
          if (current && data.some((warehouse) => warehouse.id === current)) return current;
          if (data.length === 1) return data[0].id;
          return "";
        });
      } catch (loadError) {
        if (!mounted) return;
        setWarehouses([]);
        setWarehouseId("");
        setFormError(getErrorMessage(loadError, "Depolar yuklenemedi."));
      } finally {
        if (mounted) {
          setWarehousesLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, resolvedStoreId]);

  const availableLines = useMemo(
    () => draftLines.filter((line) => line.remainingQuantity > 0),
    [draftLines],
  );

  const warehouseOptions = useMemo(
    () =>
      warehouses.map((warehouse) => ({
        value: warehouse.id,
        label: warehouse.name,
      })),
    [warehouses],
  );

  const submit = async () => {
    setFormError("");
    if (!warehouseId) {
      setFormError("Devam etmek icin bir depo secin.");
      return;
    }

    const lines = draftLines
      .map((line) => ({
        purchaseOrderLineId: line.purchaseOrderLineId,
        receivedQuantity: Number(line.receivedQuantity || 0),
        lotNumber: line.lotNumber.trim() || undefined,
        expiryDate: line.expiryDate || undefined,
      }))
      .filter((line) => line.receivedQuantity > 0);

    if (lines.length === 0) {
      setFormError("Devam etmek icin en az bir kalemde alinan miktar girin.");
      return;
    }

    await onSubmit({
      warehouseId,
      notes: notes.trim() || undefined,
      lines,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Mal Kabul"
      description={purchaseOrder?.id}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[640px]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button label="Iptal" onClick={onClose} disabled={submitting} variant="secondary" />
          <Button label="Kaydet" onClick={() => void submit()} loading={submitting} disabled={submitting} variant="primarySolid" />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {availableLines.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Kabul edilebilir acik kalem bulunmuyor.
          </div>
        ) : (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Depo *</label>
              <SearchableDropdown
                options={warehouseOptions}
                value={warehouseId}
                onChange={setWarehouseId}
                placeholder={warehousesLoading ? "Depolar yukleniyor..." : "Depo secin"}
                inputAriaLabel="Depo secimi"
                toggleAriaLabel="Depo listesini ac"
                clearAriaLabel="Depo secimini temizle"
                noResultsText="Depo bulunamadi."
                disabled={warehousesLoading || warehouseOptions.length === 0}
                allowClear
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Sevkiyat notlari"
                className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
              />
            </div>

            <div className="space-y-3">
              {draftLines.map((line) => (
                <div key={line.purchaseOrderLineId} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-text">{line.label}</div>
                      <div className="mt-1 text-xs text-muted">Kalan: {line.remainingQuantity}</div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Alinan Miktar</label>
                      <input
                        type="number"
                        min="0"
                        max={line.remainingQuantity}
                        value={line.receivedQuantity}
                        onChange={(event) =>
                          setDraftLines((prev) =>
                            prev.map((item) =>
                              item.purchaseOrderLineId === line.purchaseOrderLineId
                                ? { ...item, receivedQuantity: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Lot Numarasi</label>
                      <input
                        type="text"
                        value={line.lotNumber}
                        onChange={(event) =>
                          setDraftLines((prev) =>
                            prev.map((item) =>
                              item.purchaseOrderLineId === line.purchaseOrderLineId
                                ? { ...item, lotNumber: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-muted">Son Kullanma</label>
                      <input
                        type="date"
                        value={line.expiryDate}
                        onChange={(event) =>
                          setDraftLines((prev) =>
                            prev.map((item) =>
                              item.purchaseOrderLineId === line.purchaseOrderLineId
                                ? { ...item, expiryDate: event.target.value }
                                : item,
                            ),
                          )
                        }
                        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <FieldError error={formError} />
      </div>
    </Drawer>
  );
}
