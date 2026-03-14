"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useLang } from "@/context/LangContext";
import { getReplenishmentRuleStatusLabel, getReplenishmentRuleStatusVariant } from "@/components/supply/status";

export type ReplenishmentRuleListItem = {
  id: string;
  storeId: string;
  productVariantId: string;
  supplierId: string;
  productName: string;
  variantName: string;
  supplierName: string;
  storeName: string;
  minStock: number;
  targetStock: number;
  leadTimeDays?: number | null;
  isActive: boolean;
  createdAt?: string;
};

type RulesTableProps = {
  items: ReplenishmentRuleListItem[];
  loading: boolean;
  error: string;
  canManage: boolean;
  togglingIds: string[];
  onOpenDetail: (id: string) => void;
  onToggleActive: (item: ReplenishmentRuleListItem, next: boolean) => void;
  footer?: ReactNode;
};

export default function RulesTable({
  items,
  loading,
  error,
  canManage,
  togglingIds,
  onOpenDetail,
  onToggleActive,
  footer,
}: RulesTableProps) {
  const { t } = useLang();

  if (error) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-4 text-sm text-error">{error}</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2/40 text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">{t("supply.rules.productLabel")}</th>
              <th className="px-4 py-3">{t("supply.rules.variantLabel")}</th>
              <th className="px-4 py-3">{t("supply.rules.supplierLabel")}</th>
              <th className="px-4 py-3">{t("supply.rules.minStockLabel")}</th>
              <th className="px-4 py-3">{t("supply.rules.targetStockLabel")}</th>
              <th className="px-4 py-3">{t("supply.rules.leadTimeDaysLabel")}</th>
              <th className="px-4 py-3">{t("supply.rules.statusLabel")}</th>
              <th className="px-4 py-3 text-right">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-sm text-muted">
                  {t("supply.rules.loading")}
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted">
                  {t("supply.rules.noResults")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text">{item.productName}</td>
                  <td className="px-4 py-3 text-text2">{item.variantName}</td>
                  <td className="px-4 py-3 text-text2">{item.supplierName}</td>
                  <td className="px-4 py-3 text-text">{item.minStock}</td>
                  <td className="px-4 py-3 font-semibold text-primary">{item.targetStock}</td>
                  <td className="px-4 py-3 text-text2">{item.leadTimeDays ?? "-"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={getReplenishmentRuleStatusLabel(item.isActive)}
                      variant={getReplenishmentRuleStatusVariant(item.isActive)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        label={t("supply.rules.editAction")}
                        onClick={() => onOpenDetail(item.id)}
                        variant="secondary"
                      />
                      {canManage ? (
                        <ToggleSwitch
                          checked={item.isActive}
                          onChange={(next) => onToggleActive(item, next)}
                          disabled={togglingIds.includes(item.id)}
                        />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
