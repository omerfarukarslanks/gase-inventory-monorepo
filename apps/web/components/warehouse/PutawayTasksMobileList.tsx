"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPutawayTaskStatusVariant } from "@/components/warehouse/status";
import type { PutawayTaskListItem } from "@/components/warehouse/PutawayTasksTable";
import { useLang } from "@/context/LangContext";

type PutawayTasksMobileListProps = {
  loading: boolean;
  error: string;
  items: PutawayTaskListItem[];
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

export default function PutawayTasksMobileList({
  loading,
  error,
  items,
  onOpenDetail,
  footer,
}: PutawayTasksMobileListProps) {
  const { t } = useLang();

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
                {t("warehouse.putawayTasks.empty")}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-text">{item.productLabel}</h2>
                      <p className="mt-1 text-xs text-muted">{item.warehouseName}</p>
                    </div>
                    <StatusBadge
                      label={t(`warehouse.putawayTasks.statuses.${item.status}`)}
                      variant={getPutawayTaskStatusVariant(item.status)}
                    />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.putawayTasks.destinationLocation")}</dt>
                      <dd className="mt-1">{item.destinationLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.pickingTasks.requestedQuantity")}</dt>
                      <dd className="mt-1">{item.quantity}</dd>
                    </div>
                  </dl>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.note")}</p>
                    <p className="mt-1 text-sm text-text2">{item.notes ?? "-"}</p>
                  </div>

                  <div className="border-t border-border pt-3">
                    <Button label={t("warehouse.common.details")} onClick={() => onOpenDetail(item.id)} fullWidth variant="secondary" />
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
