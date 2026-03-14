"use client";

import type { ReactNode } from "react";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { ProductPackage } from "@/lib/product-packages";

type PackagesMobileListProps = {
  loading: boolean;
  error: string;
  packages: ProductPackage[];
  expandedPackageIds: string[];
  togglingIds: string[];
  onToggleExpand: (packageId: string) => void;
  onEditPackage: (id: string) => void;
  onToggleActive: (pkg: ProductPackage, next: boolean) => void;
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

export default function PackagesMobileList({
  loading,
  error,
  packages,
  expandedPackageIds,
  togglingIds,
  onToggleExpand,
  onEditPackage,
  onToggleActive,
  footer,
}: PackagesMobileListProps) {
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
            ) : packages.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                Kayit bulunamadi.
              </div>
            ) : (
              packages.map((pkg) => {
                const isExpanded = expandedPackageIds.includes(pkg.id);
                const isToggling = togglingIds.includes(pkg.id);

                return (
                  <article key={pkg.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-text">{pkg.name}</h2>
                        <p className="mt-1 truncate text-xs font-mono text-muted">{pkg.code}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-1 text-[11px] font-semibold",
                          pkg.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error",
                        )}
                      >
                        {pkg.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </div>

                    <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Satis Fiyati</dt>
                        <dd className="mt-1 font-medium text-text">
                          {pkg.defaultSalePrice != null ? formatPrice(pkg.defaultSalePrice) : "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Varyant</dt>
                        <dd className="mt-1">{pkg.items?.length ?? 0}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Para Birimi</dt>
                        <dd className="mt-1">{pkg.defaultCurrency ?? "-"}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Aciklama</dt>
                        <dd className="mt-1">{pkg.description ?? "-"}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      <Button
                        label={isExpanded ? "Kalemleri Gizle" : "Kalemler"}
                        onClick={() => onToggleExpand(pkg.id)}
                        disabled={isToggling}
                        variant="secondary"
                        className="min-w-[112px] flex-1"
                      />
                      <IconButton
                        onClick={() => onEditPackage(pkg.id)}
                        disabled={isToggling}
                        aria-label="Paket duzenle"
                        title="Duzenle"
                        className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                      >
                        <EditIcon />
                      </IconButton>
                      <ToggleSwitch
                        checked={Boolean(pkg.isActive)}
                        onChange={(next) => onToggleActive(pkg, next)}
                        disabled={isToggling}
                      />
                    </div>

                    {isExpanded ? (
                      <div className="space-y-3 rounded-xl2 border border-border bg-surface2/30 p-3">
                        {(pkg.items ?? []).length === 0 ? (
                          <p className="text-sm text-muted">Bu pakette varyant kalemi bulunmuyor.</p>
                        ) : (
                          (pkg.items ?? []).map((item) => (
                            <div key={item.id} className="rounded-xl border border-border bg-surface p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-text">{item.productVariant.name}</p>
                                  <p className="mt-1 truncate text-xs font-mono text-muted">{item.productVariant.code}</p>
                                </div>
                                <span className="rounded-full bg-surface2 px-2 py-1 text-xs font-semibold text-text2">
                                  {item.quantity}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
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
