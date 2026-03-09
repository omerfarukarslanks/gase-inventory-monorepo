import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createPermission,
  getPermissions,
  getRole,
  getRoles,
  replaceRolePermissions,
  updatePermission,
  type Permission,
  type RoleEntry,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";
type PermissionsTab = "permissions" | "roles";

type PermissionForm = {
  name: string;
  description: string;
  group: string;
  isActive: boolean;
};

type PermissionsScreenProps = {
  isActive?: boolean;
  onBack?: () => void;
};

const tabOptions = [
  { label: "Yetkiler", value: "permissions" as const },
  { label: "Roller", value: "roles" as const },
];

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

const emptyPermissionForm: PermissionForm = {
  name: "",
  description: "",
  group: "",
  isActive: true,
};

export default function PermissionsScreen({
  isActive = true,
  onBack,
}: PermissionsScreenProps = {}) {
  const [activeTab, setActiveTab] = useState<PermissionsTab>("permissions");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState("");
  const [rolesError, setRolesError] = useState("");
  const [permissionEditorOpen, setPermissionEditorOpen] = useState(false);
  const [editingPermissionId, setEditingPermissionId] = useState<string | null>(null);
  const [permissionForm, setPermissionForm] = useState<PermissionForm>(emptyPermissionForm);
  const [permissionFormError, setPermissionFormError] = useState("");
  const [permissionSubmitting, setPermissionSubmitting] = useState(false);
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleEntry | null>(null);
  const [allPermissionsForRole, setAllPermissionsForRole] = useState<Permission[]>([]);
  const [selectedPermissionNames, setSelectedPermissionNames] = useState<Set<string>>(new Set());
  const [roleSearch, setRoleSearch] = useState("");
  const [roleFormError, setRoleFormError] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [togglingPermissionId, setTogglingPermissionId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const debouncedRoleSearch = useDebouncedValue(roleSearch, 150);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif yetkiler";
    if (statusFilter === "false") return "Pasif yetkiler";
    return "Tum yetkiler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const permissionNameError = useMemo(() => {
    if (!permissionForm.name.trim()) return "Ad zorunlu.";
    return permissionForm.name.trim().length >= 2 ? "" : "Ad en az 2 karakter olmali.";
  }, [permissionForm.name]);

  const permissionDescriptionError = useMemo(() => {
    if (!permissionForm.description.trim()) return "Aciklama zorunlu.";
    return permissionForm.description.trim().length >= 4
      ? ""
      : "Aciklama en az 4 karakter olmali.";
  }, [permissionForm.description]);

  const permissionGroupError = useMemo(() => {
    if (!permissionForm.group.trim()) return "Grup zorunlu.";
    return permissionForm.group.trim().length >= 2 ? "" : "Grup en az 2 karakter olmali.";
  }, [permissionForm.group]);

  const groupedRolePermissions = useMemo(() => {
    const normalizedSearch = debouncedRoleSearch.trim().toLowerCase();
    const visiblePermissions = allPermissionsForRole.filter((permission) => {
      if (!normalizedSearch) return true;
      return [permission.name, permission.group, permission.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });

    const groups = new Map<string, Permission[]>();
    for (const permission of visiblePermissions) {
      const current = groups.get(permission.group) ?? [];
      current.push(permission);
      groups.set(permission.group, current);
    }

    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right, "tr"));
  }, [allPermissionsForRole, debouncedRoleSearch]);

  const fetchPermissionsList = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError("");

    try {
      const response = await getPermissions({
        page: 1,
        limit: 60,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setPermissions(response.data ?? []);
    } catch (nextError) {
      setPermissionsError(nextError instanceof Error ? nextError.message : "Yetkiler yuklenemedi.");
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchRolesList = useCallback(async () => {
    setRolesLoading(true);
    setRolesError("");

    try {
      const response = await getRoles({ page: 1, limit: 50 });
      setRoles(response.data ?? []);
    } catch (nextError) {
      setRolesError(nextError instanceof Error ? nextError.message : "Roller yuklenemedi.");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    if (activeTab === "permissions") {
      void fetchPermissionsList();
      return;
    }
    void fetchRolesList();
  }, [activeTab, fetchPermissionsList, fetchRolesList, isActive]);

  const resetPermissionEditor = useCallback(() => {
    setPermissionEditorOpen(false);
    setEditingPermissionId(null);
    setPermissionForm(emptyPermissionForm);
    setPermissionFormError("");
  }, []);

  const openCreatePermission = useCallback(() => {
    setPermissionEditorOpen(true);
    setEditingPermissionId(null);
    setPermissionForm(emptyPermissionForm);
    setPermissionFormError("");
  }, []);

  const openEditPermission = useCallback((permission: Permission) => {
    setPermissionEditorOpen(true);
    setEditingPermissionId(permission.id);
    setPermissionForm({
      name: permission.name,
      description: permission.description,
      group: permission.group,
      isActive: permission.isActive,
    });
    setPermissionFormError("");
  }, []);

  const submitPermission = async () => {
    if (permissionNameError || permissionDescriptionError || permissionGroupError) {
      trackEvent("validation_error", { screen: "permissions", field: "permission_form" });
      setPermissionFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setPermissionSubmitting(true);
    setPermissionFormError("");
    try {
      if (editingPermissionId) {
        await updatePermission(editingPermissionId, {
          description: permissionForm.description.trim(),
          group: permissionForm.group.trim(),
          isActive: permissionForm.isActive,
        });
      } else {
        await createPermission({
          name: permissionForm.name.trim(),
          description: permissionForm.description.trim(),
          group: permissionForm.group.trim(),
          isActive: permissionForm.isActive,
        });
      }

      resetPermissionEditor();
      await fetchPermissionsList();
    } catch (nextError) {
      setPermissionFormError(nextError instanceof Error ? nextError.message : "Kayit basarisiz oldu.");
    } finally {
      setPermissionSubmitting(false);
    }
  };

  const togglePermissionActive = async (permission: Permission, next: boolean) => {
    setTogglingPermissionId(permission.id);
    setPermissionsError("");
    try {
      await updatePermission(permission.id, { isActive: next });
      await fetchPermissionsList();
    } catch (nextError) {
      setPermissionsError(
        nextError instanceof Error ? nextError.message : "Yetki durumu guncellenemedi.",
      );
    } finally {
      setTogglingPermissionId(null);
    }
  };

  const openRoleEditor = useCallback(async (role: RoleEntry) => {
    setEditingRole(role);
    setRoleEditorOpen(true);
    setRoleFormError("");
    setRoleLoading(true);
    setRoleSearch("");
    try {
      const [rolePermissions, allPermissionsResponse] = await Promise.all([
        getRole(role.role),
        getPermissions({ page: 1, limit: 200 }),
      ]);
      setSelectedPermissionNames(new Set(rolePermissions.map((permission) => permission.name)));
      setAllPermissionsForRole(allPermissionsResponse.data ?? []);
    } catch (nextError) {
      setRoleFormError(
        nextError instanceof Error ? nextError.message : "Rol yetkileri yuklenemedi.",
      );
      setSelectedPermissionNames(new Set());
      setAllPermissionsForRole([]);
    } finally {
      setRoleLoading(false);
    }
  }, []);

  const resetRoleEditor = useCallback(() => {
    setRoleEditorOpen(false);
    setEditingRole(null);
    setAllPermissionsForRole([]);
    setSelectedPermissionNames(new Set());
    setRoleSearch("");
    setRoleFormError("");
  }, []);

  const saveRolePermissions = async () => {
    if (!editingRole) return;

    setRoleSubmitting(true);
    setRoleFormError("");
    try {
      await replaceRolePermissions(editingRole.role, {
        permissionNames: [...selectedPermissionNames],
        isActive: true,
      });
      resetRoleEditor();
      await fetchRolesList();
    } catch (nextError) {
      setRoleFormError(
        nextError instanceof Error ? nextError.message : "Rol yetkileri guncellenemedi.",
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

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
                  void fetchPermissionsList();
                  return;
                }
                void fetchRolesList();
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
                onPress={() => openEditPermission(item)}
                right={
                  <Button
                    label={item.isActive ? "Pasif" : "Aktif"}
                    onPress={() => void togglePermissionActive(item, !item.isActive)}
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
                  onAction={() => void fetchPermissionsList()}
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
                      resetFilters();
                      return;
                    }
                    openCreatePermission();
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
              onPress={() => void openRoleEditor(item)}
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
                onAction={() => void fetchRolesList()}
              />
            ) : (
              <EmptyStateWithAction
                title="Rol bulunamadi."
                subtitle="Backend roleri bos donuyor olabilir."
                actionLabel="Listeyi yenile"
                onAction={() => void fetchRolesList()}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        {activeTab === "permissions" ? (
          <>
            <Button label="Filtreyi temizle" onPress={resetFilters} variant="ghost" />
            <Button
              label="Yeni yetki"
              onPress={openCreatePermission}
              icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
            />
          </>
        ) : (
          <Button label="Rolleri yenile" onPress={() => void fetchRolesList()} variant="secondary" />
        )}
      </StickyActionBar>

      <PermissionEditor
        visible={permissionEditorOpen}
        form={permissionForm}
        formError={permissionFormError}
        nameError={permissionNameError}
        descriptionError={permissionDescriptionError}
        groupError={permissionGroupError}
        editingPermissionId={editingPermissionId}
        submitting={permissionSubmitting}
        onClose={resetPermissionEditor}
        onSubmit={() => void submitPermission()}
        onChange={(field, value) => {
          setPermissionForm((current) => ({ ...current, [field]: value }));
          if (permissionFormError) setPermissionFormError("");
        }}
      />

      <RoleEditor
        visible={roleEditorOpen}
        role={editingRole}
        groupedPermissions={groupedRolePermissions}
        selectedPermissionNames={selectedPermissionNames}
        roleSearch={roleSearch}
        loading={roleLoading}
        formError={roleFormError}
        submitting={roleSubmitting}
        onClose={resetRoleEditor}
        onSave={() => void saveRolePermissions()}
        onSearchChange={setRoleSearch}
        onTogglePermission={(name) => {
          setSelectedPermissionNames((current) => {
            const next = new Set(current);
            if (next.has(name)) {
              next.delete(name);
            } else {
              next.add(name);
            }
            return next;
          });
          if (roleFormError) setRoleFormError("");
        }}
      />
    </View>
  );
}

function PermissionEditor({
  visible,
  form,
  formError,
  nameError,
  descriptionError,
  groupError,
  editingPermissionId,
  submitting,
  onClose,
  onSubmit,
  onChange,
}: {
  visible: boolean;
  form: PermissionForm;
  formError: string;
  nameError: string;
  descriptionError: string;
  groupError: string;
  editingPermissionId: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onChange: (field: keyof PermissionForm, value: PermissionForm[keyof PermissionForm]) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingPermissionId ? "Yetkiyi duzenle" : "Yeni yetki"}
      subtitle="Aciklama, grup ve durum bilgisini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      {editingPermissionId ? (
        <Card>
          <SectionTitle title="Yetki adi" />
          <Text style={styles.fixedName}>{form.name}</Text>
          <Text style={styles.mutedText}>
            Bu surumde yetki adi sabit tutulur; yalnizca aciklama, grup ve durum guncellenir.
          </Text>
        </Card>
      ) : (
        <TextField
          label="Yetki adi"
          value={form.name}
          onChangeText={(value) => onChange("name", value)}
          errorText={nameError || undefined}
          autoCapitalize="none"
        />
      )}
      <TextField
        label="Grup"
        value={form.group}
        onChangeText={(value) => onChange("group", value)}
        errorText={groupError || undefined}
      />
      <TextField
        label="Aciklama"
        value={form.description}
        onChangeText={(value) => onChange("description", value)}
        errorText={descriptionError || undefined}
        multiline
      />
      <Button
        label={form.isActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
        onPress={() => onChange("isActive", !form.isActive)}
        variant={form.isActive ? "ghost" : "secondary"}
      />
      <Button
        label={editingPermissionId ? "Degisiklikleri kaydet" : "Yetkiyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(
          nameError ||
            descriptionError ||
            groupError ||
            !form.description.trim() ||
            !form.group.trim() ||
            (!editingPermissionId && !form.name.trim()),
        )}
      />
    </ModalSheet>
  );
}

function RoleEditor({
  visible,
  role,
  groupedPermissions,
  selectedPermissionNames,
  roleSearch,
  loading,
  formError,
  submitting,
  onClose,
  onSave,
  onSearchChange,
  onTogglePermission,
}: {
  visible: boolean;
  role: RoleEntry | null;
  groupedPermissions: [string, Permission[]][];
  selectedPermissionNames: Set<string>;
  roleSearch: string;
  loading: boolean;
  formError: string;
  submitting: boolean;
  onClose: () => void;
  onSave: () => void;
  onSearchChange: (value: string) => void;
  onTogglePermission: (name: string) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={role ? `${role.role} yetkileri` : "Rol yetkileri"}
      subtitle="Role atanmis permission setini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <Card>
        <SectionTitle title="Rol ozeti" />
        <Text style={styles.fixedName}>{role?.role ?? "-"}</Text>
        <Text style={styles.mutedText}>
          Secili yetki sayisi: {selectedPermissionNames.size}
        </Text>
      </Card>
      <SearchBar
        value={roleSearch}
        onChangeText={onSearchChange}
        placeholder="Role eklenecek yetkileri ara"
      />
      {loading ? (
        <View style={styles.loadingList}>
          <SkeletonBlock height={82} />
          <SkeletonBlock height={82} />
        </View>
      ) : groupedPermissions.length ? (
        groupedPermissions.map(([group, permissions]) => (
          <Card key={group}>
            <SectionTitle title={group} />
            <View style={styles.rolePermissionList}>
              {permissions.map((permission) => {
                const selected = selectedPermissionNames.has(permission.name);
                return (
                  <View key={permission.id} style={styles.rolePermissionRow}>
                    <View style={styles.rolePermissionCopy}>
                      <Text style={styles.rolePermissionTitle}>{permission.name}</Text>
                      <Text style={styles.rolePermissionCaption}>{permission.description}</Text>
                    </View>
                    <Button
                      label={selected ? "Cikar" : "Ekle"}
                      onPress={() => onTogglePermission(permission.name)}
                      variant={selected ? "ghost" : "secondary"}
                      size="sm"
                      fullWidth={false}
                    />
                  </View>
                );
              })}
            </View>
          </Card>
        ))
      ) : (
        <EmptyStateWithAction
          title="Eslesen yetki yok."
          subtitle="Arama terimini temizleyip role eklenecek baska yetkilere bak."
          actionLabel="Aramayi temizle"
          onAction={() => onSearchChange("")}
        />
      )}
      <Button label="Rol yetkilerini kaydet" onPress={onSave} loading={submitting} />
    </ModalSheet>
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
  fixedName: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  rolePermissionList: {
    marginTop: 12,
    gap: 10,
  },
  rolePermissionRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rolePermissionCopy: {
    gap: 4,
  },
  rolePermissionTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rolePermissionCaption: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
});
