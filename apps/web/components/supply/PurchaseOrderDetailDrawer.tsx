"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { PurchaseOrder, PurchaseOrderReceipt } from "@/lib/procurement";
import type { Supplier } from "@/lib/suppliers";
import { formatDate, formatPrice } from "@/lib/format";
import { formatPoStatusStep, getPurchaseOrderStatusLabel, getPurchaseOrderStatusVariant } from "@/components/supply/status";

type PurchaseOrderDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  acting: boolean;
  purchaseOrder: PurchaseOrder | null;
  receipts: PurchaseOrderReceipt[];
  suppliers: Supplier[];
  onClose: () => void;
  onApprove: () => void;
  onCancel: () => void;
  onOpenReceipt: () => void;
  canApprove: boolean;
  canCancel: boolean;
  canCreateReceipt: boolean;
};

function buildLineLabels(productName?: string | null, variantName?: string | null) {
  return {
    product: productName?.trim() || "Urun",
    variant: variantName?.trim() || "Varyant bilgisi yok",
  };
}

export default function PurchaseOrderDetailDrawer({
  open,
  loading,
  acting,
  purchaseOrder,
  receipts,
  suppliers,
  onClose,
  onApprove,
  onCancel,
  onOpenReceipt,
  canApprove,
  canCancel,
  canCreateReceipt,
}: PurchaseOrderDetailDrawerProps) {
  const supplier = suppliers.find((item) => item.id === purchaseOrder?.supplierId);
  const supplierName = supplier?.surname ? `${supplier.name} ${supplier.surname}` : supplier?.name ?? "-";

  const totalAmount = (purchaseOrder?.lines ?? []).reduce((sum, line) => sum + Number(line.lineTotal ?? 0), 0);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Siparis Detayi"
      description={purchaseOrder?.id}
      closeDisabled={acting}
      mobileFullscreen
      className="!max-w-[760px]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button label="Kapat" onClick={onClose} variant="secondary" />
          <div className="flex items-center gap-2">
            {canCancel && purchaseOrder?.status && ["DRAFT", "APPROVED"].includes(purchaseOrder.status) ? (
              <Button label="Iptal Et" onClick={onCancel} disabled={acting} variant="dangerSoft" />
            ) : null}
            {canApprove && purchaseOrder?.status === "DRAFT" ? (
              <Button label="Onayla" onClick={onApprove} disabled={acting} variant="primarySoft" />
            ) : null}
            {canCreateReceipt && purchaseOrder?.status && ["APPROVED", "PARTIALLY_RECEIVED"].includes(purchaseOrder.status) ? (
              <Button label="Mal Kabul" onClick={onOpenReceipt} disabled={acting} variant="primarySolid" />
            ) : null}
          </div>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">Siparis detayi yukleniyor...</p>
        ) : !purchaseOrder ? (
          <p className="text-sm text-muted">Gosterilecek siparis bulunamadi.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={getPurchaseOrderStatusLabel(purchaseOrder.status)}
                variant={getPurchaseOrderStatusVariant(purchaseOrder.status)}
              />
              <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                {purchaseOrder.store?.name ?? "-"}
              </span>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-surface2/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Durum Akisi</p>
              <div className="flex flex-wrap gap-2">
                {formatPoStatusStep(purchaseOrder.status).map((item) => (
                  <span
                    key={item.key}
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      item.active
                        ? "bg-primary text-white"
                        : item.completed
                          ? "bg-primary/15 text-primary"
                          : "bg-surface text-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tedarikci</p>
                <p className="mt-2 text-sm font-semibold text-text">{supplierName}</p>
                <p className="mt-1 text-xs text-muted">Beklenen teslim: {formatDate(purchaseOrder.expectedAt ?? undefined)}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Toplam</p>
                <p className="mt-2 text-sm font-semibold text-primary">
                  {purchaseOrder.currency ? `${formatPrice(totalAmount)} ${purchaseOrder.currency}` : formatPrice(totalAmount)}
                </p>
                <p className="mt-1 text-xs text-muted">{(purchaseOrder.lines ?? []).length} kalem</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Siparis Kalemleri</p>
              <div className="mt-3 space-y-3">
                {(purchaseOrder.lines ?? []).map((line) => {
                  const labels = buildLineLabels(line.productName, line.variantName);
                  return (
                    <div key={line.id} className="rounded-xl border border-border bg-surface2/20 p-3">
                      <div className="text-sm font-medium text-text">{labels.product}</div>
                      <div className="mt-1 text-xs text-muted">{labels.variant}</div>
                      <div className="mt-1 text-xs text-muted">
                        Siparis: {line.quantity} · Kabul: {line.receivedQuantity} · Birim: {formatPrice(line.unitPrice)}
                      </div>
                      {line.notes ? <div className="mt-1 text-xs text-muted">{line.notes}</div> : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Mal Kabul Gecmisi</p>
              <div className="mt-3 space-y-3">
                {receipts.length === 0 ? (
                  <p className="text-sm text-muted">Henuz mal kabul kaydi bulunmuyor.</p>
                ) : (
                  receipts.map((receipt) => (
                    <div key={receipt.id} className="rounded-xl border border-border bg-surface2/20 p-3">
                      <div className="text-sm font-medium text-text">Mal Kabul Kaydi</div>
                      <div className="mt-1 text-xs text-muted">{formatDate(receipt.receivedAt)}</div>
                      <div className="mt-2 space-y-1">
                        {(receipt.lines ?? []).map((line) => {
                          const labels = buildLineLabels(
                            line.productName ?? line.purchaseOrderLine?.productName,
                            line.variantName ?? line.purchaseOrderLine?.variantName,
                          );

                          return (
                            <div key={line.id} className="rounded-lg border border-border/70 bg-surface/60 px-3 py-2">
                              <div className="text-xs font-medium text-text">{labels.product}</div>
                              <div className="mt-1 text-[11px] text-muted">{labels.variant}</div>
                              <div className="mt-1 text-xs text-text2">
                                Alinan: {line.receivedQuantity}
                                {line.lotNumber ? ` · Lot: ${line.lotNumber}` : ""}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Not</p>
              <p className="mt-2 text-sm text-text2">{purchaseOrder.notes?.trim() || "Not yok."}</p>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
