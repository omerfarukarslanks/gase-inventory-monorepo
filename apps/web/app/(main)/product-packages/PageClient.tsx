"use client";

import { type FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TablePagination from "@/components/ui/TablePagination";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableMultiSelectDropdown from "@/components/ui/SearchableMultiSelectDropdown";
import { FieldError } from "@/components/ui/FieldError";
import { PageShell } from "@/components/layout/PageShell";
import { useDebounceStr } from "@/hooks/useDebounce";
import { useViewportMode } from "@/hooks/useViewportMode";
import { getProducts, getProductVariants, type Product } from "@/lib/products";
import {
  createProductPackage,
  getProductPackageById,
  getProductPackages,
  updateProductPackage,
  type ProductPackage,
  type ProductPackagesListMeta,
} from "@/lib/product-packages";
import { toNumberOrNull } from "@/lib/format";
import {
  createRowId,
  EMPTY_FORM,
  resolveStoreType,
  type FormErrors,
  type PackageForm,
  type PackageItemRow,
  type SessionUserForStoreType,
} from "@/components/product-packages/types";
import ProductPackagesFilters from "@/components/product-packages/ProductPackagesFilters";
import ProductPackagesTable from "@/components/product-packages/ProductPackagesTable";
import PackagesMobileList from "@/components/product-packages/PackagesMobileList";
import PackagesTaskFlow from "@/components/product-packages/PackagesTaskFlow";

export default function ProductPackagesPageClient() {
  const router = useRouter();
  const viewportMode = useViewportMode();
  const isMobile = viewportMode === "mobile";
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (!rawUser) {
        router.replace("/dashboard");
        return;
      }
      const parsed = JSON.parse(rawUser) as SessionUserForStoreType;
      if (resolveStoreType(parsed) !== "WHOLESALE") {
        router.replace("/dashboard");
        return;
      }
      setAccessChecked(true);
    } catch {
      router.replace("/dashboard");
    }
  }, [router]);

  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [meta, setMeta] = useState<ProductPackagesListMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | "all">("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedPackageIds, setExpandedPackageIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [items, setItems] = useState<PackageItemRow[]>([]);

  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [variantSearchLoading, setVariantSearchLoading] = useState(false);
  const [variantSearchProducts, setVariantSearchProducts] = useState<Product[]>([]);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState("");
  const [variantOptions, setVariantOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [addItemQuantity, setAddItemQuantity] = useState("1");
  const [addItemError, setAddItemError] = useState("");

  const debouncedSearch = useDebounceStr(searchTerm, 500);
  const debouncedVariantSearch = useDebounceStr(variantSearchTerm, 400);

  const fetchPackages = useCallback(async () => {
    if (!accessChecked) return;
    setLoading(true);
    setError("");
    try {
      const res = await getProductPackages({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch || undefined,
        isActive: statusFilter,
      });
      setPackages(res.data);
      setMeta(res.meta);
    } catch {
      setError("Paketler yuklenemedi. Lutfen tekrar deneyin.");
      setPackages([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [accessChecked, currentPage, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    if (debouncedSearch !== "") setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    void fetchPackages();
  }, [fetchPackages]);

  useEffect(() => {
    if (!debouncedVariantSearch.trim()) {
      setVariantSearchProducts([]);
      return;
    }
    let cancelled = false;
    setVariantSearchLoading(true);
    getProducts({ search: debouncedVariantSearch, limit: 20 })
      .then((res) => {
        if (!cancelled) setVariantSearchProducts(res.data);
      })
      .catch(() => {
        if (!cancelled) setVariantSearchProducts([]);
      })
      .finally(() => {
        if (!cancelled) setVariantSearchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedVariantSearch]);

  useEffect(() => {
    if (!selectedProductForVariant) {
      setVariantOptions([]);
      setSelectedVariantIds([]);
      return;
    }
    setVariantsLoading(true);
    getProductVariants(selectedProductForVariant)
      .then((variants) => {
        setVariantOptions(
          variants
            .filter((variant) => variant.isActive !== false)
            .map((variant) => ({ value: variant.id, label: `${variant.name} (${variant.code})` })),
        );
      })
      .catch(() => setVariantOptions([]))
      .finally(() => setVariantsLoading(false));
  }, [selectedProductForVariant]);

  const totalPages = meta?.totalPages ?? 1;

  const onChangePageSize = (nextPageSize: number) => {
    setPageSize(nextPageSize);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (loading || page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const resetItemSearch = () => {
    setVariantSearchTerm("");
    setVariantSearchProducts([]);
    setSelectedProductForVariant("");
    setVariantOptions([]);
    setSelectedVariantIds([]);
    setAddItemQuantity("1");
    setAddItemError("");
  };

  const onOpenDrawer = () => {
    setFormError("");
    setErrors({});
    setForm(EMPTY_FORM);
    setItems([]);
    setEditingId(null);
    setEditingIsActive(true);
    resetItemSearch();
    setDrawerOpen(true);
  };

  const onCloseDrawer = () => {
    if (submitting || loadingDetail) return;
    setErrors({});
    setDrawerOpen(false);
  };

  const onEditPackage = async (id: string) => {
    setFormError("");
    setErrors({});
    setLoadingDetail(true);
    resetItemSearch();
    try {
      const detail = await getProductPackageById(id);
      setForm({
        name: detail.name ?? "",
        code: detail.code ?? "",
        description: detail.description ?? "",
      });
      setItems(
        (detail.items ?? []).map((item) => ({
          rowId: createRowId(),
          productVariantId: item.productVariant.id,
          variantLabel: `${item.productVariant.name} (${item.productVariant.code})`,
          quantity: String(item.quantity),
        })),
      );
      setEditingId(detail.id);
      setEditingIsActive(detail.isActive ?? true);
      setDrawerOpen(true);
    } catch {
      setFormError("Paket detayi yuklenemedi. Lutfen tekrar deneyin.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const onFormChange = (field: keyof PackageForm, value: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSelectProduct = (product: Product) => {
    setSelectedProductForVariant(product.id);
    setVariantSearchTerm(product.name);
    setVariantSearchProducts([]);
  };

  const onAddItem = () => {
    setAddItemError("");
    if (selectedVariantIds.length === 0) {
      setAddItemError("Lutfen en az bir varyant secin.");
      return;
    }
    const qty = toNumberOrNull(addItemQuantity);
    if (!qty || qty <= 0) {
      setAddItemError("Gecerli bir miktar girin (en az 1).");
      return;
    }

    const existingVariantIds = new Set(items.map((item) => item.productVariantId));
    const variantIdsToAdd = selectedVariantIds.filter((id) => !existingVariantIds.has(id));
    if (variantIdsToAdd.length === 0) {
      setAddItemError("Secilen varyantlar pakete zaten eklendi.");
      return;
    }

    setItems((prev) => {
      const nextItems = [...prev];
      for (const variantId of variantIdsToAdd) {
        const label = variantOptions.find((variant) => variant.value === variantId)?.label ?? variantId;
        nextItems.push({
          rowId: createRowId(),
          productVariantId: variantId,
          variantLabel: label,
          quantity: String(qty),
        });
      }
      return nextItems;
    });

    if (errors.items) setErrors((prev) => ({ ...prev, items: undefined }));
    setSelectedVariantIds([]);
    setAddItemQuantity("1");
  };

  const onRemoveItem = (rowId: string) => {
    setItems((prev) => prev.filter((item) => item.rowId !== rowId));
  };

  const onItemQuantityChange = (rowId: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.rowId === rowId ? { ...item, quantity: value } : item)));
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "Paket adi zorunludur.";
    if (!form.code.trim()) nextErrors.code = "Paket kodu zorunludur.";
    if (items.length === 0) nextErrors.items = "En az bir urun kalemi eklenmeli.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitPackage = async () => {
    setFormError("");
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: toNumberOrNull(item.quantity) ?? 1,
        })),
      };
      if (editingId) {
        await updateProductPackage(editingId, { ...payload, isActive: editingIsActive });
      } else {
        await createProductPackage(payload);
      }
      setDrawerOpen(false);
      await fetchPackages();
    } catch {
      setFormError(
        editingId
          ? "Paket guncellenemedi. Lutfen tekrar deneyin."
          : "Paket olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitPackage();
  };

  const onToggleActive = async (pkg: ProductPackage, next: boolean) => {
    setTogglingIds((prev) => [...prev, pkg.id]);
    try {
      await updateProductPackage(pkg.id, {
        name: pkg.name,
        code: pkg.code,
        isActive: next,
        items: (pkg.items ?? []).map((item) => ({
          productVariantId: item.productVariant.id,
          quantity: item.quantity,
        })),
      });
      await fetchPackages();
    } catch {
      setError("Paket durumu guncellenemedi. Lutfen tekrar deneyin.");
    } finally {
      setTogglingIds((prev) => prev.filter((id) => id !== pkg.id));
    }
  };

  const clearAdvancedFilters = () => setStatusFilter("all");

  const onToggleExpand = (packageId: string) => {
    setExpandedPackageIds((prev) => (
      prev.includes(packageId) ? prev.filter((id) => id !== packageId) : [...prev, packageId]
    ));
  };

  const footer = meta ? (
    <TablePagination
      page={currentPage}
      totalPages={totalPages}
      total={meta.total}
      pageSize={pageSize}
      pageSizeId="product-packages-page-size"
      loading={loading}
      onPageChange={goToPage}
      onPageSizeChange={onChangePageSize}
    />
  ) : null;

  if (!accessChecked) {
    return (
      <div className="rounded-xl2 border border-border bg-surface px-4 py-6 text-sm text-muted">
        Sayfa hazirlaniyor...
      </div>
    );
  }

  return (
    <PageShell
      error={error}
      filters={
        <ProductPackagesFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters((prev) => !prev)}
          onCreate={onOpenDrawer}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={clearAdvancedFilters}
        />
      }
    >
      {isMobile ? (
        <PackagesMobileList
          loading={loading}
          error={error}
          packages={packages}
          expandedPackageIds={expandedPackageIds}
          togglingIds={togglingIds}
          onToggleExpand={onToggleExpand}
          onEditPackage={(id) => void onEditPackage(id)}
          onToggleActive={(pkg, next) => void onToggleActive(pkg, next)}
          footer={footer}
        />
      ) : (
        <ProductPackagesTable
          loading={loading}
          error={error}
          packages={packages}
          expandedPackageIds={expandedPackageIds}
          togglingIds={togglingIds}
          onToggleExpand={onToggleExpand}
          onEditPackage={(id) => void onEditPackage(id)}
          onToggleActive={(pkg, next) => void onToggleActive(pkg, next)}
          footer={footer}
        />
      )}

      {isMobile ? (
        <PackagesTaskFlow
          open={drawerOpen}
          editingId={editingId}
          loadingDetail={loadingDetail}
          submitting={submitting}
          form={form}
          errors={errors}
          items={items}
          variantSearchTerm={variantSearchTerm}
          onVariantSearchTermChange={(value) => {
            setVariantSearchTerm(value);
            setSelectedProductForVariant("");
            setSelectedVariantIds([]);
          }}
          variantSearchLoading={variantSearchLoading}
          variantSearchProducts={variantSearchProducts}
          selectedProductForVariant={selectedProductForVariant}
          onSelectProduct={onSelectProduct}
          variantOptions={variantOptions}
          variantsLoading={variantsLoading}
          selectedVariantIds={selectedVariantIds}
          onSelectedVariantIdsChange={setSelectedVariantIds}
          addItemQuantity={addItemQuantity}
          onAddItemQuantityChange={setAddItemQuantity}
          addItemError={addItemError}
          formError={formError}
          onFormChange={onFormChange}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onItemQuantityChange={onItemQuantityChange}
          onClose={onCloseDrawer}
          onSubmit={() => void submitPackage()}
        />
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={onCloseDrawer}
          side="right"
          title={editingId ? "Paketi Guncelle" : "Yeni Paket Olustur"}
          description={
            editingId
              ? "Paket bilgilerini ve icerigini guncelleyin"
              : "Paket bilgilerini ve urun kalemlerini tanimlayin"
          }
          closeDisabled={submitting || loadingDetail}
          className="!max-w-[560px]"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                label="Iptal"
                type="button"
                onClick={onCloseDrawer}
                disabled={submitting || loadingDetail}
                variant="secondary"
              />
              <Button
                label={submitting ? (editingId ? "Guncelleniyor..." : "Olusturuluyor...") : "Kaydet"}
                type="submit"
                form="package-form"
                disabled={submitting || loadingDetail}
                variant="primarySolid"
              />
            </div>
          }
        >
          <form id="package-form" onSubmit={(event) => void onSubmit(event)} className="space-y-4 p-5">
            {loadingDetail ? (
              <div className="text-sm text-muted">Paket detayi yukleniyor...</div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Paket Adi *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => onFormChange("name", event.target.value)}
                    placeholder="Kiyafet Paketi S/M/L"
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <FieldError error={errors.name} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Paket Kodu *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(event) => onFormChange("code", event.target.value)}
                    placeholder="PKG-001"
                    className="h-10 w-full rounded-xl border border-border bg-surface px-3 font-mono text-sm text-text outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <FieldError error={errors.code} />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted">Aciklama</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => onFormChange("description", event.target.value)}
                    placeholder="S, M, L bedenlerinden birer adet icerir"
                    className="min-h-[80px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                  />
                </div>

                <div className="space-y-3 border-t border-border pt-4">
                  <div>
                    <h3 className="text-sm font-semibold text-text">Paket Kalemleri</h3>
                    <p className="mt-0.5 text-xs text-muted">Pakete eklenecek urun varyantlarini ve miktarlarini tanimlayin</p>
                  </div>

                  <FieldError error={errors.items} />

                  {items.length > 0 ? (
                    <div className="divide-y divide-border rounded-xl border border-border bg-surface2/30">
                      {items.map((item) => (
                        <div key={item.rowId} className="flex items-center gap-3 px-3 py-2.5">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm text-text">{item.variantLabel}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="whitespace-nowrap text-xs text-muted">Adet:</label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(event) => onItemQuantityChange(item.rowId, event.target.value)}
                              className="h-8 w-20 rounded-lg border border-border bg-surface px-2 text-sm text-text outline-none focus:border-primary"
                            />
                            <button
                              type="button"
                              onClick={() => onRemoveItem(item.rowId)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-error transition-colors hover:bg-error/10"
                              title="Kalemi kaldir"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="space-y-3 rounded-xl2 border border-dashed border-border bg-surface2/20 p-3">
                    <p className="text-xs font-semibold text-muted">Varyant Ekle</p>

                    <div className="space-y-1">
                      <label className="text-xs text-muted">Urun Ara</label>
                      <input
                        type="text"
                        placeholder="Urun adi veya SKU..."
                        value={variantSearchTerm}
                        onChange={(event) => {
                          setVariantSearchTerm(event.target.value);
                          setSelectedProductForVariant("");
                          setSelectedVariantIds([]);
                        }}
                        className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      {variantSearchLoading ? <p className="text-xs text-muted">Araniyor...</p> : null}
                      {!variantSearchLoading && variantSearchProducts.length > 0 && !selectedProductForVariant ? (
                        <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface shadow-md">
                          {variantSearchProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => onSelectProduct(product)}
                              className="w-full px-3 py-2 text-left text-sm text-text2 transition-colors hover:bg-surface2 hover:text-text"
                            >
                              <span className="font-medium">{product.name}</span>
                              <span className="ml-2 text-xs text-muted">({product.sku})</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {selectedProductForVariant ? (
                      <div className="space-y-1">
                        <label className="text-xs text-muted">Varyantlari Sec</label>
                        {variantsLoading ? (
                          <p className="text-xs text-muted">Varyantlar yukleniyor...</p>
                        ) : variantOptions.length === 0 ? (
                          <p className="text-xs text-muted">Bu urun icin aktif varyant bulunamadi.</p>
                        ) : (
                          <SearchableMultiSelectDropdown
                            options={variantOptions.filter(
                              (option) =>
                                selectedVariantIds.includes(option.value) ||
                                !items.some((item) => item.productVariantId === option.value),
                            )}
                            values={selectedVariantIds}
                            onChange={setSelectedVariantIds}
                            placeholder="Varyantlari secin..."
                            noResultsText="Secilebilir varyant kalmadi."
                          />
                        )}
                      </div>
                    ) : null}

                    {selectedVariantIds.length > 0 ? (
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="text-xs text-muted">Miktar (paket basina adet)</label>
                          <input
                            type="number"
                            min="1"
                            value={addItemQuantity}
                            onChange={(event) => setAddItemQuantity(event.target.value)}
                            className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary"
                          />
                        </div>
                        <Button
                          label={`Secilenleri Ekle (${selectedVariantIds.length})`}
                          type="button"
                          onClick={onAddItem}
                          variant="primarySoft"
                          className="h-9 px-4 py-0"
                        />
                      </div>
                    ) : null}

                    <FieldError error={addItemError} />
                  </div>
                </div>

                {formError ? <p className="text-sm text-error">{formError}</p> : null}
              </>
            )}
          </form>
        </Drawer>
      )}
    </PageShell>
  );
}
