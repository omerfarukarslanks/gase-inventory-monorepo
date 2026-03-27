"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPermission,
  createRole,
  getPermissions,
  getRole,
  getRoles,
  updatePermission,
  updateRole,
  type Permission,
  type PermissionListMeta,
  type RoleEntry,
} from "@/lib/permissions";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import InputField from "@/components/ui/InputField";
import PageFilterBar from "@/components/ui/PageFilterBar";
import PermissionsMobileList from "@/components/permissions/PermissionsMobileList";
import RoleDetailDialog from "@/components/permissions/RoleDetailDialog";
import RoleDetailDrawer from "@/components/permissions/RoleDetailDrawer";
import RoleDrawer from "@/components/permissions/RoleDrawer";
import RolesMobileList from "@/components/permissions/RolesMobileList";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import TablePagination from "@/components/ui/TablePagination";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { usePermissions } from "@/hooks/usePermissions";
import { useViewportMode } from "@/hooks/useViewportMode";
import { useDebounceStr } from "@/hooks/useDebounce";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";
import { cn } from "@/lib/cn";
import { useLang } from "@/context/LangContext";

// Tipler

type Tab = "permissions" | "roles";

type PermForm = {
  name: string;
  description: string;
  group: string;
  isActive: boolean;
};

const EMPTY_PERM_FORM: PermForm = {
  name: "",
  description: "",
  group: "",
  isActive: true,
};

// ─── Bileşen ──────────────────────────────────────────────────────────────────

