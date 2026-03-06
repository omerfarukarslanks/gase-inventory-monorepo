"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { Supplier } from "@/lib/suppliers";
import { useLang } from "@/context/LangContext";

type SuppliersTableProps = {
  loading: boolean;
  error: string;
  suppliers: Supplier[];
  canUpdate: boolean;
  togglingSupplierIds: string[];
  onEditSupplier: (id: string) => void;
  onToggleSupplierActive: (supplier: Supplier, next: boolean) => void;
  footer?: ReactNode;
};

export default function SuppliersTable({
  loading,
  error,
  suppliers,
  canUpdate,
  togglingSupplierIds,
  onEditSupplier,
  onToggleSupplierActive,
  footer,
}: SuppliersTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("common.loading")}</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">{t("suppliers.colName")}</th>
                  <th className="px-4 py-3">{t("suppliers.colSurname")}</th>
                  <th className="px-4 py-3">{t("suppliers.colPhone")}</th>
                  <th className="px-4 py-3">{t("suppliers.colEmail")}</th>
                  <th className="px-4 py-3">{t("suppliers.colAddress")}</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  suppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text">{supplier.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{supplier.surname ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">{supplier.phoneNumber ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">{supplier.email ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">{supplier.address ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            supplier.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {supplier.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                        <div className="inline-flex items-center gap-1">
                          {canUpdate && (
                            <IconButton
                              onClick={() => onEditSupplier(supplier.id)}
                              disabled={togglingSupplierIds.includes(supplier.id)}
                              aria-label="Tedarikci duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canUpdate && (
                            <ToggleSwitch
                              checked={Boolean(supplier.isActive)}
                              onChange={(next) => onToggleSupplierActive(supplier, next)}
                              disabled={togglingSupplierIds.includes(supplier.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {footer}
        </>
      )}
    </section>
  );
}
