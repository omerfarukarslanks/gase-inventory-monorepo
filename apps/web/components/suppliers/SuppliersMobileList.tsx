"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { useLang } from "@/context/LangContext";
import type { Supplier } from "@/lib/suppliers";

type SuppliersMobileListProps = {
  loading: boolean;
  error: string;
  suppliers: Supplier[];
  canUpdate: boolean;
  togglingSupplierIds: string[];
  onEditSupplier: (id: string) => void;
  onToggleSupplierActive: (supplier: Supplier, next: boolean) => void;
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

export default function SuppliersMobileList({
  loading,
  error,
  suppliers,
  canUpdate,
  togglingSupplierIds,
  onEditSupplier,
  onToggleSupplierActive,
  footer,
}: SuppliersMobileListProps) {
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
            ) : suppliers.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("common.noData")}
              </div>
            ) : (
              suppliers.map((supplier) => {
                const isToggling = togglingSupplierIds.includes(supplier.id);

                return (
                  <article key={supplier.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-text">
                          {supplier.name} {supplier.surname ?? ""}
                        </h2>
                        <p className="mt-1 break-all text-xs text-muted">{supplier.email ?? "-"}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          supplier.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {supplier.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    </div>

                    <dl className="grid gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Telefon</dt>
                        <dd className="mt-1">{supplier.phoneNumber ?? "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Adres</dt>
                        <dd className="mt-1">{supplier.address ?? "-"}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
                      {canUpdate ? (
                        <IconButton
                          onClick={() => onEditSupplier(supplier.id)}
                          disabled={isToggling}
                          aria-label="Tedarikci duzenle"
                          title="Duzenle"
                          className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                        >
                          <EditIcon />
                        </IconButton>
                      ) : null}
                      {canUpdate ? (
                        <ToggleSwitch
                          checked={Boolean(supplier.isActive)}
                          onChange={(next) => onToggleSupplierActive(supplier, next)}
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
