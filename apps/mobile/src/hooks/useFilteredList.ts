import { useMemo } from "react";
import { normalizeTurkishLookup } from "@gase/core";

type FilteredListOptions<T> = {
  /** Dot-notation key path or a custom filter function */
  searchKey?: keyof T & string;
  /** Custom filter function, used instead of searchKey when provided */
  filterFn?: (item: T, query: string) => boolean;
};

/**
 * Filters a list of items by a debounced search query.
 *
 * @example
 * const filtered = useFilteredList(products, { searchKey: "name", query: debouncedSearch });
 */
export function useFilteredList<T>(
  items: T[],
  options: FilteredListOptions<T> & { query: string },
): T[] {
  const { query, searchKey, filterFn } = options;

  return useMemo(() => {
    const normalized = normalizeTurkishLookup(query);
    if (!normalized) return items;

    if (filterFn) {
      return items.filter((item) => filterFn(item, normalized));
    }

    if (searchKey) {
      return items.filter((item) => {
        const value = item[searchKey];
        if (typeof value !== "string") return false;
        return normalizeTurkishLookup(value).includes(normalized);
      });
    }

    return items;
  }, [items, query, searchKey, filterFn]);
}
