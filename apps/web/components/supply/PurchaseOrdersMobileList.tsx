"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { getPurchaseOrderStatusLabel, getPurchaseOrderStatusVariant } from "@/components/supply/status";
import type { PurchaseOrderListItem } from "@/components/supply/PurchaseOrdersTable";

type PurchaseOrdersMobileListProps = {
  items: PurchaseOrderListItem[];
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

export default function PurchaseOrdersMobileList({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: PurchaseOrdersMobileListProps) {
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
                Gosterilecek siparis bulunamadi.
              </div>
            ) : (
              items.map((item) => {
                return (
                  <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(item.id)}
                          className="text-left text-sm font-semibold text-primary hover:underline"
                        >
                          {item.id}
                        </button>
                        <p className="mt-1 text-xs text-muted">{item.supplierName}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        label={getPurchaseOrderStatusLabel(item.status)}
                        variant={getPurchaseOrderStatusVariant(item.status)}
                      />
                      <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                        {item.storeName}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Teslim Tarihi</dt>
                        <dd className="mt-1">{formatDate(item.expectedAt ?? undefined)}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Kalem</dt>
                        <dd className="mt-1">{item.lineCount} / {item.totalQuantity} adet</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tutar</dt>
                        <dd className="mt-1 font-medium text-text">
                          {item.currency ? `${formatPrice(item.totalAmount)} ${item.currency}` : formatPrice(item.totalAmount)}
                        </dd>
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
                );
              })
            )}
          </div>
          {footer}
        </>
      )}
    </section>
  );
}
