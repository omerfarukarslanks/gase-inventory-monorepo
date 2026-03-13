"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import type { CountSessionListItem } from "@/components/warehouse/CountSessionsTable";
import { useLang } from "@/context/LangContext";

type CountSessionsMobileListProps = {
  loading: boolean;
  error: string;
  items: CountSessionListItem[];
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

export default function CountSessionsMobileList({
  loading,
  error,
  items,
  onOpenDetail,
  footer,
}: CountSessionsMobileListProps) {
  const { t } = useLang();
  const statusLabel = (status: string) => t(`warehouse.statuses.${status}`);

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
            ) : items.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("common.noData")}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-text">{item.warehouseName}</h2>
                      <p className="mt-1 text-xs text-muted">{item.storeName}</p>
                    </div>
                    <span className="inline-flex rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary">
                      {statusLabel(item.status)}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.start")}</dt>
                      <dd className="mt-1">
                        {item.startedAt ? new Date(item.startedAt).toLocaleString("tr-TR") : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.countSessions.lineCountLabel")}</dt>
                      <dd className="mt-1">{item.lineCount}</dd>
                    </div>
                  </dl>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.note")}</p>
                    <p className="mt-1 text-sm text-text2">{item.notes ?? "-"}</p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <Button
                      label={t("warehouse.common.details")}
                      onClick={() => onOpenDetail(item.id)}
                      variant="secondary"
                      fullWidth
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
