"use client";

import { useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

type ReturnsFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
};

export default function ReturnsFilters({
  searchTerm,
  onSearchTermChange,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: ReturnsFiltersProps) {
  const { t } = useLang();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <PageFilterBar
      title={t("salesReturns.title")}
      subtitle={t("salesReturns.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("salesReturns.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
          {showStoreFilter ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("salesReturns.storeLabel")}</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={onStoreIdChange}
                placeholder={t("sales.allStores")}
                inputAriaLabel={t("salesReturns.storeLabel")}
                toggleAriaLabel={t("salesReturns.storeLabel")}
                allowClear={false}
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("salesReturns.startDateLabel")}</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("salesReturns.endDateLabel")}</label>
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
