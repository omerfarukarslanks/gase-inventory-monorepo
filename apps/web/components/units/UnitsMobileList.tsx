"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { useLang } from "@/context/LangContext";
import { formatDate } from "@/lib/format";
import type { Unit } from "@gase/core";

type UnitsMobileListProps = {
  loading: boolean;
  units: Unit[];
  togglingUnitIds: string[];
  canUpdate: boolean;
  onEditUnit: (unit: Unit) => void;
  onToggleUnitStatus: (unit: Unit, next: boolean) => void;
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

export default function UnitsMobileList({
  loading,
  units,
  togglingUnitIds,
  canUpdate,
  onEditUnit,
  onToggleUnitStatus,
  footer,
}: UnitsMobileListProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="space-y-3 p-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
        ) : units.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted">{t("units.noData")}</div>
        ) : (
          units.map((unit) => {
            const isToggling = togglingUnitIds.includes(unit.id);
            return (
              <div
                key={unit.id}
                className="rounded-xl2 border border-border bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text">{unit.name}</span>
                      <span className="rounded-md border border-border bg-surface2 px-1.5 py-0.5 font-mono text-xs text-text2">
                        {unit.abbreviation}
                      </span>
                      {unit.isDefault && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Varsayılan
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">{formatDate(unit.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canUpdate && (
                      <>
                        <ToggleSwitch
                          checked={unit.isActive}
                          onChange={(next) => onToggleUnitStatus(unit, next)}
                          disabled={isToggling || unit.isDefault}
                        />
                        <IconButton
                          icon={<EditIcon />}
                          onClick={() => onEditUnit(unit)}
                          aria-label={`${unit.name} düzenle`}
                        />
                      </>
                    )}
                    {!canUpdate && (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          unit.isActive
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-surface2 text-muted"
                        }`}
                      >
                        {unit.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </section>
  );
}
