"use client";

import { formatDate, formatPrice } from "@/lib/format";
import type { SaleDetail } from "@/lib/sales";

type SaleDetailModalProps = {
  open: boolean;
  loading: boolean;
  error: string;
  detail: SaleDetail | null;
  onClose: () => void;
};

export default function SaleDetailModal({
  open,
  loading,
  error,
  detail,
  onClose,
}: SaleDetailModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-5xl rounded-xl2 border border-border bg-surface shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-text">Satis Fis Detayi</h3>
            <p className="text-xs text-muted">
              {detail?.receiptNo ?? "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-border px-2 py-1 text-xs text-muted transition-colors hover:bg-surface2 hover:text-text"
          >
            Kapat
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto p-5">
          {loading ? (
            <p className="text-sm text-muted">Satis fis detayi yukleniyor...</p>
          ) : error ? (
            <p className="text-sm text-error">{error}</p>
          ) : !detail ? (
            <p className="text-sm text-muted">Detay bulunamadi.</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-border bg-surface2/30 p-3">
                  <p className="text-xs font-semibold text-muted">Satin Alan</p>
                  <p className="mt-1 text-sm font-medium text-text">
                    {`${detail.name ?? "-"} ${detail.surname ?? ""}`.trim()}
                  </p>
                  <p className="mt-1 text-xs text-text2">{detail.phoneNumber || "-"}</p>
                  <p className="text-xs text-text2">{detail.email || "-"}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-3">
                  <p className="text-xs font-semibold text-muted">Satis Bilgileri</p>
                  <p className="mt-1 text-xs text-text2">Durum: {detail.status ?? "-"}</p>
                  <p className="text-xs text-text2">Kaynak: {detail.source || "-"}</p>
                  <p className="text-xs text-text2">Magaza: {detail.storeName || "-"}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-3">
                  <p className="text-xs font-semibold text-muted">Tutarlar</p>
                  <p className="mt-1 text-xs text-text2">Birim Toplam: {formatPrice(detail.unitPrice)}</p>
                  <p className="text-xs font-medium text-text">Satir Toplami: {formatPrice(detail.lineTotal)}</p>
                </div>
                <div className="rounded-xl border border-border bg-surface2/30 p-3">
                  <p className="text-xs font-semibold text-muted">Tarih</p>
                  <p className="mt-1 text-xs text-text2">Satin Alma: {formatDate(detail.createdAt)}</p>
                  <p className="text-xs text-text2">Guncelleme: {formatDate(detail.updatedAt)}</p>
                </div>
              </div>

              {detail.note && (
                <div className="rounded-xl border border-border bg-surface2/30 p-3">
                  <p className="text-xs font-semibold text-muted">Not</p>
                  <p className="mt-1 text-sm text-text2">{detail.note}</p>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[960px]">
                  <thead className="border-b border-border bg-surface2/70">
                    <tr className="text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3">Urun</th>
                      <th className="px-4 py-3">Varyant</th>
                      <th className="px-4 py-3">Kod</th>
                      <th className="px-4 py-3 text-right">Adet</th>
                      <th className="px-4 py-3">PB</th>
                      <th className="px-4 py-3 text-right">Birim Fiyat</th>
                      <th className="px-4 py-3 text-right">Vergi</th>
                      <th className="px-4 py-3 text-right">Indirim</th>
                      <th className="px-4 py-3 text-right">Satir Toplami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.length === 0 ? (
                      <tr>
                        <td className="px-4 py-4 text-sm text-muted" colSpan={9}>
                          Fise ait urun satiri bulunamadi.
                        </td>
                      </tr>
                    ) : (
                      detail.lines.map((line) => (
                        <tr key={line.id} className="border-b border-border text-sm text-text2">
                          <td className="px-4 py-3">{line.productName ?? "-"}</td>
                          <td className="px-4 py-3">{line.productVariantName ?? "-"}</td>
                          <td className="px-4 py-3">{line.productVariantCode ?? "-"}</td>
                          <td className="px-4 py-3 text-right">{line.quantity ?? "-"}</td>
                          <td className="px-4 py-3">{line.currency ?? "-"}</td>
                          <td className="px-4 py-3 text-right">{formatPrice(line.unitPrice)}</td>
                          <td className="px-4 py-3 text-right">
                            {line.taxPercent != null ? `%${line.taxPercent}` : formatPrice(line.taxAmount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {line.discountPercent != null ? `%${line.discountPercent}` : formatPrice(line.discountAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-text">
                            {formatPrice(line.lineTotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
