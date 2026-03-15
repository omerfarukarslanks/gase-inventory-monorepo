import { getSessionUserStoreType, type PermissionName } from "@gase/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import type {
  CustomersRequest,
  RequestEnvelope,
  SalesDraftSeed,
  SalesRequest,
  StockFocusSeed,
  StockRequest,
  TabKey,
  TasksRequest,
} from "@/src/lib/workflows";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type ShellTab = {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  permission?: PermissionName;
  anyPermission?: PermissionName[];
  badge?: number;
};

export type ShellScreenKey =
  | TabKey
  | "products"
  | "customers"
  | "suppliers"
  | "stores"
  | "product-packages"
  | "product-categories"
  | "attributes"
  | "users"
  | "permissions"
  | "reports";

const SECONDARY_SCREENS: ShellScreenKey[] = [
  "products",
  "customers",
  "suppliers",
  "stores",
  "product-packages",
  "product-categories",
  "attributes",
  "users",
  "permissions",
  "reports",
];

const TASK_PERMISSIONS: PermissionName[] = [
  "WAREHOUSE_READ",
  "COUNT_SESSION_READ",
  "APPROVAL_READ",
  "REPLENISHMENT_READ",
  "PO_READ",
];

const PRIMARY_TABS: ShellTab[] = [
  { key: "dashboard", label: "Ana Sayfa", icon: "view-dashboard-outline" },
  { key: "sales", label: "Satis", icon: "receipt-text-outline", permission: "SALE_READ" },
  { key: "stock", label: "Stok", icon: "warehouse", permission: "STOCK_LIST_READ" },
  { key: "tasks", label: "Gorevler", icon: "clipboard-check-outline", anyPermission: TASK_PERMISSIONS },
  { key: "more", label: "Diger", icon: "dots-horizontal" },
];

export function useShellNavigation() {
  const { can, permissions, status, user } = useAuth();

  const canViewStores = permissions.includes("STORE_VIEW") || permissions.includes("STORE_READ");
  const canViewPackages = getSessionUserStoreType(user) === "WHOLESALE" && can("PRODUCT_PACKAGE_READ");
  const canViewCategories = can("PRODUCT_CATEGORY_READ");
  const canViewAttributes = can("PRODUCT_ATTRIBUTE_READ");
  const canViewUsers = can("USER_READ");
  const canViewPermissions = can("PERMISSION_MANAGE");
  const canViewReports = permissions.some((permission) => permission.startsWith("REPORT_"));
  const canViewProducts = can("PRODUCT_READ");
  const canViewCustomers = can("CUSTOMER_READ");
  const canViewSuppliers = can("SUPPLIER_READ");
  const canViewTasks = TASK_PERMISSIONS.some((p) => permissions.includes(p));
  const canViewWarehouse = can("WAREHOUSE_READ") || can("COUNT_SESSION_READ");
  const canViewSupply = can("REPLENISHMENT_READ") || can("PO_READ");

  const [tab, setTab] = useState<ShellScreenKey>("dashboard");
  const [mountedTabs, setMountedTabs] = useState<ShellScreenKey[]>(["dashboard"]);
  const requestCounter = useRef(0);
  const previousPrimaryTab = useRef<TabKey>("dashboard");
  const [salesRequest, setSalesRequest] = useState<RequestEnvelope<SalesRequest> | null>(null);
  const [stockRequest, setStockRequest] = useState<RequestEnvelope<StockRequest> | null>(null);
  const [customersRequest, setCustomersRequest] = useState<RequestEnvelope<CustomersRequest> | null>(null);
  const [tasksRequest, setTasksRequest] = useState<RequestEnvelope<TasksRequest> | null>(null);

  const visibleTabs = useMemo(
    () =>
      PRIMARY_TABS.filter((item) => {
        if (item.anyPermission) return item.anyPermission.some((p) => permissions.includes(p));
        if (item.permission) return permissions.includes(item.permission);
        return true;
      }),
    [permissions],
  );

  // Permission guard: reset tab if user loses access
  useEffect(() => {
    if (status !== "authenticated") {
      setTab("dashboard");
      setMountedTabs(["dashboard"]);
      previousPrimaryTab.current = "dashboard";
      return;
    }

    if (!SECONDARY_SCREENS.includes(tab as typeof SECONDARY_SCREENS[number]) && !visibleTabs.some((item) => item.key === tab)) {
      setTab(visibleTabs[0]?.key ?? "dashboard");
    }
    if (tab === "products" && !canViewProducts) setTab(previousPrimaryTab.current);
    if (tab === "customers" && !canViewCustomers) setTab(previousPrimaryTab.current);
    if (tab === "suppliers" && !canViewSuppliers) setTab(previousPrimaryTab.current);
    if (tab === "stores" && !canViewStores) setTab(previousPrimaryTab.current);
    if (tab === "product-packages" && !canViewPackages) setTab(previousPrimaryTab.current);
    if (tab === "product-categories" && !canViewCategories) setTab(previousPrimaryTab.current);
    if (tab === "attributes" && !canViewAttributes) setTab(previousPrimaryTab.current);
    if (tab === "users" && !canViewUsers) setTab(previousPrimaryTab.current);
    if (tab === "permissions" && !canViewPermissions) setTab(previousPrimaryTab.current);
    if (tab === "reports" && !canViewReports) setTab(previousPrimaryTab.current);
  }, [can, canViewAttributes, canViewCategories, canViewCustomers, canViewPackages, canViewPermissions, canViewProducts, canViewReports, canViewStores, canViewSuppliers, canViewUsers, status, tab, visibleTabs]);

  // Lazy mount: add tab to mounted list on first visit
  useEffect(() => {
    if (!mountedTabs.includes(tab)) {
      setMountedTabs((current) => [...current, tab]);
    }
  }, [mountedTabs, tab]);

  // Track the last visited primary tab for secondary screen back navigation
  useEffect(() => {
    if (visibleTabs.some((item) => item.key === tab)) {
      previousPrimaryTab.current = tab as TabKey;
    }
  }, [tab, visibleTabs]);

  const makeRequest = <T,>(payload: T): RequestEnvelope<T> => {
    requestCounter.current += 1;
    return { id: requestCounter.current, payload };
  };

  const openSalesComposer = (seed?: SalesDraftSeed) => {
    setTab("sales");
    setSalesRequest(makeRequest({ kind: "compose", seed }));
  };

  const openSaleDetail = (saleId: string) => {
    setTab("sales");
    setSalesRequest(makeRequest({ kind: "detail", saleId }));
  };

  const openStockFocus = (seed: StockFocusSeed) => {
    setTab("stock");
    setStockRequest(makeRequest({ kind: "focus", seed }));
  };

  const openCustomerComposer = () => {
    setTab("customers");
    setCustomersRequest(makeRequest({ kind: "compose" }));
  };

  const goBack = () => {
    setTab(previousPrimaryTab.current);
  };

  return {
    tab,
    setTab,
    mountedTabs,
    salesRequest,
    stockRequest,
    customersRequest,
    tasksRequest,
    visibleTabs,
    previousPrimaryTab,
    can,
    canViewStores,
    canViewPackages,
    canViewCategories,
    canViewAttributes,
    canViewUsers,
    canViewPermissions,
    canViewReports,
    canViewProducts,
    canViewCustomers,
    canViewSuppliers,
    canViewTasks,
    canViewWarehouse,
    canViewSupply,
    openSalesComposer,
    openSaleDetail,
    openStockFocus,
    openCustomerComposer,
    goBack,
  };
}
