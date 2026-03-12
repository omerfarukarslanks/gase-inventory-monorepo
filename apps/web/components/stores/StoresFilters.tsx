"use client";

import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";
import { useLang } from "@/context/LangContext";

type StoresFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  canCreate: boolean;
  onCreate: () => void;
  statusFilter: boolean | "all";
  onStatusFilterChange: (value: boolean | "all") => void;
  onClearFilters: () => void;
};

export default function StoresFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  canCreate,
  onCreate,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: StoresFiltersProps) {
  const { t } = useLang();

  return (
    <PageFilterBar
      title={t("stores.title")}
      subtitle={t("stores.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("common.search")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("stores.new")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => onStatusFilterChange(parseIsActiveFilter(value))}
              placeholder={t("common.allStatuses")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel={t("stores.statusFilter")}
              toggleAriaLabel={t("stores.statusFilter")}
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
