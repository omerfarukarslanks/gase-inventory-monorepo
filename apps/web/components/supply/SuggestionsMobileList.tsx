"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import RowActionMenu, { type RowActionMenuItem } from "@/components/ui/RowActionMenu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getSuggestionStatusLabel, getSuggestionStatusVariant } from "@/components/supply/status";
import type { SuggestionListItem } from "@/components/supply/SuggestionsTable";

type SuggestionsMobileListProps = {
  items: SuggestionListItem[];
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

export default function SuggestionsMobileList({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: SuggestionsMobileListProps) {
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
                Gosterilecek oneriler bulunamadi.
              </div>
            ) : (
              items.map((item) => {
                const actionItems: RowActionMenuItem[] = [
                  {
                    key: "detail",
                    label: "Detay",
                    onClick: () => onOpenDetail(item.id),
                  },
                ];

                return (
                  <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-text">{item.productName}</h2>
                        <p className="mt-1 truncate text-xs text-muted">
                          {item.variantName} · {item.supplierName}
                        </p>
                      </div>
                      <RowActionMenu items={actionItems} triggerLabel="Oneri islemleri" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusBadge
                        label={getSuggestionStatusLabel(item.status)}
                        variant={getSuggestionStatusVariant(item.status)}
                      />
                      <span className="inline-flex rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted">
                        {item.storeName}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Mevcut</dt>
                        <dd className="mt-1">{item.currentQuantity}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Oneri</dt>
                        <dd className="mt-1 font-semibold text-primary">{item.suggestedQuantity}</dd>
                      </div>
                    </dl>

                    <div className="flex gap-2 border-t border-border pt-3">
                      <Button
                        label="Detay"
                        onClick={() => onOpenDetail(item.id)}
                        variant="secondary"
                        className="flex-1"
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
