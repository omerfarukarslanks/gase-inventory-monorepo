import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createProductPackage,
  getProductPackageById,
  getProductPackages,
  getProducts,
  getProductVariants,
  updateProductPackage,
  type Product,
  type ProductPackage,
  type ProductVariant,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  InlineFieldError,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StatusBadge,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";
import { formatCurrency, formatDate, toNumber } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

type PackageForm = {
  name: string;
  code: string;
  description: string;
};

type PackageItemRow = {
  rowId: string;
  productVariantId: string;
  variantLabel: string;
  quantity: string;
};

type ProductPackagesScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

const emptyForm: PackageForm = {
  name: "",
  code: "",
  description: "",
};

function createRowId() {
  return `pkg-row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function validateItemQuantity(value: string) {
  if (!value.trim()) return "Miktar zorunlu.";
  const quantity = toNumber(value, Number.NaN);
  if (!Number.isFinite(quantity)) return "Gecerli bir miktar girin.";
  return quantity > 0 ? "" : "Miktar en az 1 olmali.";
}

export default function ProductPackagesScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: ProductPackagesScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [packages, setPackages] = useState<ProductPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorLoading, setEditorLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [items, setItems] = useState<PackageItemRow[]>([]);
  const [variantSearchTerm, setVariantSearchTerm] = useState("");
  const [variantSearchLoading, setVariantSearchLoading] = useState(false);
  const [variantSearchProducts, setVariantSearchProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductLabel, setSelectedProductLabel] = useState("");
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [addItemQuantity, setAddItemQuantity] = useState("1");
  const [addItemError, setAddItemError] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const debouncedVariantSearch = useDebouncedValue(variantSearchTerm, 350);
  const codeRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif paketler";
    if (statusFilter === "false") return "Pasif paketler";
    return "Tum paketler";
  }, [statusFilter]);
  const hasFilters = Boolean(search.trim() || statusFilter !== "all");
  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Paket adi zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Paket adi en az 2 karakter olmali.";
  }, [form.name, formAttempted]);
  const codeError = useMemo(() => {
    if (!formAttempted && !form.code.trim()) return "";
    return form.code.trim() ? "" : "Paket kodu zorunlu.";
  }, [form.code, formAttempted]);
  const itemErrors = useMemo(
    () =>
      Object.fromEntries(items.map((item) => [item.rowId, validateItemQuantity(item.quantity)])) as Record<
        string,
        string
      >,
    [items],
  );
  const itemsError = useMemo(() => {
    if (!formAttempted) return "";
    if (!items.length) return "En az bir paket kalemi ekle.";
    const hasInvalidItem = items.some((item) => itemErrors[item.rowId]);
    return hasInvalidItem ? "Kalem miktarlarini duzelt." : "";
  }, [formAttempted, itemErrors, items]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProductPackages({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setPackages(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paketler yuklenemedi.");
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchPackages();
  }, [fetchPackages, isActive]);

  useEffect(() => {
    if (!editorOpen) return;
    if (!debouncedVariantSearch.trim()) {
      setVariantSearchProducts([]);
      return;
    }

    let cancelled = false;
    setVariantSearchLoading(true);
    getProducts({
      page: 1,
      limit: 20,
      search: debouncedVariantSearch,
      isActive: true,
    })
      .then((response) => {
        if (!cancelled) setVariantSearchProducts(response.data ?? []);
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
  }, [debouncedVariantSearch, editorOpen]);

  useEffect(() => {
    if (!editorOpen) return;
    if (!selectedProductId) {
      setVariantOptions([]);
      setSelectedVariantId("");
      return;
    }

    let cancelled = false;
    setVariantsLoading(true);
    getProductVariants(selectedProductId, { isActive: true })
      .then((variants) => {
        if (!cancelled) {
          const nextVariants = variants.filter((variant) => variant.isActive !== false);
          setVariantOptions(nextVariants);
          setSelectedVariantId((current) => current || nextVariants[0]?.id || "");
        }
      })
      .catch(() => {
        if (!cancelled) setVariantOptions([]);
      })
      .finally(() => {
        if (!cancelled) setVariantsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editorOpen, selectedProductId]);

  const resetVariantPicker = useCallback(() => {
    setVariantSearchTerm("");
    setVariantSearchProducts([]);
    setSelectedProductId("");
    setSelectedProductLabel("");
    setVariantOptions([]);
    setSelectedVariantId("");
    setAddItemQuantity("1");
    setAddItemError("");
  }, []);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingId(null);
    setEditingIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
    setItems([]);
    resetVariantPicker();
  }, [resetVariantPicker]);

  const openPackage = useCallback(async (packageId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getProductPackageById(packageId);
      setSelectedPackage(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paket detayi getirilemedi.");
      setSelectedPackage(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const populateEditorFromPackage = useCallback((detail: ProductPackage) => {
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
    setFormAttempted(false);
    setFormError("");
    resetVariantPicker();
    setEditorOpen(true);
  }, [resetVariantPicker]);

  const openCreateModal = useCallback(() => {
    setEditorLoading(false);
    setEditingId(null);
    setEditingIsActive(true);
    setForm(emptyForm);
    setItems([]);
    setFormAttempted(false);
    setFormError("");
    resetVariantPicker();
    setEditorOpen(true);
  }, [resetVariantPicker]);

  const openEditModal = useCallback(async (packageId: string) => {
    setEditorLoading(true);
    setFormError("");
    setEditorOpen(true);
    try {
      const detail = await getProductPackageById(packageId);
      populateEditorFromPackage(detail);
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Paket detayi yuklenemedi.");
    } finally {
      setEditorLoading(false);
    }
  }, [populateEditorFromPackage]);

  const addVariantItem = () => {
    setAddItemError("");
    if (!selectedVariantId) {
      setAddItemError("Paket icin bir varyant sec.");
      return;
    }

    const quantityError = validateItemQuantity(addItemQuantity);
    if (quantityError) {
      setAddItemError(quantityError);
      return;
    }

    if (items.some((item) => item.productVariantId === selectedVariantId)) {
      setAddItemError("Bu varyant pakete zaten eklendi.");
      return;
    }

    const variant = variantOptions.find((item) => item.id === selectedVariantId);
    if (!variant) {
      setAddItemError("Secilen varyant tekrar yuklenemedi.");
      return;
    }

    setItems((current) => [
      ...current,
      {
        rowId: createRowId(),
        productVariantId: variant.id,
        variantLabel: `${variant.name} (${variant.code})`,
        quantity: addItemQuantity,
      },
    ]);
    setSelectedVariantId("");
    setAddItemQuantity("1");
  };

  const submitPackage = async () => {
    setFormAttempted(true);

    if (nameError || codeError || itemsError) {
      trackEvent("validation_error", { screen: "product_packages", field: "package_form" });
      setFormError("Paket alanlarini duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || undefined,
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: toNumber(item.quantity),
        })),
      };

      if (editingId) {
        const updated = await updateProductPackage(editingId, {
          ...payload,
          isActive: editingIsActive,
        });
        setSelectedPackage(updated);
      } else {
        await createProductPackage(payload);
      }

      resetEditor();
      await fetchPackages();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Paket kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePackageActive = async () => {
    if (!selectedPackage) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateProductPackage(selectedPackage.id, {
        name: selectedPackage.name,
        code: selectedPackage.code,
        description: selectedPackage.description ?? undefined,
        isActive: !(selectedPackage.isActive ?? true),
        items: (selectedPackage.items ?? []).map((item) => ({
          productVariantId: item.productVariant.id,
          quantity: item.quantity,
        })),
      });
      setSelectedPackage(updated);
      await fetchPackages();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Paket durumu guncellenemedi.");
    } finally {
      setToggling(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedPackage || detailLoading) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedPackage?.name ?? "Paket detayi"}
            subtitle="Paket icerigi ve operasyon bilgisi"
            onBack={() => {
              setSelectedPackage(null);
              setError("");
            }}
            action={
              canUpdate && selectedPackage ? (
                <Button
                  label="Duzenle"
                  onPress={() => void openEditModal(selectedPackage.id)}
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                />
              ) : undefined
            }
          />

          {error ? <Banner text={error} /> : null}

          {detailLoading ? (
            <View style={styles.loadingList}>
              <SkeletonBlock height={96} />
              <SkeletonBlock height={88} />
              <SkeletonBlock height={88} />
            </View>
          ) : selectedPackage ? (
            <>
              <Card>
                <SectionTitle title="Paket ozeti" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedPackage.isActive === false ? "pasif" : "aktif"}
                      tone={selectedPackage.isActive === false ? "neutral" : "positive"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kod</Text>
                    <Text style={styles.detailValue}>{selectedPackage.code}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Aciklama</Text>
                    <Text style={styles.detailValue}>
                      {selectedPackage.description ?? "Aciklama yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Satis fiyati</Text>
                    <Text style={styles.detailValue}>
                      {selectedPackage.defaultSalePrice != null
                        ? formatCurrency(
                            selectedPackage.defaultSalePrice,
                            (selectedPackage.defaultCurrency as "TRY" | "USD" | "EUR" | undefined) ?? "TRY",
                          )
                        : "Tanimli degil"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Varyant sayisi</Text>
                    <Text style={styles.detailValue}>
                      {selectedPackage.items?.length ?? 0}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedPackage.createdAt)}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title={`Paket kalemleri (${selectedPackage.items?.length ?? 0})`} />
                {(selectedPackage.items ?? []).length ? (
                  <View style={styles.list}>
                    {(selectedPackage.items ?? []).map((item) => (
                      <ListRow
                        key={item.id}
                        title={item.productVariant.name}
                        subtitle={item.productVariant.code}
                        caption={`${item.quantity} adet / paket`}
                        badgeLabel={item.productVariant.isActive === false ? "pasif" : "aktif"}
                        badgeTone={item.productVariant.isActive === false ? "neutral" : "info"}
                        icon={
                          <MaterialCommunityIcons
                            name="package-variant"
                            size={20}
                            color={mobileTheme.colors.brand.primary}
                          />
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyStateWithAction
                    title="Paket kalemi yok."
                    subtitle="Duzenleme ekranindan bu pakete varyant ekleyebilirsin."
                    actionLabel="Duzenle"
                    onAction={() => void openEditModal(selectedPackage.id)}
                  />
                )}
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Paket detayi getirilemedi."
              subtitle="Listeye donup paketi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedPackage(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedPackage(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedPackage ? (
            <Button
              label={selectedPackage.isActive === false ? "Aktif et" : "Pasife al"}
              onPress={() => void togglePackageActive()}
              variant={selectedPackage.isActive === false ? "secondary" : "danger"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <ProductPackageEditor
          visible={editorOpen}
          loadingDetail={editorLoading}
          form={form}
          nameError={nameError}
          codeError={codeError}
          itemsError={itemsError}
          formError={formError}
          items={items}
          itemErrors={itemErrors}
          editingId={editingId}
          editingIsActive={editingIsActive}
          submitting={submitting}
          canUpdate={canUpdate}
          variantSearchTerm={variantSearchTerm}
          variantSearchLoading={variantSearchLoading}
          variantSearchProducts={variantSearchProducts}
          selectedProductId={selectedProductId}
          selectedProductLabel={selectedProductLabel}
          variantsLoading={variantsLoading}
          variantOptions={variantOptions}
          selectedVariantId={selectedVariantId}
          addItemQuantity={addItemQuantity}
          addItemError={addItemError}
          codeRef={codeRef}
          descriptionRef={descriptionRef}
          onClose={resetEditor}
          onSubmit={() => void submitPackage()}
          onToggleActive={() => setEditingIsActive((current) => !current)}
          onFormChange={(field, value) => {
            setForm((current) => ({ ...current, [field]: value }));
            if (formError) setFormError("");
          }}
          onSearchProducts={(value) => {
            setAddItemError("");
            setVariantSearchTerm(value);
          }}
          onSelectProduct={(product) => {
            setSelectedProductId(product.id);
            setSelectedProductLabel(product.name);
            setSelectedVariantId("");
            setAddItemError("");
          }}
          onSelectVariant={(value) => {
            setAddItemError("");
            setSelectedVariantId(value);
          }}
          onAddItemQuantityChange={(value) => {
            setAddItemError("");
            setAddItemQuantity(value);
          }}
          onAddItem={addVariantItem}
          onRemoveItem={(rowId) => setItems((current) => current.filter((item) => item.rowId !== rowId))}
          onChangeItemQuantity={(rowId, value) =>
            setItems((current) =>
              current.map((item) => (item.rowId === rowId ? { ...item, quantity: value } : item)),
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Urun paketleri"
          subtitle="Toptan satis icin paket tanimlarini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void fetchPackages()}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Paket adi veya kod ara"
            />
            <FilterTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          </View>
        </Card>
      </View>

      {loading ? (
        <View style={styles.listWrap}>
          <View style={styles.loadingList}>
            <SkeletonBlock height={82} />
            <SkeletonBlock height={82} />
            <SkeletonBlock height={82} />
          </View>
        </View>
      ) : (
        <FlatList
          data={packages}
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
                  <Text style={styles.detailValue}>{packages.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum paketler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code} • ${item.items?.length ?? 0} kalem`}
              caption={item.description ?? "Aciklama yok"}
              badgeLabel={item.isActive === false ? "pasif" : "aktif"}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => void openPackage(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="package-variant-closed"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Paket listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchPackages()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun paket yok." : "Paket bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Toptan satis akisi icin yeni paket olusturabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni paket" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "product_packages",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  if (canCreate) {
                    openCreateModal();
                    return;
                  }
                  void fetchPackages();
                }}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={resetFilters} variant="ghost" />
        {canCreate ? (
          <Button
            label="Yeni paket"
            onPress={openCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={() => void fetchPackages()} variant="secondary" />
        )}
      </StickyActionBar>

      <ProductPackageEditor
        visible={editorOpen}
        loadingDetail={editorLoading}
        form={form}
        nameError={nameError}
        codeError={codeError}
        itemsError={itemsError}
        formError={formError}
        items={items}
        itemErrors={itemErrors}
        editingId={editingId}
        editingIsActive={editingIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        variantSearchTerm={variantSearchTerm}
        variantSearchLoading={variantSearchLoading}
        variantSearchProducts={variantSearchProducts}
        selectedProductId={selectedProductId}
        selectedProductLabel={selectedProductLabel}
        variantsLoading={variantsLoading}
        variantOptions={variantOptions}
        selectedVariantId={selectedVariantId}
        addItemQuantity={addItemQuantity}
        addItemError={addItemError}
        codeRef={codeRef}
        descriptionRef={descriptionRef}
        onClose={resetEditor}
        onSubmit={() => void submitPackage()}
        onToggleActive={() => setEditingIsActive((current) => !current)}
        onFormChange={(field, value) => {
          setForm((current) => ({ ...current, [field]: value }));
          if (formError) setFormError("");
        }}
        onSearchProducts={(value) => {
          setAddItemError("");
          setVariantSearchTerm(value);
        }}
        onSelectProduct={(product) => {
          setSelectedProductId(product.id);
          setSelectedProductLabel(product.name);
          setSelectedVariantId("");
          setAddItemError("");
        }}
        onSelectVariant={(value) => {
          setAddItemError("");
          setSelectedVariantId(value);
        }}
        onAddItemQuantityChange={(value) => {
          setAddItemError("");
          setAddItemQuantity(value);
        }}
        onAddItem={addVariantItem}
        onRemoveItem={(rowId) => setItems((current) => current.filter((item) => item.rowId !== rowId))}
        onChangeItemQuantity={(rowId, value) =>
          setItems((current) =>
            current.map((item) => (item.rowId === rowId ? { ...item, quantity: value } : item)),
          )
        }
      />
    </View>
  );
}

