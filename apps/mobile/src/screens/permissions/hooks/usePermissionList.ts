import {
  createRole,
  getPermissions,
  getRoles,
  getRole,
  updatePermission,
  updateRole,
  type Permission,
  type RoleEntry,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";

export type StatusFilter = "all" | "true" | "false";
export type PermissionsTab = "permissions" | "roles";

type UsePermissionListParams = {
  isActive: boolean;
};

export function usePermissionList({ isActive }: UsePermissionListParams) {
  const [activeTab, setActiveTab] = useState<PermissionsTab>("permissions");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState("");
  const [rolesError, setRolesError] = useState("");
  const [togglingPermissionId, setTogglingPermissionId] = useState<string | null>(null);

  // Role editor state
  const [roleEditorOpen, setRoleEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleEntry | null>(null);
  const [allPermissionsForRole, setAllPermissionsForRole] = useState<Permission[]>([]);
  const [selectedPermissionNames, setSelectedPermissionNames] = useState<Set<string>>(new Set());
  const [roleSearch, setRoleSearch] = useState("");
  const [roleFormError, setRoleFormError] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Role isActive toggling
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);
  const [togglingRoleError, setTogglingRoleError] = useState("");

  // Role create state
  const [roleCreateOpen, setRoleCreateOpen] = useState(false);
  const [roleCreateName, setRoleCreateName] = useState("");
  const [roleCreateNameError, setRoleCreateNameError] = useState("");
  const [roleCreateSubmitting, setRoleCreateSubmitting] = useState(false);
  const [roleCreateFormError, setRoleCreateFormError] = useState("");

  const debouncedSearch = useDebouncedValue(search, 350);
  const debouncedRoleSearch = useDebouncedValue(roleSearch, 150);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif yetkiler";
    if (statusFilter === "false") return "Pasif yetkiler";
    return "Tum yetkiler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

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
        getPermissions({ page: 1, limit: 100 }),
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
      await updateRole(editingRole.role, {
        name: editingRole.role,
        permissionNames: [...selectedPermissionNames],
        isActive: editingRole.isActive,
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

  const toggleRoleActive = async (role: RoleEntry, next: boolean) => {
    setTogglingRoleId(role.role);
    setTogglingRoleError("");
    try {
      await updateRole(role.role, {
        name: role.role,
        permissionNames: role.permissions.map((p) => p.name),
        isActive: next,
      });
      await fetchRolesList();
    } catch (nextError) {
      setTogglingRoleError(
        nextError instanceof Error ? nextError.message : "Rol durumu guncellenemedi.",
      );
    } finally {
      setTogglingRoleId(null);
    }
  };

  const openCreateRole = useCallback(() => {
    setRoleCreateOpen(true);
    setRoleCreateName("");
    setRoleCreateNameError("");
    setRoleCreateFormError("");
  }, []);

  const resetCreateRole = useCallback(() => {
    setRoleCreateOpen(false);
    setRoleCreateName("");
    setRoleCreateNameError("");
    setRoleCreateFormError("");
  }, []);

  const submitCreateRole = async () => {
    const trimmed = roleCreateName.trim();
    if (!trimmed) {
      setRoleCreateNameError("Rol adi zorunlu.");
      return;
    }
    if (trimmed.length < 2) {
      setRoleCreateNameError("Rol adi en az 2 karakter olmali.");
      return;
    }
    setRoleCreateSubmitting(true);
    setRoleCreateFormError("");
    try {
      await createRole({ name: trimmed, permissionNames: [] });
      resetCreateRole();
      await fetchRolesList();
    } catch (nextError) {
      setRoleCreateFormError(
        nextError instanceof Error ? nextError.message : "Rol olusturulamadi.",
      );
    } finally {
      setRoleCreateSubmitting(false);
    }
  };

  const toggleSelectedPermission = useCallback((name: string) => {
    setSelectedPermissionNames((current) => {
      const next = new Set(current);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
    setRoleFormError((current) => (current ? "" : current));
  }, []);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return {
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
    // Role editor
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
    togglingRoleId,
    togglingRoleError,
    roleCreateOpen,
    roleCreateName,
    setRoleCreateName,
    roleCreateNameError,
    roleCreateSubmitting,
    roleCreateFormError,
    openCreateRole,
    resetCreateRole,
    submitCreateRole,
    toggleRoleActive,
  };
}
