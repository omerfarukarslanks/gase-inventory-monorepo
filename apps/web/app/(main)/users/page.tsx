"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getUsers, updateUser, createUser, type User, type Meta, type CreateUserDto } from "@/lib/users";
import { getStores, type Store } from "@/lib/stores";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import { EditIcon, SearchIcon } from "@/components/ui/icons/TableIcons";
import { getSessionUserRole, isStoreScopedRole } from "@/lib/authz";

// Basit ikonlar
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 4-4 4 4" /><path d="M7 4v16" /><path d="M11 12h10" /><path d="M11 16h10" /><path d="M11 20h10" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 16 4 4 4-4" /><path d="M7 20V4" /><path d="M11 12h10" /><path d="M11 8h10" /><path d="M11 4h10" /></svg>;

// Debounce hook'unu inline tanımlayalım şimdilik pratik olsun
function useDebounceStr(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function UsersPage() {
    const router = useRouter();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    const STATUS_FILTER_OPTIONS = [
        { value: "all", label: "Tüm Durumlar" },
        { value: "true", label: "Aktif" },
        { value: "false", label: "Pasif" },
    ];
    const parseStatusFilter = (value: string): boolean | "all" => {
        if (value === "all") return "all";
        return value === "true";
    };

    // Local State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [storeFilter, setStoreFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | undefined>(undefined);

    const debouncedSearch = useDebounceStr(searchTerm, 500);

    const [users, setUsers] = useState<User[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(false);
    const [togglingUserIds, setTogglingUserIds] = useState<string[]>([]);

    // Edit/Create Drawer State
    const [mode, setMode] = useState<"edit" | "create">("create");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Form state (combined for edit/create)
    const [form, setForm] = useState({
        name: "",
        surname: "",
        role: "STAFF",
        email: "",
        password: "",
        storeId: "",
    });
    const [createErrors, setCreateErrors] = useState({
        name: "",
        surname: "",
        email: "",
        password: "",
    });

    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [accessChecked, setAccessChecked] = useState(false);

    useEffect(() => {
        const role = getSessionUserRole();
        if (isStoreScopedRole(role)) {
            router.replace("/dashboard");
            return;
        }
        setAccessChecked(true);
    }, [router]);

    // Stores for selection
    const [stores, setStores] = useState<Store[]>([]);
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

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
        update(mq);
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Fetch Stores for selection
    const fetchStoreList = useCallback(async () => {
        if (!accessChecked) return;
        if (stores.length > 0) return;

        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await getStores({ limit: 100, token });
            setStores(res.data);
        } catch (e) {
            console.error("Mağazalar çekilemedi", e);
        }
    }, [stores.length, accessChecked]);

    useEffect(() => {
        fetchStoreList();
    }, [fetchStoreList]);

    // Fetch Users
    const fetchUsers = useCallback(async () => {
        if (!accessChecked) return;
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
        } catch (error) {
            console.error("Kullanıcılar getirilemedi:", error);
            setUsers([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit, debouncedSearch, storeFilter, statusFilter, sortBy, sortOrder, accessChecked]);

    // Initial Fetch & Update when deps change
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Search değişince sayfa 1'e donsun
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
        } catch (error) {
            console.error("Kullanıcı durumu güncellenemedi:", error);
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
            setSortOrder(prev => prev === "ASC" ? "DESC" : "ASC");
        } else {
            setSortBy(key);
            setSortOrder("ASC");
        }
    };

    const handlePageChange = (newPage: number) => {
        if (loading || newPage < 1 || newPage > totalPages || newPage === currentPage) return;
        setCurrentPage(newPage);
    };

    const onChangePageSize = (newPageSize: number) => {
        setLimit(newPageSize);
        setCurrentPage(1);
    };

    const totalPages = meta ? meta.totalPages : 1;
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

    const getVisiblePages = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, -1, totalPages];
        }

        if (currentPage >= totalPages - 3) {
            return [1, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages];
    };

    const pageItems = getVisiblePages();

    const openCreate = () => {
        setMode("create");
        setSelectedUser(null);
        setForm({ name: "", surname: "", role: "STAFF", email: "", password: "", storeId: "" });
        setCreateErrors({ name: "", surname: "", email: "", password: "" });
        setIsDrawerOpen(true);
    };

    const openEdit = (user: User) => {
        setMode("edit");
        setSelectedUser(user);
        const firstStoreId = user.userStores?.[0]?.store.id ?? "";

        setForm({
            name: user.name,
            surname: user.surname,
            role: user.role,
            email: user.email,
            password: "", // Edit modunda şifre boş gelir, backendde opsiyonel olmalı update için
            storeId: firstStoreId,
        });
        setCreateErrors({ name: "", surname: "", email: "", password: "" });
        setIsDrawerOpen(true);
    };

    const validateCreateForm = () => {
        const nextErrors = {
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
        } else if (!emailPattern.test(form.email.trim())) {
            nextErrors.email = "Geçerli bir e-posta giriniz.";
        }

        if (!form.password) {
            nextErrors.password = "Şifre zorunludur.";
        } else if (!passwordPattern.test(form.password)) {
            nextErrors.password = "Şifre en az 8 karakter olmalı, büyük-küçük harf ve rakam içermelidir.";
        }

        setCreateErrors(nextErrors);
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
            setCreateErrors({ name: "", surname: "", email: "", password: "" });
            fetchUsers(); // Listeyi yenile
        } catch (error) {
            console.error("İşlem hatası", error);
            alert("İşlem başarısız oldu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">Kullanıcılar</h1>
                    <p className="text-sm text-muted">Sisteme kayıtlı kullanıcıları yönetin.</p>
                </div>
                <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row lg:items-center">
                    <div className="relative w-full lg:w-64">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <Button
                        label={showAdvancedFilters ? "Detaylı Filtreyi Gizle" : "Detaylı Filtre"}
                        onClick={() => setShowAdvancedFilters((prev) => !prev)}
                        variant="secondary"
                        className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
                    />
                    <Button
                        label="Yeni Kullanıcı"
                        onClick={openCreate}
                        variant="primarySoft"
                        className="w-full px-2.5 py-2 lg:w-auto lg:px-3"
                    />
                </div>
            </div>

            {showAdvancedFilters && (
                <div className="grid gap-3 rounded-xl2 border border-border bg-surface p-3 md:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">Mağaza</label>
                        <SearchableDropdown
                            options={storeFilterOptions}
                            value={storeFilter}
                            onChange={setStoreFilter}
                            placeholder="Tüm Mağazalar"
                            emptyOptionLabel="Tüm Mağazalar"
                            inputAriaLabel="Mağaza filtresi"
                            clearAriaLabel="Mağaza filtresini temizle"
                            toggleAriaLabel="Mağaza listesini aç"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">Durum</label>
                        <SearchableDropdown
                            options={STATUS_FILTER_OPTIONS}
                            value={statusFilter === "all" ? "all" : String(statusFilter)}
                            onChange={(value) => setStatusFilter(parseStatusFilter(value))}
                            placeholder="Tüm Durumlar"
                            showEmptyOption={false}
                            allowClear={false}
                            inputAriaLabel="Kullanıcı durum filtresi"
                            toggleAriaLabel="Kullanıcı durum listesini aç"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <Button
                            label="Filtreleri Temizle"
                            onClick={clearAdvancedFilters}
                            variant="secondary"
                            className="w-full sm:w-auto"
                        />
                    </div>
                </div>
            )}

            <div className="overflow-hidden rounded-xl2 border border-border bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="border-b border-border bg-surface2/70 text-xs uppercase text-muted">
                            <tr>
                                <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-text" onClick={() => handleSort("name")}>
                                    <div className="flex items-center gap-1">
                                        Ad Soyad {sortBy === "name" && (sortOrder === "ASC" ? <SortAscIcon /> : <SortDescIcon />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-text" onClick={() => handleSort("email")}>
                                    <div className="flex items-center gap-1">
                                        E-Posta {sortBy === "email" && (sortOrder === "ASC" ? <SortAscIcon /> : <SortDescIcon />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold cursor-pointer select-none hover:text-text" onClick={() => handleSort("role")}>
                                    <div className="flex items-center gap-1">
                                        Rol {sortBy === "role" && (sortOrder === "ASC" ? <SortAscIcon /> : <SortDescIcon />)}
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-muted">Mağaza</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted">Yükleniyor...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted">Kayıt bulunamadı.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="group border-b border-border last:border-b-0 hover:bg-surface2/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-text">
                                            {user.name} {user.surname}
                                        </td>
                                        <td className="px-6 py-3 text-text2">{user.email}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-text2">
                                            {user.userStores && user.userStores.length > 0
                                                ? user.userStores.map((userStore) => userStore.store.name).join(", ")
                                                : "-"}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(user)}
                                                    disabled={togglingUserIds.includes(user.id)}
                                                    className="inline-flex h-8 w-8 items-center cursor-pointer justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                                                >
                                                    <EditIcon />
                                                </button>
                                                <ToggleSwitch
                                                    checked={Boolean(user.isActive)}
                                                    onChange={(next) => onToggleUserActive(user, next)}
                                                    disabled={togglingUserIds.includes(user.id)}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta && (
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted">
                        <div className="flex items-center gap-4">
                            <span>Toplam: {meta.total}</span>
                            <span>
                                Sayfa: {currentPage}/{totalPages}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <label htmlFor="pageSize" className="text-xs text-muted">
                                Satır:
                            </label>
                            <select
                                id="pageSize"
                                value={limit}
                                onChange={(e) => onChangePageSize(Number(e.target.value))}
                                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text outline-none"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                            </select>

                            <Button
                                label="Önceki"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={!canGoPrev || loading}
                                variant="pagination"
                            />

                            {pageItems.map((item, idx) =>
                                item === -1 ? (
                                    <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted">
                                        ...
                                    </span>
                                ) : (
                                    <Button
                                        key={`page-${item}`}
                                        label={String(item)}
                                        onClick={() => handlePageChange(item)}
                                        disabled={loading}
                                        variant={item === currentPage ? "paginationActive" : "pagination"}
                                    />
                                ),
                            )}

                            <Button
                                label="Sonraki"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!canGoNext || loading}
                                variant="pagination"
                            />
                        </div>
                    </div>
                )}
            </div>

            <Drawer
                open={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    setCreateErrors({ name: "", surname: "", email: "", password: "" });
                }}
                side={isMobile ? "right" : "right"}
                title={mode === "create" ? "Yeni Kullanıcı" : "Kullanıcı Düzenle"}
                description={mode === "create" ? "Yeni bir kullanıcı hesabı oluşturun." : "Kullanıcı bilgilerini güncelleyin."}
                closeDisabled={saving}
                className={isMobile ? "!max-w-none" : ""}
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <Button
                            label="İptal"
                            type="button"
                            onClick={() => {
                                setIsDrawerOpen(false);
                                setCreateErrors({ name: "", surname: "", email: "", password: "" });
                            }}
                            disabled={saving}
                            variant="secondary"
                        />
                        <Button
                            label={saving ? "Kaydediliyor..." : "Kaydet"}
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            variant="primarySolid"
                        />
                    </div>
                }
            >
                <div className="space-y-4 p-5">
                    <InputField
                        label="Ad *"
                        type="text"
                        value={form.name}
                        onChange={(v) => {
                            setForm(p => ({ ...p, name: v }));
                            if (mode === "create" && createErrors.name) {
                                setCreateErrors((prev) => ({ ...prev, name: "" }));
                            }
                        }}
                        error={mode === "create" ? createErrors.name : undefined}
                    />
                    <InputField
                        label="Soyad *"
                        type="text"
                        value={form.surname}
                        onChange={(v) => {
                            setForm(p => ({ ...p, surname: v }));
                            if (mode === "create" && createErrors.surname) {
                                setCreateErrors((prev) => ({ ...prev, surname: "" }));
                            }
                        }}
                        error={mode === "create" ? createErrors.surname : undefined}
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">Rol</label>
                        <SearchableDropdown
                            options={roleOptions}
                            value={form.role}
                            onChange={(role) => setForm((p) => ({ ...p, role }))}
                            placeholder="Rol seçin"
                            inputAriaLabel="Rol seçimi"
                            toggleAriaLabel="Rol listesini aç"
                            allowClear={false}
                            showEmptyOption={false}
                        />
                    </div>

                    {mode === "create" && (
                        <>
                            <InputField
                                label="E-Posta *"
                                type="email"
                                value={form.email}
                                onChange={(v) => {
                                    setForm(p => ({ ...p, email: v }));
                                    if (createErrors.email) {
                                        setCreateErrors((prev) => ({ ...prev, email: "" }));
                                    }
                                }}
                                error={createErrors.email}
                            />
                            <InputField
                                label="Şifre"
                                type="password"
                                value={form.password}
                                onChange={(v) => {
                                    setForm(p => ({ ...p, password: v }));
                                    if (createErrors.password) {
                                        setCreateErrors((prev) => ({ ...prev, password: "" }));
                                    }
                                }}
                                error={createErrors.password}
                            />
                        </>
                    )}

                    {mode === "edit" && (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted">Email (Değiştirilemez)</label>
                            <div className="w-full rounded-xl2 border border-border bg-surface2 px-4 py-2.5 text-sm text-text2">
                                {selectedUser?.email}
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">Mağaza Yetkisi</label>
                        <SearchableDropdown
                            options={storeFilterOptions}
                            value={form.storeId}
                            onChange={(storeId) => setForm((p) => ({ ...p, storeId }))}
                            placeholder="Mağaza seçin"
                            emptyOptionLabel="Mağaza seçin"
                            inputAriaLabel="Mağaza seçimi"
                            clearAriaLabel="Mağaza seçimini temizle"
                            toggleAriaLabel="Mağaza listesini aç"
                        />
                        {stores.length === 0 && <div className="text-xs text-muted px-1">Mağaza bulunamadı.</div>}
                    </div>
                </div>
            </Drawer>
        </div>
    );
}
