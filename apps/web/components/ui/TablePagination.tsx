"use client";

import Button from "@/components/ui/Button";
import { getVisiblePages } from "@/lib/pagination";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  pageSizeId?: string;
  pageSizeOptions?: number[];
  loading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

export default function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  pageSizeId = "table-page-size",
  pageSizeOptions = [10, 20, 50],
  loading = false,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const canGoPrev = page > 1;
  const canGoNext = page < safeTotalPages;
  const pageItems = getVisiblePages(page, safeTotalPages);

  const goToPage = (nextPage: number) => {
    if (loading) return;
    const clamped = Math.min(safeTotalPages, Math.max(1, nextPage));
    if (clamped === page) return;
    onPageChange(clamped);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
      <div className="flex items-center gap-4">
        <span>Toplam: {total}</span>
        <span>
          Sayfa: {page}/{safeTotalPages}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor={pageSizeId} className="text-xs text-muted">
          Satir:
        </label>
        <select
          id={pageSizeId}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <Button
          label="Onceki"
          onClick={() => goToPage(page - 1)}
          disabled={!canGoPrev || loading}
          variant="pagination"
        />

        {pageItems.map((item, idx) =>
          item === -1 ? (
            <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted">
              ...
            </span>
          ) : (
            <Button
              key={`page-${item}`}
              label={String(item)}
              onClick={() => goToPage(item)}
              disabled={loading}
              variant={item === page ? "paginationActive" : "pagination"}
            />
          ),
        )}

        <Button
          label="Sonraki"
          onClick={() => goToPage(page + 1)}
          disabled={!canGoNext || loading}
          variant="pagination"
        />
      </div>
    </div>
  );
}
