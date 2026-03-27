"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { useLang } from "@/context/LangContext";
import type { Store } from "@/lib/stores";

type StoresMobileListProps = {
  loading: boolean;
  error: string;
  stores: Store[];
  canUpdate: boolean;
  togglingStoreIds: string[];
  onViewDetail: (store: Store) => void;
  onEditStore: (id: string) => void;
  onToggleStoreActive: (store: Store, next: boolean) => void;
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

export default function StoresMobileList({
  loading,
  error,
  stores,
  canUpdate,
  togglingStoreIds,
  onViewDetail,
  onEditStore,
  onToggleStoreActive,
  footer,
}: StoresMobileListProps) {
  const { t } = useLang();

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
            ) : stores.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("common.noData")}
              </div>
            ) : (
              stores.map((store) => {
                const isToggling = togglingStoreIds.includes(store.id);

                return (
                  <article key={store.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text">{store.name}</h2>
                        <p className="mt-1 text-xs text-muted">
                          {[store.code, store.slug].filter(Boolean).join(" | ") || "-"}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          store.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {store.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("stores.address")}</p>
                      <p className="mt-1 text-sm text-text2">{store.address ?? "-"}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <Button
                        label={t("common.detail")}
                        variant="secondary"
                        className="h-10 px-4"
                        onClick={() => onViewDetail(store)}
                      />

                      <div className="flex items-center gap-2">
                      {canUpdate ? (
                        <IconButton
                          onClick={() => onEditStore(store.id)}
                          disabled={isToggling}
                          aria-label={t("stores.update")}
                          title={t("common.edit")}
                          className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                        >
                          <EditIcon />
                        </IconButton>
                      ) : null}
                      {canUpdate ? (
                        <ToggleSwitch
                          checked={Boolean(store.isActive)}
                          onChange={(next) => onToggleStoreActive(store, next)}
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
        </>
      )}
    </section>
  );
}
