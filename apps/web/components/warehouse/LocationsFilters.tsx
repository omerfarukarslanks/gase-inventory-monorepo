"use client";

import Button from "@/components/ui/Button";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter, type IsActiveFilter } from "@/components/products/types";
import { useLang } from "@/context/LangContext";

type LocationsFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  canCreate: boolean;
  onCreate: () => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  warehouseId: string;
  onWarehouseIdChange: (value: string) => void;
  warehouseOptions: Array<{ value: string; label: string }>;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  typeOptions: Array<{ value: string; label: string }>;
  statusFilter: IsActiveFilter;
  onStatusFilterChange: (value: IsActiveFilter) => void;
  onClearFilters: () => void;
};

export default function LocationsFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  canCreate,
  onCreate,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  warehouseId,
  onWarehouseIdChange,
  warehouseOptions,
  typeFilter,
  onTypeFilterChange,
  typeOptions,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: LocationsFiltersProps) {
  const { t } = useLang();

  return (
    <PageFilterBar
      title={t("warehouse.locations.title")}
      subtitle={t("warehouse.locations.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("warehouse.locations.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("warehouse.locations.create")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("warehouse.locations.filtersTitle")}
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
            <label className="text-xs font-semibold text-muted">{t("warehouse.common.warehouse")}</label>
            <SearchableDropdown
              options={warehouseOptions}
              value={warehouseId}
              onChange={onWarehouseIdChange}
              placeholder={t("warehouse.common.warehousePlaceholder")}
              inputAriaLabel={t("warehouse.common.warehouse")}
              toggleAriaLabel={t("warehouse.common.warehouse")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("warehouse.common.type")}</label>
            <SearchableDropdown
              options={typeOptions}
              value={typeFilter}
              onChange={onTypeFilterChange}
              placeholder={t("warehouse.locations.typePlaceholder")}
              inputAriaLabel={t("warehouse.common.type")}
              toggleAriaLabel={t("warehouse.common.type")}
            />
          </div>

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
