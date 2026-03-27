"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { User } from "@/lib/users";
import TableSkeletonRows from "@/components/ui/TableSkeletonRows";

function isBirthday(birthDate?: string | null): boolean {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
}

const SortAscIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 8 4-4 4 4" />
    <path d="M7 4v16" />
    <path d="M11 12h10" />
    <path d="M11 16h10" />
    <path d="M11 20h10" />
  </svg>
);

const SortDescIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 16 4 4 4-4" />
    <path d="M7 20V4" />
    <path d="M11 12h10" />
    <path d="M11 8h10" />
    <path d="M11 4h10" />
  </svg>
);

type UsersTableProps = {
  users: User[];
  loading: boolean;
  canUpdate: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  togglingUserIds: string[];
  onSort: (key: string) => void;
  onEdit: (user: User) => void;
  onViewDetail: (user: User) => void;
  onToggleUserActive: (user: User, next: boolean) => void;
  footer?: ReactNode;
};

export default function UsersTable({
  users,
  loading,
  canUpdate,
  sortBy,
  sortOrder,
  togglingUserIds,
  onSort,
  onEdit,
  onViewDetail,
  onToggleUserActive,
  footer,
}: UsersTableProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-surface2/70 text-xs uppercase text-muted">
            <tr>
              <th
                className="cursor-pointer select-none px-6 py-4 font-semibold hover:text-text"
                onClick={() => onSort("name")}
              >
                <div className="flex items-center gap-1">
                  Ad Soyad {sortBy === "name" && (sortOrder === "ASC" ? <SortAscIcon /> : <SortDescIcon />)}
                </div>
              </th>
              <th
                className="cursor-pointer select-none px-6 py-4 font-semibold hover:text-text"
                onClick={() => onSort("email")}
              >
                <div className="flex items-center gap-1">
                  E-Posta {sortBy === "email" && (sortOrder === "ASC" ? <SortAscIcon /> : <SortDescIcon />)}
                </div>
              </th>
              <th
                className="cursor-pointer select-none px-6 py-4 font-semibold hover:text-text"
                onClick={() => onSort("role")}
              >
                <div className="flex items-center gap-1">
                  Rol {sortBy === "role" && (sortOrder === "ASC" ? <SortAscIcon /> : <SortDescIcon />)}
                </div>
              </th>
              <th className="px-6 py-4 font-semibold text-muted">Mağaza</th>
              {canUpdate && (
                <th className="sticky right-0 z-20 bg-surface2/70 px-6 py-4 text-right font-semibold">İşlemler</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <TableSkeletonRows rows={5} cols={5} />
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted">Kayıt bulunamadı.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                >
                  <td className="px-6 py-3">
                    <button
                      type="button"
                      onClick={() => onViewDetail(user)}
                      className="cursor-pointer text-left text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {user.name} {user.surname}
                        {isBirthday(user.birthDate) && (
                          <span title={t("users.birthdayToday")} className="text-base leading-none">🎂</span>
                        )}
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-3 text-text2">{user.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {user.roleName}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-text2">
                    {user.store?.name ?? "-"}
                  </td>
                  {canUpdate && (
                  <td className="sticky right-0 z-10 bg-surface px-6 py-3 text-right group-hover:bg-surface2/50">
                    <div className="inline-flex items-center gap-2">
                      
                        <IconButton
                          onClick={() => onEdit(user)}
                          disabled={togglingUserIds.includes(user.id)}
                          aria-label="Kullanici duzenle"
                          title="Duzenle"
                        >
                          <EditIcon />
                        </IconButton>
                      
                        <ToggleSwitch
                          checked={Boolean(user.isActive)}
                          onChange={(next) => onToggleUserActive(user, next)}
                          disabled={togglingUserIds.includes(user.id)}
                        />
                    </div>
                  </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {footer}
    </section>
  );
}
