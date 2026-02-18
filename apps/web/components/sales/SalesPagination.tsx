"use client";

import Button from "@/components/ui/Button";
import { getVisiblePages } from "@/lib/pagination";

type SalesPaginationProps = {
  page: number;
  totalPages: number;
  limit: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function SalesPagination({
  page,
  totalPages,
  limit,
  total,
  loading,
  onPageChange,
  onLimitChange,
}: SalesPaginationProps) {
  const pageItems = getVisiblePages(page, totalPages);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
      <div className="flex items-center gap-4">
        <span>Toplam: {total}</span>
        <span>Sayfa: {page}/{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="sales-page-size" className="text-xs text-muted">Satir:</label>
        <select
          id="sales-page-size"
          value={limit}
          onChange={(e) => {
            onLimitChange(Number(e.target.value));
            onPageChange(1);
          }}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <Button
          label="Onceki"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={loading || !canGoPrev}
          variant="pagination"
        />
        {pageItems.map((item, idx) =>
          item === -1 ? (
            <span key={`sales-ellipsis-${idx}`} className="px-1 text-xs text-muted">...</span>
          ) : (
            <Button
              key={`sales-page-${item}`}
              label={String(item)}
              onClick={() => onPageChange(item)}
              disabled={loading}
              variant={item === page ? "paginationActive" : "pagination"}
            />
          ),
        )}
        <Button
          label="Sonraki"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={loading || !canGoNext}
          variant="pagination"
        />
      </div>
    </div>
  );
}
