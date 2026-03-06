"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { ProductCategory } from "@/lib/product-categories";
import { useLang } from "@/context/LangContext";

type ProductCategoryTableProps = {
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

export default function ProductCategoryTable({
  loading,
  error,
  categories,
  parentNameMap,
  canUpdate,
  togglingCategoryIds,
  onEditCategory,
  onToggleCategoryActive,
  footer,
}: ProductCategoryTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="p-6 text-sm text-muted">{t("common.loading")}</div>
      ) : error ? (
        <div className="p-6">
          <p className="text-sm text-error">{error}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-border bg-surface2/70">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3">{t("productCategories.title")}</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Aciklama</th>
                  <th className="px-4 py-3">Ust Kategori</th>
                  <th className="px-4 py-3">{t("common.status")}</th>
                  <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted">
                      {t("common.noData")}
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category.id}
                      className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-text">{category.name}</td>
                      <td className="px-4 py-3 text-sm text-text2">{category.slug ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">{category.description ?? "-"}</td>
                      <td className="px-4 py-3 text-sm text-text2">
                        {category.parent?.name ?? (category.parentId ? parentNameMap.get(category.parentId) ?? "-" : "-")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            category.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {category.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                        <div className="inline-flex items-center gap-1">
                          {canUpdate && (
                            <IconButton
                              onClick={() => onEditCategory(category.id)}
                              disabled={togglingCategoryIds.includes(category.id)}
                              aria-label="Kategori duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canUpdate && (
                            <ToggleSwitch
                              checked={Boolean(category.isActive)}
                              onChange={(next) => onToggleCategoryActive(category, next)}
                              disabled={togglingCategoryIds.includes(category.id)}
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
