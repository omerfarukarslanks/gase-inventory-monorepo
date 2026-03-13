"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { Warehouse } from "@/lib/warehouse";
import { useLang } from "@/context/LangContext";

type WarehousesTableProps = {
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

export default function WarehousesTable({
  loading,
  error,
  warehouses,
  storeNameById,
  canManage,
  togglingIds,
  onEditWarehouse,
  onToggleWarehouseActive,
  footer,
}: WarehousesTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("warehouse.warehouses.loading")}</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180">
            <thead className="border-b border-border bg-surface2/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">{t("warehouse.common.warehouse")}</th>
                <th className="px-4 py-3">{t("common.storeFilter")}</th>
                <th className="px-4 py-3">{t("warehouse.common.address")}</th>
                <th className="px-4 py-3 text-center">{t("common.status")}</th>
                <th className="px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => {
                  const isToggling = togglingIds.includes(warehouse.id);
                  return (
                    <tr key={warehouse.id} className="border-b border-border last:border-b-0 hover:bg-surface2/30">
                      <td className="px-4 py-3 text-sm font-medium text-text">{warehouse.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">
                        {warehouse.storeName ?? storeNameById[warehouse.storeId] ?? warehouse.storeId}
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{warehouse.address ?? "-"}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                            warehouse.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {warehouse.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canManage ? (
                            <>
                              <IconButton
                                onClick={() => onEditWarehouse(warehouse.id)}
                                disabled={isToggling}
                                aria-label={t("warehouse.warehouses.editAria")}
                                title={t("common.edit")}
                                className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                              >
                                <EditIcon />
                              </IconButton>
                              <ToggleSwitch
                                checked={warehouse.isActive}
                                onChange={(next) => onToggleWarehouseActive(warehouse, next)}
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
