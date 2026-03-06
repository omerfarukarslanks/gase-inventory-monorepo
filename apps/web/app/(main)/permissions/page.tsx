"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createPermission,
  getPermissions,
  getRole,
  getRoles,
  replaceRolePermissions,
  updatePermission,
  type Permission,
  type PermissionListMeta,
  type RoleEntry,
  type RolePermission,
} from "@/lib/permissions";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import SearchInput from "@/components/ui/SearchInput";
import TablePagination from "@/components/ui/TablePagination";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon } from "@/components/ui/icons/TableIcons";
import { useAdminGuard } from "@/hooks/useAdminGuard";
import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDebounceStr } from "@/hooks/useDebounce";
import { STATUS_FILTER_OPTIONS, parseIsActiveFilter } from "@/components/products/types";
import { cn } from "@/lib/cn";
import { useLang } from "@/context/LangContext";

// ─── Tipler ───────────────────────────────────────────────────────────────────

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
  const accessChecked = useAdminGuard();
  const { can } = usePermissions();
  const isMobile = !useMediaQuery();
  const canManage = can("PERMISSION_MANAGE");

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

  // Drawer — rol yetkileri düzenle
  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleEntry | null>(null);
  const [allPermsForRole, setAllPermsForRole] = useState<Permission[]>([]);
  const [selectedPermNames, setSelectedPermNames] = useState<Set<string>>(new Set());
  const [roleSubmitting, setRoleSubmitting] = useState(false);
  const [roleFormError, setRoleFormError] = useState("");
  const [roleLoading, setRoleLoading] = useState(false);

  // ── Yetkiler fetch ───────────────────────────────────────────────────────────
  const fetchPermissions = useCallback(async () => {
    if (!accessChecked) return;
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
      setPermError("Yetkiler yüklenemedi. Lütfen tekrar deneyin.");
      setPermissions([]);
      setPermMeta(null);
    } finally {
      setPermLoading(false);
    }
  }, [accessChecked, permPage, permPageSize, debouncedPermSearch, permStatusFilter]);

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
    if (!accessChecked) return;
    setRolesLoading(true);
    setRolesError("");
    try {
      const res = await getRoles();
      setRoles(res.data);
    } catch {
      setRolesError("Roller yüklenemedi. Lütfen tekrar deneyin.");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [accessChecked]);

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
      setPermError("Yetki durumu güncellenemedi. Lütfen tekrar deneyin.");
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
      setPermNameError("Ad zorunludur.");
      valid = false;
    }
    if (!permForm.description.trim()) {
      setPermDescError("Açıklama zorunludur.");
      valid = false;
    }
    if (!permForm.group.trim()) {
      setPermGroupError("Grup zorunludur.");
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
      setPermFormError(editingPermId ? "Yetki güncellenemedi." : "Yetki oluşturulamadı.");
    } finally {
      setPermSubmitting(false);
    }
  };

  // ── Rol Drawer ───────────────────────────────────────────────────────────────
  const openRoleDrawer = async (role: RoleEntry) => {
    setEditingRole(role);
    setRoleFormError("");
    setSelectedPermNames(new Set());
    setAllPermsForRole([]);
    setRoleDrawerOpen(true);
    setRoleLoading(true);

    try {
      // İkisini paralel çek: rolün mevcut yetkileri + tüm yetki listesi
      const [rolePerms, allPermsRes] = await Promise.all([
        getRole(role.role),
        getPermissions({}),
      ]);
      setSelectedPermNames(new Set(rolePerms.map((p) => p.name)));
      setAllPermsForRole(allPermsRes.data);
    } catch {
      setRoleFormError("Yetki bilgileri yüklenemedi. Lütfen tekrar deneyin.");
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
    if (!editingRole) return;
    setRoleFormError("");
    setRoleSubmitting(true);
    try {
      await replaceRolePermissions(editingRole.role, {
        permissionNames: [...selectedPermNames],
        isActive: true,
      });
      setRoleDrawerOpen(false);
      await fetchRoles();
    } catch {
      setRoleFormError("Rol yetkileri güncellenemedi. Lütfen tekrar deneyin.");
    } finally {
      setRoleSubmitting(false);
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
        <h1 className="text-xl font-semibold text-text">Yetki Yönetimi</h1>
        <p className="text-sm text-muted">Sistem yetkilerini ve rol atamalarını yönetin.</p>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        <button
          onClick={() => setActiveTab("permissions")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            activeTab === "permissions"
              ? "bg-primary text-white"
              : "text-muted hover:text-text",
          )}
        >
          Yetkiler
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            activeTab === "roles"
              ? "bg-primary text-white"
              : "text-muted hover:text-text",
          )}
        >
          Roller
        </button>
      </div>

      {/* ── YETKİLER SEKMESİ ─────────────────────────────────────────────────── */}
      {activeTab === "permissions" && (
        <>
          {/* Filtreler + Eylemler */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
              <SearchInput
                value={permSearch}
                onChange={setPermSearch}
                placeholder="Ara..."
                containerClassName="w-full lg:w-64"
              />
              <Button
                label={showPermFilters ? "Detaylı Filtreyi Gizle" : "Detaylı Filtre"}
                onClick={() => setShowPermFilters((prev) => !prev)}
                variant="secondary"
                className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
              />
              {canManage && (
                <Button
                  label="Yeni Yetki"
                  onClick={openCreatePermDrawer}
                  variant="primarySoft"
                  className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
                />
              )}
            </div>
          </div>

          {showPermFilters && (
            <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Durum</label>
                <SearchableDropdown
                  options={STATUS_FILTER_OPTIONS}
                  value={permStatusFilter === "all" ? "all" : String(permStatusFilter)}
                  onChange={(value) => setPermStatusFilter(parseIsActiveFilter(value))}
                  placeholder="Tüm Durumlar"
                  showEmptyOption={false}
                  allowClear={false}
                  inputAriaLabel="Yetki durum filtresi"
                  toggleAriaLabel="Yetki durum listesini aç"
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <Button
                  label="Filtreleri Temizle"
                  onClick={() => setPermStatusFilter("all")}
                  variant="secondary"
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          )}

          <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
            {permLoading ? (
              <div className="p-6 text-sm text-muted">Yetkiler yükleniyor...</div>
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
                        <th className="px-4 py-3">Ad</th>
                        <th className="px-4 py-3">Grup</th>
                        <th className="px-4 py-3">Açıklama</th>
                        <th className="px-4 py-3">Durum</th>
                        <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted">
                            Kayıt bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        permissions.map((perm) => (
                          <tr
                            key={perm.id}
                            className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm font-medium text-text font-mono">
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
                                  perm.isActive
                                    ? "bg-primary/15 text-primary"
                                    : "bg-error/15 text-error"
                                }`}
                              >
                                {perm.isActive ? "Aktif" : "Pasif"}
                              </span>
                            </td>
                            <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                              <div className="inline-flex items-center gap-1">
                                {canManage && (
                                  <IconButton
                                    onClick={() => openEditPermDrawer(perm)}
                                    disabled={togglingPermIds.includes(perm.id)}
                                    aria-label="Yetki düzenle"
                                    title="Düzenle"
                                  >
                                    <EditIcon />
                                  </IconButton>
                                )}
                                {canManage && (
                                  <ToggleSwitch
                                    checked={perm.isActive}
                                    onChange={(next) => onTogglePermActive(perm, next)}
                                    disabled={togglingPermIds.includes(perm.id)}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {permMeta && (
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
                )}
              </>
            )}
          </section>
        </>
      )}

      {/* ── ROLLER SEKMESİ ───────────────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <section className="overflow-hidden rounded-xl2 border border-border bg-surface">
          {rolesLoading ? (
            <div className="p-6 text-sm text-muted">Roller yükleniyor...</div>
          ) : rolesError ? (
            <div className="p-6">
              <p className="text-sm text-error">{rolesError}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="border-b border-border bg-surface2/70">
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Yetki Sayısı</th>
                    <th className="sticky right-0 z-20 bg-surface2/70 px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr
                        key={role.role}
                        className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-text font-mono">
                          {role.role}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              role.isActive
                                ? "bg-primary/15 text-primary"
                                : "bg-error/15 text-error"
                            }`}
                          >
                            {role.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-text2">
                          {role.permissions.length} yetki
                        </td>
                        <td className="sticky right-0 z-10 bg-surface px-4 py-3 text-right group-hover:bg-surface2/50">
                          <div className="inline-flex items-center gap-1">
                            {canManage && (
                              <IconButton
                                onClick={() => void openRoleDrawer(role)}
                                aria-label="Rol yetkilerini düzenle"
                                title="Yetkileri Düzenle"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
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

      {/* ── YETKİ DRAWER ─────────────────────────────────────────────────────── */}
      <Drawer
        open={permDrawerOpen}
        onClose={onClosePermDrawer}
        side="right"
        title={editingPermId ? "Yetki Düzenle" : "Yeni Yetki"}
        description={
          editingPermId
            ? "Yetki açıklamasını ve grubunu güncelleyin."
            : "Sisteme yeni bir yetki tanımı ekleyin."
        }
        closeDisabled={permSubmitting}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="İptal"
              type="button"
              onClick={onClosePermDrawer}
              disabled={permSubmitting}
              variant="secondary"
            />
            <Button
              label={permSubmitting ? "Kaydediliyor..." : "Kaydet"}
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
            label="Ad *"
            type="text"
            value={permForm.name}
            onChange={(v) => onPermFormChange("name", v)}
            placeholder="SALE_CREATE"
            error={permNameError}
            disabled={Boolean(editingPermId)}
          />

          <InputField
            label="Açıklama *"
            type="text"
            value={permForm.description}
            onChange={(v) => onPermFormChange("description", v)}
            placeholder="Yeni satış fişi oluşturma"
            error={permDescError}
          />

          <InputField
            label="Grup *"
            type="text"
            value={permForm.group}
            onChange={(v) => onPermFormChange("group", v)}
            placeholder="Satış"
            error={permGroupError}
          />

          {permFormError && <p className="text-sm text-error">{permFormError}</p>}
        </div>
      </Drawer>

      {/* ── ROL YETKİLERİ DRAWER ─────────────────────────────────────────────── */}
      <Drawer
        open={roleDrawerOpen}
        onClose={onCloseRoleDrawer}
        side="right"
        title={`${editingRole?.role ?? ""} — Yetkiler`}
        description="Rol için aktif yetkileri seçin. Kaydet ile mevcut atama tamamen değiştirilir."
        closeDisabled={roleSubmitting || roleLoading}
        className={cn(isMobile && "!max-w-none")}
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button
              label="İptal"
              type="button"
              onClick={onCloseRoleDrawer}
              disabled={roleSubmitting || roleLoading}
              variant="secondary"
            />
            <Button
              label={roleSubmitting ? "Kaydediliyor..." : "Kaydet"}
              type="button"
              onClick={onSaveRolePerms}
              disabled={roleSubmitting || roleLoading}
              variant="primarySolid"
            />
          </div>
        }
      >
        <div className="space-y-5 p-5">
          {roleLoading ? (
            <p className="text-sm text-muted">Yükleniyor...</p>
          ) : groupedPerms.size === 0 && !roleFormError ? (
            <p className="text-sm text-muted">Yetki bulunamadı.</p>
          ) : (
            [...groupedPerms.entries()].map(([group, perms]) => (
              <div key={group} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group}</p>
                <div className="space-y-1">
                  {perms.map((p) => (
                    <label
                      key={p.name}
                      className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 hover:bg-surface2/60 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                        checked={selectedPermNames.has(p.name)}
                        onChange={(e) => onToggleRolePerm(p.name, e.target.checked)}
                        disabled={roleSubmitting}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-semibold text-text">{p.name}</p>
                        <p className="text-xs text-muted">{p.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))
          )}

          {roleFormError && <p className="text-sm text-error">{roleFormError}</p>}
        </div>
      </Drawer>
    </div>
  );
}
