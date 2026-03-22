import { MaterialCommunityIcons } from "@expo/vector-icons";
import { type Permission, type RoleEntry } from "@gase/core";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import { mobileTheme } from "@/src/theme";
import type { StatusFilter, PermissionsTab } from "../hooks/usePermissionList";

const tabOptions = [
  { label: "Yetkiler", value: "permissions" as const },
  { label: "Roller", value: "roles" as const },
];

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

type PermissionListViewProps = {
  activeTab: PermissionsTab;
  setActiveTab: (value: PermissionsTab) => void;
  permissions: Permission[];
  roles: RoleEntry[];
  permissionsLoading: boolean;
  rolesLoading: boolean;
  permissionsError: string;
  rolesError: string;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (value: StatusFilter) => void;
  activeFilterLabel: string;
  hasFilters: boolean;
  togglingPermissionId: string | null;
  onBack?: () => void;
  onPermissionPress: (permission: Permission) => void;
  onTogglePermissionActive: (permission: Permission, next: boolean) => void;
  onCreatePermission: () => void;
  onResetFilters: () => void;
  onRefreshPermissions: () => void;
  onRefreshRoles: () => void;
  onRolePress: (role: RoleEntry) => void;
  togglingRoleId: string | null;
  onCreateRole: () => void;
  onToggleRoleActive: (role: RoleEntry, next: boolean) => void;
};

