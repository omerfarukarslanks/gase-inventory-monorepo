"use client";

import type { ReactNode } from "react";
import { useLang } from "@/context/LangContext";
import type { User } from "@/lib/users";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-rose-500",
  "bg-amber-500", "bg-emerald-500", "bg-cyan-500",
  "bg-pink-500", "bg-indigo-500",
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

type UserDetailContentProps = {
  user: User;
  trailingAction?: ReactNode;
};

export default function UserDetailContent({ user, trailingAction }: UserDetailContentProps) {
  const { t } = useLang();
  const genderLabels: Record<string, string> = {
    MALE: t("users.genderMale"),
    FEMALE: t("users.genderFemale"),
    OTHER: t("users.genderOther"),
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="flex items-center gap-4">
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
                {user.isActive !== false ? t("common.active") : t("common.passive")}
              </span>
            </div>
          </div>
        </div>

        {trailingAction}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("users.contactSection")}</p>
        <div className="mb-5 grid grid-cols-2 gap-4">
          <Row label={t("customers.colPhone")} value={user.phone} />
          <Row label={t("users.store")} value={user.store?.name} />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("users.personalSection")}</p>
        <div className="mb-5 grid grid-cols-2 gap-4">
          <Row label={t("users.gender")} value={user.gender ? genderLabels[user.gender] : undefined} />
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{t("users.birthDate")}</span>
            <span className="inline-flex items-center gap-1.5 text-sm text-text">
              {formatDate(user.birthDate)}
              {isBirthday(user.birthDate) && (
                <span title={t("users.birthdayToday")} className="text-base leading-none">🎂</span>
              )}
            </span>
          </div>
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("users.addressSection")}</p>
        <div className="mb-5 grid grid-cols-1 gap-4">
          <Row label={t("users.address")} value={user.address} />
          <div className="grid grid-cols-3 gap-4">
            <Row label={t("users.district")} value={user.district} />
            <Row label={t("users.city")} value={user.city} />
            <Row label={t("users.country")} value={user.country} />
          </div>
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("users.systemSection")}</p>
        <div className="grid grid-cols-2 gap-4">
          <Row label={t("users.createdAt")} value={formatDateTime(user.createdAt)} />
          <Row label={t("users.updatedAt")} value={formatDateTime(user.updatedAt)} />
        </div>
      </div>
    </div>
  );
}
