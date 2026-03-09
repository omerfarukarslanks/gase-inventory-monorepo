"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import UsersFilters from "@/components/users/UsersFilters";
import UserDrawer from "@/components/users/UserDrawer";
import UsersTable from "@/components/users/UsersTable";
import {
  EMPTY_USER_FORM,
  EMPTY_USER_FORM_ERRORS,
  type UserForm,
  type UserFormErrors,
} from "@/components/users/types";
import TablePagination from "@/components/ui/TablePagination";
import { useDebounceStr } from "@/hooks/useDebounce";
import { usePermissions } from "@/hooks/usePermissions";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useStores } from "@/hooks/useStores";
import { createUser, getUsers, updateUser, type Meta, type User } from "@/lib/users";
import { isValidEmail } from "@gase/core";

export default function UsersPage() {
  const { can } = usePermissions();
  const isMobile = !useMediaQuery();
  const stores = useStores();

  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [togglingUserIds, setTogglingUserIds] = useState<string[]>([]);
  const [mode, setMode] = useState<"edit" | "create">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(EMPTY_USER_FORM);
  const [formErrors, setFormErrors] = useState<UserFormErrors>(EMPTY_USER_FORM_ERRORS);
  const [saving, setSaving] = useState(false);

  const debouncedSearch = useDebounceStr(searchTerm, 500);
  const canCreate = can("USER_CREATE");
  const canUpdate = can("USER_UPDATE");

  const storeFilterOptions = useMemo(
    () => stores.map((store) => ({ value: store.id, label: store.name })),
    [stores],
  );

  const roleOptions = useMemo(
    () => [
      { value: "STAFF", label: "STAFF" },
      { value: "MANAGER", label: "MANAGER" },
      { value: "ADMIN", label: "ADMIN" },
    ],
    [],
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({
        page: currentPage,
        limit,
        search: debouncedSearch,
        storeId: storeFilter || undefined,
        isActive: statusFilter,
        sortBy,
        sortOrder,
      });
      setUsers(res.data);
      setMeta(res.meta);
    } catch {
      setUsers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, limit, sortBy, sortOrder, statusFilter, storeFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (debouncedSearch !== "") {
      setCurrentPage(1);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [storeFilter, statusFilter]);

  const onToggleUserActive = async (user: User, next: boolean) => {
    setTogglingUserIds((prev) => [...prev, user.id]);
    try {
      await updateUser(user.id, {
        name: user.name,
        surname: user.surname,
        role: user.role,
        storeIds: user.userStores?.map((userStore) => userStore.store.id) || [],
        isActive: next,
      });
      await fetchUsers();
    } catch {
      alert("Kullanıcı durumu güncellenemedi.");
    } finally {
      setTogglingUserIds((prev) => prev.filter((id) => id !== user.id));
    }
  };

  const clearAdvancedFilters = () => {
    setStoreFilter("");
    setStatusFilter("all");
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
      return;
    }
    setSortBy(key);
    setSortOrder("ASC");
  };

  const totalPages = meta ? meta.totalPages : 1;

  const handlePageChange = (newPage: number) => {
    if (loading || newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const onChangePageSize = (newPageSize: number) => {
    setLimit(newPageSize);
    setCurrentPage(1);
  };

  const resetForm = () => {
    setForm(EMPTY_USER_FORM);
    setFormErrors(EMPTY_USER_FORM_ERRORS);
  };

  const openCreate = () => {
    setMode("create");
    setSelectedUser(null);
    resetForm();
    setIsDrawerOpen(true);
  };

  const openEdit = (user: User) => {
    setMode("edit");
    setSelectedUser(user);
    setForm({
      name: user.name,
      surname: user.surname,
      role: user.role,
      email: user.email,
      password: "",
      storeId: user.userStores?.[0]?.store.id ?? "",
    });
    setFormErrors(EMPTY_USER_FORM_ERRORS);
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    if (saving) return;
    setIsDrawerOpen(false);
    setFormErrors(EMPTY_USER_FORM_ERRORS);
  };

  const onFormChange = <K extends keyof UserForm>(field: K, value: UserForm[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));

    if (mode !== "create") return;

    if (field === "name" && formErrors.name) {
      setFormErrors((prev) => ({ ...prev, name: "" }));
    }
    if (field === "surname" && formErrors.surname) {
      setFormErrors((prev) => ({ ...prev, surname: "" }));
    }
    if (field === "email" && formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: "" }));
    }
    if (field === "password" && formErrors.password) {
      setFormErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const validateCreateForm = () => {
    const nextErrors: UserFormErrors = {
      name: "",
      surname: "",
      email: "",
      password: "",
    };

    if (!form.name.trim()) {
      nextErrors.name = "Ad zorunludur.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Ad en az 2 karakter olmalıdır.";
    }

    if (!form.surname.trim()) {
      nextErrors.surname = "Soyad zorunludur.";
    } else if (form.surname.trim().length < 2) {
      nextErrors.surname = "Soyad en az 2 karakter olmalıdır.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "E-posta zorunludur.";
    } else if (!isValidEmail(form.email)) {
      nextErrors.email = "Geçerli bir e-posta giriniz.";
    }

    if (!form.password) {
      nextErrors.password = "Şifre zorunludur.";
    } else if (!passwordPattern.test(form.password)) {
      nextErrors.password = "Şifre en az 8 karakter olmalı, büyük-küçük harf ve rakam içermelidir.";
    }

    setFormErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  };

  const handleSave = async () => {
    if (mode === "create" && !validateCreateForm()) return;

    setSaving(true);
    try {
      if (mode === "create") {
        await createUser({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          surname: form.surname.trim(),
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
        });
      } else {
        if (!selectedUser) return;
        await updateUser(selectedUser.id, {
          name: form.name,
          surname: form.surname,
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
        });
      }

      setIsDrawerOpen(false);
      setFormErrors(EMPTY_USER_FORM_ERRORS);
      await fetchUsers();
    } catch {
      alert("İşlem başarısız oldu.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <UsersFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        showAdvancedFilters={showAdvancedFilters}
        onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
        canCreate={canCreate}
        onCreate={openCreate}
        storeFilter={storeFilter}
        onStoreFilterChange={setStoreFilter}
        storeFilterOptions={storeFilterOptions}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={clearAdvancedFilters}
      />

      <UsersTable
        users={users}
        loading={loading}
        canUpdate={canUpdate}
        sortBy={sortBy}
        sortOrder={sortOrder}
        togglingUserIds={togglingUserIds}
        onSort={handleSort}
        onEdit={openEdit}
        onToggleUserActive={(user, next) => void onToggleUserActive(user, next)}
        footer={
          meta ? (
            <TablePagination
              page={currentPage}
              totalPages={totalPages}
              total={meta.total}
              pageSize={limit}
              pageSizeId="users-page-size"
              loading={loading}
              onPageChange={handlePageChange}
              onPageSizeChange={onChangePageSize}
            />
          ) : null
        }
      />

      <UserDrawer
        open={isDrawerOpen}
        mode={mode}
        selectedUser={selectedUser}
        saving={saving}
        isMobile={isMobile}
        form={form}
        errors={formErrors}
        roleOptions={roleOptions}
        storeOptions={storeFilterOptions}
        onClose={closeDrawer}
        onSave={handleSave}
        onFormChange={onFormChange}
      />
    </div>
  );
}