function ProductPackageEditor({
  visible,
  loadingDetail,
  form,
  nameError,
  codeError,
  itemsError,
  formError,
  items,
  itemErrors,
  editingId,
  editingIsActive,
  submitting,
  canUpdate,
  variantSearchTerm,
  variantSearchLoading,
  variantSearchProducts,
  selectedProductId,
  selectedProductLabel,
  variantsLoading,
  variantOptions,
  selectedVariantId,
  addItemQuantity,
  addItemError,
  codeRef,
  descriptionRef,
  onClose,
  onSubmit,
  onToggleActive,
  onFormChange,
  onSearchProducts,
  onSelectProduct,
  onSelectVariant,
  onAddItemQuantityChange,
  onAddItem,
  onRemoveItem,
  onChangeItemQuantity,
}: {
  visible: boolean;
  loadingDetail: boolean;
  form: PackageForm;
  nameError: string;
  codeError: string;
  itemsError: string;
  formError: string;
  items: PackageItemRow[];
  itemErrors: Record<string, string>;
  editingId: string | null;
  editingIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  variantSearchTerm: string;
  variantSearchLoading: boolean;
  variantSearchProducts: Product[];
  selectedProductId: string;
  selectedProductLabel: string;
  variantsLoading: boolean;
  variantOptions: ProductVariant[];
  selectedVariantId: string;
  addItemQuantity: string;
  addItemError: string;
  codeRef: { current: TextInput | null };
  descriptionRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onFormChange: <K extends keyof PackageForm>(field: K, value: PackageForm[K]) => void;
  onSearchProducts: (value: string) => void;
  onSelectProduct: (product: Product) => void;
  onSelectVariant: (variantId: string) => void;
  onAddItemQuantityChange: (value: string) => void;
  onAddItem: () => void;
  onRemoveItem: (rowId: string) => void;
  onChangeItemQuantity: (rowId: string, value: string) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingId ? "Paketi duzenle" : "Yeni paket"}
      subtitle="Paket bilgilerini ve kalemlerini guncelle"
      onClose={onClose}
    >
      {loadingDetail ? (
        <View style={styles.loadingList}>
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
          <SkeletonBlock height={72} />
        </View>
      ) : (
        <>
          {formError ? <Banner text={formError} /> : null}
          <TextField
            label="Paket adi"
            value={form.name}
            onChangeText={(value) => onFormChange("name", value)}
            errorText={nameError || undefined}
            returnKeyType="next"
            onSubmitEditing={() => codeRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Paket kodu"
            value={form.code}
            onChangeText={(value) => onFormChange("code", value)}
            errorText={codeError || undefined}
            inputRef={codeRef}
            autoCapitalize="none"
            returnKeyType="next"
            onSubmitEditing={() => descriptionRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Aciklama"
            value={form.description}
            onChangeText={(value) => onFormChange("description", value)}
            inputRef={descriptionRef}
            multiline
            helperText="Opsiyonel. Paket icindeki varyant setini aciklamak icin kullan."
          />

          <Card>
            <SectionTitle title="Varyant ekle" />
            <View style={styles.modalSection}>
              <SearchBar
                value={variantSearchTerm}
                onChangeText={onSearchProducts}
                placeholder="Urun ara"
                hint="Once urun sec, sonra ilgili varyanti pakete ekle."
              />
              {variantSearchLoading ? (
                <View style={styles.loadingList}>
                  <SkeletonBlock height={64} />
                  <SkeletonBlock height={64} />
                </View>
              ) : variantSearchTerm.trim() ? (
                variantSearchProducts.length ? (
                  <View style={styles.list}>
                    {variantSearchProducts.map((product) => (
                      <ListRow
                        key={product.id}
                        title={product.name}
                        subtitle={product.sku}
                        caption={selectedProductId === product.id ? "Secili urun" : "Varyantlarini goster"}
                        badgeLabel={selectedProductId === product.id ? "secili" : "urun"}
                        badgeTone={selectedProductId === product.id ? "info" : "neutral"}
                        onPress={() => onSelectProduct(product)}
                        icon={
                          <MaterialCommunityIcons
                            name="package-variant-closed"
                            size={20}
                            color={mobileTheme.colors.brand.primary}
                          />
                        }
                      />
                    ))}
                  </View>
                ) : (
                  <EmptyStateWithAction
                    title="Urun bulunamadi."
                    subtitle="Farkli bir arama ile tekrar dene."
                    actionLabel="Aramayi temizle"
                    onAction={() => onSearchProducts("")}
                  />
                )
              ) : null}

              {selectedProductId ? (
                <>
                  <Text style={styles.selectedHint}>
                    Secili urun: {selectedProductLabel}
                  </Text>
                  {variantsLoading ? (
                    <View style={styles.loadingList}>
                      <SkeletonBlock height={64} />
                      <SkeletonBlock height={64} />
                    </View>
                  ) : variantOptions.length ? (
                    <>
                      <FilterTabs
                        value={selectedVariantId || variantOptions[0]?.id || ""}
                        options={variantOptions.map((variant) => ({
                          label: variant.name,
                          value: variant.id,
                        }))}
                        onChange={onSelectVariant}
                      />
                      <TextField
                        label="Paket basina miktar"
                        value={addItemQuantity}
                        onChangeText={onAddItemQuantityChange}
                        keyboardType="numeric"
                        inputMode="numeric"
                        errorText={addItemError || undefined}
                      />
                      <Button
                        label="Varyanti ekle"
                        onPress={onAddItem}
                        variant="secondary"
                      />
                    </>
                  ) : (
                    <EmptyStateWithAction
                      title="Aktif varyant bulunamadi."
                      subtitle="Secili urunde pakete eklenebilir varyant yok."
                      actionLabel="Farkli urun sec"
                      onAction={() => onSearchProducts("")}
                    />
                  )}
                </>
              ) : null}
            </View>
          </Card>

          <Card>
            <SectionTitle title={`Paket kalemleri (${items.length})`} />
            <View style={styles.modalSection}>
              <InlineFieldError text={itemsError} />
              {items.length ? (
                items.map((item) => (
                  <Card key={item.rowId} style={styles.itemCard}>
                    <Text style={styles.itemTitle}>{item.variantLabel}</Text>
                    <TextField
                      label="Miktar"
                      value={item.quantity}
                      onChangeText={(value) => onChangeItemQuantity(item.rowId, value)}
                      keyboardType="numeric"
                      inputMode="numeric"
                      errorText={itemErrors[item.rowId] || undefined}
                    />
                    <Button
                      label="Kalemi cikar"
                      onPress={() => onRemoveItem(item.rowId)}
                      variant="ghost"
                    />
                  </Card>
                ))
              ) : (
                <EmptyStateWithAction
                  title="Henuz paket kalemi yok."
                  subtitle="Ustteki arama ile urun bulup varyant ekle."
                  actionLabel="Aramaya odaklan"
                  onAction={() => onSearchProducts(variantSearchTerm)}
                />
              )}
            </View>
          </Card>

          {editingId && canUpdate ? (
            <Button
              label={editingIsActive ? "Paketi pasif yap" : "Paketi aktif yap"}
              onPress={onToggleActive}
              variant={editingIsActive ? "ghost" : "secondary"}
            />
          ) : null}
          <Button
            label={editingId ? "Degisiklikleri kaydet" : "Paketi kaydet"}
            onPress={onSubmit}
            loading={submitting}
            disabled={Boolean(nameError || codeError || itemsError)}
          />
        </>
      )}
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
    paddingBottom: 12,
  },
  list: {
    gap: 12,
  },
  summaryStats: {
    marginTop: 12,
    gap: 12,
  },
  summaryStat: {
    gap: 4,
  },
  detailStats: {
    marginTop: 12,
    gap: 12,
  },
  detailStat: {
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
  modalSection: {
    marginTop: 12,
    gap: 12,
  },
  selectedHint: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
  },
  itemCard: {
    gap: 12,
  },
  itemTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
