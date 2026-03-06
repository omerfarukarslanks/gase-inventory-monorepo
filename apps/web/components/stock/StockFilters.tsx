"use client";

import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import SearchInput from "@/components/ui/SearchInput";
import { useLang } from "@/context/LangContext";

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
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text">{t("stock.title")}</h1>
        <p className="text-sm text-muted">{t("stock.subtitle")}</p>
      </div>
      <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={t("stock.searchPlaceholder")}
          containerClassName="w-full lg:w-72"
        />
        {canTenantOnly && (
          <div className="w-full lg:w-72">
            <SearchableMultiSelectDropdown
              options={storeOptions}
              values={storeFilterIds}
              onChange={onStoreFilterChange}
              placeholder={t("common.allStores")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
