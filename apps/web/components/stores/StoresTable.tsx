"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { Store } from "@/lib/stores";
import { useLang } from "@/context/LangContext";
import TableSkeletonRows from "@/components/ui/TableSkeletonRows";

type StoresTableProps = {
  loading: boolean;
  error: string;
  stores: Store[];
  canUpdate: boolean;
  togglingStoreIds: string[];
  onEditStore: (id: string) => void;
  onToggleStoreActive: (store: Store, next: boolean) => void;
  footer?: ReactNode;
};

export default function StoresTable({
  loading,
  error,
  stores,
  canUpdate,
  togglingStoreIds,
  onEditStore,
  onToggleStoreActive,
  footer,
}: StoresTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">{t("stores.colName")}</th>
                  <th className="px-4 py-3">{t("stores.colCode")}</th>
                  <th className="px-4 py-3">{t("stores.colAddress")}</th>
                  <th className="px-4 py-3">{t("stores.colStatus")}</th>
                  <th className="px-4 py-3">{t("stores.colSlug")}</th>
                  <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("stores.colActions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows rows={5} cols={6} />
                ) : (
                  stores.map((store) => (
                    <tr
                      key={store.id}
                      className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text">{store.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.code}</td>
                      <td className="px-4 py-3 text-sm text-text2">{store.address ?? "-"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            store.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {store.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{store.slug}</td>
                      <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                        <div className="inline-flex items-center gap-1">
                          {canUpdate && (
                            <IconButton
                              onClick={() => onEditStore(store.id)}
                              disabled={togglingStoreIds.includes(store.id)}
                              aria-label="Edit store"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canUpdate && (
                            <ToggleSwitch
                              checked={store.isActive}
                              onChange={(next) => onToggleStoreActive(store, next)}
                              disabled={togglingStoreIds.includes(store.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {footer}
        </>
      )}
    </section>
  );
}
