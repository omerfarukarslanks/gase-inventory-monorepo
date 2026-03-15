import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { useAuth } from "@/src/context/AuthContext";
import type { PermissionName } from "@gase/core";
import type { ShellScreenKey } from "./useShellNavigation";

type ProfileSheetProps = {
  can: (permission: PermissionName) => boolean;
  canViewWarehouse: boolean;
  canViewStores: boolean;
  canViewPackages: boolean;
  canViewCategories: boolean;
  canViewAttributes: boolean;
  canViewUsers: boolean;
  canViewPermissions: boolean;
  canViewReports: boolean;
  onNavigate: (screen: ShellScreenKey) => void;
};

type NavItem = {
  label: string;
  screen: ShellScreenKey;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface,
    padding: 16,
    gap: 6,
    maxHeight: 540,
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
  divider: {
    height: 1,
    backgroundColor: mobileTheme.colors.dark.border,
    marginVertical: 8,
  },
  groupTitle: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  groupItems: {
    gap: 8,
    marginBottom: 4,
  },
  signOutRow: {
    marginTop: 4,
  },
});

export function ProfileSheet({
  can,
  canViewWarehouse,
  canViewStores,
  canViewPackages,
  canViewCategories,
  canViewAttributes,
  canViewUsers,
  canViewPermissions,
  canViewReports,
  onNavigate,
}: ProfileSheetProps) {
  const { user, signOut } = useAuth();

  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ").trim() || "Operator";
  const scopeLabel = user?.storeIds?.length
    ? `${user.storeIds.length} magaza`
    : user?.storeId
      ? "1 magaza"
      : "Tum scope";

  // ─── Build navigation groups conditionally ─────────────────────────────────

  const operationItems: NavItem[] = [];
  if (canViewWarehouse) operationItems.push({ label: "Depo", screen: "warehouse", icon: "warehouse" });
  if (can("SUPPLIER_READ")) operationItems.push({ label: "Tedarikciler", screen: "suppliers", icon: "truck-delivery-outline" });

  const operationsGroup: NavGroup | null = operationItems.length
    ? {
        title: "Operasyon",
        items: operationItems,
      }
    : null;

  const managementItems: NavItem[] = [];
  if (canViewStores) managementItems.push({ label: "Magazalar", screen: "stores", icon: "storefront-outline" });
  if (canViewPackages) managementItems.push({ label: "Paketler", screen: "product-packages", icon: "package-variant-closed" });
  if (canViewCategories) managementItems.push({ label: "Kategoriler", screen: "product-categories", icon: "shape-outline" });
  if (canViewAttributes) managementItems.push({ label: "Ozellikler", screen: "attributes", icon: "tune-variant" });

  const managementGroup: NavGroup | null = managementItems.length
    ? { title: "Yonetim", items: managementItems }
    : null;

  const adminItems: NavItem[] = [];
  if (canViewUsers) adminItems.push({ label: "Kullanicilar", screen: "users", icon: "account-badge-outline" });
  if (canViewPermissions) adminItems.push({ label: "Izinler", screen: "permissions", icon: "shield-key-outline" });

  const adminGroup: NavGroup | null = adminItems.length
    ? { title: "Admin", items: adminItems }
    : null;

  const reportsGroup: NavGroup | null = canViewReports
    ? {
        title: "Raporlar",
        items: [
          { label: "Raporlar", screen: "reports", icon: "chart-line" },
        ],
      }
    : null;

  const groups = [operationsGroup, managementGroup, adminGroup, reportsGroup].filter(
    (g): g is NavGroup => g !== null,
  );

  return (
    <View style={styles.container}>
      {/* Profile identity */}
      <Text style={styles.profileName}>{displayName}</Text>
      <Text style={styles.profileMeta}>{user?.role ?? "STAFF"}</Text>
      <Text style={styles.profileScope}>{scopeLabel}</Text>

      {groups.length > 0 ? <View style={styles.divider} /> : null}

      <ScrollView showsVerticalScrollIndicator={false}>
        {groups.map((group, groupIndex) => (
          <View key={group.title}>
            {groupIndex > 0 ? <View style={styles.divider} /> : null}
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupItems}>
              {group.items.map((item) => (
                <Button
                  key={item.screen}
                  label={item.label}
                  onPress={() => onNavigate(item.screen)}
                  variant="secondary"
                  fullWidth={false}
                  icon={
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={16}
                      color={mobileTheme.colors.dark.text}
                    />
                  }
                />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.signOutRow}>
          {groups.length > 0 ? <View style={styles.divider} /> : null}
          <Button
            label="Cikis yap"
            onPress={() => void signOut()}
            variant="ghost"
            fullWidth={false}
            icon={<MaterialCommunityIcons name="logout" size={16} color={mobileTheme.colors.dark.text} />}
          />
        </View>
      </ScrollView>
    </View>
  );
}
