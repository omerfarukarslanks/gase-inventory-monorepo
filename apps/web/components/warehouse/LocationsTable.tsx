"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { getWarehouseLocationTypeLabel, type WarehouseLocation } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";

type LocationsTableProps = {
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

export default function LocationsTable({
  loading,
  error,
  locations,
  warehouseNameById,
  canManage,
  togglingIds,
  onEditLocation,
  onToggleLocationActive,
  footer,
}: LocationsTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("warehouse.locations.loading")}</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180">
            <thead className="border-b border-border bg-surface2/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">{t("warehouse.common.code")}</th>
                <th className="px-4 py-3">{t("warehouse.common.location")}</th>
                <th className="px-4 py-3">{t("warehouse.common.warehouse")}</th>
                <th className="px-4 py-3">{t("warehouse.common.type")}</th>
                <th className="px-4 py-3 text-center">{t("common.status")}</th>
                <th className="px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                locations.map((location) => {
                  const isToggling = togglingIds.includes(location.id);
                  return (
                    <tr key={location.id} className="border-b border-border last:border-b-0 hover:bg-surface2/30">
                      <td className="px-4 py-3 text-sm font-medium text-text">{location.code}</td>
                      <td className="px-4 py-3 text-sm text-text2">{location.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">
                        {location.warehouseName ?? warehouseNameById[location.warehouseId] ?? location.warehouseId}
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{getWarehouseLocationTypeLabel(location.type)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                            location.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {location.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canManage ? (
                            <>
                              <IconButton
                                onClick={() => onEditLocation(location.id)}
                                disabled={isToggling}
                                aria-label={t("warehouse.locations.editAria")}
                                title={t("common.edit")}
                                className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                              >
                                <EditIcon />
                              </IconButton>
                              <ToggleSwitch
                                checked={location.isActive}
                                onChange={(next) => onToggleLocationActive(location, next)}
                                disabled={isToggling}
                              />
                            </>
                          ) : (
                            <span className="text-sm text-muted">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {footer}
    </section>
  );
}
