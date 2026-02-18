"use client";

import Button from "@/components/ui/Button";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { SALES_STATUS_OPTIONS } from "@/components/sales/types";

type SalesFiltersProps = {
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onNewSale: () => void;
  isStoreScopedUser: boolean;
  storeOptions: Array<{ value: string; label: string }>;
  salesStoreIds: string[];
  onSalesStoreIdsChange: (values: string[]) => void;
  receiptNoFilter: string;
  onReceiptNoFilterChange: (value: string) => void;
  nameFilter: string;
  onNameFilterChange: (value: string) => void;
  surnameFilter: string;
  onSurnameFilterChange: (value: string) => void;
  statusFilters: string[];
  onStatusFiltersChange: (values: string[]) => void;
  minUnitPriceFilter: string;
  onMinUnitPriceFilterChange: (value: string) => void;
  maxUnitPriceFilter: string;
  onMaxUnitPriceFilterChange: (value: string) => void;
  minLineTotalFilter: string;
  onMinLineTotalFilterChange: (value: string) => void;
  maxLineTotalFilter: string;
  onMaxLineTotalFilterChange: (value: string) => void;
  includeLines: boolean;
  onIncludeLinesChange: (checked: boolean) => void;
  onResetPage: () => void;
};

export default function SalesFilters({
  showAdvancedFilters,
  onToggleAdvancedFilters,
  onNewSale,
  isStoreScopedUser,
  storeOptions,
  salesStoreIds,
  onSalesStoreIdsChange,
  receiptNoFilter,
  onReceiptNoFilterChange,
  nameFilter,
  onNameFilterChange,
  surnameFilter,
  onSurnameFilterChange,
  statusFilters,
  onStatusFiltersChange,
  minUnitPriceFilter,
  onMinUnitPriceFilterChange,
  maxUnitPriceFilter,
  onMaxUnitPriceFilterChange,
  minLineTotalFilter,
  onMinLineTotalFilterChange,
  maxLineTotalFilter,
  onMaxLineTotalFilterChange,
  includeLines,
  onIncludeLinesChange,
  onResetPage,
}: SalesFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          label={showAdvancedFilters ? "Detayli Filtreyi Gizle" : "Detayli Filtre"}
          onClick={onToggleAdvancedFilters}
          variant="secondary"
          className="px-3 py-1.5"
        />
        <Button
          label="Yeni Satis"
          onClick={onNewSale}
          variant="primarySolid"
          className="px-3 py-1.5"
        />
      </div>

      {showAdvancedFilters && (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 xl:grid-cols-4">
          {!isStoreScopedUser && (
            <div className="xl:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-muted">Magaza Filtrele</label>
              <SearchableMultiSelectDropdown
                options={storeOptions}
                values={salesStoreIds}
                onChange={(values) => {
                  onSalesStoreIdsChange(values);
                  onResetPage();
                }}
                placeholder="Tum magazalar"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Receipt No</label>
            <input
              type="text"
              value={receiptNoFilter}
              onChange={(e) => {
                onReceiptNoFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Ad</label>
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => {
                onNameFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Soyad</label>
            <input
              type="text"
              value={surnameFilter}
              onChange={(e) => {
                onSurnameFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Durum</label>
            <SearchableMultiSelectDropdown
              options={SALES_STATUS_OPTIONS}
              values={statusFilters}
              onChange={(values) => {
                onStatusFiltersChange(values);
                onResetPage();
              }}
              placeholder="Durum secin"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Min Birim Fiyat</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={minUnitPriceFilter}
              onChange={(e) => {
                onMinUnitPriceFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Max Birim Fiyat</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={maxUnitPriceFilter}
              onChange={(e) => {
                onMaxUnitPriceFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Min Satir Toplami</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={minLineTotalFilter}
              onChange={(e) => {
                onMinLineTotalFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Max Satir Toplami</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={maxLineTotalFilter}
              onChange={(e) => {
                onMaxLineTotalFilterChange(e.target.value);
                onResetPage();
              }}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-end">
            <div className="flex w-full items-center justify-between rounded-xl border border-border bg-surface2/40 px-3 py-2">
              <span className="text-xs font-semibold text-muted">Satir Detayi Dahil Et</span>
              <ToggleSwitch
                checked={includeLines}
                onChange={(checked) => {
                  onIncludeLinesChange(checked);
                  onResetPage();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
