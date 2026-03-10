import { updateSupplier, type Supplier } from "@gase/core";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  ScreenHeader,
  SectionTitle,
  SkeletonBlock,
  StatusBadge,
  StickyActionBar,
} from "@/src/components/ui";
import { formatDate } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";
import { useSupplierList } from "./hooks/useSupplierList";
import { useSupplierForm } from "./hooks/useSupplierForm";
import { SupplierListView } from "./views/SupplierListView";
import { SupplierFormSheet } from "./views/SupplierFormSheet";

type SuppliersScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

export default function SuppliersScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: SuppliersScreenProps = {}) {
  const [toggling, setToggling] = useState(false);

  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    suppliers,
    loading,
    error,
    setError,
    selectedSupplier,
    setSelectedSupplier,
    detailLoading,
    fetchSuppliers,
    openSupplier,
    resetFilters,
  } = useSupplierList({ isActive });

  const {
    editorOpen,
    editingSupplierId,
    editingSupplierIsActive,
    setEditingSupplierIsActive,
    submitting,
    form,
    formError,
    nameError,
    phoneError,
    emailError,
    surnameRef,
    phoneRef,
    emailRef,
    addressRef,
    openCreateModal,
    openEditModal,
    closeEditor,
    submitSupplier,
    handleFormChange,
  } = useSupplierForm({ canCreate, canUpdate, selectedSupplier, fetchSuppliers, setSelectedSupplier });

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

        <SupplierFormSheet
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
          onChange={handleFormChange}
        />
      </View>
    );
  }

  return (
    <SupplierListView
      suppliers={suppliers}
      loading={loading}
      error={error}
      search={search}
      setSearch={setSearch}
      statusFilter={statusFilter}
      setStatusFilter={setStatusFilter}
      canCreate={canCreate}
      onBack={onBack}
      onSupplierPress={(supplierId) => void openSupplier(supplierId)}
      onFetchSuppliers={() => void fetchSuppliers()}
      onResetFilters={resetFilters}
      onOpenCreateModal={openCreateModal}
      editorOpen={editorOpen}
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
      onCloseEditor={closeEditor}
      onSubmit={() => void submitSupplier()}
      onToggleActive={() => setEditingSupplierIsActive((current) => !current)}
      onFormChange={handleFormChange}
    />
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
  loadingList: {
    gap: 12,
    paddingBottom: 120,
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
