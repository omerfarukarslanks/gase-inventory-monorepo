"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { User } from "@/lib/users";

// ─── helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
  "bg-pink-500",  "bg-indigo-500",
];

function initials(name: string, surname: string): string {
  return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
}

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const GENDER_LABELS: Record<string, string> = {
  MALE: "Erkek",
  FEMALE: "Kadın",
  OTHER: "Diğer",
};

// ─── sub-components ───────────────────────────────────────────────────────────

function isBirthday(birthDate?: string | null): boolean {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <span className="text-sm text-text">{value || "—"}</span>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

type Props = {
  user: User | null;
  onClose: () => void;
};

export default function UserDetailDialog({ user, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [user, onClose]);

  if (!mounted) return null;

  const open = Boolean(user);

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-200 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {user && (
          <>
            {/* ── Header ── */}
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.name} ${user.surname}`}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${avatarColor(user.id)}`}>
                    {initials(user.name, user.surname)}
                  </div>
                )}

                {/* Name + badges */}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-text">
                    {user.name} {user.surname}
                  </h2>
                  <p className="truncate text-sm text-muted">{user.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {user.roleName}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.isActive !== false
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {user.isActive !== false ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface2 cursor-pointer hover:text-text"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto p-5">
              {/* Contact */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">İletişim</p>
              <div className="mb-5 grid grid-cols-2 gap-4">
                <Row label="Telefon" value={user.phone} />
                <Row label="Mağaza" value={user.store?.name} />
              </div>

              {/* Personal */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Kişisel</p>
              <div className="mb-5 grid grid-cols-2 gap-4">
                <Row label="Cinsiyet" value={user.gender ? GENDER_LABELS[user.gender] : undefined} />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Doğum Tarihi</span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-text">
                    {formatDate(user.birthDate)}
                    {isBirthday(user.birthDate) && (
                      <span title="Bugün doğum günü!" className="text-base leading-none">🎂</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Address */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Adres</p>
              <div className="mb-5 grid grid-cols-1 gap-4">
                <Row label="Adres" value={user.address} />
                <div className="grid grid-cols-3 gap-4">
                  <Row label="İlçe" value={user.district} />
                  <Row label="İl" value={user.city} />
                  <Row label="Ülke" value={user.country} />
                </div>
              </div>

              {/* Meta */}
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Sistem Bilgileri</p>
              <div className="grid grid-cols-2 gap-4">
                <Row label="Oluşturulma" value={formatDateTime(user.createdAt)} />
                <Row label="Güncellenme" value={formatDateTime(user.updatedAt)} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
