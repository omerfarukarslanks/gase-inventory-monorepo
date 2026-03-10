"use client";

import { useCallback, useState } from "react";

export interface PaginationMeta {
  total?: number;
  totalPages?: number;
}

export interface UsePaginationReturn {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
  setPage: (page: number) => void;
  /** Apply meta from API response. Derives totalPages from total/limit when needed. */
  applyMeta: (meta: PaginationMeta) => void;
  /** Change to a different page. No-ops on out-of-range or current page. */
  onPageChange: (next: number) => void;
  /** Change page size and reset to page 1. */
  onPageSizeChange: (size: number) => void;
  /** Reset to page 1 (call on filter changes). */
  resetPage: () => void;
}

export function usePagination(initialLimit = 10): UsePaginationReturn {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const resetPage = useCallback(() => setPage(1), []);

  const applyMeta = useCallback(
    (meta: PaginationMeta) => {
      if (meta.total != null) setTotal(meta.total);

      if (meta.totalPages != null && meta.totalPages > 0) {
        setTotalPages(meta.totalPages);
      } else if (meta.total != null && meta.total > 0) {
        setTotalPages(Math.max(1, Math.ceil(meta.total / limit)));
      } else {
        setTotalPages(1);
      }
    },
    [limit],
  );

  const onPageChange = useCallback(
    (next: number) => {
      if (next < 1 || next > totalPages || next === page) return;
      setPage(next);
    },
    [page, totalPages],
  );

  const onPageSizeChange = useCallback((size: number) => {
    setLimit(size);
    setPage(1);
  }, []);

  return {
    page,
    limit,
    totalPages,
    total,
    setPage,
    applyMeta,
    onPageChange,
    onPageSizeChange,
    resetPage,
  };
}
