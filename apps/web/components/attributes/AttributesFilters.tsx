"use client";

import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchInput from "@/components/ui/SearchInput";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";
import { useLang } from "@/context/LangContext";

type AttributesFiltersProps = {
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

export default function AttributesFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  canCreate,
  onCreate,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: AttributesFiltersProps) {
  const { t } = useLang();

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text">{t("attributes.title")}</h1>
          <p className="text-sm text-muted">{t("attributes.title")}</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            placeholder="Ozellik ara..."
            containerClassName="w-full lg:w-80"
          />
          <Button
            label={showAdvancedFilters ? t("common.hideFilter") : t("common.filter")}
            onClick={onToggleAdvancedFilters}
            variant="secondary"
            className="w-full px-3 py-2 lg:w-auto"
          />
          {canCreate && (
            <Button
              label={t("attributes.new")}
              onClick={onCreate}
              variant="primarySoft"
              className="w-full px-3 py-2 lg:w-auto"
            />
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => onStatusFilterChange(parseIsActiveFilter(value))}
              placeholder={t("common.allStatuses")}
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Ozellik durum filtresi"
              toggleAriaLabel="Ozellik durum listesini ac"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button
              label={t("common.clearFilters")}
              onClick={onClearFilters}
              variant="secondary"
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      )}
    </>
  );
}
