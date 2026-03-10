import { usePermissionList } from "./hooks/usePermissionList";
import { usePermissionForm } from "./hooks/usePermissionForm";
import { PermissionListView } from "./views/PermissionListView";
import { PermissionFormSheet } from "./views/PermissionFormSheet";
import { RoleFormSheet } from "./views/PermissionFormSheet";

type PermissionsScreenProps = {
  isActive?: boolean;
  onBack?: () => void;
};

export default function PermissionsScreen({
  isActive = true,
  onBack,
}: PermissionsScreenProps = {}) {
  const {
    activeTab,
    setActiveTab,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    permissions,
    roles,
    permissionsLoading,
    rolesLoading,
    permissionsError,
    rolesError,
    togglingPermissionId,
    activeFilterLabel,
    hasFilters,
    roleEditorOpen,
    editingRole,
    groupedRolePermissions,
    selectedPermissionNames,
    roleSearch,
    setRoleSearch,
    roleFormError,
    roleLoading,
    roleSubmitting,
    fetchPermissionsList,
    fetchRolesList,
    togglePermissionActive,
    openRoleEditor,
    resetRoleEditor,
    saveRolePermissions,
    toggleSelectedPermission,
    resetFilters,
  } = usePermissionList({ isActive });

  const {
    permissionEditorOpen,
    editingPermissionId,
    permissionForm,
    permissionFormError,
    permissionSubmitting,
    permissionNameError,
    permissionDescriptionError,
    permissionGroupError,
    resetPermissionEditor,
    openCreatePermission,
    openEditPermission,
    handlePermissionFieldChange,
    submitPermission,
  } = usePermissionForm({ fetchPermissionsList });

  return (
    <>
      <PermissionListView
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        permissions={permissions}
        roles={roles}
        permissionsLoading={permissionsLoading}
        rolesLoading={rolesLoading}
        permissionsError={permissionsError}
        rolesError={rolesError}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeFilterLabel={activeFilterLabel}
        hasFilters={hasFilters}
        togglingPermissionId={togglingPermissionId}
        onBack={onBack}
        onPermissionPress={openEditPermission}
        onTogglePermissionActive={(permission, next) => void togglePermissionActive(permission, next)}
        onCreatePermission={openCreatePermission}
        onResetFilters={resetFilters}
        onRefreshPermissions={() => void fetchPermissionsList()}
        onRefreshRoles={() => void fetchRolesList()}
        onRolePress={(role) => void openRoleEditor(role)}
      />

      <PermissionFormSheet
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
        onChange={handlePermissionFieldChange}
      />

      <RoleFormSheet
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
        onTogglePermission={toggleSelectedPermission}
      />
    </>
  );
}
