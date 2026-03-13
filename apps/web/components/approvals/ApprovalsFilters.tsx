"use client";

import { useMemo, useState } from "react";
import PageFilterBar from "@/components/ui/PageFilterBar";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { getApprovalEntityTypeLabel, getApprovalLevelLabel, getApprovalStatusLabel } from "@/components/approvals/status";
import type { ApprovalEntityType, ApprovalLevel, ApprovalStatus } from "@/lib/approvals";

type ApprovalsFiltersProps = {
  scope: "pending" | "history";
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  entityType: ApprovalEntityType | "";
  onEntityTypeChange: (value: ApprovalEntityType | "") => void;
  level: ApprovalLevel | "";
  onLevelChange: (value: ApprovalLevel | "") => void;
  status: ApprovalStatus | "";
  onStatusChange: (value: ApprovalStatus | "") => void;
  storeId: string;
  onStoreIdChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  storeOptions: Array<{ value: string; label: string }>;
  statusOptions: ApprovalStatus[];
};

const filterInputClassName =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function ApprovalsFilters({
  scope,
  searchTerm,
  onSearchTermChange,
  entityType,
  onEntityTypeChange,
  level,
  onLevelChange,
  status,
  onStatusChange,
  storeId,
  onStoreIdChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  storeOptions,
  statusOptions,
}: ApprovalsFiltersProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const entityTypeOptions = useMemo(
    () => ([
      "STOCK_ADJUSTMENT",
      "PRICE_OVERRIDE",
      "PURCHASE_ORDER",
      "SALE_RETURN",
      "COUNT_ADJUSTMENT",
    ] satisfies ApprovalEntityType[]).map((value) => ({
      value,
      label: getApprovalEntityTypeLabel(value),
    })),
    [],
  );

  const levelOptions = useMemo(
    () => (["L1", "L2"] satisfies ApprovalLevel[]).map((value) => ({
      value,
      label: getApprovalLevelLabel(value),
    })),
    [],
  );

  const normalizedStatusOptions = useMemo(
    () => statusOptions.map((value) => ({ value, label: getApprovalStatusLabel(value) })),
    [statusOptions],
  );

  return (
    <PageFilterBar
      title={scope === "pending" ? "Bekleyen Onaylar" : "Gecmis Onaylar"}
      subtitle={
        scope === "pending"
          ? "Bekleyen L1 ve L2 onay taleplerini tek inbox'tan yonetin"
          : "Sonuclanmis onay taleplerini gecmis kayitlariyla birlikte inceleyin"
      }
      searchTerm={searchTerm}
      onSearchTermChange={onSearchTermChange}
      searchPlaceholder="Talep, kisi veya kayit ara..."
      showAdvancedFilters={showAdvancedFilters}
      onToggleAdvancedFilters={() => setShowAdvancedFilters((previous) => !previous)}
      filterLabel="Filtrele"
      hideFilterLabel="Filtreyi Gizle"
      advancedFilters={
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Talep Tipi</label>
            <SearchableDropdown
              options={entityTypeOptions}
              value={entityType}
              onChange={(value) => onEntityTypeChange((value || "") as ApprovalEntityType | "")}
              placeholder="Tum Tipler"
              emptyOptionLabel="Tum Tipler"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Beklenen Seviye</label>
            <SearchableDropdown
              options={levelOptions}
              value={level}
              onChange={(value) => onLevelChange((value || "") as ApprovalLevel | "")}
              placeholder="Tum Seviyeler"
              emptyOptionLabel="Tum Seviyeler"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Durum</label>
            <SearchableDropdown
              options={normalizedStatusOptions}
              value={status}
              onChange={(value) => onStatusChange((value || "") as ApprovalStatus | "")}
              placeholder="Tum Durumlar"
              emptyOptionLabel="Tum Durumlar"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Magaza</label>
            <SearchableDropdown
              options={storeOptions}
              value={storeId}
              onChange={onStoreIdChange}
              placeholder="Tum Magazalar"
              emptyOptionLabel="Tum Magazalar"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Baslangic Tarihi</label>
            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className={filterInputClassName}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted">Bitis Tarihi</label>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className={filterInputClassName}
            />
          </div>
        </>
      }
    />
  );
}
