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
import { TabBar } from "./TabBar";
import type { ShellScreenKey } from "./useShellNavigation";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

function renderScreen(tabKey: ShellScreenKey, nav: ReturnType<typeof useShellNavigation>) {
  const { tab, goBack, can, salesRequest, stockRequest, customersRequest, openSalesComposer, openSaleDetail, openStockFocus, openCustomerComposer } = nav;
  switch (tabKey) {
    case "dashboard":
      return (
        <DashboardScreen
          isActive={tab === "dashboard"}
          onOpenCustomers={openCustomerComposer}
          onOpenProducts={() => nav.setTab("products")}
          onOpenSaleDetail={openSaleDetail}
          onOpenSalesComposer={openSalesComposer}
          onOpenStockFocus={openStockFocus}
        />
      );
    case "sales":
      return <SalesScreen isActive={tab === "sales"} request={salesRequest} />;
    case "stock":
      return <StockScreen isActive={tab === "stock"} request={stockRequest} />;
    case "tasks":
      return (
        <TasksScreen
          isActive={tab === "tasks"}
          canViewWarehouse={nav.canViewWarehouse}
          canViewSupply={nav.canViewSupply}
        />
      );
    case "more":
      return (
        <MoreScreen
          isActive={tab === "more"}
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
      );
    case "products":
      return (
        <ProductsScreen
          isActive={tab === "products"}
          onOpenSalesDraft={openSalesComposer}
          onOpenStockFocus={openStockFocus}
          onBack={goBack}
        />
      );
    case "customers":
      return (
        <CustomersScreen
          isActive={tab === "customers"}
          request={customersRequest}
          onStartSale={openSalesComposer}
          onBack={goBack}
        />
      );
    case "suppliers":
      return <SuppliersScreen isActive={tab === "suppliers"} canCreate={can("SUPPLIER_CREATE")} canUpdate={can("SUPPLIER_UPDATE")} onBack={goBack} />;
    case "warehouse":
      return <WarehouseScreen isActive={tab === "warehouse"} onBack={goBack} />;
    case "stores":
      return <StoresScreen isActive={tab === "stores"} canCreate={can("STORE_CREATE")} canUpdate={can("STORE_UPDATE")} onBack={goBack} />;
    case "product-packages":
      return <ProductPackagesScreen isActive={tab === "product-packages"} canCreate={can("PRODUCT_PACKAGE_CREATE")} canUpdate={can("PRODUCT_PACKAGE_UPDATE")} onBack={goBack} />;
    case "product-categories":
      return <ProductCategoriesScreen isActive={tab === "product-categories"} canCreate={can("PRODUCT_CATEGORY_CREATE")} canUpdate={can("PRODUCT_CATEGORY_UPDATE")} onBack={goBack} />;
    case "reports":
      return <ReportsScreen isActive={tab === "reports"} onBack={goBack} />;
    case "attributes":
      return <AttributesScreen isActive={tab === "attributes"} canCreate={can("PRODUCT_ATTRIBUTE_CREATE")} canUpdate={can("PRODUCT_ATTRIBUTE_UPDATE")} onBack={goBack} />;
    case "users":
      return <UsersScreen isActive={tab === "users"} canCreate={can("USER_CREATE")} canUpdate={can("USER_UPDATE")} onBack={goBack} />;
    case "permissions":
      return <PermissionsScreen isActive={tab === "permissions"} onBack={goBack} />;
    default:
      return null;
  }
}

export function AppShell() {
  const { status, user } = useAuth();
  const nav = useShellNavigation();
  const { tab, setTab, mountedTabs, visibleTabs } = nav;

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
            <View style={styles.scopeButton}>
              <MaterialCommunityIcons name="storefront-outline" size={13} color={mobileTheme.colors.dark.text2} />
              <Text style={styles.scopeLabel}>{scopeLabel}</Text>
            </View>
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
            {renderScreen(item, nav)}
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
