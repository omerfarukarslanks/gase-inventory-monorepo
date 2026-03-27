"use client";

import type { ReactNode } from "react";
import { useLang } from "@/context/LangContext";
import type { RoleEntry } from "@/lib/permissions";

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
      <span className="text-sm text-text">{value ?? "—"}</span>
    </div>
  );
}

type RoleDetailContentProps = {
  role: RoleEntry;
  trailingAction?: ReactNode;
};

export default function RoleDetailContent({ role, trailingAction }: RoleDetailContentProps) {
  const { t } = useLang();
  const groupedPermissions = role.permissions.reduce<Record<string, typeof role.permissions>>((acc, permission) => {
    const current = acc[permission.group] ?? [];
    current.push(permission);
    acc[permission.group] = current;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="min-w-0">
          <h2 className="break-all font-mono text-base font-semibold text-text">{role.role}</h2>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                role.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {role.isActive ? t("common.active") : t("common.passive")}
            </span>
            {role.level != null ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {t("permissions.level")} {role.level}
              </span>
            ) : null}
          </div>
        </div>

        {trailingAction}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("permissions.summarySection")}</p>
        <div className="mb-5 grid grid-cols-2 gap-4">
          <Row label={t("permissions.permissionCount")} value={role.permissions.length} />
          <Row label={t("permissions.groupCount")} value={Object.keys(groupedPermissions).length} />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">{t("permissions.tabPermissions")}</p>
        {role.permissions.length === 0 ? (
          <p className="text-sm text-muted">{t("permissions.noAssignedPermissions")}</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([group, permissions]) => (
              <div key={group} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group}</p>
                <div className="space-y-2">
                  {permissions.map((permission) => (
                    <div key={permission.name} className="rounded-xl2 border border-border bg-surface2/50 px-3 py-2">
                      <p className="break-all font-mono text-xs font-semibold text-text">{permission.name}</p>
                      <p className="mt-1 text-xs text-muted">{permission.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
