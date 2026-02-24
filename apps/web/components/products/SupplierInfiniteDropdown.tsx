"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebounceStr } from "@/hooks/useDebounce";
import { getSupplierById, getSuppliers, type Supplier } from "@/lib/suppliers";

type SupplierInfiniteDropdownProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const PAGE_SIZE = 20;

function toOptionLabel(supplier: Supplier) {
  const fullName = [supplier.name, supplier.surname].filter(Boolean).join(" ").trim();
  return fullName || supplier.name || supplier.id;
}

export default function SupplierInfiniteDropdown({
  value,
  onChange,
  placeholder = "Tedarikci secin",
}: SupplierInfiniteDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const requestSeqRef = useRef(0);

  const debouncedQuery = useDebounceStr(query, 350);

  const rowHeight = 36;
  const viewportHeight = 240;
  const overscan = 4;

  const selected = useMemo(
    () => options.find((item) => item.value === value),
    [options, value],
  );

  const fetchPage = useCallback(async (nextPage: number, replace: boolean, searchTerm: string) => {
    const requestId = ++requestSeqRef.current;

    if (replace) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const res = await getSuppliers({
        page: nextPage,
        limit: PAGE_SIZE,
        search: searchTerm.trim() || undefined,
        isActive: "all",
      });

      if (requestId !== requestSeqRef.current) return;

      const incoming = (res.data ?? []).map((supplier) => ({
        value: supplier.id,
        label: toOptionLabel(supplier),
      }));

      setOptions((prev) => {
        const map = new Map<string, { value: string; label: string }>();
        (replace ? [] : prev).forEach((item) => map.set(item.value, item));
        incoming.forEach((item) => {
          if (item.value && !map.has(item.value)) map.set(item.value, item);
        });
        return Array.from(map.values());
      });

      const totalPages = res.meta?.totalPages ?? 0;
      setHasMore(totalPages > 0 ? nextPage < totalPages : incoming.length >= PAGE_SIZE);
      setPage(nextPage);
    } catch {
      if (requestId !== requestSeqRef.current) return;
      if (replace) {
        setOptions([]);
      }
      setHasMore(false);
    } finally {
      if (requestId !== requestSeqRef.current) return;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore) return;
    void fetchPage(page + 1, false, debouncedQuery);
  }, [loading, loadingMore, hasMore, page, fetchPage, debouncedQuery]);

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setScrollTop(0);
      return;
    }
    requestAnimationFrame(() => searchRef.current?.focus());
    void fetchPage(1, true, debouncedQuery);
  }, [open, debouncedQuery, fetchPage]);

  useEffect(() => {
    if (!value) return;
    if (options.some((item) => item.value === value)) return;

    let cancelled = false;
    void getSupplierById(value)
      .then((supplier) => {
        if (cancelled) return;
        setOptions((prev) => {
          if (prev.some((item) => item.value === supplier.id)) return prev;
          return [{ value: supplier.id, label: toOptionLabel(supplier) }, ...prev];
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [value, options]);

  const totalHeight = options.length * rowHeight;
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(options.length, startIndex + visibleCount + overscan * 2);
  const visible = options.slice(startIndex, endIndex);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-left text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <span className={selected ? "text-text" : "text-muted"}>
          {selected?.label ?? placeholder}
        </span>
      </button>

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
          aria-label="Tedarikci secimini temizle"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
        aria-label="Tedarikci listesini ac"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-surface p-1 shadow-lg shadow-primary/10">
          <div className="px-1 pb-1">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tedarikci ara..."
              className="h-9 w-full rounded-lg border border-border bg-surface2 px-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div
            className="h-[240px] overflow-y-auto"
            onScroll={(e) => {
              const target = e.currentTarget;
              setScrollTop(target.scrollTop);
              const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - rowHeight * 2;
              if (nearBottom && hasMore && !loadingMore) loadMore();
            }}
          >
            {loading && options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted">Tedarikciler yukleniyor...</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted">Sonuc bulunamadi.</div>
            ) : (
              <div className="relative" style={{ height: totalHeight }}>
                <div
                  className="absolute left-0 right-0"
                  style={{ transform: `translateY(${startIndex * rowHeight}px)` }}
                >
                  {visible.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => {
                        onChange(item.value);
                        setOpen(false);
                      }}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        value === item.value
                          ? "bg-primary/10 text-primary"
                          : "text-text2 hover:bg-surface2 hover:text-text"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {loadingMore && (
              <div className="px-3 py-2 text-xs text-muted">Daha fazla tedarikci yukleniyor...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
