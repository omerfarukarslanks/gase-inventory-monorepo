"use client";

import type { ProductAttributeInput } from "@/lib/products";
import type { Attribute as AttributeDefinition } from "@/lib/attributes";
import type { VariantForm, VariantErrors } from "@/components/products/types";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import { TrashIcon } from "@/components/ui/icons/TableIcons";

type ProductDrawerStep2Props = {
  variants: VariantForm[];
  expandedVariantKeys: string[];
  variantErrors: Record<number, VariantErrors>;
  attributeDefinitions: AttributeDefinition[];
  formError: string;
  onToggleVariantPanel: (clientKey: string) => void;
  onRemoveVariant: (index: number) => void;
  onAddAttribute: (variantIndex: number) => void;
  onRemoveAttribute: (variantIndex: number, attrIndex: number) => void;
  onUpdateAttribute: (
    variantIndex: number,
    attrIndex: number,
    field: "id" | "values",
    value: string | string[],
  ) => void;
};

function getAttributeOptions(
  attributeDefinitions: AttributeDefinition[],
  variants: VariantForm[],
  variantIndex: number,
  attrIndex: number,
) {
  const base = attributeDefinitions
    .filter((item) => item.isActive)
    .map((item) => ({ value: item.id, label: item.name }));

  const selectedId = variants[variantIndex]?.attributes[attrIndex]?.id ?? "";
  if (!selectedId || base.some((item) => item.value === selectedId)) return base;
  const selectedDef = attributeDefinitions.find((d) => d.id === selectedId);
  return [{ value: selectedId, label: selectedDef?.name ?? selectedId }, ...base];
}

function getValueOptions(
  attributeDefinitions: AttributeDefinition[],
  attrId: string,
  currentValues: string[],
) {
  const definition = attributeDefinitions.find((item) => item.id === attrId);
  const base = (definition?.values ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({ value: item.id, label: item.name }));

  const selectedSet = new Set(currentValues.filter(Boolean));
  const extraSelected = [...selectedSet]
    .filter((value) => !base.some((item) => item.value === value))
    .map((value) => {
      const valDef = definition?.values?.find((v) => v.id === value);
      return { value, label: valDef?.name ?? value };
    });

  return [...extraSelected, ...base];
}

export default function ProductDrawerStep2({
  variants,
  expandedVariantKeys,
  variantErrors,
  attributeDefinitions,
  formError,
  onToggleVariantPanel,
  onRemoveVariant,
  onAddAttribute,
  onRemoveAttribute,
  onUpdateAttribute,
}: ProductDrawerStep2Props) {
  return (
    <>
      {/* Step indicator */}
      <div className="flex gap-2 mb-2">
        <div className="h-1 flex-1 rounded-full bg-primary" />
        <div className="h-1 flex-1 rounded-full bg-primary" />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text">Varyantlar</h3>
          <p className="text-xs text-muted">Urun icin renk, beden gibi varyantlar ekleyin</p>
        </div>
      </div>

      {variants.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">Henuz varyant eklenmedi.</p>
          <p className="mt-1 text-xs text-muted">
            Varyant eklemek zorunlu degildir, dogrudan urun olusturabilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, vi) => (
            <CollapsiblePanel
              key={variant.clientKey}
              title={`Varyant #${vi + 1}`}
              open={expandedVariantKeys.includes(variant.clientKey)}
              onToggle={() => onToggleVariantPanel(variant.clientKey)}
              toggleAriaLabel={
                expandedVariantKeys.includes(variant.clientKey)
                  ? "Varyanti daralt"
                  : "Varyanti genislet"
              }
              rightSlot={
                <button
                  type="button"
                  onClick={() => onRemoveVariant(vi)}
                  className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                  aria-label="Varyanti sil"
                >
                  <TrashIcon />
                </button>
              }
            >
              {/* Attributes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-muted">Ozellikler</label>
                  <button
                    type="button"
                    onClick={() => onAddAttribute(vi)}
                    className="text-xs cursor-pointer font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    + Ozellik Ekle
                  </button>
                </div>

                {variant.attributes.map((attr: ProductAttributeInput, ai: number) => (
                  <div key={ai} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <SearchableDropdown
                        options={getAttributeOptions(attributeDefinitions, variants, vi, ai)}
                        value={attr.id}
                        onChange={(v) => onUpdateAttribute(vi, ai, "id", v)}
                        placeholder="Ozellik secin"
                        showEmptyOption={false}
                        allowClear={false}
                        className="flex-1"
                      />
                      <SearchableMultiSelectDropdown
                        options={getValueOptions(attributeDefinitions, attr.id, attr.values)}
                        values={attr.values}
                        onChange={(values) => onUpdateAttribute(vi, ai, "values", values)}
                        placeholder={attr.id ? "Deger(ler) secin" : "Once ozellik secin"}
                        className="flex-1"
                      />
                      {variant.attributes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveAttribute(vi, ai)}
                          className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-error/10 hover:text-error transition-colors"
                          aria-label="Ozelligi sil"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {variantErrors[vi]?.attributes && (
                  <p className="text-xs text-error">{variantErrors[vi].attributes}</p>
                )}
              </div>
            </CollapsiblePanel>
          ))}
        </div>
      )}

      {formError && <p className="mt-3 text-sm text-error">{formError}</p>}
    </>
  );
}
