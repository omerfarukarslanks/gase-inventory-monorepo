"use client";

import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import SearchInput from "@/components/ui/SearchInput";

type StockFiltersProps = {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  storeFilterIds: string[];
  onStoreFilterChange: (ids: string[]) => void;
  storeOptions: { value: string; label: string }[];
  showStoreFilter?: boolean;
};

export default function StockFilters({
  searchTerm,
  onSearchChange,
  storeFilterIds,
  onStoreFilterChange,
  storeOptions,
  showStoreFilter = true,
}: StockFiltersProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-xl font-semibold text-text">Stok Yonetimi</h1>
        <p className="text-sm text-muted">
          Urun {">"} varyant {">"} magaza bazinda stok ozetini yonetin
        </p>
      </div>
      <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
        <SearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Urun / varyant / magaza ara..."
          containerClassName="w-full lg:w-72"
        />
        {showStoreFilter && (
          <div className="w-full lg:w-72">
            <SearchableMultiSelectDropdown
              options={storeOptions}
              values={storeFilterIds}
              onChange={onStoreFilterChange}
              placeholder="Tum Magazalar"
            />
          </div>
        )}
      </div>
    </div>
  );
}
