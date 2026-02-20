"use client";

import { formatPrice, formatDate } from "@/lib/format";
import type { CancellationItem } from "@/lib/reports";

type Props = {
  data: CancellationItem[];
  loading: boolean;
};

export default function DashboardCancellations({ data, loading }: Props) {
  if (loading) {
    return <p className="text-sm text-muted">Iptal verileri yukleniyor...</p>;
  }

  if (data.length === 0) {
    return <p className="text-sm text-muted">Son iptal bulunamadi.</p>;
  }

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((item, i) => (
        <div key={i} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
              ↩
            </div>
            <div>
              <div className="text-sm font-medium text-text">
                {item.receiptNo ?? item.id ?? "-"}
              </div>
              <div className="text-xs text-muted">
                {[item.name, item.surname].filter(Boolean).join(" ") || "-"}
                {item.store?.name ? ` · ${item.store.name}` : ""}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-red-500">
              {formatPrice(item.lineTotal ?? item.unitPrice)}
            </div>
            <div className="text-[10px] text-muted">
              {item.cancelledAt ? formatDate(item.cancelledAt) : "-"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
