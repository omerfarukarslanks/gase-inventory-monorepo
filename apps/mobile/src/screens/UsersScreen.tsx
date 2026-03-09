import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createUser,
  getStores,
  getUser,
  getUsers,
  updateUser,
  type Store,
  type User,
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
type UserRole = "STAFF" | "MANAGER" | "ADMIN";

type UserForm = {
  name: string;
  surname: string;
  role: UserRole;
  email: string;
  password: string;
  storeId: string;
};

type UserFormErrors = {
  name: string;
  surname: string;
  email: string;
  password: string;
};

type UsersScreenProps = {
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

const roleOptions = [
  { label: "STAFF", value: "STAFF" as const },
  { label: "MANAGER", value: "MANAGER" as const },
  { label: "ADMIN", value: "ADMIN" as const },
];

const emptyForm: UserForm = {
  name: "",
  surname: "",
  role: "STAFF",
  email: "",
  password: "",
  storeId: "",
};

const emptyFormErrors: UserFormErrors = {
  name: "",
  surname: "",
  email: "",
  password: "",
};

const noStoreValue = "__no_store__";

export default function UsersScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: UsersScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserIsActive, setEditingUserIsActive] = useState(true);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<UserFormErrors>(emptyFormErrors);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const surnameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif kullanicilar";
    if (statusFilter === "false") return "Pasif kullanicilar";
    return "Tum kullanicilar";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const storeSelectionItems = useMemo(
    () => [
      {
        value: noStoreValue,
        label: "Magaza atama",
        description: "Atama yapmadan kaydi genel tenant kapsaminda tut.",
      },
      ...stores.map((store) => ({
        value: store.id,
        label: store.name,
        description: [store.code || null, store.storeType || null].filter(Boolean).join(" • "),
      })),
    ],
    [stores],
  );

  const selectedStoreLabel = useMemo(() => {
    if (!form.storeId) return "Atanmamis";
    return stores.find((store) => store.id === form.storeId)?.name ?? "Secili magaza bulunamadi";
  }, [form.storeId, stores]);

  const nameError = useMemo(() => {
    if (!form.name.trim()) return "Ad zorunlu.";
    return form.name.trim().length >= 2 ? "" : "Ad en az 2 karakter olmali.";
  }, [form.name]);

  const surnameError = useMemo(() => {
    if (!form.surname.trim()) return "Soyad zorunlu.";
    return form.surname.trim().length >= 2 ? "" : "Soyad en az 2 karakter olmali.";
  }, [form.surname]);

  const emailError = useMemo(() => {
    if (editingUserId) return "";
    if (!form.email.trim()) return "E-posta zorunlu.";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
      ? ""
      : "Gecerli bir e-posta girin.";
  }, [editingUserId, form.email]);

  const passwordError = useMemo(() => {
    if (editingUserId) return "";
    if (!form.password) return "Sifre zorunlu.";
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)
      ? ""
      : "Sifre en az 8 karakter, buyuk-kucuk harf ve rakam icermeli.";
  }, [editingUserId, form.password]);

  const fetchUsersList = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getUsers({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
        sortBy: "createdAt",
        sortOrder: "DESC",
      });
      setUsers(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Kullanicilar yuklenemedi.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  const fetchStoresList = useCallback(async () => {
    try {
      const response = await getStores({
        page: 1,
        limit: 50,
        isActive: true,
        sortBy: "name",
        sortOrder: "ASC",
      });
      setStores(response.data ?? []);
    } catch {
      setStores([]);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;
    void fetchUsersList();
  }, [fetchUsersList, isActive]);

  useEffect(() => {
    if (!isActive) return;
    void fetchStoresList();
  }, [fetchStoresList, isActive]);

  const openUser = useCallback(async (userId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getUser(userId);
      setSelectedUser(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Kullanici detayi getirilemedi.");
      setSelectedUser(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingUserId(null);
    setEditingUserIsActive(true);
    setForm(emptyForm);
    setFormErrors(emptyFormErrors);
    setFormError("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingUserId(null);
    setEditingUserIsActive(true);
    setForm(emptyForm);
    setFormErrors(emptyFormErrors);
    setFormError("");
  }, []);

  const openEditModal = useCallback((user: User) => {
    setEditorOpen(true);
    setEditingUserId(user.id);
    setEditingUserIsActive(Boolean(user.isActive));
    setForm({
      name: user.name ?? "",
      surname: user.surname ?? "",
      role: (user.role as UserRole) ?? "STAFF",
      email: user.email ?? "",
      password: "",
      storeId: user.userStores?.[0]?.store.id ?? "",
    });
    setFormErrors(emptyFormErrors);
    setFormError("");
  }, []);

  const submitUser = async () => {
    const nextErrors: UserFormErrors = {
      name: nameError,
      surname: surnameError,
      email: emailError,
      password: passwordError,
    };
    setFormErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      trackEvent("validation_error", { screen: "users", field: "user_form" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingUserId) {
        const updated = await updateUser(editingUserId, {
          name: form.name.trim(),
          surname: form.surname.trim(),
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
          isActive: editingUserIsActive,
        });
        const refreshed = await getUser(updated.id);
        setSelectedUser(refreshed);
      } else {
        const created = await createUser({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          surname: form.surname.trim(),
          role: form.role,
          storeIds: form.storeId ? [form.storeId] : [],
        });
        const refreshed = await getUser(created.id);
        setSelectedUser(refreshed);
      }

      resetEditor();
      await fetchUsersList();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Kullanici kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserActive = async () => {
    if (!selectedUser) return;

    setToggling(true);
    setError("");
    try {
      const updated = await updateUser(selectedUser.id, {
        name: selectedUser.name,
        surname: selectedUser.surname,
        role: selectedUser.role,
        storeIds: selectedUser.userStores?.map((item) => item.store.id) ?? [],
        isActive: !(selectedUser.isActive ?? true),
      });
      const refreshed = await getUser(updated.id);
      setSelectedUser(refreshed);
      await fetchUsersList();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Kullanici durumu guncellenemedi.",
      );
    } finally {
      setToggling(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedUser || detailLoading) {
    const assignedStores = selectedUser?.userStores ?? [];

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedUser ? `${selectedUser.name} ${selectedUser.surname}`.trim() : "Kullanici detayi"}
            subtitle="Rol, magaza kapsam ve oturum durumu"
            onBack={() => {
              setSelectedUser(null);
              setError("");
            }}
            action={
              canUpdate && selectedUser ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedUser)}
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
          ) : selectedUser ? (
            <>
              <Card>
                <SectionTitle title="Kullanici profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedUser.isActive === false ? "pasif" : "aktif"}
                      tone={selectedUser.isActive === false ? "neutral" : "positive"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Rol</Text>
                    <Text style={styles.detailValue}>{selectedUser.role}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>E-posta</Text>
                    <Text style={styles.detailValue}>{selectedUser.email}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Magaza atamasi</Text>
                    <Text style={styles.detailValue}>{assignedStores.length}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedUser.createdAt)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Guncelleme</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedUser.updatedAt)}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="Magaza kapsam" />
                <View style={styles.assignmentList}>
                  {assignedStores.length ? (
                    assignedStores.map((assignment) => (
                      <View key={assignment.id} style={styles.assignmentRow}>
                        <View style={styles.assignmentCopy}>
                          <Text style={styles.assignmentTitle}>{assignment.store.name}</Text>
                          <Text style={styles.assignmentCaption}>
                            {[assignment.store.code, assignment.store.slug].filter(Boolean).join(" • ") || "Kod yok"}
                          </Text>
                        </View>
                        <StatusBadge
                          label={assignment.store.isActive === false ? "pasif" : "aktif"}
                          tone={assignment.store.isActive === false ? "neutral" : "positive"}
                        />
                      </View>
                    ))
                  ) : (
                    <Text style={styles.mutedText}>Bu kullaniciya magaza atanmamis.</Text>
                  )}
                </View>
              </Card>

              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.mutedText}>
                  Rol ve magaza atamalari mobil shell gorunurlugunu da etkiler. Ozellikle saha
                  ekipleri icin yalnizca ihtiyac duyulan yetki ve store kapsami tutulmali.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Kullanici detayi getirilemedi."
              subtitle="Listeye donup kullaniciyi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedUser(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedUser(null);
              setError("");
            }}
            variant="ghost"
          />
          {canUpdate && selectedUser ? (
            <Button
              label={selectedUser.isActive === false ? "Aktif et" : "Pasife al"}
              onPress={() => void toggleUserActive()}
              variant={selectedUser.isActive === false ? "secondary" : "danger"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <UserEditor
          visible={editorOpen}
          form={form}
          formErrors={formErrors}
          formError={formError}
          storeSelectionItems={storeSelectionItems}
          selectedStoreLabel={selectedStoreLabel}
          editingUserId={editingUserId}
          editingUserIsActive={editingUserIsActive}
          canUpdate={canUpdate}
          submitting={submitting}
          surnameRef={surnameRef}
          emailRef={emailRef}
          passwordRef={passwordRef}
          onClose={resetEditor}
          onSubmit={() => void submitUser()}
          onToggleActive={() => setEditingUserIsActive((current) => !current)}
          onChange={(field, value) => {
            setForm((current) => ({ ...current, [field]: value }));
            setFormErrors((current) => ({ ...current, [field]: field in current ? "" : current[field as never] }));
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
          title="Kullanicilar"
          subtitle="Rol ve magaza kapsamini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void Promise.all([fetchUsersList(), fetchStoresList()])}
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
              placeholder="Ad, soyad veya e-posta ara"
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
          data={users}
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
                  <Text style={styles.detailValue}>{users.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum kullanicilar"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={`${item.name} ${item.surname}`.trim()}
              subtitle={item.email}
              caption={
                item.userStores?.length
                  ? item.userStores.map((entry) => entry.store.name).join(", ")
                  : "Magaza atamasi yok"
              }
              badgeLabel={item.isActive === false ? "pasif" : item.role.toLowerCase()}
              badgeTone={item.isActive === false ? "neutral" : "info"}
              onPress={() => void openUser(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="account-badge-outline"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Kullanici listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void Promise.all([fetchUsersList(), fetchStoresList()])}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun kullanici yok." : "Kullanici bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni kullanici ekleyerek rol ve operasyon kapsamlarini yonetebilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni kullanici" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "users",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  if (canCreate) {
                    openCreateModal();
                    return;
                  }
                  void Promise.all([fetchUsersList(), fetchStoresList()]);
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
            label="Yeni kullanici"
            onPress={openCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button
            label="Listeyi yenile"
            onPress={() => void Promise.all([fetchUsersList(), fetchStoresList()])}
            variant="secondary"
          />
        )}
      </StickyActionBar>

      <UserEditor
        visible={editorOpen}
        form={form}
        formErrors={formErrors}
        formError={formError}
        storeSelectionItems={storeSelectionItems}
        selectedStoreLabel={selectedStoreLabel}
        editingUserId={editingUserId}
        editingUserIsActive={editingUserIsActive}
        canUpdate={canUpdate}
        submitting={submitting}
        surnameRef={surnameRef}
        emailRef={emailRef}
        passwordRef={passwordRef}
        onClose={resetEditor}
        onSubmit={() => void submitUser()}
        onToggleActive={() => setEditingUserIsActive((current) => !current)}
        onChange={(field, value) => {
          setForm((current) => ({ ...current, [field]: value }));
          setFormErrors((current) => ({
            ...current,
            ...(field === "name" ? { name: "" } : {}),
            ...(field === "surname" ? { surname: "" } : {}),
            ...(field === "email" ? { email: "" } : {}),
            ...(field === "password" ? { password: "" } : {}),
          }));
          if (formError) setFormError("");
        }}
      />
    </View>
  );
}

function UserEditor({
  visible,
  form,
  formErrors,
  formError,
  storeSelectionItems,
  selectedStoreLabel,
  editingUserId,
  editingUserIsActive,
  canUpdate,
  submitting,
  surnameRef,
  emailRef,
  passwordRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChange,
}: {
  visible: boolean;
  form: UserForm;
  formErrors: UserFormErrors;
  formError: string;
  storeSelectionItems: { label: string; value: string; description?: string }[];
  selectedStoreLabel: string;
  editingUserId: string | null;
  editingUserIsActive: boolean;
  canUpdate: boolean;
  submitting: boolean;
  surnameRef: { current: TextInput | null };
  emailRef: { current: TextInput | null };
  passwordRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChange: (field: keyof UserForm, value: UserForm[keyof UserForm]) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingUserId ? "Kullaniciyi duzenle" : "Yeni kullanici"}
      subtitle="Rol, magaza ve temel kimlik bilgisini guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Ad"
        value={form.name}
        onChangeText={(value) => onChange("name", value)}
        errorText={formErrors.name || undefined}
        returnKeyType="next"
        onSubmitEditing={() => surnameRef.current?.focus()}
        blurOnSubmit={false}
      />
      <TextField
        label="Soyad"
        value={form.surname}
        onChangeText={(value) => onChange("surname", value)}
        inputRef={surnameRef}
        errorText={formErrors.surname || undefined}
        returnKeyType={editingUserId ? "done" : "next"}
        onSubmitEditing={() => {
          if (editingUserId) {
            onSubmit();
            return;
          }
          emailRef.current?.focus();
        }}
        blurOnSubmit={false}
      />
      <SectionTitle title="Rol" />
      <FilterTabs value={form.role} options={roleOptions} onChange={(value) => onChange("role", value)} />
      {!editingUserId ? (
        <>
          <TextField
            label="E-posta"
            value={form.email}
            onChangeText={(value) => onChange("email", value)}
            inputRef={emailRef}
            keyboardType="email-address"
            textContentType="emailAddress"
            autoCapitalize="none"
            inputMode="email"
            errorText={formErrors.email || undefined}
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TextField
            label="Sifre"
            value={form.password}
            onChangeText={(value) => onChange("password", value)}
            inputRef={passwordRef}
            secureTextEntry
            textContentType="newPassword"
            errorText={formErrors.password || undefined}
            helperText="En az 8 karakter, buyuk-kucuk harf ve rakam kullan."
            returnKeyType="done"
            onSubmitEditing={onSubmit}
          />
        </>
      ) : (
        <Card>
          <SectionTitle title="Kimlik bilgisi" />
          <Text style={styles.mutedText}>
            Bu surumde e-posta ve sifre sadece kullanici olustururken belirlenir.
          </Text>
        </Card>
      )}
      <Card>
        <SectionTitle title="Magaza atamasi" />
        <Text style={styles.assignmentSummary}>{selectedStoreLabel}</Text>
        <SelectionList
          items={storeSelectionItems}
          selectedValue={form.storeId || noStoreValue}
          onSelect={(value) => onChange("storeId", value === noStoreValue ? "" : value)}
          emptyText="Magaza bulunamadi."
        />
      </Card>
      {editingUserId && canUpdate ? (
        <Button
          label={editingUserIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingUserIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingUserId ? "Degisiklikleri kaydet" : "Kullaniciyi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(
          formErrors.name ||
            formErrors.surname ||
            formErrors.email ||
            formErrors.password ||
            !form.name.trim() ||
            !form.surname.trim() ||
            (!editingUserId && (!form.email.trim() || !form.password)),
        )}
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
  assignmentList: {
    marginTop: 12,
    gap: 10,
  },
  assignmentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assignmentCopy: {
    flex: 1,
    gap: 4,
  },
  assignmentTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  assignmentCaption: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  assignmentSummary: {
    marginTop: 12,
    marginBottom: 12,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
});
