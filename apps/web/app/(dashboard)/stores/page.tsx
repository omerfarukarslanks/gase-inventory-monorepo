"use client";

import { useCallback, useEffect, useState } from "react";
import { getStores, type Store, type StoresListMeta } from "@/lib/stores";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [meta, setMeta] = useState<StoresListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [cursor] = useState(() => new Date().toISOString());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session not found. Please sign in again.");
        setStores([]);
        setMeta(null);
        return;
      }

      const offset = (currentPage - 1) * pageSize;
      const res = await getStores({
        offset,
        limit: pageSize,
        cursor,
        token,
      });

      setStores(res.data);
      setMeta(res.meta);
    } catch {
      setError("Stores could not be loaded. Please try again.");
      setStores([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, cursor, pageSize]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / pageSize)) : 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  const goPrev = () => {
    if (!canGoPrev || loading) return;
    setCurrentPage((prev) => prev - 1);
  };

  const goNext = () => {
    if (!canGoNext || loading) return;
    setCurrentPage((prev) => prev + 1);
  };

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, -1, totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
  };

  const pageItems = getVisiblePages();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">Stores</h1>
          <p className="text-sm text-muted">Store list from service</p>
        </div>
        <button
          onClick={fetchStores}
          className="rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-surface2"
        >
          Refresh
        </button>
      </div>

      <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
        {loading ? (
          <div className="p-6 text-sm text-muted">Loading stores...</div>
        ) : error ? (
          <div className="p-6">
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="border-b border-border last:border-b-0">
                      <td className="px-4 py-3 text-sm font-medium text-text">{store.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.code}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.address ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            store.isActive
                              ? "bg-primary/15 text-primary"
                              : "bg-error/15 text-error"
                          }`}
                        >
                          {store.isActive ? "Active" : "Passive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{store.slug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
                <div className="flex items-center gap-4">
                  <span>Total: {meta.total}</span>
                  <span>
                    Page: {currentPage}/{totalPages}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="pageSize" className="text-xs text-muted">
                    Rows:
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => onChangePageSize(Number(e.target.value))}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>

                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev || loading}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface2"
                  >
                    Previous
                  </button>

                  {pageItems.map((item, idx) =>
                    item === -1 ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted">
                        ...
                      </span>
                    ) : (
                      <button
                        key={`page-${item}`}
                        onClick={() => goToPage(item)}
                        disabled={loading}
                        className={`rounded-lg border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${
                          item === currentPage
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border bg-surface text-text hover:bg-surface2"
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    onClick={goNext}
                    disabled={!canGoNext || loading}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface2"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
