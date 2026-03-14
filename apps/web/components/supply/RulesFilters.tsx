"use client";

import { useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";

type RulesFiltersProps = {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  supplierId: string;
  onSupplierIdChange: (value: string) => void;
  supplierOptions: Array<{ value: string; label: string }>;
  statusFilter: "active" | "inactive";
  onStatusFilterChange: (value: "active" | "inactive") => void;
  showStoreFilter: boolean;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  canCreate: boolean;
  onCreate: () => void;
};

export default function RulesFilters({
  searchTerm,
  onSearchTermChange,
  supplierId,
  onSupplierIdChange,
  supplierOptions,
  statusFilter,
  onStatusFilterChange,
  showStoreFilter,
  storeId,
  onStoreIdChange,
  storeOptions,
  canCreate,
  onCreate,
}: RulesFiltersProps) {
  const { t } = useLang();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  return (
    <PageFilterBar
      title={t("supply.rules.title")}
      subtitle={t("supply.rules.subtitle")}
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder={t("supply.rules.searchPlaceholder")}
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
      filterLabel={t("common.filter")}
      hideFilterLabel={t("common.hideFilters")}
      canCreate={canCreate}
      createLabel={t("supply.rules.create")}
      onCreate={onCreate}
      mobileAdvancedFiltersTitle={t("supply.rules.filtersTitle")}
      advancedFilters={(
        <>
          {showStoreFilter ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted">{t("common.storeFilter")}</label>
              <SearchableDropdown
                options={storeOptions}
                value={storeId}
                onChange={onStoreIdChange}
                placeholder={t("supply.common.storePlaceholder")}
                showEmptyOption={false}
                allowClear={false}
              />
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.supplierLabel")}</label>
            <SearchableDropdown
              options={supplierOptions}
              value={supplierId}
              onChange={onSupplierIdChange}
              placeholder={t("supply.common.allSuppliers")}
              emptyOptionLabel={t("supply.common.allSuppliers")}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">{t("supply.rules.statusLabel")}</label>
            <SearchableDropdown
              options={[
                { value: "active", label: t("supply.common.active") },
                { value: "inactive", label: t("supply.common.inactive") },
              ]}
              value={statusFilter}
              onChange={(value) => onStatusFilterChange(value === "inactive" ? "inactive" : "active")}
              placeholder={t("supply.common.active")}
              showEmptyOption={false}
              allowClear={false}
            />
          </div>
        </>
      )}
    />
  );
}
