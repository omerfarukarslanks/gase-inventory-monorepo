import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, ModalSheet, SectionTitle, SelectionList } from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { mobileTheme } from "@/src/theme";
import type { ShellScreenKey } from "@/src/navigation/useShellNavigation";
import { useEffect, useState } from "react";
import { getStores, type Store } from "@gase/core";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type MoreScreenProps = {
  isActive?: boolean;
  canViewProducts: boolean;
  canViewCustomers: boolean;
  canViewSuppliers: boolean;
  canViewStores: boolean;
  canViewPackages: boolean;
  canViewCategories: boolean;
  canViewAttributes: boolean;
  canViewUsers: boolean;
  canViewPermissions: boolean;
  canViewReports: boolean;
  onNavigate: (screen: ShellScreenKey) => void;
};

type MenuItem = {
  key: ShellScreenKey;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  visible: boolean;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

export default function MoreScreen({
  isActive = true,
  canViewProducts,
  canViewCustomers,
  canViewSuppliers,
  canViewStores,
  canViewPackages,
  canViewCategories,
  canViewAttributes,
  canViewUsers,
  canViewPermissions,
  canViewReports,
  onNavigate,
}: MoreScreenProps) {
  const { user, signOut } = useAuth();
  const [storePickerOpen, setStorePickerOpen] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    if (!isActive) return;
    getStores({ page: 1, limit: 100 })
      .then((res) => setStores(res.data ?? []))
      .catch(() => setStores([]));
  }, [isActive]);

  const displayName = [user?.name, user?.surname].filter(Boolean).join(" ").trim() || "Operator";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const roleName = user?.role ?? "Operator";
  const scopeLabel = user?.storeIds?.length
    ? `${user.storeIds.length} magaza`
    : user?.storeId
      ? "1 magaza"
      : "Tum magazalar";

  const groups: MenuGroup[] = [
    {
      title: "Katalog",
      items: [
        { key: "products", label: "Urunler", icon: "package-variant-closed", visible: canViewProducts },
        { key: "product-packages", label: "Paketler", icon: "package-variant", visible: canViewPackages },
        { key: "product-categories", label: "Kategoriler", icon: "tag-outline", visible: canViewCategories },
        { key: "attributes", label: "Ozellikler", icon: "format-list-bulleted", visible: canViewAttributes },
      ],
    },
    {
      title: "Kisiler",
      items: [
        { key: "customers", label: "Musteriler", icon: "account-group-outline", visible: canViewCustomers },
        { key: "suppliers", label: "Tedarikciler", icon: "truck-delivery-outline", visible: canViewSuppliers },
      ],
    },
    {
      title: "Raporlar",
      items: [
        { key: "reports", label: "Rapor merkezi", icon: "chart-bar", visible: canViewReports },
      ],
    },
    {
      title: "Yonetim",
      items: [
        { key: "stores", label: "Magazalar", icon: "store-outline", visible: canViewStores },
        { key: "users", label: "Kullanicilar", icon: "account-cog-outline", visible: canViewUsers },
        { key: "permissions", label: "Izinler", icon: "shield-lock-outline", visible: canViewPermissions },
      ],
    },
  ];

  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.visible) }))
    .filter((g) => g.items.length > 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileRole}>{roleName}</Text>
              <Pressable onPress={() => setStorePickerOpen(true)} hitSlop={8}>
                <Text style={styles.profileScope}>{scopeLabel} ▾</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Menu Groups */}
        {visibleGroups.map((group) => (
          <Card key={group.title}>
            <SectionTitle title={group.title} />
            <View style={styles.menuList}>
              {group.items.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                  onPress={() => onNavigate(item.key)}
                >
                  <View style={styles.menuIcon}>
                    <MaterialCommunityIcons name={item.icon} size={20} color={brand.primary} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </Card>
        ))}

        {/* Sign Out */}
        <View style={styles.signOutWrap}>
          <Button label="Cikis yap" onPress={signOut} variant="ghost" icon={<MaterialCommunityIcons name="logout" size={16} color={colors.text2} />} />
        </View>
      </ScrollView>

      {/* Store Picker */}
      <ModalSheet visible={storePickerOpen} onClose={() => setStorePickerOpen(false)} title="Magaza sec">
        <SelectionList
          items={[{ value: "", label: "Tum magazalar" }, ...stores.map((s) => ({ value: s.id, label: s.name }))]}
          selectedValue=""
          onSelect={() => setStorePickerOpen(false)}
        />
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: brand.primary, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  profileInfo: { flex: 1, gap: 2 },
  profileName: { color: colors.text, fontSize: 16, fontWeight: "700" },
  profileRole: { color: colors.text2, fontSize: 13 },
  profileScope: { color: brand.primary, fontSize: 12, fontWeight: "600", marginTop: 2 },
  menuList: { marginTop: 8, gap: 2 },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, paddingHorizontal: 4, borderRadius: 10,
  },
  menuItemPressed: { opacity: 0.6 },
  menuIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.surface2, alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "600" },
  signOutWrap: { marginTop: 8 },
});
