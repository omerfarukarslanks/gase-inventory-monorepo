"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { PurchaseOrderReceipt } from "@/lib/procurement";
import { useLang } from "@/context/LangContext";

type GoodsReceiptDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  acting: boolean;
  receipt: PurchaseOrderReceipt | null;
  onClose: () => void;
  onOpenPurchaseOrder: () => void;
  onOpenPutaway: () => void;
  canCreatePutaway: boolean;
};

function buildLineLabels(productName?: string | null, variantName?: string | null) {
  return {
    product: productName?.trim() || "Urun",
    variant: variantName?.trim() || "Varyant bilgisi yok",
  };
}

export default function GoodsReceiptDetailDrawer({
  open,
  loading,
  acting,
  receipt,
  onClose,
  onOpenPurchaseOrder,
  onOpenPutaway,
  canCreatePutaway,
}: GoodsReceiptDetailDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("supply.receipts.detailsTitle")}
      description={receipt?.purchaseOrderReference ?? receipt?.id}
      closeDisabled={acting}
      mobileFullscreen
      className="!max-w-[720px]"
      footer={(
        <div className="flex items-center justify-between gap-2">
          <Button label={t("supply.suggestions.close")} onClick={onClose} variant="secondary" />
          <div className="flex items-center gap-2">
            {receipt?.purchaseOrderId ? (
              <Button
                label={t("supply.receipts.openPurchaseOrder")}
                onClick={onOpenPurchaseOrder}
                disabled={acting}
                variant="primarySoft"
              />
            ) : null}
            {canCreatePutaway && receipt?.warehouseId && (receipt.lines?.length ?? 0) > 0 ? (
              <Button
                label={t("supply.receipts.putawayAction")}
                onClick={onOpenPutaway}
                disabled={acting}
                variant="primarySolid"
              />
            ) : null}
          </div>
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">{t("supply.receipts.detailsLoading")}</p>
        ) : !receipt ? (
          <p className="text-sm text-muted">{t("supply.receipts.detailsNotFound")}</p>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.receipts.purchaseOrderLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-text">{receipt.purchaseOrderReference ?? receipt.purchaseOrderId ?? "-"}</p>
                <p className="mt-1 text-xs text-muted">{receipt.store?.name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.receipts.receivedAtLabel")}</p>
                <p className="mt-2 text-sm font-semibold text-primary">{formatDate(receipt.receivedAt)}</p>
                <p className="mt-1 text-xs text-muted">
                  {(receipt.lineCount ?? receipt.lines?.length ?? 0)} {t("supply.receipts.lineCountLabel").toLowerCase()}
                  {" · "}
                  {receipt.totalReceivedQuantity ?? (receipt.lines ?? []).reduce((sum, line) => sum + Number(line.receivedQuantity ?? 0), 0)}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.receipts.storeLabel")}</p>
                <p className="mt-2 text-sm text-text2">{receipt.store?.name ?? "-"}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.receipts.warehouseLabel")}</p>
                <p className="mt-2 text-sm text-text2">{receipt.warehouseName ?? receipt.warehouseId ?? "-"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.receipts.linesTitle")}</p>
              <div className="mt-3 space-y-3">
                {(receipt.lines ?? []).length === 0 ? (
                  <p className="text-sm text-muted">{t("supply.receipts.linesEmpty")}</p>
                ) : (
                  (receipt.lines ?? []).map((line) => {
                    const labels = buildLineLabels(
                      line.productName ?? line.purchaseOrderLine?.productName,
                      line.variantName ?? line.purchaseOrderLine?.variantName,
                    );
                    return (
                      <div key={line.id} className="rounded-xl border border-border bg-surface2/20 p-3">
                        <div className="text-sm font-medium text-text">{labels.product}</div>
                        <div className="mt-1 text-xs text-muted">{labels.variant}</div>
                        <div className="mt-2 grid gap-2 text-xs text-text2 md:grid-cols-3">
                          <div>
                            {t("supply.receipts.totalReceivedQuantityLabel")}: {line.receivedQuantity}
                          </div>
                          <div>
                            {t("supply.receipts.lotNumberLabel")}: {line.lotNumber?.trim() || "-"}
                          </div>
                          <div>
                            {t("supply.receipts.expiryDateLabel")}: {formatDate(line.expiryDate ?? undefined)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("supply.receipts.notesLabel")}</p>
              <p className="mt-2 text-sm text-text2">{receipt.notes?.trim() || t("supply.receipts.notesEmpty")}</p>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
