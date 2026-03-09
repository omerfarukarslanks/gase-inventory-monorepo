import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getSessionUserStoreType, type PermissionName } from "@gase/core";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/src/context/AuthContext";
import { Button } from "@/src/components/ui";
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
import type {
  CustomersRequest,
  RequestEnvelope,
  SalesDraftSeed,
  SalesRequest,
  StockFocusSeed,
  StockRequest,
  TabKey,
} from "@/src/lib/workflows";
import { mobileTheme } from "@/src/theme";

type ShellTab = {
  key: TabKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  permission?: PermissionName;
};

type ShellScreenKey =
  | TabKey
  | "suppliers"
  | "stores"
  | "product-packages"
  | "product-categories"
  | "attributes"
  | "users"
  | "permissions"
  | "reports";

const tabs: ShellTab[] = [
  { key: "dashboard", label: "Pano", icon: "view-dashboard-outline" },
  { key: "sales", label: "Satis", icon: "receipt-text-outline", permission: "SALE_READ" },
  { key: "stock", label: "Stok", icon: "warehouse", permission: "STOCK_LIST_READ" },
  { key: "products", label: "Urun", icon: "package-variant-closed", permission: "PRODUCT_READ" },
  { key: "customers", label: "Musteri", icon: "account-group-outline", permission: "CUSTOMER_READ" },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppShell />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function AppShell() {
  const { can, permissions, signOut, status, user } = useAuth();
  const canViewStores = permissions.includes("STORE_VIEW") || permissions.includes("STORE_READ");
  const canViewPackages =
    getSessionUserStoreType(user) === "WHOLESALE" && can("PRODUCT_PACKAGE_READ");
  const canViewCategories = can("PRODUCT_CATEGORY_READ");
  const canViewAttributes = can("PRODUCT_ATTRIBUTE_READ");
  const canViewUsers = can("USER_READ");
  const canViewPermissions = can("PERMISSION_MANAGE");
  const canViewReports = permissions.some((permission) => permission.startsWith("REPORT_"));
  const [tab, setTab] = useState<ShellScreenKey>("dashboard");
  const [mountedTabs, setMountedTabs] = useState<ShellScreenKey[]>(["dashboard"]);
  const [profileOpen, setProfileOpen] = useState(false);
  const requestCounter = useRef(0);
  const previousPrimaryTab = useRef<TabKey>("dashboard");
  const [salesRequest, setSalesRequest] = useState<RequestEnvelope<SalesRequest> | null>(null);
  const [stockRequest, setStockRequest] = useState<RequestEnvelope<StockRequest> | null>(null);
  const [customersRequest, setCustomersRequest] = useState<RequestEnvelope<CustomersRequest> | null>(null);

  const visibleTabs = useMemo(
    () => tabs.filter((item) => !item.permission || permissions.includes(item.permission)),
    [permissions],
  );

  useEffect(() => {
    if (status !== "authenticated") {
      setTab("dashboard");
      setMountedTabs(["dashboard"]);
      previousPrimaryTab.current = "dashboard";
      setProfileOpen(false);
      return;
    }

    if (
      !["suppliers", "stores", "product-packages", "product-categories", "attributes", "users", "permissions", "reports"].includes(tab) &&
      !visibleTabs.some((item) => item.key === tab)
    ) {
      setTab(visibleTabs[0]?.key ?? "dashboard");
    }
    if (tab === "suppliers" && !can("SUPPLIER_READ")) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "stores" && !canViewStores) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "product-packages" && !canViewPackages) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "product-categories" && !canViewCategories) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "attributes" && !canViewAttributes) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "users" && !canViewUsers) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "permissions" && !canViewPermissions) {
      setTab(previousPrimaryTab.current);
    }
    if (tab === "reports" && !canViewReports) {
      setTab(previousPrimaryTab.current);
    }
  }, [can, canViewAttributes, canViewCategories, canViewPackages, canViewPermissions, canViewReports, canViewStores, canViewUsers, status, tab, visibleTabs]);

  useEffect(() => {
    if (!mountedTabs.includes(tab)) {
      setMountedTabs((current) => [...current, tab]);
    }
  }, [mountedTabs, tab]);

  useEffect(() => {
    if (visibleTabs.some((item) => item.key === tab)) {
      previousPrimaryTab.current = tab as TabKey;
    }
  }, [tab, visibleTabs]);

  if (status === "booting") {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Operator oturumu hazirlaniyor...</Text>
      </View>
    );
  }

  if (status !== "authenticated") {
    return <LoginShell />;
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

  const renderTab = (tabKey: ShellScreenKey) => {
    switch (tabKey) {
      case "dashboard":
        return (
          <DashboardScreen
            isActive={tab === "dashboard"}
            onOpenCustomers={openCustomerComposer}
            onOpenProducts={() => setTab("products")}
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
        return (
          <SuppliersScreen
            isActive={tab === "suppliers"}
            canCreate={can("SUPPLIER_CREATE")}
            canUpdate={can("SUPPLIER_UPDATE")}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "stores":
        return (
          <StoresScreen
            isActive={tab === "stores"}
            canCreate={can("STORE_CREATE")}
            canUpdate={can("STORE_UPDATE")}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "product-packages":
        return (
          <ProductPackagesScreen
            isActive={tab === "product-packages"}
            canCreate={can("PRODUCT_PACKAGE_CREATE")}
            canUpdate={can("PRODUCT_PACKAGE_UPDATE")}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "product-categories":
        return (
          <ProductCategoriesScreen
            isActive={tab === "product-categories"}
            canCreate={can("PRODUCT_CATEGORY_CREATE")}
            canUpdate={can("PRODUCT_CATEGORY_UPDATE")}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "reports":
        return (
          <ReportsScreen
            isActive={tab === "reports"}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "attributes":
        return (
          <AttributesScreen
            isActive={tab === "attributes"}
            canCreate={can("PRODUCT_ATTRIBUTE_CREATE")}
            canUpdate={can("PRODUCT_ATTRIBUTE_UPDATE")}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "users":
        return (
          <UsersScreen
            isActive={tab === "users"}
            canCreate={can("USER_CREATE")}
            canUpdate={can("USER_UPDATE")}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      case "permissions":
        return (
          <PermissionsScreen
            isActive={tab === "permissions"}
            onBack={() => {
              setProfileOpen(false);
              setTab(previousPrimaryTab.current);
            }}
          />
        );
      default:
        return null;
    }
  };

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
          <View style={styles.profileMenu}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileMeta}>{user?.role ?? "STAFF"}</Text>
            <Text style={styles.profileScope}>{scopeLabel}</Text>
            <View style={styles.profileActions}>
              {can("SUPPLIER_READ") ? (
                <Button
                  label="Tedarikciler"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("suppliers");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="truck-delivery-outline" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewStores ? (
                <Button
                  label="Magazalar"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("stores");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="storefront-outline" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewPackages ? (
                <Button
                  label="Paketler"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("product-packages");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="package-variant-closed" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewCategories ? (
                <Button
                  label="Kategoriler"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("product-categories");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="shape-outline" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewAttributes ? (
                <Button
                  label="Ozellikler"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("attributes");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="tune-variant" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewUsers ? (
                <Button
                  label="Kullanicilar"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("users");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="account-badge-outline" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewPermissions ? (
                <Button
                  label="Izinler"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("permissions");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="shield-key-outline" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              {canViewReports ? (
                <Button
                  label="Raporlar"
                  onPress={() => {
                    setProfileOpen(false);
                    setTab("reports");
                  }}
                  variant="secondary"
                  fullWidth={false}
                  icon={<MaterialCommunityIcons name="chart-line" size={16} color={mobileTheme.colors.dark.text} />}
                />
              ) : null}
              <Button
                label="Cikis yap"
                onPress={() => void signOut()}
                variant="ghost"
                fullWidth={false}
                icon={<MaterialCommunityIcons name="logout" size={16} color={mobileTheme.colors.dark.text} />}
              />
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      <View style={styles.content}>
        {mountedTabs.map((item) =>
          mountedTabs.includes(item) ? (
            <View
              key={item}
              pointerEvents={tab === item ? "auto" : "none"}
              accessibilityElementsHidden={tab !== item}
              importantForAccessibility={tab === item ? "auto" : "no-hide-descendants"}
              style={[styles.screenPane, tab === item ? styles.screenPaneVisible : styles.screenPaneHidden]}
            >
              {renderTab(item)}
            </View>
          ) : null,
        )}
      </View>

      <SafeAreaView edges={["bottom"]} style={styles.navSafe}>
        <View style={styles.navBar}>
          {visibleTabs.map((item) => {
            const active = item.key === tab;

            return (
              <Pressable
                key={item.key}
                accessibilityRole="tab"
                accessibilityLabel={item.label}
                accessibilityHint={`${item.label} ekranini ac`}
                accessibilityState={{ selected: active }}
                hitSlop={4}
                onPress={() => {
                  setProfileOpen(false);
                  setTab(item.key);
                }}
                style={({ pressed }) => [
                  styles.navItem,
                  active && styles.navItemActive,
                  pressed && styles.profileButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={active ? mobileTheme.colors.dark.bg : mobileTheme.colors.dark.text2}
                />
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

function LoginShell() {
  return <LoginScreen />;
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  topSafe: {
    zIndex: 10,
    backgroundColor: mobileTheme.colors.dark.bg,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  brandCopy: {
    flex: 1,
    gap: 2,
  },
  brandLabel: {
    color: mobileTheme.colors.brand.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  brandTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 20,
    fontWeight: "700",
  },
  brandSubtitle: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
  },
  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.dark.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
  },
  profileButtonPressed: {
    opacity: 0.75,
  },
  profileInitials: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  profileMenu: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface,
    padding: 16,
    gap: 6,
  },
  profileName: {
    color: mobileTheme.colors.dark.text,
    fontSize: 16,
    fontWeight: "700",
  },
  profileMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    textTransform: "uppercase",
  },
  profileScope: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  profileActions: {
    marginTop: 10,
    gap: 10,
  },
  content: {
    flex: 1,
    position: "relative",
  },
  screenPane: {
    ...StyleSheet.absoluteFillObject,
  },
  screenPaneVisible: {
    display: "flex",
  },
  screenPaneHidden: {
    display: "none",
  },
  navSafe: {
    backgroundColor: mobileTheme.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: mobileTheme.colors.dark.border,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 16,
    minHeight: 52,
    paddingVertical: 10,
    backgroundColor: mobileTheme.colors.dark.surface,
  },
  navItemActive: {
    backgroundColor: mobileTheme.colors.brand.primary,
  },
  navLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 11,
    fontWeight: "700",
  },
  navLabelActive: {
    color: mobileTheme.colors.dark.bg,
  },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  loadingText: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
  },
});