export function PermissionListView({
  activeTab,
  setActiveTab,
  permissions,
  roles,
  permissionsLoading,
  rolesLoading,
  permissionsError,
  rolesError,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  activeFilterLabel,
  hasFilters,
  togglingPermissionId,
  onBack,
  onPermissionPress,
  onTogglePermissionActive,
  onCreatePermission,
  onResetFilters,
  onRefreshPermissions,
  onRefreshRoles,
  onRolePress,
  togglingRoleId,
  onCreateRole,
  onToggleRoleActive,
}: PermissionListViewProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Izinler"
          subtitle="Yetki tanimlari ve rol atamalarini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => {
                if (activeTab === "permissions") {
                  onRefreshPermissions();
                  return;
                }
                onRefreshRoles();
              }}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {activeTab === "permissions" && permissionsError ? <Banner text={permissionsError} /> : null}
        {activeTab === "roles" && rolesError ? <Banner text={rolesError} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <FilterTabs value={activeTab} options={tabOptions} onChange={setActiveTab} />
            {activeTab === "permissions" ? (
              <>
                <SearchBar
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Yetki adi veya grup ara"
                />
                <FilterTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
              </>
            ) : (
              <Text style={styles.mutedText}>
                Roller sekmesinde rol bazli permission dagilimini gorur ve duzenlersin.
              </Text>
            )}
          </View>
        </Card>
      </View>

      {activeTab === "permissions" ? (
        permissionsLoading ? (
          <View style={styles.listWrap}>
            <View style={styles.loadingList}>
              <SkeletonBlock height={82} />
              <SkeletonBlock height={82} />
              <SkeletonBlock height={82} />
            </View>
          </View>
        ) : (
          <FlatList
            data={permissions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Card>
                <SectionTitle title="Liste baglami" />
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.detailLabel}>Kapsam</Text>
                    <Text style={styles.detailValue}>{activeFilterLabel}</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.detailLabel}>Kayit</Text>
                    <Text style={styles.detailValue}>{permissions.length}</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.detailLabel}>Arama</Text>
                    <Text style={styles.detailValue}>
                      {search.trim() ? `"${search.trim()}"` : "Tum yetkiler"}
                    </Text>
                  </View>
                </View>
              </Card>
            }
            renderItem={({ item }) => (
              <ListRow
                title={item.name}
                subtitle={item.group}
                caption={item.description}
                badgeLabel={item.isActive ? "aktif" : "pasif"}
                badgeTone={item.isActive ? "positive" : "neutral"}
                onPress={() => onPermissionPress(item)}
                right={
                  <Button
                    label={item.isActive ? "Pasif" : "Aktif"}
                    onPress={() => onTogglePermissionActive(item, !item.isActive)}
                    variant={item.isActive ? "ghost" : "secondary"}
                    size="sm"
                    fullWidth={false}
                    loading={togglingPermissionId === item.id}
                  />
                }
                icon={
                  <MaterialCommunityIcons
                    name="key-chain-variant"
                    size={20}
                    color={mobileTheme.colors.brand.primary}
                  />
                }
              />
            )}
            ListEmptyComponent={
              permissionsError ? (
                <EmptyStateWithAction
                  title="Yetki listesi yuklenemedi."
                  subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                  actionLabel="Tekrar dene"
                  onAction={onRefreshPermissions}
                />
              ) : (
                <EmptyStateWithAction
                  title={hasFilters ? "Filtreye uygun yetki yok." : "Yetki bulunamadi."}
                  subtitle={
                    hasFilters
                      ? "Aramayi temizleyip durum filtresini genislet."
                      : "Yeni yetki olusturarak rol atamalarini genisletebilirsin."
                  }
                  actionLabel={hasFilters ? "Filtreyi temizle" : "Yeni yetki"}
                  onAction={() => {
                    if (hasFilters) {
                      trackEvent("empty_state_action_clicked", {
                        screen: "permissions",
                        target: "reset_filters",
                      });
                      onResetFilters();
                      return;
                    }
                    onCreatePermission();
                  }}
                />
              )
            }
          />
        )
      ) : rolesLoading ? (
        <View style={styles.listWrap}>
          <View style={styles.loadingList}>
            <SkeletonBlock height={82} />
            <SkeletonBlock height={82} />
            <SkeletonBlock height={82} />
          </View>
        </View>
      ) : (
        <FlatList
          data={roles}
          keyExtractor={(item) => item.role}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ListRow
              title={item.role}
              subtitle={`${item.permissions.length} yetki`}
              caption={item.permissions.slice(0, 3).map((permission) => permission.name).join(", ") || "Yetki yok"}
              badgeLabel={item.isActive ? "aktif" : "pasif"}
              badgeTone={item.isActive ? "info" : "neutral"}
              onPress={() => onRolePress(item)}
              right={
                <Button
                  label={item.isActive ? "Pasif" : "Aktif"}
                  onPress={() => onToggleRoleActive(item, !item.isActive)}
                  variant={item.isActive ? "ghost" : "secondary"}
                  size="sm"
                  fullWidth={false}
                  loading={togglingRoleId === item.role}
                />
              }
              icon={
                <MaterialCommunityIcons
                  name="shield-account-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            rolesError ? (
              <EmptyStateWithAction
                title="Rol listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Rolleri yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={onRefreshRoles}
              />
            ) : (
              <EmptyStateWithAction
                title="Rol bulunamadi."
                subtitle="Backend roleri bos donuyor olabilir."
                actionLabel="Listeyi yenile"
                onAction={onRefreshRoles}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        {activeTab === "permissions" ? (
          <>
            <Button label="Filtreyi temizle" onPress={onResetFilters} variant="ghost" />
            <Button
              label="Yeni yetki"
              onPress={onCreatePermission}
              icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
            />
          </>
        ) : (
          <>
            <Button label="Rolleri yenile" onPress={onRefreshRoles} variant="secondary" />
            <Button
              label="Yeni Rol"
              onPress={onCreateRole}
              icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
            />
          </>
        )}
      </StickyActionBar>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  filterStack: {
    gap: 12,
  },
  listWrap: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 12,
  },
  loadingList: {
    gap: 12,
    paddingBottom: 120,
  },
  summaryStats: {
    marginTop: 12,
    gap: 12,
  },
  summaryStat: {
    gap: 4,
  },
  detailLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  detailValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  mutedText: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
});
