"use client";

import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchInput from "@/components/ui/SearchInput";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";

type UsersFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  canCreate: boolean;
  onCreate: () => void;
  storeFilter: string;
  onStoreFilterChange: (value: string) => void;
  storeFilterOptions: Array<{ value: string; label: string }>;
  statusFilter: boolean | "all";
  onStatusFilterChange: (value: boolean | "all") => void;
  onClearFilters: () => void;
};

export default function UsersFilters({
  searchTerm,
  onSearchTermChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  canCreate,
  onCreate,
  storeFilter,
  onStoreFilterChange,
  storeFilterOptions,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: UsersFiltersProps) {
  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Kullanıcılar</h1>
          <p className="text-sm text-muted">Sisteme kayıtlı kullanıcıları yönetin.</p>
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            placeholder="Ara..."
            containerClassName="w-full lg:w-64"
          />
          <Button
            label={showAdvancedFilters ? "Detaylı Filtreyi Gizle" : "Detaylı Filtre"}
            onClick={onToggleAdvancedFilters}
            variant="secondary"
            className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
          />
          {canCreate && (
            <Button
              label="Yeni Kullanıcı"
              onClick={onCreate}
              variant="primarySoft"
              className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
            />
          )}
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Mağaza</label>
            <SearchableDropdown
              options={storeFilterOptions}
              value={storeFilter}
              onChange={onStoreFilterChange}
              placeholder="Tüm Mağazalar"
              emptyOptionLabel="Tüm Mağazalar"
              inputAriaLabel="Mağaza filtresi"
              clearAriaLabel="Mağaza filtresini temizle"
              toggleAriaLabel="Mağaza listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={STATUS_FILTER_OPTIONS}
              value={statusFilter === "all" ? "all" : String(statusFilter)}
              onChange={(value) => onStatusFilterChange(parseIsActiveFilter(value))}
              placeholder="Tüm Durumlar"
              showEmptyOption={false}
              allowClear={false}
              inputAriaLabel="Kullanıcı durum filtresi"
              toggleAriaLabel="Kullanıcı durum listesini aç"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Button
              label="Filtreleri Temizle"
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