export default function PermissionsPage() {
  const { t } = useLang();
  const { can } = usePermissions();
  const isMobile = useViewportMode() === "mobile";
  const canReadPermission = can("PERMISSION_READ");
  const canCreatePermission = can("PERMISSION_CREATE");
  const canUpdatePermission = can("PERMISSION_UPDATE");
  const canReadRole = can("ROLE_READ");
  const canViewRole = can("ROLE_VIEW");
  const canCreateRole = can("ROLE_CREATE");
  const canUpdateRole = can("ROLE_UPDATE");

  const [activeTab, setActiveTab] = useState<Tab>("permissions");

  // ── Yetkiler tab state ───────────────────────────────────────────────────────
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permMeta, setPermMeta] = useState<PermissionListMeta | null>(null);
  const [permPage, setPermPage] = useState(1);
  const [permPageSize, setPermPageSize] = useState(20);
  const [permSearch, setPermSearch] = useState("");
  const [permStatusFilter, setPermStatusFilter] = useState<boolean | "all">("all");
  const [showPermFilters, setShowPermFilters] = useState(false);
  const [permLoading, setPermLoading] = useState(true);
  const [permError, setPermError] = useState("");
  const [togglingPermIds, setTogglingPermIds] = useState<string[]>([]);

  // Drawer — oluştur / düzenle
  const [permDrawerOpen, setPermDrawerOpen] = useState(false);
  const [editingPermId, setEditingPermId] = useState<string | null>(null);
  const [permForm, setPermForm] = useState<PermForm>(EMPTY_PERM_FORM);
  const [permFormError, setPermFormError] = useState("");
  const [permNameError, setPermNameError] = useState("");
  const [permDescError, setPermDescError] = useState("");
  const [permGroupError, setPermGroupError] = useState("");
  const [permSubmitting, setPermSubmitting] = useState(false);

  const debouncedPermSearch = useDebounceStr(permSearch, 500);

  // ── Roller tab state ─────────────────────────────────────────────────────────
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [rolesError, setRolesError] = useState("");
  const [roleStatusFilter, setRoleStatusFilter] = useState<boolean | "all">("all");
  const [showRoleFilters, setShowRoleFilters] = useState(false);

  // Drawer — rol yetkileri düzenle
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleEntry | null>(null);
  const [allPermsForRole, setAllPermsForRole] = useState<Permission[]>([]);
  const [selectedPermNames, setSelectedPermNames] = useState<Set<string>>(new Set());
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleFormError, setRoleFormError] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  // Rol oluştur / düzenle
  const [roleName, setRoleName] = useState("");
  const [roleNameError, setRoleNameError] = useState("");
  const [roleLevel, setRoleLevel] = useState<number | undefined>(undefined);
  const [togglingRoleIds, setTogglingRoleIds] = useState<string[]>([]);
  const [detailRole, setDetailRole] = useState<RoleEntry | null>(null);

  const LEVEL_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));

  // ── Yetkiler fetch ───────────────────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    setPermLoading(true);
    setPermError("");
    try {
      const res = await getPermissions({
        page: permPage,
        limit: permPageSize,
        search: debouncedPermSearch || undefined,
        isActive: permStatusFilter,
      });
      setPermissions(res.data);
      setPermMeta(res.meta);
    } catch {
      setPermError(t("permissions.loadError"));
      setPermissions([]);
      setPermMeta(null);
    } finally {
      setPermLoading(false);
    }
  }, [permPage, permPageSize, debouncedPermSearch, permStatusFilter]);

  useEffect(() => {
    if (debouncedPermSearch !== "") setPermPage(1);
  }, [debouncedPermSearch]);

  useEffect(() => {
    setPermPage(1);
  }, [permStatusFilter]);

  useEffect(() => {
    if (activeTab === "permissions") fetchPermissions();
  }, [activeTab, fetchPermissions]);

  // ── Roller fetch ─────────────────────────────────────────────────────────────
  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError("");
    try {
      const res = await getRoles({ isActive: roleStatusFilter });
      setRoles(res.data);
    } catch {
      setRolesError(t("permissions.rolesLoadError"));
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [roleStatusFilter]);

  useEffect(() => {
    if (activeTab === "roles") fetchRoles();
  }, [activeTab, fetchRoles]);

  // ── Yetkiler sayfa yardımcıları ──────────────────────────────────────────────
  const permTotalPages = permMeta?.totalPages ?? 1;

  const onPermPageSizeChange = (next: number) => {
    setPermPageSize(next);
    setPermPage(1);
  };

  // ── Toggle isActive ──────────────────────────────────────────────────────────
  const onTogglePermActive = async (perm: Permission, next: boolean) => {
    setTogglingPermIds((prev) => [...prev, perm.id]);
    try {
      await updatePermission(perm.id, { isActive: next });
      await fetchPermissions();
    } catch {
      setPermError(t("permissions.permissionToggleError"));
    } finally {
      setTogglingPermIds((prev) => prev.filter((id) => id !== perm.id));
    }
  };

  // ── Yetki Drawer ─────────────────────────────────────────────────────────────
  const openCreatePermDrawer = () => {
    setEditingPermId(null);
    setPermForm(EMPTY_PERM_FORM);
    setPermFormError("");
    setPermNameError("");
    setPermDescError("");
    setPermGroupError("");
    setPermDrawerOpen(true);
  };

  const openEditPermDrawer = (perm: Permission) => {
    setEditingPermId(perm.id);
    setPermForm({
      name: perm.name,
      description: perm.description,
      group: perm.group,
      isActive: perm.isActive,
    });
    setPermFormError("");
    setPermNameError("");
    setPermDescError("");
    setPermGroupError("");
    setPermDrawerOpen(true);
  };

  const onClosePermDrawer = () => {
    if (permSubmitting) return;
    setPermDrawerOpen(false);
  };

  const onPermFormChange = (field: keyof PermForm, value: string | boolean) => {
    if (field === "name" && permNameError) setPermNameError("");
    if (field === "description" && permDescError) setPermDescError("");
    if (field === "group" && permGroupError) setPermGroupError("");
    setPermForm((prev) => ({ ...prev, [field]: value }));
  };

  const validatePermForm = () => {
    let valid = true;
    if (!permForm.name.trim()) {
      setPermNameError(t("permissions.nameRequired"));
      valid = false;
    }
    if (!permForm.description.trim()) {
      setPermDescError(t("permissions.descRequired"));
      valid = false;
    }
    if (!permForm.group.trim()) {
      setPermGroupError(t("permissions.groupRequired"));
      valid = false;
    }
    return valid;
  };

  const onSubmitPermForm = async () => {
    setPermFormError("");
    if (!validatePermForm()) return;

    setPermSubmitting(true);
    try {
      if (editingPermId) {
        await updatePermission(editingPermId, {
          description: permForm.description.trim(),
          group: permForm.group.trim(),
          isActive: permForm.isActive,
        });
      } else {
        await createPermission({
          name: permForm.name.trim(),
          description: permForm.description.trim(),
          group: permForm.group.trim(),
          isActive: permForm.isActive,
        });
      }
      setPermDrawerOpen(false);
      await fetchPermissions();
    } catch {
      setPermFormError(editingPermId ? t("permissions.permissionUpdateError") : t("permissions.permissionCreateError"));
    } finally {
      setPermSubmitting(false);
    }
  };

  // ── Rol Drawer ───────────────────────────────────────────────────────────────
  const openCreateRoleDrawer = () => {
    setEditingRole(null);
    setRoleName("");
    setRoleNameError("");
    setRoleFormError("");
    setRoleLevel(undefined);
    setSelectedPermNames(new Set());
    setAllPermsForRole([]);
    setRoleDrawerOpen(true);
    setRoleLoading(true);
    getPermissions({})
      .then((res) => setAllPermsForRole(res.data))
      .catch(() => setRoleFormError(t("permissions.loadError")))
      .finally(() => setRoleLoading(false));
  };

  const openRoleDrawer = async (role: RoleEntry) => {
    setEditingRole(role);
    setRoleName(role.role);
    setRoleNameError("");
    setRoleFormError("");
    setRoleLevel(role.level);
    setSelectedPermNames(new Set());
    setAllPermsForRole([]);
    setRoleDrawerOpen(true);
    setRoleLoading(true);

    try {
      const [rolePerms, allPermsRes] = await Promise.all([
        getRole(role.role),
        getPermissions({}),
      ]);
      setSelectedPermNames(new Set(rolePerms.map((p) => p.name)));
      setAllPermsForRole(allPermsRes.data);
    } catch {
      setRoleFormError(t("permissions.roleDetailError"));
    } finally {
      setRoleLoading(false);
    }
  };

  const onCloseRoleDrawer = () => {
    if (roleSubmitting) return;
    setRoleDrawerOpen(false);
  };

  const onToggleRolePerm = (name: string, checked: boolean) => {
    setSelectedPermNames((prev) => {
      const next = new Set(prev);
      if (checked) next.add(name);
      else next.delete(name);
      return next;
    });
  };

  const onSaveRolePerms = async () => {
    setRoleFormError("");

    if (!editingRole) {
      // Oluşturma modu
      const trimmedName = roleName.trim();
      if (!trimmedName) {
        setRoleNameError(t("permissions.roleNameRequired"));
        return;
      }
      setRoleSubmitting(true);
      try {
        await createRole({
          name: trimmedName,
          permissionNames: [...selectedPermNames],
          ...(roleLevel != null ? { level: roleLevel } : {}),
        });
        setRoleDrawerOpen(false);
        await fetchRoles();
      } catch {
        setRoleFormError(t("permissions.roleCreateError"));
      } finally {
        setRoleSubmitting(false);
      }
      return;
    }

    // Düzenleme modu
    setRoleSubmitting(true);
    try {
      await updateRole(editingRole.role, {
        name: roleName.trim(),
        permissionNames: [...selectedPermNames],
        isActive: editingRole.isActive,
        ...(roleLevel != null ? { level: roleLevel } : {}),
      });
      setRoleDrawerOpen(false);
      await fetchRoles();
    } catch {
      setRoleFormError(t("permissions.rolePermissionsUpdateError"));
    } finally {
      setRoleSubmitting(false);
    }
  };

  const onToggleRoleActive = async (role: RoleEntry, next: boolean) => {
    setTogglingRoleIds((prev) => [...prev, role.role]);
    try {
      await updateRole(role.role, {
        name: role.role,
        permissionNames: role.permissions.map((p) => p.name),
        isActive: next,
      });
      await fetchRoles();
    } catch {
      setRolesError(t("permissions.roleToggleError"));
    } finally {
      setTogglingRoleIds((prev) => prev.filter((id) => id !== role.role));
    }
  };

  // Gruplanmış yetkiler (drawer'da checkbox listesi için)
  const groupedPerms = useMemo(() => {
    const map = new Map<string, Permission[]>();
    for (const p of allPermsForRole) {
      const arr = map.get(p.group) ?? [];
      arr.push(p);
      map.set(p.group, arr);
    }
    return map;
  }, [allPermsForRole]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Başlık */}
      <div>
        <h1 className="text-xl font-semibold text-text">{t("permissions.managementTitle")}</h1>
        <p className="text-sm text-muted">{t("permissions.managementSubtitle")}</p>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {(canReadPermission || canCreatePermission || canUpdatePermission) && (
          <button
            onClick={() => setActiveTab("permissions")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === "permissions"
                ? "bg-primary text-white"
                : "text-muted hover:text-text",
            )}
          >
            {t("permissions.tabPermissions")}
          </button>
        )}
        {(canViewRole || canCreateRole || canUpdateRole) && (
          <button
            onClick={() => setActiveTab("roles")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
              activeTab === "roles"
                ? "bg-primary text-white"
                : "text-muted hover:text-text",
            )}
          >
            {t("permissions.tabRoles")}
          </button>
        )}
      </div>

      {/* ── YETKİLER SEKMESİ ─────────────────────────────────────────────────── */}
      {activeTab === "permissions" && (
        <>
          <PageFilterBar
            title={t("permissions.title")}
            subtitle={t("permissions.permissionsSubtitle")}
            searchTerm={permSearch}
            onSearchTermChange={setPermSearch}
            searchPlaceholder={t("common.search")}
            showAdvancedFilters={showPermFilters}
            onToggleAdvancedFilters={() => setShowPermFilters((prev) => !prev)}
            filterLabel={t("common.filter")}
            hideFilterLabel={t("common.hideFilter")}
            canCreate={canCreatePermission}
            createLabel={t("permissions.new")}
            onCreate={openCreatePermDrawer}
            mobileAdvancedFiltersTitle={t("permissions.permissionFiltersTitle")}
            advancedFilters={(
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
                  <SearchableDropdown
                    options={STATUS_FILTER_OPTIONS}
                    value={permStatusFilter === "all" ? "all" : String(permStatusFilter)}
                    onChange={(value) => setPermStatusFilter(parseIsActiveFilter(value))}
                    placeholder={t("common.allStatuses")}
                    showEmptyOption={false}
                    allowClear={false}
                    inputAriaLabel={t("permissions.permissionStatusFilterAria")}
                    toggleAriaLabel={t("permissions.permissionStatusFilterToggleAria")}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button
                    type="button"
                    onClick={() => setPermStatusFilter("all")}
                    className="inline-flex rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface2"
                  >
                    {t("common.clearFilters")}
                  </button>
                </div>
              </>
            )}
          />

          {isMobile ? (
            <PermissionsMobileList
              loading={permLoading}
              error={permError}
              permissions={permissions}
              canManage={canUpdatePermission}
              togglingPermIds={togglingPermIds}
              onEditPermission={openEditPermDrawer}
              onTogglePermissionActive={(perm, next) => void onTogglePermActive(perm, next)}
              footer={
                permMeta ? (
                  <TablePagination
                    page={permPage}
                    totalPages={permTotalPages}
                    total={permMeta.total}
                    pageSize={permPageSize}
                    pageSizeId="permissions-page-size"
                    loading={permLoading}
                    onPageChange={setPermPage}
                    onPageSizeChange={onPermPageSizeChange}
                  />
                ) : null
              }
            />
          ) : (
            <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
              {permLoading ? (
                <div className="p-6 text-sm text-muted">{t("permissions.loadingPermissions")}</div>
              ) : permError ? (
                <div className="p-6">
                  <p className="text-sm text-error">{permError}</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead className="border-b border-border bg-surface2/70">
                        <tr className="text-left text-xs uppercase tracking-wide text-muted">
                          <th className="px-4 py-3">{t("permissions.colName")}</th>
                          <th className="px-4 py-3">{t("permissions.colGroup")}</th>
                          <th className="px-4 py-3">{t("permissions.colDescription")}</th>
                          <th className="px-4 py-3">{t("permissions.colStatus")}</th>
                          <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("permissions.colActions")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {permissions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                              {t("common.noData")}
                            </td>
                          </tr>
                        ) : (
                          permissions.map((perm) => (
                            <tr
                              key={perm.id}
                              className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                            >
                              <td className="px-4 py-3 font-mono text-sm font-medium text-text">
                                {perm.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-text2">
                                <span className="inline-flex items-center rounded-full bg-surface2 px-2.5 py-0.5 text-xs font-medium text-text2">
                                  {perm.group}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-text2">{perm.description}</td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    perm.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                                  }`}
                                >
                                  {perm.isActive ? t("common.active") : t("common.passive")}
                                </span>
                              </td>
                              <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                                <div className="inline-flex items-center gap-1">
                                  {canUpdatePermission ? (
                                    <IconButton
                                      onClick={() => openEditPermDrawer(perm)}
                                      disabled={togglingPermIds.includes(perm.id)}
                                      aria-label={t("permissions.editPermissionAria")}
                                      title={t("common.edit")}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  ) : null}
                                  {canUpdatePermission ? (
                                    <ToggleSwitch
                                      checked={perm.isActive}
                                      onChange={(next) => onTogglePermActive(perm, next)}
                                      disabled={togglingPermIds.includes(perm.id)}
                                    />
                                  ) : null}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {permMeta ? (
                    <TablePagination
                      page={permPage}
                      totalPages={permTotalPages}
                      total={permMeta.total}
                      pageSize={permPageSize}
                      pageSizeId="permissions-page-size"
                      loading={permLoading}
                      onPageChange={setPermPage}
                      onPageSizeChange={onPermPageSizeChange}
                    />
                  ) : null}
                </>
              )}
            </section>
          )}
        </>
      )}

      {/* ── ROLLER SEKMESİ ───────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <>
          <PageFilterBar
            title={t("permissions.rolesTitle")}
            subtitle={t("permissions.rolesSubtitle")}
            searchTerm=""
            onSearchTermChange={() => undefined}
            showAdvancedFilters={showRoleFilters}
            onToggleAdvancedFilters={() => setShowRoleFilters((prev) => !prev)}
            filterLabel={t("common.filter")}
            hideFilterLabel={t("common.hideFilter")}
            canCreate={canCreateRole}
            createLabel={t("permissions.newRole")}
            onCreate={openCreateRoleDrawer}
            mobileAdvancedFiltersTitle={t("permissions.roleFiltersTitle")}
            advancedFilters={(
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">{t("common.status")}</label>
                  <SearchableDropdown
                    options={STATUS_FILTER_OPTIONS}
                    value={roleStatusFilter === "all" ? "all" : String(roleStatusFilter)}
                    onChange={(value) => setRoleStatusFilter(parseIsActiveFilter(value))}
                    placeholder={t("common.allStatuses")}
                    showEmptyOption={false}
                    allowClear={false}
                    inputAriaLabel={t("permissions.roleStatusFilterAria")}
                    toggleAriaLabel={t("permissions.roleStatusFilterToggleAria")}
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <button
                    type="button"
                    onClick={() => setRoleStatusFilter("all")}
                    className="inline-flex rounded-xl2 border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:bg-surface2"
                  >
                    {t("common.clearFilters")}
                  </button>
                </div>
              </>
            )}
          />
          {isMobile ? (
            <RolesMobileList
              loading={rolesLoading}
              error={rolesError}
              roles={roles}
              canManage={canUpdateRole}
              onViewRole={setDetailRole}
              onEditRole={openRoleDrawer}
              togglingRoleIds={togglingRoleIds}
              onToggleRoleActive={(role, next) => void onToggleRoleActive(role, next)}
            />
          ) : (
            <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
              {rolesLoading ? (
                <div className="p-6 text-sm text-muted">{t("permissions.loadingRoles")}</div>
              ) : rolesError ? (
                <div className="p-6">
                  <p className="text-sm text-error">{rolesError}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="border-b border-border bg-surface2/70">
                      <tr className="text-left text-xs uppercase tracking-wide text-muted">
                        <th className="px-4 py-3">{t("permissions.colRole")}</th>
                        <th className="px-4 py-3">{t("permissions.colStatus")}</th>
                        <th className="px-4 py-3">{t("permissions.permissionCount")}</th>
                        <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">{t("permissions.colActions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                            {t("common.noData")}
                          </td>
                        </tr>
                      ) : (
                        roles.map((role) => (
                          <tr
                            key={role.role}
                            className="group border-b border-border last:border-b-0 transition-colors hover:bg-surface2/50"
                          >
                            <td className="px-4 py-3 font-mono text-sm font-medium text-text">
                              {canViewRole || canReadRole || canUpdateRole ? (
                                <button
                                  type="button"
                                  onClick={() => setDetailRole(role)}
                                  className="cursor-pointer break-all text-left text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                                >
                                  {role.role}
                                </button>
                              ) : (
                                role.role
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                  role.isActive ? "bg-primary/15 text-primary" : "bg-error/15 text-error"
                                }`}
                              >
                                {role.isActive ? t("common.active") : t("common.passive")}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-text2">
                              {role.permissions.length} {t("permissions.permissionCountSuffix")}
                            </td>
                            <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                              <div className="inline-flex items-center gap-1">
                                {canUpdateRole ? (
                                  <IconButton
                                    onClick={() => void openRoleDrawer(role)}
                                    disabled={togglingRoleIds.includes(role.role)}
                                    aria-label={t("permissions.editRoleAria")}
                                    title={t("permissions.editRoleTitle")}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                ) : null}
                                {canUpdateRole ? (
                                  <ToggleSwitch
                                    checked={role.isActive}
                                    onChange={(next) => void onToggleRoleActive(role, next)}
                                    disabled={togglingRoleIds.includes(role.role)}
                                  />
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* ── YETKİ DRAWER ─────────────────────────────────────────────────────── */}
      <Drawer
        open={permDrawerOpen}
        onClose={onClosePermDrawer}
        side="right"
        title={editingPermId ? t("permissions.editTitle") : t("permissions.createTitle")}
        description={
          editingPermId
            ? t("permissions.permissionEditDescription")
            : t("permissions.permissionCreateDescription")
        }
        closeDisabled={permSubmitting}
        mobileFullscreen
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label={t("common.cancel")}
              type="button"
              onClick={onClosePermDrawer}
              disabled={permSubmitting}
              variant="secondary"
            />
            <Button
              label={permSubmitting ? t("common.saving") : t("common.save")}
              type="button"
              onClick={onSubmitPermForm}
              disabled={permSubmitting}
              variant="primarySolid"
            />
          </div>
        }
      >
        <div className="space-y-4 p-5">
          <InputField
            label={t("permissions.name")}
            type="text"
            value={permForm.name}
            onChange={(v) => onPermFormChange("name", v)}
            placeholder="SALE_CREATE"
            error={permNameError}
            disabled={Boolean(editingPermId)}
          />

          <InputField
            label={t("permissions.description")}
            type="text"
            value={permForm.description}
            onChange={(v) => onPermFormChange("description", v)}
            placeholder={t("permissions.descriptionPlaceholder")}
            error={permDescError}
          />

          <InputField
            label={t("permissions.group")}
            type="text"
            value={permForm.group}
            onChange={(v) => onPermFormChange("group", v)}
            placeholder={t("permissions.groupPlaceholder")}
            error={permGroupError}
          />

          {permFormError && <p className="text-sm text-error">{permFormError}</p>}
        </div>
      </Drawer>

      {isMobile ? (
        <RoleDetailDrawer role={detailRole} onClose={() => setDetailRole(null)} />
      ) : (
        <RoleDetailDialog role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      <RoleDrawer
        open={roleDrawerOpen}
        editingRole={editingRole}
        roleName={roleName}
        roleNameError={roleNameError}
        roleLevel={roleLevel}
        levelOptions={LEVEL_OPTIONS}
        roleLoading={roleLoading}
        roleSubmitting={roleSubmitting}
        roleFormError={roleFormError}
        groupedPerms={groupedPerms}
        selectedPermNames={selectedPermNames}
        onClose={onCloseRoleDrawer}
        onSave={onSaveRolePerms}
        onRoleNameChange={(value) => {
          setRoleNameError("");
          setRoleName(value);
        }}
        onRoleLevelChange={setRoleLevel}
        onToggleRolePerm={onToggleRolePerm}
      />
    </div>
  );
}
