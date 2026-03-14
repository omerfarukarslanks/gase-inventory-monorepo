"use client";

import { useMemo, useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import { getMovementTypeOptions } from "@/components/stock/movement-types";

type StockMovementsFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  warehouseId: string;
  onWarehouseIdChange: (value: string) => void;
  warehouseOptions: Array<{ value: string; label: string }>;
  type: string;
  onTypeChange: (value: string) => void;
  warehouseDisabled?: boolean;
};

export default function StockMovementsFilters({
  searchTerm,
  onSearchTermChange,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  warehouseId,
  onWarehouseIdChange,
  warehouseOptions,
  type,
  onTypeChange,
  warehouseDisabled = false,
}: StockMovementsFiltersProps) {
  const { t } = useLang();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const typeOptions = useMemo(() => getMovementTypeOptions(t), [t]);

  return (
    <PageFilterBar
      title={t("stockMovements.title")}
      subtitle={t("stockMovements.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("stockMovements.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          {showStoreFilter ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("stockMovements.storeLabel")}</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={onStoreIdChange}
                placeholder={t("stockMovements.storePlaceholder")}
                inputAriaLabel={t("stockMovements.storeLabel")}
                toggleAriaLabel={t("stockMovements.storeLabel")}
                showEmptyOption={false}
                allowClear={false}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("stockMovements.warehouseLabel")}</label>
            <SearchableDropdown
              options={warehouseOptions}
              value={warehouseId}
              onChange={onWarehouseIdChange}
              placeholder={t("stockMovements.warehousePlaceholder")}
              emptyOptionLabel={t("stockMovements.allWarehouses")}
              inputAriaLabel={t("stockMovements.warehouseLabel")}
              toggleAriaLabel={t("stockMovements.warehouseLabel")}
              disabled={warehouseDisabled}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("stockMovements.typeLabel")}</label>
            <SearchableDropdown
              options={typeOptions}
              value={type}
              onChange={onTypeChange}
              placeholder={t("stockMovements.typePlaceholder")}
              emptyOptionLabel={t("stockMovements.typePlaceholder")}
              inputAriaLabel={t("stockMovements.typeLabel")}
              toggleAriaLabel={t("stockMovements.typeLabel")}
              showEmptyOption={false}
            />
          </div>
        </>
      )}
    />
  );
}
