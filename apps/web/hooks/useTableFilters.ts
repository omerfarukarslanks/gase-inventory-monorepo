"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDebounceStr } from "./useDebounce";

export interface UseTableFiltersReturn<TFilters extends Record<string, unknown>> {
  filters: TFilters;
  debouncedSearch: string;
  /** Update a single filter key. Automatically resets to page 1 via onReset. */
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  /** Reset all filters to their initial values and page to 1. */
  resetFilters: () => void;
}

/**
 * Manages table filter state with debounced search and automatic page reset.
 *
 * @param initialFilters  Initial filter values. Must be stable (defined outside component or useMemo'd).
 * @param onReset         Called whenever any filter changes (use this to reset pagination to page 1).
 * @param searchKey       Key in TFilters that holds the search string (for debouncing). Default: "search".
 * @param debounceMs      Debounce delay for the search field. Default: 400ms.
 */
export function useTableFilters<TFilters extends Record<string, unknown>>(
  initialFilters: TFilters,
  onReset: () => void,
  searchKey: keyof TFilters = "search" as keyof TFilters,
  debounceMs = 400,
): UseTableFiltersReturn<TFilters> {
  const [filters, setFilters] = useState<TFilters>(initialFilters);

  const searchValue = (filters[searchKey] as string | undefined) ?? "";
  const debouncedSearch = useDebounceStr(searchValue, debounceMs);

  // Skip calling onReset on initial mount
  const isFirstRender = useRef(true);
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onResetRef.current = onReset;
  });

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onResetRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { filters, debouncedSearch, setFilter, resetFilters };
}
