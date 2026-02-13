"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUsers, updateUser, createUser, type User, type Meta, type CreateUserDto } from "@/lib/users";
import { getStores, type Store } from "@/lib/stores";
import InputField from "@/components/ui/InputField";
import Button from "@/components/ui/Button";
import Drawer from "@/components/ui/Drawer";

// Basit ikonlar
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
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

    // Local State
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<"ASC" | "DESC" | undefined>(undefined);

    const debouncedSearch = useDebounceStr(searchTerm, 500);

    const [users, setUsers] = useState<User[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(false);

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
        storeIds: [] as string[]
    });

    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Stores for selection
    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
        const update = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(!e.matches);
        update(mq);
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Fetch Stores for selection
    const fetchStoreList = useCallback(async () => {
        if (stores.length > 0) return;

        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await getStores({ limit: 100, token });
            setStores(res.data);
        } catch (e) {
            console.error("Mağazalar çekilemedi", e);
        }
    }, [stores.length]);

    useEffect(() => {
        if (isDrawerOpen) {
            fetchStoreList();
        }
    }, [isDrawerOpen, fetchStoreList]);

    // Fetch Users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getUsers({
                page: currentPage,
                limit,
                search: debouncedSearch,
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
    }, [currentPage, limit, debouncedSearch, sortBy, sortOrder]);

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
        setForm({ name: "", surname: "", role: "STAFF", email: "", password: "", storeIds: [] });
        setIsDrawerOpen(true);
    };

    const openEdit = (user: User) => {
        setMode("edit");
        setSelectedUser(user);
        // Edit modunda mevcut şifre gösterilmez, storeIds ise eğer API'den geliyorsa doldurulur
        // User nesnesinde storeIds var mı? lib/users.ts'e ekledik ama API dönüyor mu emin değiliz.
        // Şimdilik boş varsayıyoruz veya user nesnesine storeIds eklemeliyiz.
        // User interface'e stores?: {id, name}[] ekledik.
        const userStoreIds = user.stores?.map(s => s.id) || [];

        setForm({
            name: user.name,
            surname: user.surname,
            role: user.role,
            email: user.email,
            password: "", // Edit modunda şifre boş gelir, backendde opsiyonel olmalı update için
            storeIds: userStoreIds
        });
        setIsDrawerOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (mode === "create") {
                await createUser({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    surname: form.surname,
                    role: form.role,
                    storeIds: form.storeIds
                });
            } else {
                if (!selectedUser) return;
                await updateUser(selectedUser.id, {
                    name: form.name,
                    surname: form.surname,
                    role: form.role,
                    // email genelde değişmez, backend izin veriyorsa eklenir
                });
            }
            setIsDrawerOpen(false);
            fetchUsers(); // Listeyi yenile
        } catch (error) {
            console.error("İşlem hatası", error);
            alert("İşlem başarısız oldu.");
        } finally {
            setSaving(false);
        }
    };

    const toggleStoreSelection = (storeId: string) => {
        setForm(prev => {
            const exists = prev.storeIds.includes(storeId);
            if (exists) {
                return { ...prev, storeIds: prev.storeIds.filter(id => id !== storeId) };
            } else {
                return { ...prev, storeIds: [...prev.storeIds, storeId] };
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-text">Kullanıcılar</h1>
                    <p className="text-sm text-muted">Sisteme kayıtlı kullanıcıları yönetin.</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
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
                        label="Yeni Kullanıcı"
                        onClick={openCreate}
                        className="rounded-xl border border-primary/20 bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 whitespace-nowrap"
                    />
                </div>
            </div>

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
                                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted">Yükleniyor...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted">Kayıt bulunamadı.</td>
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
                                        <td className="px-6 py-3 text-right">
                                            <button
                                                onClick={() => openEdit(user)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-primary/10 hover:text-primary transition-colors"
                                            >
                                                <EditIcon />
                                            </button>
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
                                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface2"
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
                                        className={`rounded-lg border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${item === currentPage
                                            ? "border-primary bg-primary/15 text-primary"
                                            : "border-border bg-surface text-text hover:bg-surface2"
                                            }`}
                                    />
                                ),
                            )}

                            <Button
                                label="Sonraki"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={!canGoNext || loading}
                                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text disabled:cursor-not-allowed disabled:opacity-50 hover:bg-surface2"
                            />
                        </div>
                    </div>
                )}
            </div>

            <Drawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
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
                            onClick={() => setIsDrawerOpen(false)}
                            disabled={saving}
                            className="rounded-xl2 border border-border px-3 py-2 text-sm text-text disabled:cursor-not-allowed disabled:opacity-60 hover:bg-surface2"
                        />
                        <Button
                            label={saving ? "Kaydediliyor..." : "Kaydet"}
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-xl2 border border-primary/20 bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 hover:bg-primary/90"
                        />
                    </div>
                }
            >
                <div className="space-y-4 p-5">
                    <InputField
                        label="Ad"
                        type="text"
                        value={form.name}
                        onChange={(v) => setForm(p => ({ ...p, name: v }))}
                    />
                    <InputField
                        label="Soyad"
                        type="text"
                        value={form.surname}
                        onChange={(v) => setForm(p => ({ ...p, surname: v }))}
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">Rol</label>
                        <select
                            className="w-full rounded-xl2 border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                            value={form.role}
                            onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}
                        >
                            <option value="STAFF">STAFF</option>
                            <option value="MANAGER">MANAGER</option>
                            <option value="ADMIN">ADMIN</option>
                        </select>
                    </div>

                    {mode === "create" ? (
                        <>
                            <InputField
                                label="E-Posta"
                                type="email"
                                value={form.email}
                                onChange={(v) => setForm(p => ({ ...p, email: v }))}
                            />
                            <InputField
                                label="Şifre"
                                type="password"
                                value={form.password}
                                onChange={(v) => setForm(p => ({ ...p, password: v }))}
                            />

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-muted">Mağaza Yetkileri</label>
                                <div className="max-h-40 overflow-y-auto rounded-xl2 border border-border bg-surface2 p-2 space-y-1">
                                    {stores.map(store => (
                                        <label key={store.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.storeIds.includes(store.id)}
                                                onChange={() => toggleStoreSelection(store.id)}
                                                className="rounded border-border text-primary focus:ring-primary"
                                            />
                                            <span className="text-sm text-text">{store.name}</span>
                                        </label>
                                    ))}
                                    {stores.length === 0 && <div className="text-xs text-muted px-2">Mağaza bulunamadı.</div>}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-muted">Email (Değiştirilemez)</label>
                            <div className="w-full rounded-xl2 border border-border bg-surface2 px-4 py-2.5 text-sm text-text2">
                                {selectedUser?.email}
                            </div>
                        </div>
                    )}
                </div>
            </Drawer>
        </div>
    );
}
