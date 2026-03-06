"use client";

import { Fragment, type ReactNode } from "react";
import IconButton from "@/components/ui/IconButton";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import type { Attribute, AttributeValue } from "@/lib/attributes";
import { formatDate } from "@/lib/format";
import { useLang } from "@/context/LangContext";
import VirtualAttributeValuesTable from "@/components/attributes/VirtualAttributeValuesTable";

type AttributesTableProps = {
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

export default function AttributesTable({
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
}: AttributesTableProps) {
  const { t } = useLang();

  return (
    <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
      {loading ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted">
          <svg className="h-4 w-4 animate-sp" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {t("common.loading")}
        </div>
      ) : attributes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-10 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-muted/40"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.29 7 12 12 20.71 7" />
            <line x1="12" y1="22" x2="12" y2="12" />
          </svg>
          <p className="text-sm font-medium text-muted">{t("common.noData")}</p>
          <p className="text-xs text-muted/70">{t("attributes.new")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-border bg-surface2/70">
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3">{t("attributes.title")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3 text-center">{t("attributes.valueName")}</th>
                <th className="px-4 py-3">Guncelleme</th>
                <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((attribute) => {
                const isExpanded = expandedAttributeIds.includes(attribute.id);
                const values = sortValues(attribute);

                return (
                  <Fragment key={attribute.id}>
                    <tr className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/40">
                      <td className="px-4 py-3 text-sm font-medium text-text">
                        <button
                          type="button"
                          onClick={() => onToggleExpand(attribute.id)}
                          className="inline-flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-left hover:bg-surface2"
                          aria-expanded={isExpanded}
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
                            className={`text-muted transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                          <span>{attribute.name}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            attribute.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                          }`}
                        >
                          {attribute.isActive ? t("common.active") : t("common.passive")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-text2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-surface2 px-2 text-xs font-medium">
                          {attribute.values?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text2">{formatDate(attribute.updatedAt)}</td>
                      <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/40">
                        <div className="inline-flex items-center gap-2">
                          {canUpdate && (
                            <IconButton
                              onClick={() => onEditAttribute(attribute)}
                              aria-label="Ozellik duzenle"
                              title="Duzenle"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {canUpdate && (
                            <ToggleSwitch
                              checked={attribute.isActive}
                              onChange={(next) => onToggleAttributeStatus(attribute, next)}
                              disabled={togglingAttributeIds.includes(attribute.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-border bg-surface/60">
                        <td colSpan={5} className="px-5 py-4">
                          {values.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-xs text-muted">
                              Bu ozellige ait deger bulunamadi.
                            </div>
                          ) : (
                            <VirtualAttributeValuesTable
                              values={values}
                              togglingValueIds={togglingValueIds}
                              onToggleValueStatus={onToggleValueStatus}
                              canUpdate={canUpdate}
                            />
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {footer}
    </section>
  );
}
