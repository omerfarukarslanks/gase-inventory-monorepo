"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import type { Warehouse } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";

type WarehousesMobileListProps = {
  loading: boolean;
  error: string;
  warehouses: Warehouse[];
  storeNameById: Record<string, string>;
  canManage: boolean;
  togglingIds: string[];
  onEditWarehouse: (id: string) => void;
  onToggleWarehouseActive: (warehouse: Warehouse, next: boolean) => void;
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

export default function WarehousesMobileList({
  loading,
  error,
  warehouses,
  storeNameById,
  canManage,
  togglingIds,
  onEditWarehouse,
  onToggleWarehouseActive,
  footer,
}: WarehousesMobileListProps) {
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
            ) : warehouses.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("common.noData")}
              </div>
            ) : (
              warehouses.map((warehouse) => {
                const isToggling = togglingIds.includes(warehouse.id);
                return (
                  <article key={warehouse.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text">{warehouse.name}</h2>
                        <p className="mt-1 text-xs text-muted">
                          {warehouse.storeName ?? storeNameById[warehouse.storeId] ?? warehouse.storeId}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          warehouse.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {warehouse.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("warehouse.common.address")}</p>
                      <p className="mt-1 text-sm text-text2">{warehouse.address ?? "-"}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                      {canManage ? (
                        <>
                          <Button
                            label={t("common.edit")}
                            onClick={() => onEditWarehouse(warehouse.id)}
                            disabled={isToggling}
                            className="min-w-24"
                            variant="secondary"
                          />
                          <ToggleSwitch
                            checked={warehouse.isActive}
                            onChange={(next) => onToggleWarehouseActive(warehouse, next)}
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
