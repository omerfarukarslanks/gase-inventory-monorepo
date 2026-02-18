"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type VariantInfiniteDropdownProps = {
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
};

export default function VariantInfiniteDropdown({
  options,
  value,
  onChange,
  placeholder,
  loading,
  loadingMore,
  hasMore,
  onLoadMore,
}: VariantInfiniteDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrollTop, setScrollTop] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const rowHeight = 36;
  const viewportHeight = 240;
  const overscan = 4;

  const selected = useMemo(() => options.find((item) => item.value === value), [options, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((item) => item.label.toLowerCase().includes(q));
  }, [options, query]);

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
  }, [open]);

  const totalHeight = filtered.length * rowHeight;
  const visibleCount = Math.ceil(viewportHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(filtered.length, startIndex + visibleCount + overscan * 2);
  const visible = filtered.slice(startIndex, endIndex);

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

      {open && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-border bg-surface p-1 shadow-lg shadow-primary/10">
          <div className="px-1 pb-1">
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Varyant ara..."
              className="h-9 w-full rounded-lg border border-border bg-surface2 px-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div
            className="h-[240px] overflow-y-auto"
            onScroll={(e) => {
              const target = e.currentTarget;
              setScrollTop(target.scrollTop);
              const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - rowHeight * 2;
              if (nearBottom && hasMore && !loadingMore) onLoadMore();
            }}
          >
            {loading && options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted">Varyantlar yukleniyor...</div>
            ) : filtered.length === 0 ? (
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
              <div className="px-3 py-2 text-xs text-muted">Daha fazla varyant yukleniyor...</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
