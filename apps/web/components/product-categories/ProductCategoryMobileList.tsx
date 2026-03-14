"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { useLang } from "@/context/LangContext";
import type { ProductCategory } from "@/lib/product-categories";

type ProductCategoryMobileListProps = {
  loading: boolean;
  error: string;
  categories: ProductCategory[];
  parentNameMap: Map<string, string>;
  canUpdate: boolean;
  togglingCategoryIds: string[];
  onEditCategory: (id: string) => void;
  onToggleCategoryActive: (category: ProductCategory, next: boolean) => void;
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

export default function ProductCategoryMobileList({
  loading,
  error,
  categories,
  parentNameMap,
  canUpdate,
  togglingCategoryIds,
  onEditCategory,
  onToggleCategoryActive,
  footer,
}: ProductCategoryMobileListProps) {
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
            ) : categories.length === 0 ? (
              <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
                {t("common.noData")}
              </div>
            ) : (
              categories.map((category) => {
                const isToggling = togglingCategoryIds.includes(category.id);
                const parentLabel =
                  category.parent?.name ?? (category.parentId ? parentNameMap.get(category.parentId) ?? "-" : "-");

                return (
                  <article key={category.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-text">{category.name}</h2>
                        <p className="mt-1 truncate text-xs text-muted">{category.slug ?? "-"}</p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          category.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                        }`}
                      >
                        {category.isActive ? t("common.active") : t("common.passive")}
                      </span>
                    </div>

                    <dl className="grid gap-3 text-sm text-text2">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Ust Kategori</dt>
                        <dd className="mt-1">{parentLabel}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">Aciklama</dt>
                        <dd className="mt-1">{category.description ?? "-"}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                      {canUpdate ? (
                        <IconButton
                          onClick={() => onEditCategory(category.id)}
                          disabled={isToggling}
                          aria-label="Kategori duzenle"
                          title="Duzenle"
                          className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                        >
                          <EditIcon />
                        </IconButton>
                      ) : null}
                      {canUpdate ? (
                        <ToggleSwitch
                          checked={Boolean(category.isActive)}
                          onChange={(next) => onToggleCategoryActive(category, next)}
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
