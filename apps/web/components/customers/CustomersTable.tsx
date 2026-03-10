"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, PriceIcon } from "@/components/ui/icons/TableIcons";
import type { Customer } from "@/lib/customers";
import { useLang } from "@/context/LangContext";
import TableSkeletonRows from "@/components/ui/TableSkeletonRows";

type CustomersTableProps = {
  loading: boolean;
  error: string;
  customers: Customer[];
  togglingCustomerIds: string[];
  canUpdate: boolean;
  onOpenBalanceDrawer: (customer: Customer) => void;
  onEditCustomer: (id: string) => void;
  onToggleCustomerActive: (customer: Customer, next: boolean) => void;
  footer?: ReactNode;
};

export default function CustomersTable({
  loading,
  error,
  customers,
  togglingCustomerIds,
  canUpdate,
  onOpenBalanceDrawer,
  onEditCustomer,
  onToggleCustomerActive,
  footer,
}: CustomersTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">{t("customers.colName")}</th>
                  <th className="px-4 py-3">Soyisim</th>
                  <th className="px-4 py-3">{t("customers.colPhone")}</th>
                  <th className="px-4 py-3">{t("customers.colEmail")}</th>
                  <th className="px-4 py-3">Sehir / Ilce</th>
                  <th className="px-4 py-3">Cinsiyet</th>
                  <th className="px-4 py-3">Dogum Tarihi</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows rows={5} cols={9} />
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-muted">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text">{customer.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{customer.surname}</td>
                      <td className="px-4 py-3 text-sm text-text2">{customer.phoneNumber ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">{customer.email ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">
                        {[customer.city, customer.district].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{customer.gender ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">
                        {customer.birthDate ? String(customer.birthDate).slice(0, 10) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            customer.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {customer.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                        <div className="inline-flex items-center gap-1">
                          <IconButton
                            onClick={() => onOpenBalanceDrawer(customer)}
                            disabled={togglingCustomerIds.includes(customer.id)}
                            aria-label="Musteri cari bakiyesi"
                            title="Cari Bakiye"
                          >
                            <PriceIcon />
                          </IconButton>
                          {canUpdate && (
                            <IconButton
                              onClick={() => onEditCustomer(customer.id)}
                              disabled={togglingCustomerIds.includes(customer.id)}
                              aria-label="Musteri duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canUpdate && (
                            <ToggleSwitch
                              checked={Boolean(customer.isActive)}
                              onChange={(next) => onToggleCustomerActive(customer, next)}
                              disabled={togglingCustomerIds.includes(customer.id)}
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
