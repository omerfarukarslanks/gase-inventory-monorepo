import { useAuth } from "@/src/context/AuthContext";

export type ReportPermissions = {
  canReadSales: boolean;
  canReadStock: boolean;
  canReadFinancial: boolean;
  canReadInventory: boolean;
  canReadEmployee: boolean;
  canReadCustomers: boolean;
  hasQuickInsights: boolean;
  hasAnyReports: boolean;
};

export function useReportPermissions(): ReportPermissions {
  const { permissions } = useAuth();

  const canReadSales = permissions.includes("REPORT_SALES_READ");
  const canReadStock =
    permissions.includes("REPORT_STOCK_READ") || permissions.includes("REPORT_INVENTORY_READ");
  const canReadFinancial = permissions.includes("REPORT_FINANCIAL_READ");
  const canReadInventory = permissions.includes("REPORT_INVENTORY_READ");
  const canReadEmployee = permissions.includes("REPORT_EMPLOYEE_READ");
  const canReadCustomers = permissions.includes("REPORT_CUSTOMER_READ");
  const hasQuickInsights = canReadSales || canReadStock || canReadFinancial;
  const hasAnyReports = hasQuickInsights || canReadInventory || canReadEmployee || canReadCustomers;

  return {
    canReadSales,
    canReadStock,
    canReadFinancial,
    canReadInventory,
    canReadEmployee,
    canReadCustomers,
    hasQuickInsights,
    hasAnyReports,
  };
}
