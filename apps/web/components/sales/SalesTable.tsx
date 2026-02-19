"use client";

import { formatPrice } from "@/lib/format";
import { EditIcon, TrashIcon } from "@/components/ui/icons/TableIcons";
import type { SaleListItem } from "@/lib/sales";

type SalesTableProps = {
  salesReceipts: SaleListItem[];
  salesLoading: boolean;
  salesError: string;
  onOpenDetail: (saleId: string) => void;
  onEdit: (sale: SaleListItem) => void;
  onOpenCancel: (sale: SaleListItem) => void;
};

function getSaleUnitPrice(sale: SaleListItem) {
  if (sale.unitPrice != null) return sale.unitPrice;
  if (!Array.isArray(sale.lines) || sale.lines.length === 0) return null;
  return sale.lines[0].unitPrice ?? null;
}

function getSaleTotal(sale: SaleListItem) {
  if (sale.lineTotal != null) return sale.lineTotal;
  if (sale.total != null) return sale.total;
  if (!Array.isArray(sale.lines)) return null;
  return sale.lines.reduce((sum, line) => sum + (line.lineTotal ?? 0), 0);
}

export default function SalesTable({
  salesReceipts,
  salesLoading,
  salesError,
  onOpenDetail,
  onEdit,
  onOpenCancel,
}: SalesTableProps) {
  if (salesError) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6">
          <p className="text-sm text-error">{salesError}</p>
        </div>
      </section>
    );
  }

  if (salesLoading) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">Satis fisleri yukleniyor...</div>
      </section>
    );
  }

  if (salesReceipts.length === 0) {
    return (
      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        <div className="p-6 text-sm text-muted">Gosterilecek satis fisi bulunamadi.</div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-border bg-surface2/70">
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Receipt No</th>
              <th className="px-4 py-3">Ad</th>
              <th className="px-4 py-3">Soyad</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Birim Fiyat</th>
              <th className="px-4 py-3 text-right">Satir Toplami</th>
              <th className="px-4 py-3 text-right">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {salesReceipts.map((sale) => {
              const isCancelled = sale.status === "CANCELLED";
              return (
                <tr key={sale.id} className="border-b border-border hover:bg-surface2/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-text2">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(sale.id)}
                      className="cursor-pointer text-left text-primary underline-offset-2 transition-colors hover:text-primary/80 hover:underline"
                    >
                      {sale.receiptNo ?? sale.id}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm text-text2">{sale.name ?? "-"}</td>
                  <td className="px-4 py-3 text-sm text-text2">{sale.surname ?? "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={
                        sale.status === "CONFIRMED"
                          ? "inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          : sale.status === "CANCELLED"
                            ? "inline-block rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error"
                            : "inline-block rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-muted"
                      }
                    >
                      {sale.status ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-text2">
                    {formatPrice(getSaleUnitPrice(sale))}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-text">
                    {formatPrice(getSaleTotal(sale))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {sale.status === "CONFIRMED" && (
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(sale)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                          aria-label="Satis fisini duzenle"
                          title="Fisi duzenle"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenCancel(sale)}
                          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-error/10 hover:text-error"
                          aria-label="Satis fisini iptal et"
                          title="Fisi iptal et"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
