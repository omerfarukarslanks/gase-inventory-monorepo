"use client";

import Button from "@/components/ui/Button";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter, type IsActiveFilter } from "@/components/products/types";
import { useLang } from "@/context/LangContext";

type WarehousesFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  canCreate: boolean;
  onCreate: () => void;
  statusFilter: IsActiveFilter;
  onStatusFilterChange: (value: IsActiveFilter) => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  onClearFilters: () => void;
};

export default function WarehousesFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  canCreate,
  onCreate,
  statusFilter,
  onStatusFilterChange,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  onClearFilters,
}: WarehousesFiltersProps) {
  const { t } = useLang();

  return (
    <PageFilterBar
      title={t("warehouse.warehouses.title")}
      subtitle={t("warehouse.warehouses.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("warehouse.warehouses.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("warehouse.warehouses.create")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("warehouse.warehouses.filtersTitle")}
      advancedFilters={(
        <>
          {showStoreFilter ? (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">{t("common.storeFilter")}</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={onStoreIdChange}
                placeholder={t("warehouse.common.storePlaceholder")}
                inputAriaLabel={t("common.storeFilter")}
                toggleAriaLabel={t("common.storeFilter")}
              />
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => onStatusFilterChange(parseIsActiveFilter(value))}
              placeholder={t("common.allStatuses")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel={t("common.status")}
              toggleAriaLabel={t("common.status")}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Button label={t("common.clearFilters")} onClick={onClearFilters} variant="secondary" />
          </div>
        </>
      )}
    />
  );
}
