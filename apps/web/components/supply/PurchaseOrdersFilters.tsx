"use client";

import { useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";

type PurchaseOrdersFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  supplierId: string;
  onSupplierIdChange: (value: string) => void;
  supplierOptions: Array<{ value: string; label: string }>;
  canCreate: boolean;
  onCreate: () => void;
};

export default function PurchaseOrdersFilters({
  searchTerm,
  onSearchTermChange,
  status,
  onStatusChange,
  supplierId,
  onSupplierIdChange,
  supplierOptions,
  canCreate,
  onCreate,
}: PurchaseOrdersFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <PageFilterBar
      title="Satin Alma Siparisleri"
      subtitle="Taslak, onay ve mal kabul surecini tek yuzeyden yonetin"
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder="Tedarikci, varyant veya siparis ara..."
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel="Filtrele"
      hideFilterLabel="Filtreyi Gizle"
      canCreate={canCreate}
      createLabel="Yeni PO"
      onCreate={onCreate}
      advancedFilters={
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={[
                { value: "DRAFT", label: "Taslak" },
                { value: "APPROVED", label: "Onaylandi" },
                { value: "PARTIALLY_RECEIVED", label: "Kismi Kabul" },
                { value: "RECEIVED", label: "Kabul Edildi" },
                { value: "CANCELLED", label: "Iptal" },
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
