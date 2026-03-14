"use client";

import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { getApprovalEntityTypeLabel, getApprovalLevelLabel, getApprovalStatusLabel, getApprovalStatusVariant } from "@/components/approvals/status";
import { getApprovalCurrentLevel, getApprovalStoreId, getApprovalSupplierId, isPendingApproval, type ApprovalRequest } from "@/lib/approvals";

type ApprovalDetailDrawerProps = {
  open: boolean;
  loading: boolean;
  acting: boolean;
  approval: ApprovalRequest | null;
  requesterName: string;
  l1ReviewerName: string;
  l2ReviewerName: string;
  storeNameById: Record<string, string>;
  supplierNameById: Record<string, string>;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onCancel: () => void;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
};

type SummaryRow = {
  label: string;
  value: string;
  monospace?: boolean;
};

function buildKeyValueRows(payload: Record<string, unknown> | null): SummaryRow[] {
  if (!payload) return [];
  return Object.entries(payload)
    .filter(([, value]) => value != null && String(value).trim())
    .map(([key, value]) => ({
      label: key,
      value:
        typeof value === "string"
          ? value
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value),
      monospace: key.toLowerCase().includes("id") || typeof value === "object",
    }));
}

function buildSummaryRows(
  approval: ApprovalRequest,
  storeNameById: Record<string, string>,
  supplierNameById: Record<string, string>,
): SummaryRow[] {
  const requestData = approval.requestData ?? {};
  const storeId = getApprovalStoreId(approval);
  const supplierId = getApprovalSupplierId(approval);

  switch (approval.entityType) {
    case "STOCK_ADJUSTMENT":
      return [
        { label: "Magaza", value: storeNameById[storeId] ?? storeId ?? "-" },
        { label: "Varyant", value: String(requestData.productVariantId ?? "-"), monospace: true },
        { label: "Yeni Miktar", value: String(requestData.newQuantity ?? "-") },
      ];
    case "PRICE_OVERRIDE":
      return [
        { label: "Magaza", value: storeNameById[storeId] ?? storeId ?? "-" },
        { label: "Varyant", value: String(requestData.productVariantId ?? "-"), monospace: true },
        {
          label: "Yeni Fiyat",
          value: requestData.newPrice != null
            ? `${formatPrice(requestData.newPrice as number)} ${String(requestData.currency ?? "").trim()}`.trim()
            : "-",
        },
        { label: "Para Birimi", value: String(requestData.currency ?? "-") },
        { label: "Vergi", value: requestData.taxPercent != null ? `%${requestData.taxPercent}` : "-" },
      ];
    case "PURCHASE_ORDER":
      return [
        {
          label: "Siparis",
          value: String(requestData.purchaseOrderId ?? approval.entityId ?? "-"),
          monospace: true,
        },
        { label: "Tedarikci", value: supplierNameById[supplierId] ?? supplierId ?? "-" },
        {
          label: "Toplam",
          value: requestData.totalAmount != null
            ? `${formatPrice(requestData.totalAmount as number)} ${String(requestData.currency ?? "").trim()}`.trim()
            : "-",
        },
        { label: "Para Birimi", value: String(requestData.currency ?? "-") },
      ];
    case "SALE_RETURN":
    case "COUNT_ADJUSTMENT":
      return buildKeyValueRows(requestData);
    default:
      return buildKeyValueRows(requestData);
  }
}

