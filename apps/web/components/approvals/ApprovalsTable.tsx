"use client";

import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { getApprovalEntityTypeLabel, getApprovalLevelLabel, getApprovalStatusLabel, getApprovalStatusVariant } from "@/components/approvals/status";
import type { ApprovalEntityType, ApprovalLevel, ApprovalStatus } from "@/lib/approvals";

export type ApprovalListItem = {
  id: string;
  entityType: ApprovalEntityType;
  status: ApprovalStatus;
  level: ApprovalLevel;
  requesterName: string;
  storeName: string;
  createdAt?: string;
};

type ApprovalsTableProps = {
  items: ApprovalListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function ApprovalsTable({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: ApprovalsTableProps) {
  if (error) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-4 text-sm text-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2/40 text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Talep Tipi</th>
              <th className="px-4 py-3">Isteyen</th>
              <th className="px-4 py-3">Magaza</th>
              <th className="px-4 py-3">Tarih</th>
              <th className="px-4 py-3">Seviye</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  Onay talepleri yukleniyor...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                  Gosterilecek onay talebi bulunamadi.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{getApprovalEntityTypeLabel(item.entityType)}</td>
                  <td className="px-4 py-3 text-text">{item.requesterName}</td>
                  <td className="px-4 py-3 text-text2">{item.storeName}</td>
                  <td className="px-4 py-3 text-text2">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-text">{getApprovalLevelLabel(item.level)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={getApprovalStatusLabel(item.status)}
                      variant={getApprovalStatusVariant(item.status)}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item.id)}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
