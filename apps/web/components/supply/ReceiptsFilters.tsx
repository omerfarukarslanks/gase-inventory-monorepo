"use client";

import { useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

type ReceiptsFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  warehouseId: string;
  onWarehouseIdChange: (value: string) => void;
  warehouseOptions: Array<{ value: string; label: string }>;
  warehouseDisabled?: boolean;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
};

export default function ReceiptsFilters({
  searchTerm,
  onSearchTermChange,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  warehouseId,
  onWarehouseIdChange,
  warehouseOptions,
  warehouseDisabled = false,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: ReceiptsFiltersProps) {
  const { t } = useLang();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <PageFilterBar
      title={t("supply.receipts.title")}
      subtitle={t("supply.receipts.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("supply.receipts.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          {showStoreFilter ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.receipts.storeLabel")}</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={onStoreIdChange}
                placeholder={t("supply.common.storePlaceholder")}
                inputAriaLabel={t("supply.receipts.storeLabel")}
                toggleAriaLabel={t("supply.receipts.storeLabel")}
                allowClear={false}
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.receipts.warehouseLabel")}</label>
              <SearchableDropdown
                options={warehouseOptions}
                value={warehouseId}
                onChange={onWarehouseIdChange}
                placeholder={t("supply.receipts.warehousePlaceholder")}
                emptyOptionLabel={t("supply.receipts.warehousePlaceholder")}
                inputAriaLabel={t("supply.receipts.warehouseLabel")}
                toggleAriaLabel={t("supply.receipts.warehouseLabel")}
                disabled={warehouseDisabled}
              />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.startDate")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.endDate")}</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </>
      )}
    />
  );
}
