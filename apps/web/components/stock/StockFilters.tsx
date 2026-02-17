"use client";

import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import { SearchIcon } from "@/components/ui/icons/TableIcons";

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
        <div className="relative w-full lg:w-72">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <SearchIcon />
          </div>
          <input
            type="text"
            placeholder="Urun / varyant / magaza ara..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
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
