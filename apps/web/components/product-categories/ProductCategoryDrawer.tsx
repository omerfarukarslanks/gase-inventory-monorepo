"use client";

import type { FormEvent } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import InputField from "@/components/ui/InputField";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import type { CategoryForm } from "@/components/product-categories/types";

type ProductCategoryDrawerProps = {
  open: boolean;
  editingCategoryId: string | null;
  submitting: boolean;
  loadingCategoryDetail: boolean;
  form: CategoryForm;
  parentOptions: Array<{ value: string; label: string }>;
  formError: string;
  nameError: string;
  slugError: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (field: keyof CategoryForm, value: string) => void;
};

export default function ProductCategoryDrawer({
  open,
  editingCategoryId,
  submitting,
  loadingCategoryDetail,
  form,
  parentOptions,
  formError,
  nameError,
  slugError,
  onClose,
  onSubmit,
  onFormChange,
}: ProductCategoryDrawerProps) {
  const { t } = useLang();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={editingCategoryId ? t("common.update") : t("productCategories.new")}
      description={editingCategoryId ? t("common.update") : t("productCategories.new")}
      closeDisabled={submitting || loadingCategoryDetail}
      mobileFullscreen
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            label={t("common.cancel")}
            type="button"
            onClick={onClose}
            disabled={submitting || loadingCategoryDetail}
            variant="secondary"
          />
          <Button
            label={submitting ? (editingCategoryId ? t("common.updating") : t("common.creating")) : t("common.save")}
            type="submit"
            form="category-form"
            disabled={submitting || loadingCategoryDetail}
            variant="primarySolid"
          />
        </div>
      }
    >
      <form id="category-form" onSubmit={onSubmit} className="space-y-4 p-5">
        {loadingCategoryDetail ? (
          <div className="text-sm text-muted">{t("common.loading")}</div>
        ) : (
          <>
            <InputField
              label="Kategori Adi *"
              type="text"
              value={form.name}
              onChange={(value) => onFormChange("name", value)}
              placeholder="Elektronik"
              error={nameError}
            />

            <InputField
              label="Slug *"
              type="text"
              value={form.slug}
              onChange={(value) => onFormChange("slug", value)}
              placeholder="elektronik"
              error={slugError}
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Ust Kategori</label>
              <SearchableDropdown
                options={parentOptions}
                value={form.parentId}
                onChange={(value) => onFormChange("parentId", value)}
                placeholder="Ana kategori"
                emptyOptionLabel="Ana Kategori"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Aciklama</label>
              <textarea
                value={form.description}
                onChange={(event) => onFormChange("description", event.target.value)}
                className="min-h-[92px] w-full rounded-xl2 border border-border bg-surface2 px-3 py-2.5 text-sm text-text outline-none focus:border-primary/60"
                placeholder="Tum elektronik urunler"
              />
            </div>

            {formError && <p className="text-sm text-error">{formError}</p>}
          </>
        )}
      </form>
    </Drawer>
  );
}
