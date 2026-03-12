"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { Permission } from "@/lib/permissions";

type PermissionsMobileListProps = {
  loading: boolean;
  error: string;
  permissions: Permission[];
  canManage: boolean;
  togglingPermIds: string[];
  onEditPermission: (permission: Permission) => void;
  onTogglePermissionActive: (permission: Permission, next: boolean) => void;
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

export default function PermissionsMobileList({
  loading,
  error,
  permissions,
  canManage,
  togglingPermIds,
  onEditPermission,
  onTogglePermissionActive,
  footer,
}: PermissionsMobileListProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-4">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 p-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
            ) : permissions.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                Kayit bulunamadi.
              </div>
            ) : (
              permissions.map((permission) => {
                const isToggling = togglingPermIds.includes(permission.id);

                return (
                  <article key={permission.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="break-all font-mono text-sm font-semibold text-text">{permission.name}</h2>
                        <p className="mt-1 text-xs text-muted">{permission.group}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          permission.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {permission.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>

                    <p className="text-sm text-text2">{permission.description}</p>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                      {canManage ? (
                        <IconButton
                          onClick={() => onEditPermission(permission)}
                          disabled={isToggling}
                          aria-label="Yetki duzenle"
                          title="Duzenle"
                          className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                        >
                          <EditIcon />
                        </IconButton>
                      ) : null}
                      {canManage ? (
                        <ToggleSwitch
                          checked={permission.isActive}
                          onChange={(next) => onTogglePermissionActive(permission, next)}
                          disabled={isToggling}
                        />
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          {footer}
        </>
      )}
    </section>
  );
}
