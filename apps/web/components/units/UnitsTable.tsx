"use client";

import type { ReactNode } from "react";
import TableSkeletonRows from "@/components/ui/TableSkeletonRows";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";
import type { Unit } from "@gase/core";

type UnitsTableProps = {
  loading: boolean;
  units: Unit[];
  togglingUnitIds: string[];
  canUpdate: boolean;
  onEditUnit: (unit: Unit) => void;
  onToggleUnitStatus: (unit: Unit, next: boolean) => void;
  footer?: ReactNode;
};

export default function UnitsTable({
  loading,
  units,
  togglingUnitIds,
  canUpdate,
  onEditUnit,
  onToggleUnitStatus,
  footer,
}: UnitsTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {units.length === 0 && !loading ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted/40"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
          <p className="text-sm text-muted">{t("units.noData")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface2/60">
                <th className="px-4 py-3 text-left font-semibold text-muted">{t("units.name")}</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">{t("units.abbreviation")}</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">{t("units.isDefault")}</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">{t("common.status")}</th>
                <th className="px-4 py-3 text-left font-semibold text-muted">Oluşturulma</th>
                {canUpdate && (
                  <th className="px-4 py-3 text-right font-semibold text-muted">{t("common.actions")}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <TableSkeletonRows cols={canUpdate ? 6 : 5} rows={5} />
              ) : (
                units.map((unit) => {
                  const isToggling = togglingUnitIds.includes(unit.id);
                  return (
                    <tr key={unit.id} className="transition-colors hover:bg-surface2/40">
                      <td className="px-4 py-3 font-medium text-text">{unit.name}</td>
                      <td className="px-4 py-3 text-text2">
                        <span className="rounded-md border border-border bg-surface2 px-2 py-0.5 font-mono text-xs">
                          {unit.abbreviation}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {unit.isDefault ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                            Varsayılan
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canUpdate ? (
                          <ToggleSwitch
                            checked={unit.isActive}
                            onChange={(next) => onToggleUnitStatus(unit, next)}
                            disabled={isToggling || unit.isDefault}
                          />
                        ) : (
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
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">{formatDate(unit.createdAt)}</td>
                      {canUpdate && (
                        <td className="px-4 py-3 text-right">
                          <IconButton
                            icon={<EditIcon />}
                            onClick={() => onEditUnit(unit)}
                            aria-label={`${unit.name} düzenle`}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
      {footer && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </section>
  );
}
