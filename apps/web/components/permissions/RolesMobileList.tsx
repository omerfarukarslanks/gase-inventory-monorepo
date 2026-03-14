"use client";

import IconButton from "@/components/ui/IconButton";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { RoleEntry } from "@/lib/permissions";

type RolesMobileListProps = {
  loading: boolean;
  error: string;
  roles: RoleEntry[];
  canManage: boolean;
  onEditRole: (role: RoleEntry) => void | Promise<void>;
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

export default function RolesMobileList({
  loading,
  error,
  roles,
  canManage,
  onEditRole,
}: RolesMobileListProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <div className="space-y-3 p-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
          ) : roles.length === 0 ? (
            <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              Kayit bulunamadi.
            </div>
          ) : (
            roles.map((role) => (
              <article key={role.role} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="break-all font-mono text-sm font-semibold text-text">{role.role}</h2>
                    <p className="mt-1 text-xs text-muted">{role.permissions.length} yetki</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                      role.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                    }`}
                  >
                    {role.isActive ? "Aktif" : "Pasif"}
                  </span>
                </div>

                <div className="flex justify-end border-t border-border pt-3">
                  {canManage ? (
                    <IconButton
                      onClick={() => void onEditRole(role)}
                      aria-label="Rol yetkilerini duzenle"
                      title="Yetkileri Duzenle"
                      className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                    >
                      <EditIcon />
                    </IconButton>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
