"use client";

import { useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import { useLang } from "@/context/LangContext";
import { useViewportMode } from "@/hooks/useViewportMode";

type StockFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  storeFilterIds: string[];
  onStoreFilterChange: (ids: string[]) => void;
  storeOptions: { value: string; label: string }[];
  canTenantOnly?: boolean;
};

export default function StockFilters({
  searchTerm,
  onSearchChange,
  storeFilterIds,
  onStoreFilterChange,
  storeOptions,
  canTenantOnly = true,
}: StockFiltersProps) {
  const { t } = useLang();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const showStoreFilter = canTenantOnly && !isMobile;

  return (
    <PageFilterBar
      title={t("stock.title")}
      subtitle={t("stock.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchChange}
      searchPlaceholder={t("stock.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={showStoreFilter ? () => setShowAdvancedFilters((prev) => !prev) : undefined}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={
        showStoreFilter ? (
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Magaza</label>
            <SearchableMultiSelectDropdown
              options={storeOptions}
              values={storeFilterIds}
              onChange={onStoreFilterChange}
              placeholder={t("common.allStores")}
            />
          </div>
        ) : undefined
      }
    />
  );
}
