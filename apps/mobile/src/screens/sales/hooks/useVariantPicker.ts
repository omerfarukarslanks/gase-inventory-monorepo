import { getTenantStockSummary, normalizeProducts, type InventoryVariantStockItem } from "@gase/core";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { scoreVariantMatch } from "./validators";

type UseVariantPickerOptions = {
  onSelect: (variant: InventoryVariantStockItem, lineId?: string | null) => void;
  scopedStoreIds: string[] | undefined;
};

export function useVariantPicker({ onSelect, scopedStoreIds }: UseVariantPickerOptions) {
  const [open, setOpen] = useState(false);
  const [lineId, setLineId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<InventoryVariantStockItem[]>([]);

  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    getTenantStockSummary({
      page: 1,
      limit: 20,
      search: debouncedSearch || undefined,
      storeIds: scopedStoreIds,
    })
      .then((response) => {
        if (!active) return;
        const variants = normalizeProducts(response)
          .flatMap((product) => product.variants ?? [])
          .sort((left, right) => {
            const scoreDiff =
              scoreVariantMatch(debouncedSearch, right) -
              scoreVariantMatch(debouncedSearch, left);
            if (scoreDiff !== 0) return scoreDiff;
            return right.totalQuantity - left.totalQuantity;
          })
          .slice(0, 30);
        setOptions(variants);
      })
      .catch(() => {
        if (active) setOptions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, debouncedSearch, scopedStoreIds]);

  const openForLine = (targetLineId: string, initialSearch?: string) => {
    setLineId(targetLineId);
    setSearch(initialSearch ?? "");
    setOpen(true);
  };

  const select = (variant: InventoryVariantStockItem) => {
    onSelect(variant, lineId);
    setLineId(null);
    setOpen(false);
  };

  return { open, setOpen, lineId, search, setSearch, loading, options, openForLine, select };
}
