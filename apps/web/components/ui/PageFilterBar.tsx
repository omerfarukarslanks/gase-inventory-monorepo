"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import Button from "./Button";
import SearchInput from "./SearchInput";

type PageFilterBarProps = {
  /** Page title text */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Search input value */
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Show/hide advanced filters toggle */
  showAdvancedFilters?: boolean;
  onToggleAdvancedFilters?: () => void;
  filterLabel?: string;
  hideFilterLabel?: string;
  /** Create button — only rendered when canCreate is true */
  canCreate?: boolean;
  createLabel?: string;
  onCreate?: () => void;
  /** Extra action buttons rendered alongside the search + filter buttons */
  extraActions?: ReactNode;
  /** Advanced filter panel content (rendered when showAdvancedFilters is true) */
  advancedFilters?: ReactNode;
  className?: string;
};

/**
 * Standardized page-level filter bar used across all domain listing pages.
 *
 * Layout:
 * - Left: title + optional subtitle
 * - Right: search input + filter toggle + optional create button + extra actions
 * - Below (collapsible): advanced filter fields
 */
export default function PageFilterBar({
  title,
  subtitle,
  searchTerm,
  onSearchTermChange,
  searchPlaceholder = "Ara...",
  showAdvancedFilters,
  onToggleAdvancedFilters,
  filterLabel = "Filtrele",
  hideFilterLabel = "Filtreyi gizle",
  canCreate,
  createLabel = "Yeni",
  onCreate,
  extraActions,
  advancedFilters,
  className,
}: PageFilterBarProps) {
  return (
    <>
      <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
        <div>
          <h1 className="text-xl font-semibold text-text">{title}</h1>
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>
        <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            placeholder={searchPlaceholder}
            containerClassName="w-full lg:w-64"
          />
          {onToggleAdvancedFilters ? (
            <Button
              label={showAdvancedFilters ? hideFilterLabel : filterLabel}
              onClick={onToggleAdvancedFilters}
              variant="secondary"
              className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
            />
          ) : null}
          {canCreate && onCreate ? (
            <Button
              label={createLabel}
              onClick={onCreate}
              variant="primarySoft"
              className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
            />
          ) : null}
          {extraActions}
        </div>
      </div>

      {showAdvancedFilters && advancedFilters ? (
        <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
          {advancedFilters}
        </div>
      ) : null}
    </>
  );
}