function MetadataCard({
  label,
  value,
  muted = false,
  monospace = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  monospace?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-sm ${muted ? "text-text2" : "font-semibold text-text"} ${monospace ? "break-all font-mono text-xs" : ""}`}>
        {value || "-"}
      </p>
    </div>
  );
}

export default function ApprovalDetailDrawer({
  open,
  loading,
  acting,
  approval,
  requesterName,
  l1ReviewerName,
  l2ReviewerName,
  storeNameById,
  supplierNameById,
  onClose,
  onApprove,
  onReject,
  onCancel,
  canApprove,
  canReject,
  canCancel,
}: ApprovalDetailDrawerProps) {
  const level = approval ? getApprovalCurrentLevel(approval) : "L1";
  const summaryRows = approval ? buildSummaryRows(approval, storeNameById, supplierNameById) : [];
  const storeLabel = approval ? storeNameById[getApprovalStoreId(approval)] ?? getApprovalStoreId(approval) ?? "-" : "-";
  const showActions = approval ? isPendingApproval(approval) : false;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title="Onay Detayi"
      description={approval?.id}
      closeDisabled={acting}
      mobileFullscreen
      className="!max-w-[760px]"
      footer={
        <div className="flex items-center justify-between gap-2">
          <Button label="Kapat" onClick={onClose} variant="secondary" />
          {showActions ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {canCancel ? (
                <Button label="Iptal Et" onClick={onCancel} disabled={acting} variant="dangerSoft" />
              ) : null}
              {canReject ? (
                <Button label="Reddet" onClick={onReject} disabled={acting} variant="dangerSoft" />
              ) : null}
              {canApprove ? (
                <Button label="Onayla" onClick={onApprove} disabled={acting} variant="primarySolid" />
              ) : null}
            </div>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4 p-5">
        {loading ? (
          <p className="text-sm text-muted">Onay detayi yukleniyor...</p>
        ) : !approval ? (
          <p className="text-sm text-muted">Gosterilecek onay talebi bulunamadi.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <StatusBadge
                label={getApprovalStatusLabel(approval.status)}
                variant={getApprovalStatusVariant(approval.status)}
              />
              <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                {getApprovalEntityTypeLabel(approval.entityType)}
              </span>
              <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                {getApprovalLevelLabel(level)}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetadataCard label="Talep Tipi" value={getApprovalEntityTypeLabel(approval.entityType)} />
              <MetadataCard label="Kayit" value={approval.entityId} monospace />
              <MetadataCard label="Isteyen" value={requesterName || approval.requestedById || "-"} />
              <MetadataCard label="Magaza" value={storeLabel} muted />
              <MetadataCard label="Olusturulma" value={formatDate(approval.createdAt)} muted />
              <MetadataCard label="Son Guncelleme" value={formatDate(approval.updatedAt)} muted />
              <MetadataCard label="Son Gecerlilik" value={formatDate(approval.expiresAt ?? undefined)} muted />
              <MetadataCard label="Maks Seviye" value={String(approval.maxLevel)} muted />
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Talep Ozeti</p>
              <div className="mt-3 space-y-3">
                {summaryRows.length === 0 ? (
                  <p className="text-sm text-muted">Talep verisi bulunamadi.</p>
                ) : (
                  summaryRows.map((row) => (
                    <div key={`${row.label}-${row.value}`} className="rounded-xl border border-border bg-surface2/20 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{row.label}</div>
                      <div className={`mt-2 text-sm text-text ${row.monospace ? "break-all font-mono text-xs" : ""}`}>
                        {row.value || "-"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Talep Eden Notu</p>
              <p className="mt-2 text-sm text-text2">{approval.requesterNotes?.trim() || "Not yok."}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">L1 Inceleme</p>
                <p className="mt-2 text-sm font-semibold text-text">{l1ReviewerName || approval.l1ReviewedById || "-"}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(approval.l1ReviewedAt ?? undefined)}</p>
                <p className="mt-2 text-sm text-text2">{approval.l1ReviewNotes?.trim() || "Not yok."}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">L2 Inceleme</p>
                <p className="mt-2 text-sm font-semibold text-text">{l2ReviewerName || approval.l2ReviewedById || "-"}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(approval.l2ReviewedAt ?? undefined)}</p>
                <p className="mt-2 text-sm text-text2">{approval.l2ReviewNotes?.trim() || "Not yok."}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}
