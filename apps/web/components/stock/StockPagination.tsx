"use client";

import Button from "@/components/ui/Button";

type StockPaginationProps = {
  page: number;
  totalPages: number;
  limit: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
};

export default function StockPagination({
  page,
  totalPages,
  limit,
  loading,
  onPageChange,
  onLimitChange,
}: StockPaginationProps) {
  const safeTotal = Math.max(1, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border border-border rounded-xl2 bg-surface px-4 py-3 text-xs text-muted">
      <label htmlFor="stockPageSize" className="text-xs text-muted">
        Satir:
      </label>
      <select
        id="stockPageSize"
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
      >
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
      </select>

      <Button
        label="Onceki"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1 || loading}
        variant="pagination"
      />
      <span>
        Sayfa: {page}/{safeTotal}
      </span>
      <Button
        label="Sonraki"
        onClick={() => onPageChange(Math.min(safeTotal, page + 1))}
        disabled={page >= totalPages || loading}
        variant="pagination"
      />
    </div>
  );
}
