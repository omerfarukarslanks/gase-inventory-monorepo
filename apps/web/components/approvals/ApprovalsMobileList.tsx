"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { getApprovalEntityTypeLabel, getApprovalLevelLabel, getApprovalStatusLabel, getApprovalStatusVariant } from "@/components/approvals/status";
import type { ApprovalListItem } from "@/components/approvals/ApprovalsTable";

type ApprovalsMobileListProps = {
  items: ApprovalListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

export default function ApprovalsMobileList({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: ApprovalsMobileListProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4 text-sm text-error">{error}</div>
      ) : (
        <>
          <div className="space-y-3 p-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
            ) : items.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                Gosterilecek onay talebi bulunamadi.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(item.id)}
                      className="text-left text-sm font-semibold text-primary hover:underline"
                    >
                      {getApprovalEntityTypeLabel(item.entityType)}
                    </button>
                    <p className="text-xs text-muted">{item.requesterName}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      label={getApprovalStatusLabel(item.status)}
                      variant={getApprovalStatusVariant(item.status)}
                    />
                    <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                      {getApprovalLevelLabel(item.level)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Magaza</dt>
                      <dd className="mt-1">{item.storeName}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tarih</dt>
                      <dd className="mt-1">{formatDate(item.createdAt)}</dd>
                    </div>
                  </dl>

                  <div className="border-t border-border pt-3">
                    <Button
                      label="Detay"
                      onClick={() => onOpenDetail(item.id)}
                      variant="secondary"
                      className="w-full"
                    />
                  </div>
                </article>
              ))
            )}
          </div>
          {footer}
        </>
      )}
    </section>
  );
}
