"use client";

import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
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
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: string;
  onSortOrderChange: (value: string) => void;
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
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  onClearFilters,
}: UsersFiltersProps) {
  const { t } = useLang();
  const sortFieldOptions = [
    { value: "name", label: "Ad Soyad" },
    { value: "email", label: "E-Posta" },
    { value: "role", label: "Rol" },
  ];
  const sortOrderOptions = [
    { value: "ASC", label: "Artan" },
    { value: "DESC", label: "Azalan" },
  ];

  return (
    <PageFilterBar
      title="Kullanıcılar"
      subtitle="Sisteme kayıtlı kullanıcıları yönetin."
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder="Ara..."
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={onToggleAdvancedFilters}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilter")}
      canCreate={canCreate}
      createLabel="Yeni Kullanıcı"
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("common.filter")}
      advancedFilters={(
        <>
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
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Sıralama Alanı</label>
            <SearchableDropdown
              options={sortFieldOptions}
              value={sortBy}
              onChange={onSortByChange}
              placeholder="Varsayılan sıralama"
              emptyOptionLabel="Varsayılan sıralama"
              inputAriaLabel="Sıralama alanı"
              clearAriaLabel="Sıralama alanını temizle"
              toggleAriaLabel="Sıralama alanı listesini aç"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">Sıralama Yönü</label>
            <SearchableDropdown
              options={sortOrderOptions}
              value={sortOrder}
              onChange={onSortOrderChange}
              placeholder="Sıralama yönü"
              emptyOptionLabel="Sıralama yönü"
              inputAriaLabel="Sıralama yönü"
              clearAriaLabel="Sıralama yönünü temizle"
              toggleAriaLabel="Sıralama yönü listesini aç"
              disabled={!sortBy}
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
