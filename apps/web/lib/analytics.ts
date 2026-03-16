"use client";

import type { PermissionName } from "@/lib/authz";

export type ReportFilterState = {
  startDate?: string;
  endDate?: string;
  storeIds?: string[];
  search?: string;
  [key: string]: unknown;
};

export type ReportScopeState = {
  route: string;
  storeIds?: string[];
  activeStoreId?: string | null;
};

export type ReportPageConfig = {
  reportType: string;
  title: string;
  description?: string;
  path: string;
};

export type ReportSummaryItem = {
  label: string;
  value: string | number;
  hint?: string;
};

export type AiReportContext = ReportPageConfig & {
  filters?: ReportFilterState;
  scope?: ReportScopeState;
  summary?: ReportSummaryItem[];
  rowCount?: number;
  promptPresets?: string[];
};

type ReportDirectoryAccessRule = {
  permission?: PermissionName;
  anyPermission?: PermissionName[];
};

export type ReportDirectoryItem = ReportDirectoryAccessRule & {
  id: string;
  href: string;
  titleKey: string;
  descriptionKey: string;
};

export type ReportDirectorySection = ReportDirectoryAccessRule & {
  id: string;
  href: string;
  labelKey: string;
  titleKey: string;
  descriptionKey: string;
  matchesRoute?: string[];
  items: ReportDirectoryItem[];
};

export const REPORT_DIRECTORY: ReportDirectorySection[] = [
  {
    id: "sales",
    href: "/reports/sales",
    labelKey: "nav.salesReports",
    titleKey: "reportsDirectory.categories.sales.title",
    descriptionKey: "reportsDirectory.categories.sales.description",
    anyPermission: ["REPORT_SALES_READ", "REPORT_FINANCIAL_READ"],
    matchesRoute: [
      "/reports/sales-summary",
      "/reports/cancellations",
      "/reports/product-performance",
      "/reports/revenue-trend",
      "/reports/discount-summary",
    ],
    items: [
      {
        id: "salesSummary",
        href: "/reports/sales-summary",
        titleKey: "reportsDirectory.items.salesSummary.title",
        descriptionKey: "reportsDirectory.items.salesSummary.description",
        permission: "REPORT_SALES_READ",
      },
      {
        id: "cancellations",
        href: "/reports/cancellations",
        titleKey: "reportsDirectory.items.cancellations.title",
        descriptionKey: "reportsDirectory.items.cancellations.description",
        permission: "REPORT_SALES_READ",
      },
      {
        id: "productPerformance",
        href: "/reports/product-performance",
        titleKey: "reportsDirectory.items.productPerformance.title",
        descriptionKey: "reportsDirectory.items.productPerformance.description",
        permission: "REPORT_SALES_READ",
      },
      {
        id: "revenueTrend",
        href: "/reports/revenue-trend",
        titleKey: "reportsDirectory.items.revenueTrend.title",
        descriptionKey: "reportsDirectory.items.revenueTrend.description",
        permission: "REPORT_FINANCIAL_READ",
      },
      {
        id: "discountSummary",
        href: "/reports/discount-summary",
        titleKey: "reportsDirectory.items.discountSummary.title",
        descriptionKey: "reportsDirectory.items.discountSummary.description",
        permission: "REPORT_FINANCIAL_READ",
      },
    ],
  },
  {
    id: "inventory",
    href: "/reports/inventory",
    labelKey: "nav.inventoryReports",
    titleKey: "reportsDirectory.categories.inventory.title",
    descriptionKey: "reportsDirectory.categories.inventory.description",
    anyPermission: ["REPORT_STOCK_READ", "REPORT_INVENTORY_READ"],
    matchesRoute: [
      "/reports/stock-summary",
      "/reports/low-stock",
      "/reports/dead-stock",
      "/reports/inventory-movements",
      "/reports/turnover",
    ],
    items: [
      {
        id: "stockSummary",
        href: "/reports/stock-summary",
        titleKey: "reportsDirectory.items.stockSummary.title",
        descriptionKey: "reportsDirectory.items.stockSummary.description",
        permission: "REPORT_STOCK_READ",
      },
      {
        id: "lowStock",
        href: "/reports/low-stock",
        titleKey: "reportsDirectory.items.lowStock.title",
        descriptionKey: "reportsDirectory.items.lowStock.description",
        permission: "REPORT_STOCK_READ",
      },
      {
        id: "deadStock",
        href: "/reports/dead-stock",
        titleKey: "reportsDirectory.items.deadStock.title",
        descriptionKey: "reportsDirectory.items.deadStock.description",
        permission: "REPORT_STOCK_READ",
      },
      {
        id: "inventoryMovements",
        href: "/reports/inventory-movements",
        titleKey: "reportsDirectory.items.inventoryMovements.title",
        descriptionKey: "reportsDirectory.items.inventoryMovements.description",
        permission: "REPORT_INVENTORY_READ",
      },
      {
        id: "turnover",
        href: "/reports/turnover",
        titleKey: "reportsDirectory.items.turnover.title",
        descriptionKey: "reportsDirectory.items.turnover.description",
        permission: "REPORT_INVENTORY_READ",
      },
    ],
  },
  {
    id: "procurement",
    href: "/reports/procurement",
    labelKey: "nav.procurementReports",
    titleKey: "reportsDirectory.categories.procurement.title",
    descriptionKey: "reportsDirectory.categories.procurement.description",
    permission: "REPORT_SALES_READ",
    matchesRoute: ["/reports/supplier-performance"],
    items: [
      {
        id: "supplierPerformance",
        href: "/reports/supplier-performance",
        titleKey: "reportsDirectory.items.supplierPerformance.title",
        descriptionKey: "reportsDirectory.items.supplierPerformance.description",
        permission: "REPORT_SALES_READ",
      },
    ],
  },
  {
    id: "finance",
    href: "/reports/finance",
    labelKey: "nav.financeReports",
    titleKey: "reportsDirectory.categories.finance.title",
    descriptionKey: "reportsDirectory.categories.finance.description",
    permission: "REPORT_FINANCIAL_READ",
    matchesRoute: ["/reports/profit-margin", "/reports/vat-summary"],
    items: [
      {
        id: "profitMargin",
        href: "/reports/profit-margin",
        titleKey: "reportsDirectory.items.profitMargin.title",
        descriptionKey: "reportsDirectory.items.profitMargin.description",
        permission: "REPORT_FINANCIAL_READ",
      },
      {
        id: "vatSummary",
        href: "/reports/vat-summary",
        titleKey: "reportsDirectory.items.vatSummary.title",
        descriptionKey: "reportsDirectory.items.vatSummary.description",
        permission: "REPORT_FINANCIAL_READ",
      },
    ],
  },
  {
    id: "performance",
    href: "/reports/performance",
    labelKey: "nav.performanceReports",
    titleKey: "reportsDirectory.categories.performance.title",
    descriptionKey: "reportsDirectory.categories.performance.description",
    anyPermission: ["REPORT_SALES_READ", "REPORT_EMPLOYEE_READ", "REPORT_CUSTOMER_READ"],
    matchesRoute: ["/reports/store-performance", "/reports/employee-performance", "/reports/customers"],
    items: [
      {
        id: "storePerformance",
        href: "/reports/store-performance",
        titleKey: "reportsDirectory.items.storePerformance.title",
        descriptionKey: "reportsDirectory.items.storePerformance.description",
        permission: "REPORT_SALES_READ",
      },
      {
        id: "employeePerformance",
        href: "/reports/employee-performance",
        titleKey: "reportsDirectory.items.employeePerformance.title",
        descriptionKey: "reportsDirectory.items.employeePerformance.description",
        permission: "REPORT_EMPLOYEE_READ",
      },
      {
        id: "customers",
        href: "/reports/customers",
        titleKey: "reportsDirectory.items.customers.title",
        descriptionKey: "reportsDirectory.items.customers.description",
        permission: "REPORT_CUSTOMER_READ",
      },
    ],
  },
];

