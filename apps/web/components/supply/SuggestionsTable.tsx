"use client";

import RowActionMenu, { type RowActionMenuItem } from "@/components/ui/RowActionMenu";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ReactNode } from "react";
import type { ReplenishmentSuggestionStatus } from "@/lib/replenishment";
import { getSuggestionStatusLabel, getSuggestionStatusVariant } from "@/components/supply/status";

export type SuggestionListItem = {
  id: string;
  supplierId: string;
  productName: string;
  variantName: string;
  supplierName: string;
  storeName: string;
  currentQuantity: number;
  suggestedQuantity: number;
  status: ReplenishmentSuggestionStatus;
  autoCreatedPoId?: string | null;
};

type SuggestionsTableProps = {
  items: SuggestionListItem[];
  loading: boolean;
  error: string;
  onOpenDetail: (id: string) => void;
  footer?: ReactNode;
};

export default function SuggestionsTable({
  items,
  loading,
  error,
  onOpenDetail,
  footer,
}: SuggestionsTableProps) {
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
              <th className="px-4 py-3">Urun</th>
              <th className="px-4 py-3">Varyant</th>
              <th className="px-4 py-3">Tedarikci</th>
              <th className="px-4 py-3">Mevcut</th>
              <th className="px-4 py-3">Oneri</th>
              <th className="px-4 py-3">Durum</th>
              <th className="px-4 py-3 text-right">Islemler</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-sm text-muted">
                  Oneriler yukleniyor...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted">
                  Gosterilecek oneriler bulunamadi.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const actionItems: RowActionMenuItem[] = [
                  {
                    key: "detail",
                    label: "Detay",
                    onClick: () => onOpenDetail(item.id),
                  },
                ];

                return (
                  <tr key={item.id} className="border-b border-border/50 transition-colors hover:bg-primary/5">
                    <td className="px-4 py-3 font-medium text-text">{item.productName}</td>
                    <td className="px-4 py-3 text-text2">{item.variantName}</td>
                    <td className="px-4 py-3 text-text2">{item.supplierName}</td>
                    <td className="px-4 py-3 text-text">{item.currentQuantity}</td>
                    <td className="px-4 py-3 font-semibold text-primary">{item.suggestedQuantity}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={getSuggestionStatusLabel(item.status)}
                        variant={getSuggestionStatusVariant(item.status)}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(item.id)}
                          className="text-sm font-semibold text-primary hover:underline"
                        >
                          Detay
                        </button>
                        <RowActionMenu items={actionItems} triggerLabel="Oneri islemleri" />
                      </div>
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
