"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { getWarehouseLocationTypeLabel, type WarehouseLocation } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";

type LocationsMobileListProps = {
  loading: boolean;
  error: string;
  locations: WarehouseLocation[];
  warehouseNameById: Record<string, string>;
  canManage: boolean;
  togglingIds: string[];
  onEditLocation: (id: string) => void;
  onToggleLocationActive: (location: WarehouseLocation, next: boolean) => void;
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

export default function LocationsMobileList({
  loading,
  error,
  locations,
  warehouseNameById,
  canManage,
  togglingIds,
  onEditLocation,
  onToggleLocationActive,
  footer,
}: LocationsMobileListProps) {
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
            ) : locations.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("common.noData")}
              </div>
            ) : (
              locations.map((location) => {
                const isToggling = togglingIds.includes(location.id);
                return (
                  <article key={location.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text">{location.code}</h2>
                        <p className="mt-1 text-xs text-muted">{location.name}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          location.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {location.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.warehouse")}</dt>
                        <dd className="mt-1">
                          {location.warehouseName ?? warehouseNameById[location.warehouseId] ?? location.warehouseId}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.type")}</dt>
                        <dd className="mt-1">{getWarehouseLocationTypeLabel(location.type)}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                      {canManage ? (
                        <>
                          <Button
                            label={t("common.edit")}
                            onClick={() => onEditLocation(location.id)}
                            disabled={isToggling}
                            className="min-w-24"
                            variant="secondary"
                          />
                          <ToggleSwitch
                            checked={location.isActive}
                            onChange={(next) => onToggleLocationActive(location, next)}
                            disabled={isToggling}
                          />
                        </>
                      ) : null}
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
