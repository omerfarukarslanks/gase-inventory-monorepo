"use client";

import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { FieldError } from "@/components/ui/FieldError";
import type { PurchaseOrderReceipt } from "@/lib/procurement";
import {
  getWarehouseLocations,
  type CreateGoodsReceiptPutawayTasksPayload,
  type WarehouseLocation,
} from "@/lib/warehouse";

type GoodsReceiptPutawayDraftLine = {
  goodsReceiptLineId: string;
  label: string;
  quantity: number;
  toLocationId: string;
};

type GoodsReceiptPutawayDrawerProps = {
  open: boolean;
  submitting: boolean;
  receipt: PurchaseOrderReceipt | null;
  warehouseLabel?: string | null;
  onClose: () => void;
  onSubmit: (receiptId: string, payload: CreateGoodsReceiptPutawayTasksPayload) => Promise<void>;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function buildDraftLines(receipt: PurchaseOrderReceipt): GoodsReceiptPutawayDraftLine[] {
  return (receipt.lines ?? []).map((line) => ({
    goodsReceiptLineId: line.id,
    label: [line.productName, line.variantName].filter(Boolean).join(" / ") || "Urun / Varyant",
    quantity: Number(line.receivedQuantity ?? 0),
    toLocationId: "",
  }));
}

export default function GoodsReceiptPutawayDrawer({
  open,
  submitting,
  receipt,
  warehouseLabel,
  onClose,
  onSubmit,
}: GoodsReceiptPutawayDrawerProps) {
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");
  const [draftLines, setDraftLines] = useState<GoodsReceiptPutawayDraftLine[]>([]);
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  useEffect(() => {
    if (!open || !receipt) return;
    setNotes("");
    setFormError("");
    setDraftLines(buildDraftLines(receipt));
  }, [open, receipt]);

  useEffect(() => {
    if (!open || !receipt?.warehouseId) {
      setLocations([]);
      return;
    }

    let mounted = true;
    setLocationsLoading(true);
    void (async () => {
      try {
        const data = await getWarehouseLocations(receipt.warehouseId ?? "");
        if (!mounted) return;
        setLocations(data);
      } catch (loadError) {
        if (!mounted) return;
        setLocations([]);
        setFormError(getErrorMessage(loadError, "Lokasyonlar yuklenemedi."));
      } finally {
        if (mounted) {
          setLocationsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [open, receipt?.warehouseId]);

  const locationOptions = useMemo(
    () =>
      locations.map((location) => ({
        value: location.id,
        label: `${location.code} / ${location.name}`,
      })),
    [locations],
  );

  const submit = async () => {
    if (!receipt?.id) {
      setFormError("Mal kabul kaydi bulunamadi.");
      return;
    }

    const lines = draftLines
      .filter((line) => line.toLocationId)
      .map((line) => ({
        goodsReceiptLineId: line.goodsReceiptLineId,
        toLocationId: line.toLocationId,
      }));

    if (lines.length === 0) {
      setFormError("Devam etmek icin en az bir satira hedef lokasyon secin.");
      return;
    }

    setFormError("");
    await onSubmit(receipt.id, {
      notes: notes.trim() || undefined,
      lines,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Mal Kabulden Putaway Olustur"
      description={receipt?.id}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[720px]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button label="Iptal" onClick={onClose} disabled={submitting} variant="secondary" />
          <Button label="Putaway Olustur" onClick={() => void submit()} loading={submitting} disabled={submitting} variant="primarySolid" />
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {warehouseLabel ? (
          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Depo</div>
            <div className="mt-1 text-sm font-medium text-text">{warehouseLabel}</div>
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">Not</label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Putaway notlari"
            className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
          />
        </div>

        <div className="space-y-3">
          {draftLines.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Putaway olusturulabilecek mal kabul satiri bulunmuyor.
            </div>
          ) : (
            draftLines.map((line) => (
              <div key={line.goodsReceiptLineId} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text">{line.label}</div>
                    <div className="mt-1 text-xs text-muted">Miktar: {line.quantity}</div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold text-muted">Hedef Lokasyon *</label>
                  <SearchableDropdown
                    options={locationOptions}
                    value={line.toLocationId}
                    onChange={(value) =>
                      setDraftLines((prev) =>
                        prev.map((item) =>
                          item.goodsReceiptLineId === line.goodsReceiptLineId
                            ? { ...item, toLocationId: value }
                            : item,
                        ),
                      )
                    }
                    placeholder={locationsLoading ? "Lokasyonlar yukleniyor..." : "Lokasyon secin"}
                    inputAriaLabel="Hedef lokasyon secimi"
                    toggleAriaLabel="Lokasyon listesini ac"
                    clearAriaLabel="Lokasyon secimini temizle"
                    noResultsText="Lokasyon bulunamadi."
                    disabled={locationsLoading || locationOptions.length === 0}
                    allowClear
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <FieldError error={formError} />
      </div>
    </Drawer>
  );
}
