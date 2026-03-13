"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { useLang } from "@/context/LangContext";

export type CountSessionListItem = {
  id: string;
  storeName: string;
  warehouseName: string;
  status: string;
  startedAt?: string | null;
  closedAt?: string | null;
  notes?: string | null;
  lineCount: number;
};

type CountSessionsTableProps = {
  loading: boolean;
  error: string;
  items: CountSessionListItem[];
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function CountSessionsTable({
  loading,
  error,
  items,
  onOpenDetail,
  footer,
}: CountSessionsTableProps) {
  const { t } = useLang();
  const statusLabel = (status: string) => t(`warehouse.statuses.${status}`);

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("warehouse.countSessions.loading")}</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-200">
            <thead className="border-b border-border bg-surface2/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">{t("common.storeFilter")}</th>
                <th className="px-4 py-3">{t("warehouse.common.warehouse")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">{t("warehouse.common.start")}</th>
                <th className="px-4 py-3">{t("warehouse.common.note")}</th>
                <th className="px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                    {t("common.noData")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-surface2/30">
                    <td className="px-4 py-3 text-sm text-text">{item.storeName}</td>
                    <td className="px-4 py-3 text-sm text-text2">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-sm text-text2">{statusLabel(item.status)}</td>
                    <td className="px-4 py-3 text-sm text-text2">
                      {item.startedAt ? new Date(item.startedAt).toLocaleString("tr-TR") : "-"}
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
