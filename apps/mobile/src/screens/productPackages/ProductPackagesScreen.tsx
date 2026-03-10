import { usePackageDetail } from "./hooks/usePackageDetail";
import { usePackageForm } from "./hooks/usePackageForm";
import { usePackageList } from "./hooks/usePackageList";
import { PackageDetailView } from "./views/PackageDetailView";
import { PackageFormSheet } from "./views/PackageFormSheet";
import { PackageListView } from "./views/PackageListView";

type ProductPackagesScreenProps = {
  isActive?: boolean;
  canCreate?: boolean;
  canUpdate?: boolean;
  onBack?: () => void;
};

export default function ProductPackagesScreen({
  isActive = true,
  canCreate = false,
  canUpdate = false,
  onBack,
}: ProductPackagesScreenProps = {}) {
  const list = usePackageList({ isActive });

  const detail = usePackageDetail({
    onToggleSuccess: list.fetchPackages,
  });

  const form = usePackageForm({
    onSaveSuccess: async (updated) => {
      if (updated) {
        detail.setSelectedPackage(updated);
      }
      await list.fetchPackages();
    },
  });

  if (detail.selectedPackage || detail.detailLoading) {
    return (
      <>
        <PackageDetailView
          selectedPackage={detail.selectedPackage}
          detailLoading={detail.detailLoading}
          error={detail.error}
          toggling={detail.toggling}
          canUpdate={canUpdate}
          onBack={detail.closeDetail}
          onEditPress={(packageId) => void form.openEditModal(packageId)}
          onToggleActive={() => void detail.togglePackageActive()}
        />
        <PackageFormSheet
          visible={form.editorOpen}
          loadingDetail={form.editorLoading}
          form={form.form}
          nameError={form.nameError}
          codeError={form.codeError}
          itemsError={form.itemsError}
          formError={form.formError}
          items={form.items}
          itemErrors={form.itemErrors}
          editingId={form.editingId}
          editingIsActive={form.editingIsActive}
          submitting={form.submitting}
          canUpdate={canUpdate}
          variantSearchTerm={form.variantSearchTerm}
          variantSearchLoading={form.variantSearchLoading}
          variantSearchProducts={form.variantSearchProducts}
          selectedProductId={form.selectedProductId}
          selectedProductLabel={form.selectedProductLabel}
          variantsLoading={form.variantsLoading}
          variantOptions={form.variantOptions}
          selectedVariantId={form.selectedVariantId}
          addItemQuantity={form.addItemQuantity}
          addItemError={form.addItemError}
          codeRef={form.codeRef}
          descriptionRef={form.descriptionRef}
          onClose={form.resetEditor}
          onSubmit={() => void form.submitPackage()}
          onToggleActive={() => form.setEditingIsActive((current) => !current)}
          onFormChange={(field, value) => {
            form.setForm((current) => ({ ...current, [field]: value }));
            if (form.formError) form.setFormError("");
          }}
          onSearchProducts={(value) => {
            form.setAddItemError("");
            form.setVariantSearchTerm(value);
          }}
          onSelectProduct={(product) => {
            form.setSelectedProductId(product.id);
            form.setSelectedProductLabel(product.name);
            form.setSelectedVariantId("");
            form.setAddItemError("");
          }}
          onSelectVariant={(value) => {
            form.setAddItemError("");
            form.setSelectedVariantId(value);
          }}
          onAddItemQuantityChange={(value) => {
            form.setAddItemError("");
            form.setAddItemQuantity(value);
          }}
          onAddItem={form.addVariantItem}
          onRemoveItem={(rowId) =>
            form.setItems((current) => current.filter((item) => item.rowId !== rowId))
          }
          onChangeItemQuantity={(rowId, value) =>
            form.setItems((current) =>
              current.map((item) => (item.rowId === rowId ? { ...item, quantity: value } : item)),
            )
          }
        />
      </>
    );
  }

  return (
    <>
      <PackageListView
        packages={list.packages}
        loading={list.loading}
        error={list.error}
        search={list.search}
        statusFilter={list.statusFilter}
        activeFilterLabel={list.activeFilterLabel}
        hasFilters={list.hasFilters}
        canCreate={canCreate}
        onBack={onBack}
        onChangeSearch={list.setSearch}
        onChangeStatusFilter={list.setStatusFilter}
        onPackagePress={(packageId) => void detail.openPackage(packageId)}
        onFetchPackages={() => void list.fetchPackages()}
        onResetFilters={list.resetFilters}
        onResetFiltersWithTracking={list.resetFiltersWithTracking}
        onCreatePress={form.openCreateModal}
      />
      <PackageFormSheet
        visible={form.editorOpen}
        loadingDetail={form.editorLoading}
        form={form.form}
        nameError={form.nameError}
        codeError={form.codeError}
        itemsError={form.itemsError}
        formError={form.formError}
        items={form.items}
        itemErrors={form.itemErrors}
        editingId={form.editingId}
        editingIsActive={form.editingIsActive}
        submitting={form.submitting}
        canUpdate={canUpdate}
        variantSearchTerm={form.variantSearchTerm}
        variantSearchLoading={form.variantSearchLoading}
        variantSearchProducts={form.variantSearchProducts}
        selectedProductId={form.selectedProductId}
        selectedProductLabel={form.selectedProductLabel}
        variantsLoading={form.variantsLoading}
        variantOptions={form.variantOptions}
        selectedVariantId={form.selectedVariantId}
        addItemQuantity={form.addItemQuantity}
        addItemError={form.addItemError}
        codeRef={form.codeRef}
        descriptionRef={form.descriptionRef}
        onClose={form.resetEditor}
        onSubmit={() => void form.submitPackage()}
        onToggleActive={() => form.setEditingIsActive((current) => !current)}
        onFormChange={(field, value) => {
          form.setForm((current) => ({ ...current, [field]: value }));
          if (form.formError) form.setFormError("");
        }}
        onSearchProducts={(value) => {
          form.setAddItemError("");
          form.setVariantSearchTerm(value);
        }}
        onSelectProduct={(product) => {
          form.setSelectedProductId(product.id);
          form.setSelectedProductLabel(product.name);
          form.setSelectedVariantId("");
          form.setAddItemError("");
        }}
        onSelectVariant={(value) => {
          form.setAddItemError("");
          form.setSelectedVariantId(value);
        }}
        onAddItemQuantityChange={(value) => {
          form.setAddItemError("");
          form.setAddItemQuantity(value);
        }}
        onAddItem={form.addVariantItem}
        onRemoveItem={(rowId) =>
          form.setItems((current) => current.filter((item) => item.rowId !== rowId))
        }
        onChangeItemQuantity={(rowId, value) =>
          form.setItems((current) =>
            current.map((item) => (item.rowId === rowId ? { ...item, quantity: value } : item)),
          )
        }
      />
    </>
  );
}
