import { StyleSheet, Text, View } from "react-native";
import { type Permission, type RoleEntry } from "@gase/core";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ModalSheet,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import type { PermissionForm } from "../hooks/usePermissionForm";

// ─── Permission Editor ────────────────────────────────────────────────────────

type PermissionFormSheetProps = {
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
};

export function PermissionFormSheet({
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
}: PermissionFormSheetProps) {
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

// ─── Role Editor ──────────────────────────────────────────────────────────────

type RoleFormSheetProps = {
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
};

export function RoleFormSheet({
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
}: RoleFormSheetProps) {
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

// ─── Role Create ──────────────────────────────────────────────────────────────

type RoleCreateSheetProps = {
  visible: boolean;
  roleName: string;
  nameError: string;
  formError: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onNameChange: (value: string) => void;
};

export function RoleCreateSheet({
  visible,
  roleName,
  nameError,
  formError,
  submitting,
  onClose,
  onSubmit,
  onNameChange,
}: RoleCreateSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      title="Yeni rol"
      subtitle="Rol adini girerek sisteme yeni bir rol ekle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Rol adi"
        value={roleName}
        onChangeText={onNameChange}
        errorText={nameError || undefined}
        autoCapitalize="characters"
        placeholder="KASIYER"
      />
      <Button
        label="Rolu kaydet"
        onPress={onSubmit}
        loading={submitting}
        disabled={!roleName.trim() || roleName.trim().length < 2}
      />
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  fixedName: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  mutedText: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingList: {
    gap: 12,
    paddingBottom: 120,
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
