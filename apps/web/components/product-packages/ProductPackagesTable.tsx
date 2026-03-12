"use client";

import { useState, type ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { ProductPackage, ProductPackageItem } from "@/lib/product-packages";

function VirtualPackageItemsTable({ items }: { items: ProductPackageItem[] }) {
  const rowHeight = 42;
  const containerHeight = 252;
  const overscan = 4;
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + overscan * 2);
  const visibleItems = items.slice(startIndex, endIndex);

  return (
    <div className="min-w-[620px]">
      <div className="grid grid-cols-[2fr_1fr_90px] border-b border-border bg-surface2/70 text-left text-[11px] uppercase tracking-wide text-muted">
        <div className="px-3 py-2">Varyant Adi</div>
        <div className="px-3 py-2">Kod</div>
        <div className="px-3 py-2 text-right">Adet</div>
      </div>
      <div className="h-[252px] overflow-y-auto" onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}>
        <div className="relative" style={{ height: totalHeight }}>
          <div className="absolute inset-x-0" style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visibleItems.map((item) => (
              <div
                key={item.id}
                className="grid h-[42px] grid-cols-[2fr_1fr_90px] items-center border-b border-border text-sm text-text2 last:border-b-0 hover:bg-surface2/30"
              >
                <div className="truncate px-3 py-2 text-text">{item.productVariant.name}</div>
                <div className="truncate px-3 py-2 font-mono text-text2">{item.productVariant.code}</div>
                <div className="px-3 py-2 text-right text-text2">{item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type ProductPackagesTableProps = {
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

export default function ProductPackagesTable({
  loading,
  error,
  packages,
  expandedPackageIds,
  togglingIds,
  onToggleExpand,
  onEditPackage,
  onToggleActive,
  footer,
}: ProductPackagesTableProps) {
  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">Paketler yukleniyor...</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="w-10 px-2 py-3 text-center"></th>
                  <th className="px-4 py-3">Paket Adi</th>
                  <th className="px-4 py-3">Kod</th>
                  <th className="px-4 py-3">Aciklama</th>
                  <th className="px-4 py-3">Satis Fiyati</th>
                  <th className="px-4 py-3">Alis Fiyati</th>
                  <th className="px-4 py-3">KDV %</th>
                  <th className="px-4 py-3">Para Birimi</th>
                  <th className="px-4 py-3">Varyant</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="sticky right-0 z-20 w-[156px] bg-surface2/70 px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)]">
                    Islemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-sm text-muted">
                      Kayit bulunamadi.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => {
                    const isExpanded = expandedPackageIds.includes(pkg.id);
                    const itemCount = pkg.items?.length ?? 0;
                    return [
                      <tr
                        key={`${pkg.id}-row`}
                        className="group border-b border-border transition-colors hover:bg-surface2/50"
                      >
                        <td className="px-2 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => onToggleExpand(pkg.id)}
                            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface2 hover:text-text"
                            aria-label={isExpanded ? "Paket kalemlerini gizle" : "Paket kalemlerini goster"}
                            title={isExpanded ? "Paket kalemlerini gizle" : "Paket kalemlerini goster"}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={cn("transition-transform", isExpanded && "rotate-90")}
                            >
                              <path d="m9 18 6-6-6-6" />
                            </svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-text">{pkg.name}</td>
                        <td className="px-4 py-3 text-sm font-mono text-text2">{pkg.code}</td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-sm text-text2">{pkg.description ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {pkg.defaultSalePrice != null ? formatPrice(pkg.defaultSalePrice) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {pkg.defaultPurchasePrice != null ? formatPrice(pkg.defaultPurchasePrice) : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {pkg.defaultTaxPercent != null ? `%${pkg.defaultTaxPercent}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">{pkg.defaultCurrency ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-text2">
                          <span className="inline-flex rounded-full bg-surface2 px-2 py-0.5 text-xs font-semibold text-text2">
                            {itemCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
                              pkg.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error",
                            )}
                          >
                            {pkg.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="sticky right-0 z-10 w-[156px] bg-surface px-4 py-3 text-right shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.2)] group-hover:bg-surface2/50">
                          <div className="inline-flex items-center gap-1">
                            <IconButton
                              onClick={() => onEditPackage(pkg.id)}
                              disabled={togglingIds.includes(pkg.id)}
                              aria-label="Paket duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </IconButton>
                            <ToggleSwitch
                              checked={Boolean(pkg.isActive)}
                              onChange={(next) => onToggleActive(pkg, next)}
                              disabled={togglingIds.includes(pkg.id)}
                            />
                          </div>
                        </td>
                      </tr>,
                      isExpanded ? (
                        <tr key={`${pkg.id}-items`} className="border-b border-border bg-surface/60">
                          <td colSpan={11} className="px-4 py-3">
                            {itemCount === 0 ? (
                              <div className="rounded-xl border border-border bg-surface2/40 p-3 text-sm text-muted">
                                Bu pakette varyant kalemi bulunmuyor.
                              </div>
                            ) : (
                              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                                <VirtualPackageItemsTable items={pkg.items ?? []} />
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : null,
                    ];
                  })
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
