"use client";

import { useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

type SuggestionsFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  supplierId: string;
  onSupplierIdChange: (value: string) => void;
  supplierOptions: Array<{ value: string; label: string }>;
};

export default function SuggestionsFilters({
  searchTerm,
  onSearchTermChange,
  status,
  onStatusChange,
  supplierId,
  onSupplierIdChange,
  supplierOptions,
}: SuggestionsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <PageFilterBar
      title="Ikmal Onerileri"
      subtitle="Aktif magaza icin otomatik replenishment onerileri"
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder="Urun, varyant veya tedarikci ara..."
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel="Filtrele"
      hideFilterLabel="Filtreyi Gizle"
      advancedFilters={
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={[
                { value: "PENDING", label: "Bekliyor" },
                { value: "ACCEPTED", label: "Kabul Edildi" },
                { value: "DISMISSED", label: "Reddedildi" },
              ]}
              value={status}
              onChange={onStatusChange}
              placeholder="Tum Durumlar"
              emptyOptionLabel="Tum Durumlar"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Tedarikci</label>
            <SearchableDropdown
              options={supplierOptions}
              value={supplierId}
              onChange={onSupplierIdChange}
              placeholder="Tum Tedarikciler"
              emptyOptionLabel="Tum Tedarikciler"
            />
          </div>
        </>
      }
    />
  );
}
