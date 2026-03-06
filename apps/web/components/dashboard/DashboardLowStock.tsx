"use client";

import type { LowStockItem } from "@/lib/reports";
import { useLang } from "@/context/LangContext";

type Props = {
  data: LowStockItem[];
  loading: boolean;
};

export default function DashboardLowStock({ data, loading }: Props) {
  const { t } = useLang();

  if (loading) {
    return <p className="text-sm text-muted">{t("dashboard.lowStockLoading")}</p>;
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted">{t("dashboard.lowStockEmpty")}</p>;
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 6).map((item, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-bg/50 p-3">
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
            <div>
              <div className="text-sm font-medium text-text">{item.productName ?? "-"}</div>
              <div className="text-xs text-muted">
                {item.variantName ?? ""} {item.storeName ? `· ${item.storeName}` : ""}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-red-500">{item.quantity ?? 0} {t("dashboard.units")}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
