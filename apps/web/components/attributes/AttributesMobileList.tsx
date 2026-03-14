"use client";

import type { ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import Button from "@/components/ui/Button";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { useLang } from "@/context/LangContext";
import { formatDate } from "@/lib/format";
import type { Attribute, AttributeValue } from "@/lib/attributes";

type AttributesMobileListProps = {
  loading: boolean;
  attributes: Attribute[];
  expandedAttributeIds: string[];
  togglingAttributeIds: string[];
  togglingValueIds: string[];
  canUpdate: boolean;
  onToggleExpand: (id: string) => void;
  onEditAttribute: (attribute: Attribute) => void;
  onToggleAttributeStatus: (attribute: Attribute, next: boolean) => void;
  onToggleValueStatus: (value: AttributeValue, next: boolean) => void;
  footer?: ReactNode;
};

function sortValues(attribute: Attribute): AttributeValue[] {
  return [...(attribute.values ?? [])].sort((a, b) => Number(a.value) - Number(b.value));
}

function LoadingCard() {
  return (
    <div className="space-y-3 rounded-xl2 border border-border bg-surface p-4">
      <div className="h-4 w-1/2 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-2/3 animate-pulse rounded bg-surface2" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-surface2" />
    </div>
  );
}

export default function AttributesMobileList({
  loading,
  attributes,
  expandedAttributeIds,
  togglingAttributeIds,
  togglingValueIds,
  canUpdate,
  onToggleExpand,
  onEditAttribute,
  onToggleAttributeStatus,
  onToggleValueStatus,
  footer,
}: AttributesMobileListProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      <div className="space-y-3 p-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => <LoadingCard key={index} />)
        ) : attributes.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            {t("common.noData")}
          </div>
        ) : (
          attributes.map((attribute) => {
            const isExpanded = expandedAttributeIds.includes(attribute.id);
            const isToggling = togglingAttributeIds.includes(attribute.id);
            const values = sortValues(attribute);

            return (
              <article key={attribute.id} className="space-y-4 rounded-xl2 border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-text">{attribute.name}</h2>
                    <p className="mt-1 text-xs text-muted">Guncelleme: {formatDate(attribute.updatedAt)}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                      attribute.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                    }`}
                  >
                    {attribute.isActive ? t("common.active") : t("common.passive")}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm text-text2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">{t("attributes.valueName")}</dt>
                    <dd className="mt-1">{attribute.values?.length ?? 0}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <Button
                    label={isExpanded ? "Degerleri Gizle" : "Degerler"}
                    onClick={() => onToggleExpand(attribute.id)}
                    variant="secondary"
                    className="min-w-[112px] flex-1"
                  />
                  {canUpdate ? (
                    <IconButton
                      onClick={() => onEditAttribute(attribute)}
                      aria-label="Ozellik duzenle"
                      title="Duzenle"
                      className="h-10 w-10 rounded-xl border border-border text-text2 hover:bg-surface2 hover:text-text"
                    >
                      <EditIcon />
                    </IconButton>
                  ) : null}
                  {canUpdate ? (
                    <ToggleSwitch
                      checked={attribute.isActive}
                      onChange={(next) => onToggleAttributeStatus(attribute, next)}
                      disabled={isToggling}
                    />
                  ) : null}
                </div>

                {isExpanded ? (
                  <div className="space-y-3 rounded-xl2 border border-border bg-surface2/30 p-3">
                    {values.length === 0 ? (
                      <p className="text-sm text-muted">Bu ozellige ait deger bulunamadi.</p>
                    ) : (
                      values.map((value) => (
                        <div key={value.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-text">{value.name}</p>
                            <p className="mt-1 text-xs text-muted">Deger: {String(value.value)}</p>
                          </div>
                          {canUpdate ? (
                            <ToggleSwitch
                              checked={value.isActive}
                              onChange={(next) => onToggleValueStatus(value, next)}
                              disabled={togglingValueIds.includes(value.id)}
                            />
                          ) : null}
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
    </section>
  );
}
