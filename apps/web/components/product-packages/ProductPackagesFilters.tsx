"use client";

import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type ProductPackagesFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onCreate: () => void;
  statusFilter: boolean | "all";
  onStatusFilterChange: (value: boolean | "all") => void;
  onClearFilters: () => void;
};

export default function ProductPackagesFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onCreate,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: ProductPackagesFiltersProps) {
  return (
    <PageFilterBar
      title="Urun Paketleri"
      subtitle="Toptan satis paket tanimlari ve yonetimi"
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder="Ara..."
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel="Detayli Filtre"
      hideFilterLabel="Detayli Filtreyi Gizle"
      canCreate
      createLabel="Yeni Paket"
      onCreate={onCreate}
      mobileAdvancedFiltersTitle="Filtreler"
      advancedFilters={(
        <>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => onStatusFilterChange(parseIsActiveFilter(value))}
              placeholder="Tum Durumlar"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Paket durum filtresi"
              toggleAriaLabel="Paket durum listesini ac"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface2"
            >
              Filtreleri Temizle
            </button>
          </div>
        </>
      )}
    />
  );
}