function canAccessReportDirectoryRule(
  rule: ReportDirectoryAccessRule,
  permissions: string[],
): boolean {
  if (rule.permission && !permissions.includes(rule.permission)) return false;
  if (rule.anyPermission && !rule.anyPermission.some((permission) => permissions.includes(permission))) return false;
  return true;
}

export function getVisibleReportDirectorySections(permissions: string[]): ReportDirectorySection[] {
  return REPORT_DIRECTORY
    .map((section) => {
      const items = section.items.filter((item) => canAccessReportDirectoryRule(item, permissions));
      return { ...section, items };
    })
    .filter((section) => section.items.length > 0 && canAccessReportDirectoryRule(section, permissions));
}

export function getVisibleReportDirectorySection(
  sectionId: string,
  permissions: string[],
): ReportDirectorySection | null {
  return getVisibleReportDirectorySections(permissions).find((section) => section.id === sectionId) ?? null;
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const serialized = String(value).replaceAll('"', '""');
  return /[",\n]/.test(serialized) ? `"${serialized}"` : serialized;
}

export function exportRowsToCsv(filename: string, rows: Array<Record<string, unknown>>) {
  if (typeof window === "undefined" || rows.length === 0) return;

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const csvLines = [
    columns.map((column) => escapeCsvCell(column)).join(","),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(row[column])).join(",")),
  ];

  const blob = new Blob(["\uFEFF" + csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// getDateRange is now canonical in @gase/core.
export { getDateRange } from "@gase/core";

export const reportInputClassName =
  "h-10 rounded-xl border border-border bg-surface2 px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary";
