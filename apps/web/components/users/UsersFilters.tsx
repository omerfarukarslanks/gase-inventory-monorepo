"use client";

import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type UsersFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  canCreate: boolean;
  onCreate: () => void;
  storeFilter: string;
  onStoreFilterChange: (value: string) => void;
  storeFilterOptions: Array<{ value: string; label: string }>;
  showStoreFilter: boolean;
  statusFilter: boolean | "all";
  onStatusFilterChange: (value: boolean | "all") => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
  onClearFilters: () => void;
};

export default function UsersFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  canCreate,
  onCreate,
  storeFilter,
  onStoreFilterChange,
  storeFilterOptions,
  showStoreFilter,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
}: UsersFiltersProps) {
  const { t } = useLang();
  return (
    <PageFilterBar
      title={t("users.title")}
      subtitle={t("users.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("common.search")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("users.new")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          {showStoreFilter && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">{t("common.storeFilter")}</label>
              <SearchableDropdown
                options={storeFilterOptions}
                value={storeFilter}
                onChange={onStoreFilterChange}
                placeholder={t("users.allStores")}
                emptyOptionLabel={t("users.allStores")}
                inputAriaLabel={t("users.storeFilterAria")}
                clearAriaLabel={t("users.storeFilterClearAria")}
                toggleAriaLabel={t("users.storeFilterToggleAria")}
              />
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => onStatusFilterChange(parseIsActiveFilter(value))}
              placeholder={t("common.allStatuses")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel={t("users.statusFilterAria")}
              toggleAriaLabel={t("users.statusFilterToggleAria")}
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface2"
            >
              {t("common.clearFilters")}
            </button>
          </div>
        </>
      )}
    />
  );
}
