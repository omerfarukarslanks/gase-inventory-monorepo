import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createAttribute,
  createAttributeValues,
  getAttributeById,
  getAttributesPaginated,
  updateAttribute,
  updateAttributeValue,
  type Attribute,
  type AttributeDetail,
  type AttributeValue,
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

type EditableValue = {
  id: string;
  name: string;
  isActive: boolean;
  originalName: string;
};

type AttributesScreenProps = {
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

function parseCommaSeparated(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function sortValues(values: AttributeValue[] = []) {
  return [...values].sort((left, right) => {
    const leftNumber = Number(left.value);
    const rightNumber = Number(right.value);

    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return leftNumber - rightNumber;
    }

    return String(left.value).localeCompare(String(right.value), "tr");
  });
}

function toEditableValues(values: AttributeValue[] = []): EditableValue[] {
  return sortValues(values).map((value) => ({
    id: value.id,
    name: value.name ?? "",
    isActive: value.isActive,
    originalName: value.name ?? "",
  }));
}

export default function AttributesScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: AttributesScreenProps = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
  const [editingAttributeIsActive, setEditingAttributeIsActive] = useState(true);
  const [formName, setFormName] = useState("");
  const [formAttempted, setFormAttempted] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [valueEditorOpen, setValueEditorOpen] = useState(false);
  const [existingValues, setExistingValues] = useState<EditableValue[]>([]);
  const [newValuesInput, setNewValuesInput] = useState("");
  const [valueFormError, setValueFormError] = useState("");
  const [valueSubmitting, setValueSubmitting] = useState(false);
  const [togglingAttribute, setTogglingAttribute] = useState(false);
  const [togglingValueId, setTogglingValueId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 350);
  const nameRef = useRef<TextInput>(null);
  const valuesRef = useRef<TextInput>(null);

  const canManageValues = canCreate || canUpdate;

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif ozellikler";
    if (statusFilter === "false") return "Pasif ozellikler";
    return "Tum ozellikler";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

  const nameError = useMemo(() => {
    if (!formAttempted && !formName.trim()) return "";
    if (!formName.trim()) return "Ozellik adi zorunlu.";
    return formName.trim().length >= 2 ? "" : "Ozellik adi en az 2 karakter olmali.";
  }, [formAttempted, formName]);

  const fetchAttributes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAttributesPaginated({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        sortOrder: "DESC",
        sortBy: "createdAt",
        isActive: statusFilter === "all" ? "all" : statusFilter === "true",
      });
      setAttributes(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Ozellikler yuklenemedi.");
      setAttributes([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchAttributes();
  }, [fetchAttributes, isActive]);

  const openAttribute = useCallback(async (attributeId: string) => {
    setDetailLoading(true);
    setError("");
    try {
      const detail = await getAttributeById(attributeId);
      setSelectedAttribute(detail);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Ozellik detayi getirilemedi.");
      setSelectedAttribute(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const resetEditor = useCallback(() => {
    setEditorOpen(false);
    setEditingAttributeId(null);
    setEditingAttributeIsActive(true);
    setFormName("");
    setFormAttempted(false);
    setFormError("");
  }, []);

  const resetValueEditor = useCallback(() => {
    setValueEditorOpen(false);
    setExistingValues([]);
    setNewValuesInput("");
    setValueFormError("");
  }, []);

  const openCreateModal = useCallback(() => {
    setEditorOpen(true);
    setEditingAttributeId(null);
    setEditingAttributeIsActive(true);
    setFormName("");
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openEditModal = useCallback((attribute: AttributeDetail) => {
    setEditorOpen(true);
    setEditingAttributeId(attribute.id);
    setEditingAttributeIsActive(attribute.isActive);
    setFormName(attribute.name ?? "");
    setFormAttempted(false);
    setFormError("");
  }, []);

  const openValuesEditor = useCallback((attribute: AttributeDetail) => {
    setSelectedAttribute(attribute);
    setExistingValues(toEditableValues(attribute.values));
    setNewValuesInput("");
    setValueFormError("");
    setValueEditorOpen(true);
  }, []);

  const submitAttribute = async () => {
    setFormAttempted(true);

    if (nameError) {
      trackEvent("validation_error", { screen: "attributes", field: "attribute_name" });
      setFormError("Alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    try {
      if (editingAttributeId) {
        const updated = await updateAttribute(editingAttributeId, {
          name: formName.trim(),
          isActive: editingAttributeIsActive,
        });
        const refreshed = await getAttributeById(updated.id);
        setSelectedAttribute(refreshed);
      } else {
        const created = await createAttribute({ name: formName.trim() });
        const refreshed = await getAttributeById(created.id);
        setSelectedAttribute(refreshed);
        if (canManageValues) {
          setExistingValues(toEditableValues(refreshed.values));
          setNewValuesInput("");
          setValueFormError("");
          setValueEditorOpen(true);
        }
      }

      resetEditor();
      await fetchAttributes();
    } catch (nextError) {
      setFormError(nextError instanceof Error ? nextError.message : "Ozellik kaydedilemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveValues = async () => {
    if (!selectedAttribute) {
      setValueFormError("Ozellik detayi bulunamadi. Tekrar dene.");
      return;
    }

    const preparedNewValues = parseCommaSeparated(newValuesInput).map((name) => ({ name }));
    const existingValueUpdates = existingValues
      .filter((value) => value.name.trim() !== value.originalName)
      .map((value) => ({ id: value.id, name: value.name.trim() }));

    if (existingValueUpdates.some((value) => !value.name)) {
      trackEvent("validation_error", { screen: "attributes", field: "attribute_values" });
      setValueFormError("Deger adi bos birakilamaz.");
      return;
    }

    if (!preparedNewValues.length && !existingValueUpdates.length) {
      resetValueEditor();
      return;
    }

    setValueSubmitting(true);
    setValueFormError("");
    try {
      if (existingValueUpdates.length) {
        await Promise.all(
          existingValueUpdates.map((value) =>
            updateAttributeValue(value.id, { name: value.name }),
          ),
        );
      }

      if (preparedNewValues.length) {
        await createAttributeValues(selectedAttribute.value, preparedNewValues);
      }

      const refreshed = await getAttributeById(selectedAttribute.id);
      setSelectedAttribute(refreshed);
      resetValueEditor();
      await fetchAttributes();
    } catch (nextError) {
      setValueFormError(
        nextError instanceof Error ? nextError.message : "Degerler kaydedilemedi.",
      );
    } finally {
      setValueSubmitting(false);
    }
  };

  const toggleAttributeActive = async () => {
    if (!selectedAttribute) return;

    setTogglingAttribute(true);
    setError("");
    try {
      await updateAttribute(selectedAttribute.id, {
        isActive: !selectedAttribute.isActive,
      });
      const refreshed = await getAttributeById(selectedAttribute.id);
      setSelectedAttribute(refreshed);
      await fetchAttributes();
    } catch (nextError) {
      setError(
        nextError instanceof Error ? nextError.message : "Ozellik durumu guncellenemedi.",
      );
    } finally {
      setTogglingAttribute(false);
    }
  };

  const toggleValueActive = async (value: AttributeValue, next: boolean) => {
    if (!selectedAttribute) return;

    setTogglingValueId(value.id);
    setError("");
    try {
      await updateAttributeValue(value.id, { isActive: next });
      const refreshed = await getAttributeById(selectedAttribute.id);
      setSelectedAttribute(refreshed);
      await fetchAttributes();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Deger durumu guncellenemedi.");
    } finally {
      setTogglingValueId(null);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedAttribute || detailLoading) {
    const sortedValues = sortValues(selectedAttribute?.values);

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            title={selectedAttribute?.name ?? "Ozellik detayi"}
            subtitle="Degerler ve durum yonetimi"
            onBack={() => {
              setSelectedAttribute(null);
              setError("");
            }}
            action={
              canUpdate && selectedAttribute ? (
                <Button
                  label="Duzenle"
                  onPress={() => openEditModal(selectedAttribute)}
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
          ) : selectedAttribute ? (
            <>
              <Card>
                <SectionTitle title="Ozellik profili" />
                <View style={styles.detailStats}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Durum</Text>
                    <StatusBadge
                      label={selectedAttribute.isActive ? "aktif" : "pasif"}
                      tone={selectedAttribute.isActive ? "positive" : "neutral"}
                    />
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Deger sayisi</Text>
                    <Text style={styles.detailValue}>{selectedAttribute.values?.length ?? 0}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Deger anahtari</Text>
                    <Text style={styles.detailValue}>{String(selectedAttribute.value ?? "-")}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Kayit tarihi</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedAttribute.createdAt)}</Text>
                  </View>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailLabel}>Guncelleme</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedAttribute.updatedAt)}</Text>
                  </View>
                </View>
              </Card>

              <Card>
                <SectionTitle title="Ozellik degerleri" />
                <View style={styles.valueList}>
                  {sortedValues.length ? (
                    sortedValues.map((value) => (
                      <View key={value.id} style={styles.valueRow}>
                        <View style={styles.valueCopy}>
                          <Text style={styles.valueTitle}>{value.name}</Text>
                          <Text style={styles.valueCaption}>{`Sira: ${String(value.value)}`}</Text>
                        </View>
                        <View style={styles.valueActions}>
                          <StatusBadge
                            label={value.isActive ? "aktif" : "pasif"}
                            tone={value.isActive ? "positive" : "neutral"}
                          />
                          {canUpdate ? (
                            <Button
                              label={value.isActive ? "Pasif" : "Aktif"}
                              onPress={() => void toggleValueActive(value, !value.isActive)}
                              variant={value.isActive ? "ghost" : "secondary"}
                              size="sm"
                              fullWidth={false}
                              loading={togglingValueId === value.id}
                            />
                          ) : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <EmptyStateWithAction
                      title="Bu ozellige ait deger yok."
                      subtitle="Varyant olustururken kullanmak icin deger ekleyebilirsin."
                      actionLabel={canManageValues ? "Deger ekle" : "Listeye don"}
                      onAction={() => {
                        if (canManageValues) {
                          openValuesEditor(selectedAttribute);
                          return;
                        }
                        setSelectedAttribute(null);
                      }}
                    />
                  )}
                </View>
              </Card>

              <Card>
                <SectionTitle title="Operator notu" />
                <Text style={styles.mutedText}>
                  Bu ozellik urun varyant matrisinde kullanilir. Deger setini duzenli tutmak,
                  varyant secimini ve urun acilis akislarini hizlandirir.
                </Text>
              </Card>
            </>
          ) : (
            <EmptyStateWithAction
              title="Ozellik detayi getirilemedi."
              subtitle="Listeye donup ozelligi yeniden ac."
              actionLabel="Listeye don"
              onAction={() => setSelectedAttribute(null)}
            />
          )}
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedAttribute(null);
              setError("");
            }}
            variant="ghost"
          />
          {canManageValues && selectedAttribute ? (
            <Button
              label="Degerleri yonet"
              onPress={() => openValuesEditor(selectedAttribute)}
              variant="secondary"
            />
          ) : null}
          {canUpdate && selectedAttribute ? (
            <Button
              label={selectedAttribute.isActive ? "Pasife al" : "Aktif et"}
              onPress={() => void toggleAttributeActive()}
              variant={selectedAttribute.isActive ? "danger" : "secondary"}
              loading={togglingAttribute}
            />
          ) : null}
        </StickyActionBar>

        <AttributeEditor
          visible={editorOpen}
          formName={formName}
          formError={formError}
          nameError={nameError}
          editingAttributeId={editingAttributeId}
          editingAttributeIsActive={editingAttributeIsActive}
          canUpdate={canUpdate}
          submitting={submitting}
          nameRef={nameRef}
          onClose={resetEditor}
          onSubmit={() => void submitAttribute()}
          onToggleActive={() => setEditingAttributeIsActive((current) => !current)}
          onChangeName={(value) => {
            setFormName(value);
            if (formError) setFormError("");
          }}
        />

        <AttributeValuesEditor
          visible={valueEditorOpen}
          values={existingValues}
          newValuesInput={newValuesInput}
          formError={valueFormError}
          submitting={valueSubmitting}
          valuesRef={valuesRef}
          onClose={resetValueEditor}
          onSave={() => void saveValues()}
          onNewValuesChange={(value) => {
            setNewValuesInput(value);
            if (valueFormError) setValueFormError("");
          }}
          onUpdateValue={(id, nextName) => {
            setExistingValues((current) =>
              current.map((value) => (value.id === id ? { ...value, name: nextName } : value)),
            );
            if (valueFormError) setValueFormError("");
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Ozellikler"
          subtitle="Urun varyantlari icin tanim setini mobilde yonet"
          onBack={onBack}
          action={
            <Button
              label="Yenile"
              onPress={() => void fetchAttributes()}
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
              placeholder="Ozellik adi ara"
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
          data={attributes}
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
                  <Text style={styles.detailValue}>{attributes.length}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum ozellikler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={item.name}
              subtitle={`${item.values?.length ?? 0} deger • ${formatDate(item.updatedAt)}`}
              caption={
                item.values?.length
                  ? item.values
                      .slice(0, 3)
                      .map((value) => value.name)
                      .filter(Boolean)
                      .join(", ")
                  : "Henuz deger yok"
              }
              badgeLabel={item.isActive ? "aktif" : "pasif"}
              badgeTone={item.isActive ? "positive" : "neutral"}
              onPress={() => void openAttribute(item.id)}
              icon={
                <MaterialCommunityIcons
                  name="tune-variant"
                  size={20}
                  color={mobileTheme.colors.brand.primary}
                />
              }
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Ozellik listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchAttributes()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasFilters ? "Filtreye uygun ozellik yok." : "Ozellik bulunamadi."}
                subtitle={
                  hasFilters
                    ? "Aramayi temizleyip durum filtresini genislet."
                    : "Yeni ozellik ekleyerek varyant tanimlarini mobilde de acabilirsin."
                }
                actionLabel={hasFilters ? "Filtreyi temizle" : canCreate ? "Yeni ozellik" : "Listeyi yenile"}
                onAction={() => {
                  if (hasFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "attributes",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  if (canCreate) {
                    openCreateModal();
                    return;
                  }
                  void fetchAttributes();
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
            label="Yeni ozellik"
            onPress={openCreateModal}
            icon={<MaterialCommunityIcons name="plus-circle-outline" size={16} color="#FFFFFF" />}
          />
        ) : (
          <Button label="Listeyi yenile" onPress={() => void fetchAttributes()} variant="secondary" />
        )}
      </StickyActionBar>

      <AttributeEditor
        visible={editorOpen}
        formName={formName}
        formError={formError}
        nameError={nameError}
        editingAttributeId={editingAttributeId}
        editingAttributeIsActive={editingAttributeIsActive}
        canUpdate={canUpdate}
        submitting={submitting}
        nameRef={nameRef}
        onClose={resetEditor}
        onSubmit={() => void submitAttribute()}
        onToggleActive={() => setEditingAttributeIsActive((current) => !current)}
        onChangeName={(value) => {
          setFormName(value);
          if (formError) setFormError("");
        }}
      />

      <AttributeValuesEditor
        visible={valueEditorOpen}
        values={existingValues}
        newValuesInput={newValuesInput}
        formError={valueFormError}
        submitting={valueSubmitting}
        valuesRef={valuesRef}
        onClose={resetValueEditor}
        onSave={() => void saveValues()}
        onNewValuesChange={(value) => {
          setNewValuesInput(value);
          if (valueFormError) setValueFormError("");
        }}
        onUpdateValue={(id, nextName) => {
          setExistingValues((current) =>
            current.map((value) => (value.id === id ? { ...value, name: nextName } : value)),
          );
          if (valueFormError) setValueFormError("");
        }}
      />
    </View>
  );
}

function AttributeEditor({
  visible,
  formName,
  formError,
  nameError,
  editingAttributeId,
  editingAttributeIsActive,
  canUpdate,
  submitting,
  nameRef,
  onClose,
  onSubmit,
  onToggleActive,
  onChangeName,
}: {
  visible: boolean;
  formName: string;
  formError: string;
  nameError: string;
  editingAttributeId: string | null;
  editingAttributeIsActive: boolean;
  canUpdate: boolean;
  submitting: boolean;
  nameRef: { current: TextInput | null };
  onClose: () => void;
  onSubmit: () => void;
  onToggleActive: () => void;
  onChangeName: (value: string) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title={editingAttributeId ? "Ozelligi duzenle" : "Yeni ozellik"}
      subtitle="Varyant taniminda kullanilacak kaydi guncelle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <TextField
        label="Ozellik adi"
        value={formName}
        onChangeText={onChangeName}
        inputRef={nameRef}
        errorText={nameError || undefined}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
      />
      {editingAttributeId && canUpdate ? (
        <Button
          label={editingAttributeIsActive ? "Kaydi pasif yap" : "Kaydi aktif yap"}
          onPress={onToggleActive}
          variant={editingAttributeIsActive ? "ghost" : "secondary"}
        />
      ) : null}
      <Button
        label={editingAttributeId ? "Degisiklikleri kaydet" : "Ozelligi kaydet"}
        onPress={onSubmit}
        loading={submitting}
        disabled={Boolean(nameError || !formName.trim())}
      />
    </ModalSheet>
  );
}

function AttributeValuesEditor({
  visible,
  values,
  newValuesInput,
  formError,
  submitting,
  valuesRef,
  onClose,
  onSave,
  onNewValuesChange,
  onUpdateValue,
}: {
  visible: boolean;
  values: EditableValue[];
  newValuesInput: string;
  formError: string;
  submitting: boolean;
  valuesRef: { current: TextInput | null };
  onClose: () => void;
  onSave: () => void;
  onNewValuesChange: (value: string) => void;
  onUpdateValue: (id: string, nextName: string) => void;
}) {
  return (
    <ModalSheet
      visible={visible}
      title="Degerleri yonet"
      subtitle="Mevcut degerleri duzenle, yenilerini virgulle ekle"
      onClose={onClose}
    >
      {formError ? <Banner text={formError} /> : null}
      <Card>
        <SectionTitle title="Mevcut degerler" />
        <View style={styles.editorValueList}>
          {values.length ? (
            values.map((value, index) => (
              <TextField
                key={value.id}
                label={`Deger ${index + 1}`}
                value={value.name}
                onChangeText={(nextValue) => onUpdateValue(value.id, nextValue)}
                helperText={value.isActive ? "Aktif deger" : "Pasif deger"}
              />
            ))
          ) : (
            <Text style={styles.mutedText}>Henuz kayitli deger yok.</Text>
          )}
        </View>
      </Card>

      <TextField
        label="Yeni degerler"
        value={newValuesInput}
        onChangeText={onNewValuesChange}
        inputRef={valuesRef}
        multiline
        helperText="Ornek: S, M, L veya 36, 38, 40"
        returnKeyType="done"
        onSubmitEditing={onSave}
      />

      <Button label="Degerleri kaydet" onPress={onSave} loading={submitting} />
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
  valueList: {
    marginTop: 12,
    gap: 10,
  },
  valueRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  valueCopy: {
    gap: 4,
  },
  valueTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  valueCaption: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  valueActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  editorValueList: {
    marginTop: 12,
    gap: 12,
  },
});
