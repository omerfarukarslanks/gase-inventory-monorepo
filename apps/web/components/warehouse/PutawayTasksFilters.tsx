"use client";

import Button from "@/components/ui/Button";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

type PutawayTasksFiltersProps = {
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

export default function PutawayTasksFilters({
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
}: PutawayTasksFiltersProps) {
  const { t } = useLang();

  return (
    <PageFilterBar
      title={t("warehouse.putawayTasks.title")}
      subtitle={t("warehouse.putawayTasks.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("warehouse.putawayTasks.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel={t("warehouse.putawayTasks.create")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("warehouse.putawayTasks.filtersTitle")}
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
                { value: "PENDING", label: t("warehouse.putawayTasks.statuses.PENDING") },
                { value: "IN_PROGRESS", label: t("warehouse.putawayTasks.statuses.IN_PROGRESS") },
                { value: "COMPLETED", label: t("warehouse.putawayTasks.statuses.COMPLETED") },
                { value: "CANCELLED", label: t("warehouse.putawayTasks.statuses.CANCELLED") },
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
