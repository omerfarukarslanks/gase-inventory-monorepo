import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createStore,
  getStoreById,
  getStores,
  updateStore,
  type Currency,
  type Store,
  type StoreType,
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

type StoreForm = {
  name: string;
  storeType: StoreType;
  currency: Currency;
  code: string;
  address: string;
  slug: string;
  logo: string;
  description: string;
};

type StoresScreenProps = {
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

const storeTypeOptions = [
  { label: "Perakende", value: "RETAIL" as const },
  { label: "Toptan", value: "WHOLESALE" as const },
];

const currencyOptions = [
  { label: "TRY", value: "TRY" as const },
  { label: "USD", value: "USD" as const },
  { label: "EUR", value: "EUR" as const },
];

const emptyForm: StoreForm = {
  name: "",
  storeType: "RETAIL",
  currency: "TRY",
  code: "",
  address: "",
  slug: "",
  logo: "",
  description: "",
};

function formatStoreType(value: StoreType | null | undefined) {
  return value === "WHOLESALE" ? "Toptan" : "Perakende";
}

export default function StoresScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: StoresScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editingStoreIsActive, setEditingStoreIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<StoreForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [toggling, setToggling] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const codeRef = useRef<TextInput>(null);
  const slugRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);
  const logoRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif magazalar";
    if (statusFilter === "false") return "Pasif magazalar";
    return "Tum magazalar";
  }, [statusFilter]);
  const hasFilters = Boolean(search.trim() || statusFilter !== "all");
  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Magaza adi zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Magaza adi en az 2 karakter olmali.";
  }, [form.name, formAttempted]);
  const canSubmitForm = Boolean(form.name.trim().length >= 2);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getStores({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setStores(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Magazalar yuklenemedi.");
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchStores();
  }, [fetchStores, isActive]);

  const openStore = useCallback(async (storeId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getStoreById(storeId);
      setSelectedStore(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Magaza detayi getirilemedi.");
      setSelectedStore(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openEditModal = useCallback((store: Store) => {
    setEditorOpen(true);
    setEditingStoreId(store.id);
    setEditingStoreIsActive(store.isActive);
    setForm({
      name: store.name ?? "",
      storeType: (store.storeType ?? "RETAIL") as StoreType,
      currency: (store.currency ?? "TRY") as Currency,
      code: store.code ?? "",
      address: store.address ?? "",
      slug: store.slug ?? "",
      logo: store.logo ?? "",
      description: store.description ?? "",
    });
    setFormAttempted(false);
    setFormError("");
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingStoreId(null);
    setEditingStoreIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const submitStore = async () => {
    setFormAttempted(true);

    if (!canSubmitForm || nameError) {
      trackEvent("validation_error", { screen: "stores", field: "store_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingStoreId) {
        const updated = await updateStore(editingStoreId, {
          name: form.name.trim(),
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          slug: form.slug.trim() || undefined,
          logo: form.logo.trim() || undefined,
          description: form.description.trim() || undefined,
          isActive: editingStoreIsActive,
        });
        setSelectedStore(updated);
      } else {
        await createStore({
          name: form.name.trim(),
          storeType: form.storeType,
          currency: form.currency,
          code: form.code.trim() || undefined,
          address: form.address.trim() || undefined,
          slug: form.slug.trim() || undefined,
          logo: form.logo.trim() || undefined,
          description: form.description.trim() || undefined,
        });
      }

      closeEditor();
      await fetchStores();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Magaza kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStoreActive = async () => {
    if (!selectedStore) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateStore(selectedStore.id, {
        name: selectedStore.name,
        code: selectedStore.code || undefined,
        address: selectedStore.address || undefined,
        slug: selectedStore.slug || undefined,
        logo: selectedStore.logo || undefined,
        description: selectedStore.description || undefined,
        isActive: !selectedStore.isActive,
      });
      setSelectedStore(updated);
      await fetchStores();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Magaza durumu guncellenemedi.",
      );
    } finally {
      setToggling(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedStore || detailLoading) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedStore?.name ?? "Magaza detayi"}
            subtitle="Scope, iletisim ve operasyon bilgisi"
            onBack={() => {
              setSelectedStore(null);
              setError("");
            }}
            action={
              canUpdate && selectedStore ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedStore)}
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
            </View>
          ) : selectedStore ? (
            <>
              <Card>
                <SectionTitle title="Magaza profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedStore.isActive ? "aktif" : "pasif"}
                      tone={selectedStore.isActive ? "positive" : "neutral"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kod</Text>
                    <Text style={styles.detailValue}>{selectedStore.code || "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Tip</Text>
                    <Text style={styles.detailValue}>{formatStoreType(selectedStore.storeType)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Para birimi</Text>
                    <Text style={styles.detailValue}>{selectedStore.currency ?? "TRY"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Slug</Text>
                    <Text style={styles.detailValue}>{selectedStore.slug || "-"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Adres</Text>
                    <Text style={styles.detailValue}>{selectedStore.address ?? "Kayitli adres yok"}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Aciklama</Text>
                    <Text style={styles.detailValue}>
                      {selectedStore.description ?? "Kayitli aciklama yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedStore.createdAt)}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.mutedText}>
                  Stok ve satis akislarinda bu magaza scope olarak kullanilir. Kod, slug ve para birimi operasyonel tutarlilik icin guncel tutulmalidir.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Magaza detayi getirilemedi."
              subtitle="Listeye donup magazayi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedStore(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedStore(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedStore ? (
            <Button
              label={selectedStore.isActive ? "Pasife al" : "Aktif et"}
              onPress={() => void toggleStoreActive()}
              variant={selectedStore.isActive ? "danger" : "secondary"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <StoreEditor
          visible={editorOpen}
          form={form}
          formError={formError}
          nameError={nameError}
          editingStoreId={editingStoreId}
          editingStoreIsActive={editingStoreIsActive}
          submitting={submitting}
          canUpdate={canUpdate}
          codeRef={codeRef}
          slugRef={slugRef}
          addressRef={addressRef}
          logoRef={logoRef}
          descriptionRef={descriptionRef}
          onClose={closeEditor}
          onSubmit={() => void submitStore()}
          onToggleActive={() => setEditingStoreIsActive((current) => !current)}
          onChange={(field, value) => {
            setForm((current) => ({ ...current, [field]: value }));
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
          title="Magazalar"
          subtitle="Scope ve operasyon ayarlarini mobilde takip et"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void fetchStores()}
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
              placeholder="Magaza adi, kod veya slug ara"
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
          data={stores}
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
                  <Text style={styles.detailValue}>{stores.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum magazalar"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.code || "-"} • ${formatStoreType(item.storeType)}`}
              caption={`${item.currency ?? "TRY"} • ${item.slug || "slug yok"}`}
              badgeLabel={item.isActive ? "aktif" : "pasif"}
              badgeTone={item.isActive ? "positive" : "neutral"}
              onPress={() => void openStore(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Magaza listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchStores()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun magaza yok." : "Magaza bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni magaza ekleyerek scope yonetimini mobilde de acabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni magaza" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "stores",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  if (canCreate) {
                    openCreateModal();
                    return;
                  }
                  void fetchStores();
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
            label="Yeni magaza"
            onPress={openCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={() => void fetchStores()} variant="secondary" />
        )}
      </StickyActionBar>

      <StoreEditor
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        editingStoreId={editingStoreId}
        editingStoreIsActive={editingStoreIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        codeRef={codeRef}
        slugRef={slugRef}
        addressRef={addressRef}
        logoRef={logoRef}
        descriptionRef={descriptionRef}
        onClose={closeEditor}
        onSubmit={() => void submitStore()}
        onToggleActive={() => setEditingStoreIsActive((current) => !current)}
        onChange={(field, value) => {
          setForm((current) => ({ ...current, [field]: value }));
          if (formError) setFormError("");
        }}
      />
    </View>
  );
}

function StoreEditor({
  visible,
  form,
  formError,
  nameError,
  editingStoreId,
  editingStoreIsActive,
  submitting,
  canUpdate,
  codeRef,
  slugRef,
  addressRef,
  logoRef,
  descriptionRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: {
  visible: boolean;
  form: StoreForm;
  formError: string;
  nameError: string;
  editingStoreId: string | null;
  editingStoreIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  codeRef: { current: TextInput | null };
  slugRef: { current: TextInput | null };
  addressRef: { current: TextInput | null };
  logoRef: { current: TextInput | null };
  descriptionRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChange: (field: keyof StoreForm, value: StoreForm[keyof StoreForm]) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingStoreId ? "Magazayi duzenle" : "Yeni magaza"}
      subtitle="Scope ve operasyon detaylarini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      {!editingStoreId ? (
        <>
          <SectionTitle title="Magaza tipi" />
          <FilterTabs
            value={form.storeType}
            options={storeTypeOptions}
            onChange={(value) => onChange("storeType", value)}
          />
          <SectionTitle title="Para birimi" />
          <FilterTabs
            value={form.currency}
            options={currencyOptions}
            onChange={(value) => onChange("currency", value)}
          />
        </>
      ) : (
        <Card>
          <SectionTitle title="Sabit alanlar" />
          <Text style={styles.mutedText}>
            Magaza tipi ve para birimi bu surumde sadece olustururken belirlenir.
          </Text>
        </Card>
      )}
      <TextField
        label="Magaza adi"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        onSubmitEditing={() => codeRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Kod"
        value={form.code}
        onChangeText={(value) => onChange("code", value)}
        inputRef={codeRef}
        helperText="Opsiyonel. Stok ve satis operasyonlarinda hiz kazandirir."
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
        returnKeyType="next"
        onSubmitEditing={() => addressRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Adres"
        value={form.address}
        onChangeText={(value) => onChange("address", value)}
        inputRef={addressRef}
        multiline
        returnKeyType="next"
        onSubmitEditing={() => logoRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Logo URL"
        value={form.logo}
        onChangeText={(value) => onChange("logo", value)}
        inputRef={logoRef}
        autoCapitalize="none"
        inputMode="url"
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
        helperText="Opsiyonel. Operasyon notlari veya magaza baglami burada tutulabilir."
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {editingStoreId && canUpdate ? (
        <Button
          label={editingStoreIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingStoreIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingStoreId ? "Degisiklikleri kaydet" : "Magazayi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || !form.name.trim())}
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
});
