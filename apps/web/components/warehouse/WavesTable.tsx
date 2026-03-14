"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getWaveStatusVariant } from "@/components/warehouse/status";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";
import type { WaveStatus } from "@/lib/warehouse";

export type WaveListItem = {
  id: string;
  warehouseName: string;
  code: string;
  status: WaveStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
};

type WavesTableProps = {
  loading: boolean;
  error: string;
  items: WaveListItem[];
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function WavesTable({ loading, error, items, onOpenDetail, footer }: WavesTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("warehouse.waves.loading")}</div>
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
                <th className="px-4 py-3">{t("warehouse.waves.codeLabel")}</th>
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
                    {t("warehouse.waves.empty")}
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0 hover:bg-surface2/30">
                    <td className="px-4 py-3 text-sm text-text">{item.warehouseName}</td>
                    <td className="px-4 py-3 text-sm text-text2">{item.code}</td>
                    <td className="px-4 py-3 text-sm text-text2">
                      <StatusBadge
                        label={t(`warehouse.waves.statuses.${item.status}`)}
                        variant={getWaveStatusVariant(item.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-text2">{formatDate(item.startedAt ?? undefined)}</td>
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
