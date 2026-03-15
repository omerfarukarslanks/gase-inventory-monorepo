import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginScreen from "@/src/screens/LoginScreen";
import DashboardScreen from "@/src/screens/DashboardScreen";
import ProductsScreen from "@/src/screens/ProductsScreen";
import StockScreen from "@/src/screens/StockScreen";
import SalesScreen from "@/src/screens/SalesScreen";
import CustomersScreen from "@/src/screens/CustomersScreen";
import SuppliersScreen from "@/src/screens/SuppliersScreen";
import StoresScreen from "@/src/screens/StoresScreen";
import ProductPackagesScreen from "@/src/screens/ProductPackagesScreen";
import ProductCategoriesScreen from "@/src/screens/ProductCategoriesScreen";
import AttributesScreen from "@/src/screens/AttributesScreen";
import UsersScreen from "@/src/screens/UsersScreen";
import PermissionsScreen from "@/src/screens/PermissionsScreen";
import ReportsScreen from "@/src/screens/ReportsScreen";
import WarehouseScreen from "@/src/screens/WarehouseScreen";
import MoreScreen from "@/src/screens/MoreScreen";
import TasksScreen from "@/src/screens/TasksScreen";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";
import { useShellNavigation } from "./useShellNavigation";
import type { ShellScreenKey } from "./useShellNavigation";
import { TabBar } from "./TabBar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNotificationHandler } from "@/src/hooks/useNotificationHandler";

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: mobileTheme.colors.dark.bg },
  topSafe: {
    zIndex: 10,
    backgroundColor: mobileTheme.colors.dark.bg,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 16 },
  brandCopy: { flex: 1, gap: 2 },
  brandLabel: { color: mobileTheme.colors.brand.primary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  brandTitle: { color: mobileTheme.colors.dark.text, fontSize: 20, fontWeight: "700" },
  scopeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scopeLabel: { color: mobileTheme.colors.dark.text2, fontSize: 13 },
  content: { flex: 1, position: "relative" },
  screenPane: { ...StyleSheet.absoluteFillObject },
  screenPaneVisible: { display: "flex" },
  screenPaneHidden: { display: "none" },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: mobileTheme.colors.dark.bg },
  loadingText: { color: mobileTheme.colors.dark.text, fontSize: 14 },
});

// ─── Screen Registry ────────────────────────────────────────────────────────
// Each entry receives the full `nav` object and returns a JSX element.
// Adding a new screen only requires one line here — no switch editing needed.

type NavType = ReturnType<typeof useShellNavigation>;

type ScreenEntry = {
  render: (nav: NavType) => ReactElement | null;
};

const SCREEN_REGISTRY: Record<ShellScreenKey, ScreenEntry> = {
  dashboard: {
    render: (nav) => (
      <DashboardScreen
        isActive={nav.tab === "dashboard"}
        onOpenCustomers={nav.openCustomerComposer}
        onOpenProducts={() => nav.setTab("products")}
        onOpenSaleDetail={nav.openSaleDetail}
        onOpenSalesComposer={nav.openSalesComposer}
        onOpenStockFocus={nav.openStockFocus}
        onOpenPendingCollections={() => nav.setTab("sales")}
      />
    ),
  },
  sales: {
    render: (nav) => (
      <SalesScreen isActive={nav.tab === "sales"} request={nav.salesRequest} />
    ),
  },
  stock: {
    render: (nav) => (
      <StockScreen isActive={nav.tab === "stock"} request={nav.stockRequest} />
    ),
  },
  tasks: {
    render: (nav) => (
      <TasksScreen
        isActive={nav.tab === "tasks"}
        canViewWarehouse={nav.canViewWarehouse}
        canViewSupply={nav.canViewSupply}
        onNavigateToWarehouse={() => nav.setTab("warehouse")}
      />
    ),
  },
  more: {
    render: (nav) => (
      <MoreScreen
        isActive={nav.tab === "more"}
        canViewProducts={nav.canViewProducts}
        canViewCustomers={nav.canViewCustomers}
        canViewWarehouse={nav.canViewWarehouse}
        canViewSuppliers={nav.canViewSuppliers}
        canViewStores={nav.canViewStores}
        canViewPackages={nav.canViewPackages}
        canViewCategories={nav.canViewCategories}
        canViewAttributes={nav.canViewAttributes}
        canViewUsers={nav.canViewUsers}
        canViewPermissions={nav.canViewPermissions}
        canViewReports={nav.canViewReports}
        onNavigate={(screen: ShellScreenKey) => nav.setTab(screen)}
      />
    ),
  },
  products: {
    render: (nav) => (
      <ProductsScreen
        isActive={nav.tab === "products"}
        onOpenSalesDraft={nav.openSalesComposer}
        onOpenStockFocus={nav.openStockFocus}
        onBack={nav.goBack}
      />
    ),
  },
  customers: {
    render: (nav) => (
      <CustomersScreen
        isActive={nav.tab === "customers"}
        request={nav.customersRequest}
        onStartSale={nav.openSalesComposer}
        onBack={nav.goBack}
      />
    ),
  },
  suppliers: {
    render: (nav) => (
      <SuppliersScreen
        isActive={nav.tab === "suppliers"}
        canCreate={nav.can("SUPPLIER_CREATE")}
        canUpdate={nav.can("SUPPLIER_UPDATE")}
        onBack={nav.goBack}
      />
    ),
  },
  warehouse: {
    render: (nav) => (
      <WarehouseScreen isActive={nav.tab === "warehouse"} onBack={nav.goBack} />
    ),
  },
  stores: {
    render: (nav) => (
      <StoresScreen
        isActive={nav.tab === "stores"}
        canCreate={nav.can("STORE_CREATE")}
        canUpdate={nav.can("STORE_UPDATE")}
        onBack={nav.goBack}
      />
    ),
  },
  "product-packages": {
    render: (nav) => (
      <ProductPackagesScreen
        isActive={nav.tab === "product-packages"}
        canCreate={nav.can("PRODUCT_PACKAGE_CREATE")}
        canUpdate={nav.can("PRODUCT_PACKAGE_UPDATE")}
        onBack={nav.goBack}
      />
    ),
  },
  "product-categories": {
    render: (nav) => (
      <ProductCategoriesScreen
        isActive={nav.tab === "product-categories"}
        canCreate={nav.can("PRODUCT_CATEGORY_CREATE")}
        canUpdate={nav.can("PRODUCT_CATEGORY_UPDATE")}
        onBack={nav.goBack}
      />
    ),
  },
  reports: {
    render: (nav) => (
      <ReportsScreen isActive={nav.tab === "reports"} onBack={nav.goBack} />
    ),
  },
  attributes: {
    render: (nav) => (
      <AttributesScreen
        isActive={nav.tab === "attributes"}
        canCreate={nav.can("PRODUCT_ATTRIBUTE_CREATE")}
        canUpdate={nav.can("PRODUCT_ATTRIBUTE_UPDATE")}
        onBack={nav.goBack}
      />
    ),
  },
  users: {
    render: (nav) => (
      <UsersScreen
        isActive={nav.tab === "users"}
        canCreate={nav.can("USER_CREATE")}
        canUpdate={nav.can("USER_UPDATE")}
        onBack={nav.goBack}
      />
    ),
  },
  permissions: {
    render: (nav) => (
      <PermissionsScreen isActive={nav.tab === "permissions"} onBack={nav.goBack} />
    ),
  },
};

