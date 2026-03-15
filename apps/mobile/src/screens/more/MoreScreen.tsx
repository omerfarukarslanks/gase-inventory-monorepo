import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getStores, type Store } from "@gase/core";
import { AppScreen, Button, ModalSheet } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";
import type { ShellScreenKey } from "@/src/navigation/useShellNavigation";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type NavItem = {
  label: string;
  screen: ShellScreenKey;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type MoreScreenProps = {
  isActive?: boolean;
  onNavigate: (screen: ShellScreenKey) => void;
  canViewProducts: boolean;
  canViewCustomers: boolean;
  canViewWarehouse: boolean;
  canViewStores: boolean;
  canViewPackages: boolean;
  canViewCategories: boolean;
  canViewAttributes: boolean;
  canViewUsers: boolean;
  canViewPermissions: boolean;
  canViewReports: boolean;
  canViewSuppliers: boolean;
};

export default function MoreScreen({
  isActive = true,
  onNavigate,
  canViewProducts,
  canViewCustomers,
  canViewWarehouse,
  canViewStores,
  canViewPackages,
  canViewCategories,
  canViewAttributes,
  canViewUsers,
  canViewPermissions,
  canViewReports,
  canViewSuppliers,
}: MoreScreenProps) {
  const { user, signOut, storeIds } = useAuth();
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ").trim() || "Operator";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const scopeLabel = storeIds?.length
    ? `${storeIds.length} magaza`
    : user?.storeId
      ? "1 magaza"
      : "Tum magazalar";

  // Fetch stores for store picker
  useEffect(() => {
    if (!isActive) return;
    getStores({ page: 1, limit: 100 })
      .then((res) => setStores(res.data ?? []))
      .catch(() => setStores([]));
  }, [isActive]);

  const visibleStores = useMemo(
    () => (stores.length ? stores.filter((s) => !storeIds.length || storeIds.includes(s.id)) : []),
    [storeIds, stores],
  );

  // ─── Build navigation groups ──────────────────────────────────────────────

  const catalogItems: NavItem[] = [];
  if (canViewProducts) catalogItems.push({ label: "Urunler", screen: "products", icon: "package-variant-closed" });
  if (canViewPackages) catalogItems.push({ label: "Paketler", screen: "product-packages", icon: "package-variant" });
  if (canViewCategories) catalogItems.push({ label: "Kategoriler", screen: "product-categories", icon: "shape-outline" });
  if (canViewAttributes) catalogItems.push({ label: "Ozellikler", screen: "attributes", icon: "tune-variant" });

  const peopleItems: NavItem[] = [];
  if (canViewCustomers) peopleItems.push({ label: "Musteriler", screen: "customers", icon: "account-group-outline" });
  if (canViewSuppliers) peopleItems.push({ label: "Tedarikciler", screen: "suppliers", icon: "truck-delivery-outline" });

  const operationItems: NavItem[] = [];
  if (canViewWarehouse) operationItems.push({ label: "Depo", screen: "warehouse", icon: "warehouse" });

  const adminItems: NavItem[] = [];
  if (canViewStores) adminItems.push({ label: "Magazalar", screen: "stores", icon: "storefront-outline" });
  if (canViewUsers) adminItems.push({ label: "Kullanicilar", screen: "users", icon: "account-badge-outline" });
  if (canViewPermissions) adminItems.push({ label: "Izinler", screen: "permissions", icon: "shield-key-outline" });

  const groups = [
    catalogItems.length ? { title: "Katalog", items: catalogItems } : null,
    peopleItems.length ? { title: "Kisiler", items: peopleItems } : null,
    canViewReports ? { title: "Raporlar", items: [{ label: "Rapor merkezi", screen: "reports" as ShellScreenKey, icon: "chart-line" as const }] } : null,
    operationItems.length ? { title: "Operasyon", items: operationItems } : null,
    adminItems.length ? { title: "Yonetim", items: adminItems } : null,
  ].filter((g): g is NavGroup => g !== null);

  const renderNavItem = useCallback(
    (item: NavItem) => (
      <Pressable
        key={item.screen}
        onPress={() => onNavigate(item.screen)}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}
      >
        <View style={styles.navItemIcon}>
          <MaterialCommunityIcons name={item.icon} size={20} color={colors.text} />
        </View>
        <Text style={styles.navItemLabel}>{item.label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
      </Pressable>
    ),
    [onNavigate],
  );

  return (
    <AppScreen title="Diger" subtitle="Katalog, yonetim ve diger ekranlar">
      {/* ─── Profile Card ──────────────────────────────────────────────────── */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileRole}>{user?.role ?? "STAFF"}</Text>
          <Pressable
            onPress={() => setStorePickerOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Magaza sec"
            style={styles.scopeButton}
          >
            <MaterialCommunityIcons name="storefront-outline" size={14} color={brand.primary} />
            <Text style={styles.scopeLabel}>{scopeLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color={brand.primary} />
          </Pressable>
        </View>
      </View>

      {/* ─── Navigation Groups ─────────────────────────────────────────────── */}
      {groups.map((group) => (
        <View key={group.title} style={styles.groupContainer}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.groupCard}>
            {group.items.map((item, idx) => (
              <View key={item.screen}>
                {idx > 0 ? <View style={styles.itemDivider} /> : null}
                {renderNavItem(item)}
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* ─── Sign Out ──────────────────────────────────────────────────────── */}
      <View style={styles.signOutSection}>
        <Button
          label="Cikis yap"
          onPress={() => void signOut()}
          variant="ghost"
          icon={<MaterialCommunityIcons name="logout" size={16} color={colors.text} />}
        />
      </View>

      {/* ─── Store Picker Modal ────────────────────────────────────────────── */}
      <ModalSheet
        visible={storePickerOpen}
        title="Magaza sec"
        subtitle="Calismak istediginiz magazayi secin"
        onClose={() => setStorePickerOpen(false)}
      >
        {visibleStores.map((store) => (
          <Pressable
            key={store.id}
            onPress={() => setStorePickerOpen(false)}
            style={({ pressed }) => [styles.storeItem, pressed && styles.navItemPressed]}
          >
            <MaterialCommunityIcons name="storefront-outline" size={20} color={colors.text} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeLabel}>{store.name}</Text>
              {store.code ? <Text style={styles.storeCode}>{store.code}</Text> : null}
            </View>
          </Pressable>
        ))}
        {visibleStores.length === 0 ? (
          <Text style={styles.emptyStore}>Erisilebilir magaza bulunamadi</Text>
        ) : null}
      </ModalSheet>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInitials: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  profileRole: {
    color: colors.text2,
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  scopeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  scopeLabel: {
    color: brand.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  groupContainer: {
    gap: 8,
  },
  groupTitle: {
    color: colors.text2,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  groupCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  navItemPressed: {
    opacity: 0.72,
  },
  navItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  navItemLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  itemDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  signOutSection: {
    marginTop: 8,
  },
  storeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  storeInfo: {
    flex: 1,
    gap: 2,
  },
  storeLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },
  storeCode: {
    color: colors.text2,
    fontSize: 12,
  },
  emptyStore: {
    color: colors.text2,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 20,
  },
});
