import { MaterialCommunityIcons } from "@expo/vector-icons";
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
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";
import { useShellNavigation } from "./useShellNavigation";
import { ProfileSheet } from "./ProfileSheet";
import { TabBar } from "./TabBar";
import type { ShellScreenKey } from "./useShellNavigation";

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
  brandSubtitle: { color: mobileTheme.colors.dark.text2, fontSize: 13 },
  profileButton: {
    width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center",
    backgroundColor: mobileTheme.colors.dark.surface, borderWidth: 1, borderColor: mobileTheme.colors.dark.border,
  },
  profileButtonPressed: { opacity: 0.75 },
  profileInitials: { color: mobileTheme.colors.dark.text, fontSize: 14, fontWeight: "700" },
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
    case "products":
      return (
        <ProductsScreen
          isActive={tab === "products"}
          onOpenSalesDraft={openSalesComposer}
          onOpenStockFocus={openStockFocus}
        />
      );
    case "customers":
      return (
        <CustomersScreen
          isActive={tab === "customers"}
          request={customersRequest}
          onStartSale={openSalesComposer}
        />
      );
    case "suppliers":
      return <SuppliersScreen isActive={tab === "suppliers"} canCreate={can("SUPPLIER_CREATE")} canUpdate={can("SUPPLIER_UPDATE")} onBack={goBack} />;
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
  const { tab, setTab, mountedTabs, profileOpen, setProfileOpen, visibleTabs } = nav;

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

  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ").trim() || "Operator";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
            <Text style={styles.brandSubtitle}>{scopeLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil menusu"
            accessibilityHint="Oturum ve cikis islemlerini ac"
            accessibilityState={{ expanded: profileOpen }}
            hitSlop={6}
            onPress={() => setProfileOpen((current) => !current)}
            style={({ pressed }) => [styles.profileButton, pressed && styles.profileButtonPressed]}
          >
            <Text style={styles.profileInitials}>{initials}</Text>
          </Pressable>
        </View>

        {profileOpen ? (
          <ProfileSheet
            can={nav.can}
            canViewStores={nav.canViewStores}
            canViewPackages={nav.canViewPackages}
            canViewCategories={nav.canViewCategories}
            canViewAttributes={nav.canViewAttributes}
            canViewUsers={nav.canViewUsers}
            canViewPermissions={nav.canViewPermissions}
            canViewReports={nav.canViewReports}
            onNavigate={(screen) => {
              setProfileOpen(false);
              setTab(screen);
            }}
          />
        ) : null}
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
        onCloseProfile={() => setProfileOpen(false)}
      />
    </View>
  );
}
