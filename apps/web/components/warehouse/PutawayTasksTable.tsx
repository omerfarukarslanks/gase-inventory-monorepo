"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getPutawayTaskStatusVariant } from "@/components/warehouse/status";
import { useLang } from "@/context/LangContext";
import type { PutawayTaskStatus } from "@/lib/warehouse";

export type PutawayTaskListItem = {
  id: string;
  warehouseName: string;
  productLabel: string;
  quantity: number;
  destinationLabel: string;
  status: PutawayTaskStatus;
  notes?: string | null;
};

type PutawayTasksTableProps = {
  loading: boolean;
  error: string;
  items: PutawayTaskListItem[];
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function PutawayTasksTable({
  loading,
  error,
  items,
  onOpenDetail,
  footer,
}: PutawayTasksTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("warehouse.putawayTasks.loading")}</div>
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
                <th className="px-4 py-3">{t("warehouse.common.product")}</th>
                <th className="px-4 py-3">{t("warehouse.common.location")}</th>
                <th className="px-4 py-3">{t("warehouse.pickingTasks.requestedQuantity")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">{t("warehouse.common.note")}</th>
                <th className="px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                    {t("warehouse.putawayTasks.empty")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-surface2/30">
                    <td className="px-4 py-3 text-sm text-text">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-sm text-text2">{item.productLabel}</td>
                    <td className="px-4 py-3 text-sm text-text2">{item.destinationLabel}</td>
                    <td className="px-4 py-3 text-sm text-text2">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-text2">
                      <StatusBadge
                        label={t(`warehouse.putawayTasks.statuses.${item.status}`)}
                        variant={getPutawayTaskStatusVariant(item.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-text2">{item.notes ?? "-"}</td>
                    <td className="px-4 py-3 text-right">
                      <Button label={t("warehouse.common.details")} onClick={() => onOpenDetail(item.id)} variant="secondary" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {footer}
    </section>
  );
}
