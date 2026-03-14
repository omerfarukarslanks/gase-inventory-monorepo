"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLang } from "@/context/LangContext";
import { getReplenishmentRuleStatusLabel, getReplenishmentRuleStatusVariant } from "@/components/supply/status";
import type { ReplenishmentRuleListItem } from "@/components/supply/RulesTable";

type RulesMobileListProps = {
  items: ReplenishmentRuleListItem[];
  loading: boolean;
  error: string;
  canManage: boolean;
  togglingIds: string[];
  onOpenDetail: (id: string) => void;
  onToggleActive: (item: ReplenishmentRuleListItem, next: boolean) => void;
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

export default function RulesMobileList({
  items,
  loading,
  error,
  canManage,
  togglingIds,
  onOpenDetail,
  onToggleActive,
  footer,
}: RulesMobileListProps) {
  const { t } = useLang();

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
                {t("supply.rules.noResults")}
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-text">{item.productName}</h2>
                      <p className="mt-1 truncate text-xs text-muted">
                        {item.variantName} · {item.supplierName}
                      </p>
                    </div>
                    <StatusBadge
                      label={getReplenishmentRuleStatusLabel(item.isActive)}
                      variant={getReplenishmentRuleStatusVariant(item.isActive)}
                    />
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.minStockLabel")}</dt>
                      <dd className="mt-1">{item.minStock}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.targetStockLabel")}</dt>
                      <dd className="mt-1 font-semibold text-primary">{item.targetStock}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("supply.rules.leadTimeDaysLabel")}</dt>
                      <dd className="mt-1">{item.leadTimeDays ?? "-"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("common.storeFilter")}</dt>
                      <dd className="mt-1">{item.storeName}</dd>
                    </div>
                  </dl>

                  <div className="flex gap-2 border-t border-border pt-3">
                    <Button
                      label={t("supply.rules.editAction")}
                      onClick={() => onOpenDetail(item.id)}
                      variant="secondary"
                      className="flex-1"
                    />
                    {canManage ? (
                      <div className="flex flex-1 items-center justify-end rounded-xl border border-border px-3">
                        <ToggleSwitch
                          checked={item.isActive}
                          onChange={(next) => onToggleActive(item, next)}
                          disabled={togglingIds.includes(item.id)}
                        />
                      </div>
                    ) : null}
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
