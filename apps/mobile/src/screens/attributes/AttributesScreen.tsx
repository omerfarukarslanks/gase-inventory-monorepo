import { useAttributeList } from "./hooks/useAttributeList";
import { useAttributeForm } from "./hooks/useAttributeForm";
import { AttributeListView } from "./views/AttributeListView";
import { AttributeDetailView } from "./views/AttributeDetailView";
import { AttributeEditorSheet, AttributeValuesEditorSheet } from "./views/AttributeEditorSheet";

type AttributesScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

export default function AttributesScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: AttributesScreenProps = {}) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    attributes,
    loading,
    error,
    setError,
    selectedAttribute,
    setSelectedAttribute,
    detailLoading,
    activeFilterLabel,
    hasFilters,
    fetchAttributes,
    openAttribute,
    resetFilters,
  } = useAttributeList({ isActive });

  const canManageValues = canCreate || canUpdate;

  const {
    editorOpen,
    editingAttributeId,
    editingAttributeIsActive,
    setEditingAttributeIsActive,
    formName,
    setFormName,
    formError,
    setFormError,
    nameError,
    submitting,
    valueEditorOpen,
    existingValues,
    setExistingValues,
    newValuesInput,
    setNewValuesInput,
    valueFormError,
    setValueFormError,
    valueSubmitting,
    togglingAttribute,
    togglingValueId,
    nameRef,
    valuesRef,
    resetEditor,
    resetValueEditor,
    openCreateModal,
    openEditModal,
    openValuesEditor,
    submitAttribute,
    saveValues,
    toggleAttributeActive,
    toggleValueActive,
  } = useAttributeForm({ fetchAttributes, setSelectedAttribute });

  const handleBack = () => {
    setSelectedAttribute(null);
    setError("");
  };

  const sharedSheets = (
    <>
      <AttributeEditorSheet
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
        onSubmit={() => void submitAttribute(canManageValues)}
        onToggleActive={() => setEditingAttributeIsActive((current) => !current)}
        onChangeName={(value) => {
          setFormName(value);
          if (formError) setFormError("");
        }}
      />

      <AttributeValuesEditorSheet
        visible={valueEditorOpen}
        values={existingValues}
        newValuesInput={newValuesInput}
        formError={valueFormError}
        submitting={valueSubmitting}
        valuesRef={valuesRef}
        onClose={resetValueEditor}
        onSave={() => void saveValues(selectedAttribute)}
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
    </>
  );

  if (selectedAttribute || detailLoading) {
    return (
      <>
        <AttributeDetailView
          selectedAttribute={selectedAttribute}
          detailLoading={detailLoading}
          error={error}
          canUpdate={canUpdate}
          canManageValues={canManageValues}
          togglingAttribute={togglingAttribute}
          togglingValueId={togglingValueId}
          onBack={handleBack}
          onEditPress={(attribute) => openEditModal(attribute)}
          onManageValues={(attribute) => openValuesEditor(attribute)}
          onToggleAttributeActive={(attribute) => void toggleAttributeActive(attribute, setError)}
          onToggleValueActive={(value, next) =>
            void toggleValueActive(value, next, selectedAttribute, setError)
          }
        />
        {sharedSheets}
      </>
    );
  }

  return (
    <>
      <AttributeListView
        search={search}
        statusFilter={statusFilter}
        attributes={attributes}
        loading={loading}
        error={error}
        activeFilterLabel={activeFilterLabel}
        hasFilters={hasFilters}
        canCreate={canCreate}
        onBack={onBack}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
        onAttributePress={(attributeId) => void openAttribute(attributeId)}
        onResetFilters={resetFilters}
        onRefresh={() => void fetchAttributes()}
        onCreatePress={openCreateModal}
      />
      {sharedSheets}
    </>
  );
}
