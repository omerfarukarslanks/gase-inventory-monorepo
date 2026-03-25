"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Store } from "@/lib/stores";

// ─── helpers ──────────────────────────────────────────────────────────────────

const STORE_TYPE_LABELS: Record<string, string> = {
  RETAIL: "Perakende",
  WHOLESALE: "Toptan",
};

const CURRENCY_LABELS: Record<string, string> = {
  TRY: "Türk Lirası (₺)",
  USD: "Amerikan Doları ($)",
  EUR: "Euro (€)",
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <span className="text-sm text-text">{value || "—"}</span>
    </div>
  );
}

function StoreLogo({ name, logo }: { name: string; logo?: string | null }) {
  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        className="h-14 w-14 rounded-xl2 object-contain ring-2 ring-border"
      />
    );
  }

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl2 border border-border bg-surface2 text-lg font-bold text-muted">
      {initials || "M"}
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

type Props = {
  store: Store | null;
  onClose: () => void;
};

export default function StoreDetailDialog({ store, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!store) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [store, onClose]);

  if (!mounted) return null;

  const open = Boolean(store);

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {store && (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="flex items-center gap-4">
                <StoreLogo name={store.name} logo={store.logo} />

                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-text">{store.name}</h2>
                  {store.code && (
                    <p className="text-sm text-muted">#{store.code}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {store.storeType && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {STORE_TYPE_LABELS[store.storeType] ?? store.storeType}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        store.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {store.isActive ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="shrink-0 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 hover:text-text"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Genel */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Genel</p>
              <div className="mb-5 grid grid-cols-2 gap-4">
                <Row label="Para Birimi" value={store.currency ? CURRENCY_LABELS[store.currency] ?? store.currency : undefined} />
                <Row
                  label="Kimlik No"
                  value={
                    store.tckn ? `TCKN: ${store.tckn}`
                    : store.taxNo ? `Vergi No: ${store.taxNo}`
                    : undefined
                  }
                />
              </div>

              {/* Adres */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Adres</p>
              <div className="mb-5 grid grid-cols-1 gap-4">
                <Row label="Adres" value={store.address} />
                <div className="grid grid-cols-3 gap-4">
                  <Row label="İlçe" value={store.district} />
                  <Row label="İl" value={store.city} />
                  <Row label="Ülke" value={store.country} />
                </div>
              </div>

              {/* Açıklama */}
              {store.description && (
                <>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Açıklama</p>
                  <div className="mb-5">
                    <p className="text-sm text-text">{store.description}</p>
                  </div>
                </>
              )}

              {/* Sistem */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Sistem Bilgileri</p>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Oluşturulma" value={formatDateTime(store.createdAt)} />
                <Row label="Güncellenme" value={formatDateTime(store.updatedAt)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
