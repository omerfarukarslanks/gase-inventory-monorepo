import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
  type Supplier,
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

type SupplierForm = {
  name: string;
  surname: string;
  address: string;
  phoneNumber: string;
  email: string;
};

type SuppliersScreenProps = {
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

const emptyForm: SupplierForm = {
  name: "",
  surname: "",
  address: "",
  phoneNumber: "",
  email: "",
};

export default function SuppliersScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: SuppliersScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [editingSupplierIsActive, setEditingSupplierIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [toggling, setToggling] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const surnameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const addressRef = useRef<TextInput>(null);

  const phoneDigits = useMemo(
    () => form.phoneNumber.replace(/\D/g, ""),
    [form.phoneNumber],
  );
  const emailValue = form.email.trim().toLowerCase();
  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif tedarikciler";
    if (statusFilter === "false") return "Pasif tedarikciler";
    return "Tum tedarikciler";
  }, [statusFilter]);
  const hasFilters = Boolean(search.trim() || statusFilter !== "all");
  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    if (!form.name.trim()) return "Isim zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Isim en az 2 karakter olmali.";
  }, [form.name, formAttempted]);
  const phoneError = useMemo(() => {
    if (!form.phoneNumber.trim()) return "";
    return phoneDigits.length >= 10 ? "" : "Telefon en az 10 haneli olmali.";
  }, [form.phoneNumber, phoneDigits.length]);
  const emailError = useMemo(() => {
    if (!emailValue) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
      ? ""
      : "Gecerli bir e-posta girin.";
  }, [emailValue]);
  const canSubmitForm = Boolean(form.name.trim().length >= 2 && !phoneError && !emailError);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getSuppliers({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setSuppliers(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Tedarikciler yuklenemedi.");
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchSuppliers();
  }, [fetchSuppliers, isActive]);

  const openSupplier = useCallback(async (supplierId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getSupplierById(supplierId);
      setSelectedSupplier(detail);
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Tedarikci detayi getirilemedi.",
      );
      setSelectedSupplier(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingSupplierId(null);
    setEditingSupplierIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openEditModal = useCallback((supplier: Supplier) => {
    setEditorOpen(true);
    setEditingSupplierId(supplier.id);
    setEditingSupplierIsActive(supplier.isActive ?? true);
    setForm({
      name: supplier.name ?? "",
      surname: supplier.surname ?? "",
      address: supplier.address ?? "",
      phoneNumber: supplier.phoneNumber ?? "",
      email: supplier.email ?? "",
    });
    setFormAttempted(false);
    setFormError("");
  }, []);

  const closeEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingSupplierId(null);
    setEditingSupplierIsActive(true);
    setForm(emptyForm);
    setFormAttempted(false);
    setFormError("");
  }, []);

  const submitSupplier = async () => {
    setFormAttempted(true);

    if (!canSubmitForm || nameError || phoneError || emailError) {
      trackEvent("validation_error", { screen: "suppliers", field: "supplier_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingSupplierId) {
        const updated = await updateSupplier(editingSupplierId, {
          name: form.name.trim(),
          surname: form.surname.trim() || undefined,
          address: form.address.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: emailValue || undefined,
          isActive: editingSupplierIsActive,
        });
        setSelectedSupplier(updated);
      } else {
        await createSupplier({
          name: form.name.trim(),
          surname: form.surname.trim() || undefined,
          address: form.address.trim() || undefined,
          phoneNumber: form.phoneNumber.trim() || undefined,
          email: emailValue || undefined,
        });
      }

      closeEditor();
      await fetchSuppliers();
    } catch (nextError) {
      setFormError(
        nextError instanceof Error ? nextError.message : "Tedarikci kaydedilemedi.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSupplierActive = async () => {
    if (!selectedSupplier) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateSupplier(selectedSupplier.id, {
        name: selectedSupplier.name,
        surname: selectedSupplier.surname ?? undefined,
        address: selectedSupplier.address ?? undefined,
        phoneNumber: selectedSupplier.phoneNumber ?? undefined,
        email: selectedSupplier.email ?? undefined,
        isActive: !(selectedSupplier.isActive ?? true),
      });
      setSelectedSupplier(updated);
      await fetchSuppliers();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Tedarikci durumu guncellenemedi.",
      );
    } finally {
      setToggling(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedSupplier || detailLoading) {
    const fullName = [selectedSupplier?.name, selectedSupplier?.surname]
      .filter(Boolean)
      .join(" ")
      .trim() || "Tedarikci detayi";

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={fullName}
            subtitle="Iletisim ve durum ozeti"
            onBack={() => {
              setSelectedSupplier(null);
              setError("");
            }}
            action={
              canUpdate && selectedSupplier ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedSupplier)}
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
              <SkeletonBlock height={84} />
            </View>
          ) : selectedSupplier ? (
            <>
              <Card>
                <SectionTitle title="Tedarikci profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedSupplier.isActive === false ? "pasif" : "aktif"}
                      tone={selectedSupplier.isActive === false ? "neutral" : "positive"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Telefon</Text>
                    <Text style={styles.detailValue}>
                      {selectedSupplier.phoneNumber ?? "Kayitli telefon yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>E-posta</Text>
                    <Text style={styles.detailValue}>
                      {selectedSupplier.email ?? "Kayitli e-posta yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Adres</Text>
                    <Text style={styles.detailValue}>
                      {selectedSupplier.address ?? "Kayitli adres yok"}
                    </Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(selectedSupplier.createdAt)}
                    </Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="Operasyon notu" />
                <Text style={styles.mutedText}>
                  Stok alim ekraninda bu tedarikci artik secilebilir. Guncel iletisim ve durum bilgisi burada takip edilir.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Tedarikci detayi getirilemedi."
              subtitle="Listeye donup tedarikciyi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedSupplier(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedSupplier(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedSupplier ? (
            <Button
              label={selectedSupplier.isActive === false ? "Aktif et" : "Pasife al"}
              onPress={() => void toggleSupplierActive()}
              variant={selectedSupplier.isActive === false ? "secondary" : "danger"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <SupplierEditor
          visible={editorOpen}
          form={form}
          formError={formError}
          nameError={nameError}
          phoneError={phoneError}
          emailError={emailError}
          editingSupplierId={editingSupplierId}
          editingSupplierIsActive={editingSupplierIsActive}
          submitting={submitting}
          canUpdate={canUpdate}
          surnameRef={surnameRef}
          phoneRef={phoneRef}
          emailRef={emailRef}
          addressRef={addressRef}
          onClose={closeEditor}
          onSubmit={() => void submitSupplier()}
          onToggleActive={() => setEditingSupplierIsActive((current) => !current)}
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
          title="Tedarikciler"
          subtitle="Stok alimi icin iletisim ve durum yonetimi"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void fetchSuppliers()}
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
              placeholder="Isim, telefon veya e-posta ara"
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
          data={suppliers}
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
                  <Text style={styles.detailValue}>{suppliers.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum tedarikciler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={[item.name, item.surname].filter(Boolean).join(" ").trim()}
              subtitle={item.phoneNumber ?? item.email ?? "Iletisim bilgisi yok"}
              caption={item.address ?? "Adres bilgisi yok"}
              badgeLabel={item.isActive === false ? "pasif" : "aktif"}
              badgeTone={item.isActive === false ? "neutral" : "positive"}
              onPress={() => void openSupplier(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="truck-delivery-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Tedarikci listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchSuppliers()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun tedarikci yok." : "Tedarikci bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni tedarikci ekleyerek alim akislarini tamamlayabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni tedarikci" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "suppliers",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  if (canCreate) {
                    openCreateModal();
                    return;
                  }
                  void fetchSuppliers();
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
            label="Yeni tedarikci"
            onPress={openCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={() => void fetchSuppliers()} variant="secondary" />
        )}
      </StickyActionBar>

      <SupplierEditor
        visible={editorOpen}
        form={form}
        formError={formError}
        nameError={nameError}
        phoneError={phoneError}
        emailError={emailError}
        editingSupplierId={editingSupplierId}
        editingSupplierIsActive={editingSupplierIsActive}
        submitting={submitting}
        canUpdate={canUpdate}
        surnameRef={surnameRef}
        phoneRef={phoneRef}
        emailRef={emailRef}
        addressRef={addressRef}
        onClose={closeEditor}
        onSubmit={() => void submitSupplier()}
        onToggleActive={() => setEditingSupplierIsActive((current) => !current)}
        onChange={(field, value) => {
          setForm((current) => ({ ...current, [field]: value }));
          if (formError) setFormError("");
        }}
      />
    </View>
  );
}

function SupplierEditor({
  visible,
  form,
  formError,
  nameError,
  phoneError,
  emailError,
  editingSupplierId,
  editingSupplierIsActive,
  submitting,
  canUpdate,
  surnameRef,
  phoneRef,
  emailRef,
  addressRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: {
  visible: boolean;
  form: SupplierForm;
  formError: string;
  nameError: string;
  phoneError: string;
  emailError: string;
  editingSupplierId: string | null;
  editingSupplierIsActive: boolean;
  submitting: boolean;
  canUpdate: boolean;
  surnameRef: { current: TextInput | null };
  phoneRef: { current: TextInput | null };
  emailRef: { current: TextInput | null };
  addressRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChange: (field: keyof SupplierForm, value: string) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingSupplierId ? "Tedarikciyi duzenle" : "Yeni tedarikci"}
      subtitle="Stok alimlerinde kullanilacak kaydi guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Isim"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={nameError || undefined}
        returnKeyType="next"
        onSubmitEditing={() => surnameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Soyisim"
        value={form.surname}
        onChangeText={(value) => onChange("surname", value)}
        inputRef={surnameRef}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Telefon"
        value={form.phoneNumber}
        onChangeText={(value) => onChange("phoneNumber", value)}
        keyboardType="phone-pad"
        inputMode="tel"
        errorText={phoneError || undefined}
        inputRef={phoneRef}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="E-posta"
        value={form.email}
        onChangeText={(value) => onChange("email", value)}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        inputMode="email"
        errorText={emailError || undefined}
        inputRef={emailRef}
        returnKeyType="next"
        onSubmitEditing={() => addressRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Adres"
        value={form.address}
        onChangeText={(value) => onChange("address", value)}
        multiline
        helperText="Opsiyonel. Teslimat ve operasyon notlari icin faydalidir."
        inputRef={addressRef}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {editingSupplierId && canUpdate ? (
        <Button
          label={editingSupplierIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingSupplierIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingSupplierId ? "Degisiklikleri kaydet" : "Tedarikciyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || phoneError || emailError || !form.name.trim())}
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
