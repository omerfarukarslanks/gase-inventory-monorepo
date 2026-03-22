import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
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
import { useUserList } from "./hooks/useUserList";
import { useUserForm } from "./hooks/useUserForm";
import { UserListView } from "./views/UserListView";
import { UserFormSheet } from "./views/UserFormSheet";

type UsersScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

export default function UsersScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: UsersScreenProps = {}) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    users,
    stores,
    roleOptions,
    loading,
    error,
    setError,
    selectedUser,
    setSelectedUser,
    detailLoading,
    fetchUsersList,
    fetchStoresList,
    openUser,
    resetFilters,
  } = useUserList({ isActive });

  const {
    editorOpen,
    editingUserId,
    editingUserIsActive,
    setEditingUserIsActive,
    form,
    formErrors,
    formError,
    submitting,
    toggling,
    surnameRef,
    emailRef,
    passwordRef,
    storeSelectionItems,
    selectedStoreLabel,
    resetEditor,
    openCreateModal,
    openEditModal,
    handleFieldChange,
    submitUser,
    toggleUserActive,
  } = useUserForm({
    stores,
    onAfterSubmit: (refreshed) => setSelectedUser(refreshed),
    fetchUsersList,
  });

  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif kullanicilar";
    if (statusFilter === "false") return "Pasif kullanicilar";
    return "Tum kullanicilar";
  }, [statusFilter]);

  const hasFilters = Boolean(search.trim() || statusFilter !== "all");

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
              onPress={() =>
                void toggleUserActive(
                  selectedUser,
                  (refreshed) => setSelectedUser(refreshed),
                  (msg) => setError(msg),
                )
              }
              variant={selectedUser.isActive === false ? "secondary" : "danger"}
              loading={toggling}
            />
          ) : null}
        </StickyActionBar>

        <UserFormSheet
          visible={editorOpen}
          form={form}
          formErrors={formErrors}
          formError={formError}
          roleOptions={roleOptions}
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
          onChange={handleFieldChange}
        />
      </View>
    );
  }

  return (
    <>
      <UserListView
        users={users}
        loading={loading}
        error={error}
        search={search}
        setSearch={setSearch}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        activeFilterLabel={activeFilterLabel}
        hasFilters={hasFilters}
        canCreate={canCreate}
        onBack={onBack}
        onUserPress={(userId) => void openUser(userId)}
        onCreatePress={openCreateModal}
        onResetFilters={resetFilters}
        onRefresh={() => void Promise.all([fetchUsersList(), fetchStoresList()])}
      />

      <UserFormSheet
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
        onChange={handleFieldChange}
      />
    </>
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
});
