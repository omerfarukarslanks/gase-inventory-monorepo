"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getWaveStatusVariant } from "@/components/warehouse/status";
import type { WaveListItem } from "@/components/warehouse/WavesTable";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";

type WavesMobileListProps = {
  loading: boolean;
  error: string;
  items: WaveListItem[];
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

export default function WavesMobileList({
  loading,
  error,
  items,
  onOpenDetail,
  footer,
}: WavesMobileListProps) {
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
                {t("warehouse.waves.empty")}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-text">{item.code}</h2>
                      <p className="mt-1 text-xs text-muted">{item.warehouseName}</p>
                    </div>
                    <StatusBadge
                      label={t(`warehouse.waves.statuses.${item.status}`)}
                      variant={getWaveStatusVariant(item.status)}
                    />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.start")}</dt>
                      <dd className="mt-1">{formatDate(item.startedAt ?? undefined)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.note")}</dt>
                      <dd className="mt-1">{item.notes ?? "-"}</dd>
                    </div>
                  </dl>

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
