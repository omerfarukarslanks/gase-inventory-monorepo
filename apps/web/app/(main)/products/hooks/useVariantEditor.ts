import { type VariantForm, type VariantErrors } from "@/components/products/types";
import type { Dispatch, SetStateAction } from "react";

type Options = {
  variants: VariantForm[];
  setVariants: Dispatch<SetStateAction<VariantForm[]>>;
  expandedVariantKeys: string[];
  setExpandedVariantKeys: Dispatch<SetStateAction<string[]>>;
  setVariantErrors: Dispatch<SetStateAction<Record<number, VariantErrors>>>;
};

export function useVariantEditor({
  variants,
  setVariants,
  expandedVariantKeys,
  setExpandedVariantKeys,
  setVariantErrors,
}: Options) {
  const removeVariant = (index: number) => {
    const removedKey = variants[index]?.clientKey;
    setVariants((prev) => prev.filter((_, i) => i !== index));
    if (removedKey) {
      setExpandedVariantKeys((prev) => prev.filter((key) => key !== removedKey));
    }
    setVariantErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const toggleVariantPanel = (clientKey: string) => {
    setExpandedVariantKeys((prev) =>
      prev.includes(clientKey) ? prev.filter((key) => key !== clientKey) : [...prev, clientKey],
    );
  };

  const addAttribute = (variantIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, attributes: [...v.attributes, { id: "", values: [] }] } : v,
      ),
    );
  };

  const removeAttribute = (variantIndex: number, attrIndex: number) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex ? { ...v, attributes: v.attributes.filter((_, ai) => ai !== attrIndex) } : v,
      ),
    );
  };

  const updateVariantAttribute = (
    variantIndex: number,
    attrIndex: number,
    field: "id" | "values",
    value: string | string[],
  ) => {
    setVariants((prev) =>
      prev.map((v, i) =>
        i === variantIndex
          ? {
              ...v,
              attributes: v.attributes.map((a, ai) => {
                if (ai !== attrIndex) return a;
                if (field === "id") {
                  return { id: String(value), values: [] };
                }
                return { ...a, values: Array.isArray(value) ? value : [] };
              }),
            }
          : v,
      ),
    );
  };

  return { removeVariant, toggleVariantPanel, addAttribute, removeAttribute, updateVariantAttribute };
}
