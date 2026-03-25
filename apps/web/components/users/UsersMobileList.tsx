"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { User } from "@/lib/users";

type UsersMobileListProps = {
  users: User[];
  loading: boolean;
  canUpdate: boolean;
  togglingUserIds: string[];
  onViewDetail: (user: User) => void;
  onEdit: (user: User) => void;
  onToggleUserActive: (user: User, next: boolean) => void;
  footer?: ReactNode;
};

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

function getAssignedStores(user: User) {
  return user.store?.name;
}

export default function UsersMobileList({
  users,
  loading,
  canUpdate,
  togglingUserIds,
  onViewDetail,
  onEdit,
  onToggleUserActive,
  footer,
}: UsersMobileListProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface shadow-sm">
      <div className="space-y-3 p-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
        ) : users.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Kayit bulunamadi.
          </div>
        ) : (
          users.map((user) => {
            const isToggling = togglingUserIds.includes(user.id);

            return (
              <article key={user.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-text">
                      {user.name} {user.surname}
                    </h2>
                    <p className="mt-1 break-all text-xs text-muted">{user.email}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                      user.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                    }`}
                  >
                    {user.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>

                <dl className="grid gap-3 text-sm text-text2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Rol</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {user.roleName}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Magazalar</dt>
                    <dd className="mt-1">{getAssignedStores(user)}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                  <Button
                    label="Detay"
                    variant="secondary"
                    className="h-10 px-4"
                    onClick={() => onViewDetail(user)}
                  />

                  <div className="flex items-center gap-2">
                  {canUpdate ? (
                    <IconButton
                      onClick={() => onEdit(user)}
                      disabled={isToggling}
                      aria-label="Kullanici duzenle"
                      title="Duzenle"
                      className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                    >
                      <EditIcon />
                    </IconButton>
                  ) : null}
                  {canUpdate ? (
                    <ToggleSwitch
                      checked={Boolean(user.isActive)}
                      onChange={(next) => onToggleUserActive(user, next)}
                      disabled={isToggling}
                    />
                  ) : null}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {footer}
    </section>
  );
}
