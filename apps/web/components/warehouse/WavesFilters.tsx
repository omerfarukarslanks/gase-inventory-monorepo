"use client";

import Button from "@/components/ui/Button";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

type WavesFiltersProps = {
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
  status: string;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
};

export default function WavesFilters({
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
  status,
  onStatusChange,
  onClearFilters,
}: WavesFiltersProps) {
  const { t } = useLang();

  return (
    <PageFilterBar
      title={t("warehouse.waves.title")}
      subtitle={t("warehouse.waves.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("warehouse.waves.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("warehouse.waves.create")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("warehouse.waves.filtersTitle")}
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
            <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
            <SearchableDropdown
              options={[
                { value: "OPEN", label: t("warehouse.waves.statuses.OPEN") },
                { value: "IN_PROGRESS", label: t("warehouse.waves.statuses.IN_PROGRESS") },
                { value: "COMPLETED", label: t("warehouse.waves.statuses.COMPLETED") },
                { value: "CANCELLED", label: t("warehouse.waves.statuses.CANCELLED") },
              ]}
              value={status}
              onChange={onStatusChange}
              placeholder={t("common.allStatuses")}
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
