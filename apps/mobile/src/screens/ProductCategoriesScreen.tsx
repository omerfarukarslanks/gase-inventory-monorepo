import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createProductCategory,
  getAllProductCategories,
  getProductCategoriesPaginated,
  getProductCategoryById,
  updateProductCategory,
  type ProductCategory,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SelectionList,
  SkeletonBlock,
  StatusBadge,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { trackEvent } from "@/src/lib/analytics";
import { formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  parentId: string;
};

type ProductCategoriesScreenProps = {
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

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  parentId: "",
};

const rootCategoryValue = "__root__";

function slugifyText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[ç]/g, "c")
    .replace(/[ğ]/g, "g")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ş]/g, "s")
    .replace(/[ü]/g, "u")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ProductCategoriesScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: ProductCategoriesScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [allCategories, setAllCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryIsActive, setEditingCategoryIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [parentSearch, setParentSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const debouncedParentSearch = useDebouncedValue(parentSearch, 150);
  const slugRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif kategoriler";
    if (statusFilter === "false") return "Pasif kategoriler";
    return "Tum kategoriler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const parentNameMap = useMemo(() => {
    const map = new Map<string, string>();
    allCategories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [allCategories]);

  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Kategori adi zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Kategori adi en az 2 karakter olmali.";
  }, [form.name, formAttempted]);

  const slugError = useMemo(() => {
    if (!formAttempted && !form.slug.trim()) return "";
    const trimmedSlug = form.slug.trim();
    if (!trimmedSlug) return "Slug alani zorunlu.";
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmedSlug)
      ? ""
      : "Slug sadece kucuk harf, rakam ve tire icerebilir.";
  }, [form.slug, formAttempted]);

  const parentError = useMemo(() => {
    if (!editingCategoryId || !form.parentId) return "";
    return editingCategoryId === form.parentId
      ? "Bir kategori kendisini ust kategori secemez."
      : "";
  }, [editingCategoryId, form.parentId]);

  const selectedParentLabel = useMemo(() => {
    if (!form.parentId) return "Kok kategori";
    return parentNameMap.get(form.parentId) ?? "Secili kategori bulunamadi";
  }, [form.parentId, parentNameMap]);

  const parentSelectionItems = useMemo(() => {
    const normalizedSearch = debouncedParentSearch.trim().toLowerCase();
    const parentOptions = allCategories
      .filter((category) => category.id !== editingCategoryId)
      .filter((category) => {
        if (!normalizedSearch) return true;
        return [category.name, category.slug, category.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .map((category) => ({
        value: category.id,
        label: category.name,
        description: [
          category.slug ? `Slug: ${category.slug}` : null,
          category.isActive === false ? "Pasif" : "Aktif",
        ]
          .filter(Boolean)
          .join(" • "),
      }));

    return [
      {
        value: rootCategoryValue,
        label: "Kok kategori",
        description: "Bu kaydi ust seviye kategori olarak tut.",
      },
      ...parentOptions,
    ];
  }, [allCategories, debouncedParentSearch, editingCategoryId]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getProductCategoriesPaginated({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setCategories(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Kategoriler yuklenemedi.");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchAllCategories = useCallback(async () => {
    try {
      const response = await getAllProductCategories({
        isActive: "all",
        sortBy: "name",
        sortOrder: "ASC",
      });
      setAllCategories(response ?? []);
    } catch {
      setAllCategories([]);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void fetchCategories();
  }, [fetchCategories, isActive]);

  useEffect(() => {
    if (!isActive) return;
    void fetchAllCategories();
  }, [fetchAllCategories, isActive]);

  const openCategory = useCallback(async (categoryId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getProductCategoryById(categoryId);
      setSelectedCategory(detail);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Kategori detayi getirilemedi.",
      );
      setSelectedCategory(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingCategoryId(null);
    setEditingCategoryIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
    setSlugTouched(false);
    setParentSearch("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingCategoryId(null);
    setEditingCategoryIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
    setSlugTouched(false);
    setParentSearch("");
  }, []);

  const openEditModal = useCallback((category: ProductCategory) => {
    setEditorOpen(true);
    setEditingCategoryId(category.id);
    setEditingCategoryIsActive(category.isActive ?? true);
    setForm({
      name: category.name ?? "",
      slug: category.slug ?? slugifyText(category.name ?? ""),
      description: category.description ?? "",
      parentId: category.parentId ?? "",
    });
    setFormAttempted(false);
    setFormError("");
    setSlugTouched(true);
    setParentSearch("");
  }, []);

  const submitCategory = async () => {
    setFormAttempted(true);

    if (nameError || slugError || parentError) {
      trackEvent("validation_error", { screen: "product_categories", field: "category_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingCategoryId) {
        const updated = await updateProductCategory(editingCategoryId, {
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId || null,
          isActive: editingCategoryIsActive,
        });
        const refreshed = await getProductCategoryById(updated.id);
        setSelectedCategory(refreshed);
      } else {
        await createProductCategory({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          parentId: form.parentId || null,
          isActive: true,
        });
      }

      resetEditor();
      await Promise.all([fetchCategories(), fetchAllCategories()]);
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Kategori kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCategoryActive = async () => {
    if (!selectedCategory) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateProductCategory(selectedCategory.id, {
        name: selectedCategory.name,
        slug: selectedCategory.slug ?? slugifyText(selectedCategory.name),
        description: selectedCategory.description ?? undefined,
        parentId: selectedCategory.parentId ?? null,
        isActive: !(selectedCategory.isActive ?? true),
      });
      const refreshed = await getProductCategoryById(updated.id);
      setSelectedCategory(refreshed);
      await Promise.all([fetchCategories(), fetchAllCategories()]);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Kategori durumu guncellenemedi.",
      );
    } finally {
      setToggling(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedCategory || detailLoading) {
    const childCategories = selectedCategory?.children ?? [];
    const parentLabel =
      selectedCategory?.parent?.name ??
      (selectedCategory?.parentId ? parentNameMap.get(selectedCategory.parentId) : undefined) ??
      "Kok kategori";

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedCategory?.name ?? "Kategori detayi"}
            subtitle="Hiyerarsi, slug ve durum ozeti"
            onBack={() => {
              setSelectedCategory(null);
              setError("");
            }}
            action={
              canUpdate && selectedCategory ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedCategory)}
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
              <SkeletonBlock height={92} />
              <SkeletonBlock height={88} />
            </View>
          ) : selectedCategory ? (
            <>
              <Card>
                <SectionTitle title="Kategori profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedCategory.isActive === false ? "pasif" : "aktif"}
                      tone={selectedCategory.isActive === false ? "neutral" : "positive"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Slug</Text>
                    <Text style={styles.detailValue}>{selectedCategory.slug ?? "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Ust kategori</Text>
                    <Text style={styles.detailValue}>{parentLabel}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Alt kategori</Text>
                    <Text style={styles.detailValue}>{childCategories.length}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Aciklama</Text>
                    <Text style={styles.detailValue}>
                      {selectedCategory.description ?? "Kayitli aciklama yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedCategory.createdAt)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Guncelleme</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedCategory.updatedAt)}</Text>
                  </View>
                </View>
              </Card>

              {childCategories.length ? (
                <Card>
                  <SectionTitle title="Alt kategoriler" />
                  <View style={styles.childList}>
                    {childCategories.map((child) => (
                      <View key={child.id} style={styles.childRow}>
                        <View style={styles.childCopy}>
                          <Text style={styles.childTitle}>{child.name}</Text>
                          <Text style={styles.childCaption}>{child.slug ?? "slug yok"}</Text>
                        </View>
                        <StatusBadge
                          label={child.isActive === false ? "pasif" : "aktif"}
                          tone={child.isActive === false ? "neutral" : "positive"}
                        />
                      </View>
                    ))}
                  </View>
                </Card>
              ) : null}

              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.mutedText}>
                  Urun filtreleri ve paketleme akislarinda kategori hiyerarsisi bu kayitla
                  belirlenir. Slug ve ust kategori secimini guncel tutmak raporlamayi da
                  duzgunlestirir.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Kategori detayi getirilemedi."
              subtitle="Listeye donup kategoriyi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedCategory(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedCategory(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedCategory ? (
            <Button
              label={selectedCategory.isActive === false ? "Aktif et" : "Pasife al"}
              onPress={() => void toggleCategoryActive()}
              variant={selectedCategory.isActive === false ? "secondary" : "danger"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <CategoryEditor
          visible={editorOpen}
          form={form}
          formError={formError}
          nameError={nameError}
          slugError={slugError}
          parentError={parentError}
          parentSearch={parentSearch}
          parentSelectionItems={parentSelectionItems}
          selectedParentLabel={selectedParentLabel}
          editingCategoryId={editingCategoryId}
          editingCategoryIsActive={editingCategoryIsActive}
          submitting={submitting}
          canUpdate={canUpdate}
          slugRef={slugRef}
          descriptionRef={descriptionRef}
          onClose={resetEditor}
          onSubmit={() => void submitCategory()}
          onToggleActive={() => setEditingCategoryIsActive((current) => !current)}
          onParentSearchChange={setParentSearch}
          onParentSelect={(value) => {
            setForm((current) => ({
              ...current,
              parentId: value === rootCategoryValue ? "" : value,
            }));
            if (formError) setFormError("");
          }}
          onChange={(field, value) => {
            setForm((current) => {
              if (field === "name") {
                const nextName = value;
                return {
                  ...current,
                  name: nextName,
                  slug: slugTouched ? current.slug : slugifyText(nextName),
                };
              }

              return { ...current, [field]: value };
            });
            if (field === "slug") setSlugTouched(true);
            if (formError) setFormError("");
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Urun kategorileri"
          subtitle="Urun hiyerarsisini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void Promise.all([fetchCategories(), fetchAllCategories()])}
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
              placeholder="Kategori adi veya slug ara"
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
          data={categories}
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
                  <Text style={styles.detailValue}>{categories.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum kategoriler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={
                item.parent?.name ??
                (item.parentId ? parentNameMap.get(item.parentId) : undefined) ??
                "Kok kategori"
              }
              caption={[
                item.slug ? `Slug: ${item.slug}` : "Slug yok",
                `${item.children?.length ?? 0} alt kategori`,
              ].join(" • ")}
              badgeLabel={item.isActive === false ? "pasif" : "aktif"}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => void openCategory(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="shape-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Kategori listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void Promise.all([fetchCategories(), fetchAllCategories()])}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun kategori yok." : "Kategori bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni kategori ekleyerek urun hiyerarsisini mobilde de kurabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni kategori" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "product_categories",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  if (canCreate) {
                    openCreateModal();
                    return;
                  }
                  void Promise.all([fetchCategories(), fetchAllCategories()]);
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
            label="Yeni kategori"
            onPress={openCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button
            label="Listeyi yenile"
            onPress={() => void Promise.all([fetchCategories(), fetchAllCategories()])}
            variant="secondary"
          />
        )}
      </StickyActionBar>

      <CategoryEditor
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        slugError={slugError}
        parentError={parentError}
        parentSearch={parentSearch}
        parentSelectionItems={parentSelectionItems}
        selectedParentLabel={selectedParentLabel}
        editingCategoryId={editingCategoryId}
        editingCategoryIsActive={editingCategoryIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        slugRef={slugRef}
        descriptionRef={descriptionRef}
        onClose={resetEditor}
        onSubmit={() => void submitCategory()}
        onToggleActive={() => setEditingCategoryIsActive((current) => !current)}
        onParentSearchChange={setParentSearch}
        onParentSelect={(value) => {
          setForm((current) => ({
            ...current,
            parentId: value === rootCategoryValue ? "" : value,
          }));
          if (formError) setFormError("");
        }}
        onChange={(field, value) => {
          setForm((current) => {
            if (field === "name") {
              const nextName = value;
              return {
                ...current,
                name: nextName,
                slug: slugTouched ? current.slug : slugifyText(nextName),
              };
            }

            return { ...current, [field]: value };
          });
          if (field === "slug") setSlugTouched(true);
          if (formError) setFormError("");
        }}
      />
    </View>
  );
}

function CategoryEditor({
  visible,
  form,
  formError,
  nameError,
  slugError,
  parentError,
  parentSearch,
  parentSelectionItems,
  selectedParentLabel,
  editingCategoryId,
  editingCategoryIsActive,
  submitting,
  canUpdate,
  slugRef,
  descriptionRef,
  onClose,
  onSubmit,
  onToggleActive,
  onParentSearchChange,
  onParentSelect,
  onChange,
}: {
  visible: boolean;
  form: CategoryForm;
  formError: string;
  nameError: string;
  slugError: string;
  parentError: string;
  parentSearch: string;
  parentSelectionItems: { label: string; value: string; description?: string }[];
  selectedParentLabel: string;
  editingCategoryId: string | null;
  editingCategoryIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  slugRef: { current: TextInput | null };
  descriptionRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onParentSearchChange: (value: string) => void;
  onParentSelect: (value: string) => void;
  onChange: (field: keyof CategoryForm, value: string) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingCategoryId ? "Kategoriyi duzenle" : "Yeni kategori"}
      subtitle="Hiyerarsi ve slug bilgisini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Kategori adi"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        onSubmitEditing={() => slugRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Slug"
        value={form.slug}
        onChangeText={(value) => onChange("slug", value)}
        inputRef={slugRef}
        autoCapitalize="none"
        errorText={slugError || undefined}
        helperText="Kucuk harf, rakam ve tire kullan."
        returnKeyType="next"
        onSubmitEditing={() => descriptionRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Aciklama"
        value={form.description}
        onChangeText={(value) => onChange("description", value)}
        inputRef={descriptionRef}
        multiline
        helperText="Opsiyonel. Operasyon ve raporlama notlari icin faydalidir."
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />

      <Card>
        <SectionTitle title="Ust kategori" />
        <Text style={styles.parentValue}>{selectedParentLabel}</Text>
        <Text style={[styles.parentHelper, parentError ? styles.parentHelperError : null]}>
          {parentError || "Opsiyonel. Bu kaydi mevcut bir kategori altina baglayabilirsin."}
        </Text>
        <SearchBar
          value={parentSearch}
          onChangeText={onParentSearchChange}
          placeholder="Ust kategori ara"
          hint="Kok kategori seciliyse kayit ust seviye olarak kalir."
        />
        <SelectionList
          items={parentSelectionItems}
          selectedValue={form.parentId || rootCategoryValue}
          onSelect={onParentSelect}
          emptyText="Eslesen kategori yok."
        />
      </Card>

      {editingCategoryId && canUpdate ? (
        <Button
          label={editingCategoryIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingCategoryIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingCategoryId ? "Degisiklikleri kaydet" : "Kategoriyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || slugError || parentError || !form.name.trim() || !form.slug.trim())}
      />
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
    paddingBottom: 120,
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
  mutedText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  childList: {
    marginTop: 12,
    gap: 10,
  },
  childRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  childCopy: {
    flex: 1,
    gap: 4,
  },
  childTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  childCaption: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  parentValue: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  parentHelper: {
    marginTop: 6,
    marginBottom: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  parentHelperError: {
    color: mobileTheme.colors.brand.error,
  },
});