// ─── Shell ──────────────────────────────────────────────────────────────────

export function AppShell() {
  const { status, user } = useAuth();
  const nav = useShellNavigation();
  const { tab, setTab, mountedTabs, visibleTabs } = nav;

  // ─── Push / Deep-link handler ──────────────────────────────────────────
  useNotificationHandler(status === "authenticated", {
    openSaleDetail: nav.openSaleDetail,
    openApproval: (approvalId) => {
      nav.setTab("tasks");
      // tasksRequest currently handles "approval" kind — future: wire to detail
    },
    openStockFocus: (opts) => {
      nav.openStockFocus({
        productVariantId: opts.productVariantId,
        variantName: opts.variantName,
        productName: opts.productName,
        operation: "receive",
      });
    },
    openReplenishment: (_suggestionId) => {
      nav.setTab("tasks");
    },
    openTasksTab: () => nav.setTab("tasks"),
  });

  if (status === "booting") {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Operator oturumu hazirlaniyor...</Text>
      </View>
    );
  }

  if (status !== "authenticated") {
    return <LoginScreen />;
  }

  const scopeLabel = user?.storeIds?.length
    ? `${user.storeIds.length} magaza`
    : user?.storeId
      ? "1 magaza"
      : "Tum scope";

  return (
    <View style={styles.shell}>
      <SafeAreaView edges={["top"]} style={styles.topSafe}>
        <View style={styles.topBar}>
          <View style={styles.brandCopy}>
            <Text style={styles.brandLabel}>StockPulse Mobile</Text>
            <Text style={styles.brandTitle}>Saha operator shell</Text>
            <Pressable style={styles.scopeButton} onPress={() => setTab("more")} hitSlop={8}>
              <MaterialCommunityIcons name="storefront-outline" size={13} color={mobileTheme.colors.dark.text2} />
              <Text style={styles.scopeLabel}>{scopeLabel}</Text>
              <MaterialCommunityIcons name="chevron-down" size={11} color={mobileTheme.colors.dark.text2} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        {mountedTabs.map((item) => (
          <View
            key={item}
            pointerEvents={tab === item ? "auto" : "none"}
            accessibilityElementsHidden={tab !== item}
            importantForAccessibility={tab === item ? "auto" : "no-hide-descendants"}
            style={[styles.screenPane, tab === item ? styles.screenPaneVisible : styles.screenPaneHidden]}
          >
            {SCREEN_REGISTRY[item]?.render(nav) ?? null}
          </View>
        ))}
      </View>

      <TabBar
        tabs={visibleTabs}
        activeTab={tab}
        onSelect={setTab}
      />
    </View>
  );
}
