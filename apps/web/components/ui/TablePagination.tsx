"use client";

import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useViewportMode } from "@/hooks/useViewportMode";
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
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
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

  const pageSizeOptionsAsDropdown = pageSizeOptions.map((size) => ({
    value: String(size),
    label: String(size),
  }));

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <span>Toplam: {total}</span>
        <span>
          Sayfa: {page}/{safeTotalPages}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            Satir:
          </span>
          <SearchableDropdown
            options={pageSizeOptionsAsDropdown}
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value || pageSizeOptions[0] || 10))}
            placeholder="Satir"
            showEmptyOption={false}
            allowClear={false}
            showSearchInput={false}
            menuPlacement="top"
            inputAriaLabel={`${pageSizeId} satir sayisi`}
            toggleAriaLabel={`${pageSizeId} satir sayisi listesini ac`}
            className="w-[76px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            label="Onceki"
            onClick={() => goToPage(page - 1)}
            disabled={!canGoPrev || loading}
            variant="pagination"
            className={isMobile ? "min-w-[92px] flex-1" : undefined}
          />

          {!isMobile && pageItems.map((item, idx) =>
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
            className={isMobile ? "min-w-[92px] flex-1" : undefined}
          />
        </div>

        {isMobile ? (
          <div className="flex justify-end">
            <Button
              label={`${page}/${safeTotalPages}`}
              variant="paginationActive"
              disabled
              className="min-w-[64px]"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
