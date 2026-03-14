"use client";

import type { ReactNode } from "react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import type { PurchaseOrderStatus } from "@/lib/procurement";
import { getPurchaseOrderStatusLabel, getPurchaseOrderStatusVariant } from "@/components/supply/status";

export type PurchaseOrderListItem = {
  id: string;
  status: PurchaseOrderStatus;
  supplierName: string;
  storeName: string;
  expectedAt?: string | null;
  currency?: string | null;
  notes?: string | null;
  lineCount: number;
  totalQuantity: number;
  totalAmount: number;
};

type PurchaseOrdersTableProps = {
  items: PurchaseOrderListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function PurchaseOrdersTable({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: PurchaseOrdersTableProps) {
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
              <th className="px-4 py-3">Siparis</th>
              <th className="px-4 py-3">Tedarikci</th>
              <th className="px-4 py-3">Beklenen Tarih</th>
              <th className="px-4 py-3">Kalem</th>
              <th className="px-4 py-3">Tutar</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  Siparisler yukleniyor...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                  Gosterilecek siparis bulunamadi.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                return (
                  <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item.id)}
                        className="font-semibold text-primary hover:underline"
                      >
                        {item.id}
                      </button>
                      <div className="mt-1 text-xs text-muted">{item.storeName}</div>
                    </td>
                    <td className="px-4 py-3 text-text">{item.supplierName}</td>
                    <td className="px-4 py-3 text-text2">{formatDate(item.expectedAt ?? undefined)}</td>
                    <td className="px-4 py-3 text-text">{item.lineCount} kalem / {item.totalQuantity} adet</td>
                    <td className="px-4 py-3 font-medium text-text">
                      {item.currency ? `${formatPrice(item.totalAmount)} ${item.currency}` : formatPrice(item.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={getPurchaseOrderStatusLabel(item.status)}
                        variant={getPurchaseOrderStatusVariant(item.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(item.id)}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Detay
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}
