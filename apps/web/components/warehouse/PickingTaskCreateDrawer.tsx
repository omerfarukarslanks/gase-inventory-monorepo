"use client";

import { useEffect, useMemo, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import Button from "@/components/ui/Button";
import SearchableDropdown from "@/components/ui/SearchableDropdown";
import { useLang } from "@/context/LangContext";
import { useDebounceStr } from "@/hooks/useDebounce";
import { getProducts, getProductVariants, type Product, type ProductVariant } from "@/lib/products";
import { getWarehouseLocations, getWaves, type CreatePickingTaskPayload, type WarehouseLocation, type Wave } from "@/lib/warehouse";

type PickingTaskCreateDrawerProps = {
  open: boolean;
  submitting: boolean;
  warehouseOptions: Array<{ value: string; label: string }>;
  initialWarehouseId?: string;
  onClose: () => void;
  onSubmit: (payload: CreatePickingTaskPayload) => Promise<void>;
};

const INPUT_CLASSNAME =
  "h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function PickingTaskCreateDrawer({
  open,
  submitting,
  warehouseOptions,
  initialWarehouseId,
  onClose,
  onSubmit,
}: PickingTaskCreateDrawerProps) {
  const { t } = useLang();
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId ?? "");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const debouncedProductSearchTerm = useDebounceStr(productSearchTerm, 300);
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [variantOptions, setVariantOptions] = useState<ProductVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [locationOptions, setLocationOptions] = useState<WarehouseLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [fromLocationId, setFromLocationId] = useState("");
  const [waveOptions, setWaveOptions] = useState<Wave[]>([]);
  const [wavesLoading, setWavesLoading] = useState(false);
  const [waveId, setWaveId] = useState("");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [saleId, setSaleId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const resolvedWarehouseId = useMemo(() => {
    if (warehouseId && warehouseOptions.some((option) => option.value === warehouseId)) return warehouseId;
    return initialWarehouseId && warehouseOptions.some((option) => option.value === initialWarehouseId)
      ? initialWarehouseId
      : (warehouseOptions[0]?.value ?? "");
  }, [initialWarehouseId, warehouseId, warehouseOptions]);

  const productOptions = useMemo(
    () => productResults.map((product) => ({ value: product.id, label: product.name })),
    [productResults],
  );

  const variantDropdownOptions = useMemo(
    () => variantOptions.map((variant) => ({ value: variant.id, label: variant.name || variant.code || variant.id })),
    [variantOptions],
  );

  const locationDropdownOptions = useMemo(
    () => locationOptions.map((location) => ({ value: location.id, label: `${location.code} / ${location.name}` })),
    [locationOptions],
  );

  const waveDropdownOptions = useMemo(
    () =>
      waveOptions
        .filter((wave) => wave.status !== "COMPLETED" && wave.status !== "CANCELLED")
        .map((wave) => ({ value: wave.id, label: wave.code })),
    [waveOptions],
  );

  useEffect(() => {
    if (!open) return;
    const term = debouncedProductSearchTerm.trim();
    let cancelled = false;

    void (async () => {
      setProductsLoading(true);
      try {
        const response = await getProducts({
          page: 1,
          limit: 15,
          search: term || undefined,
          isActive: true,
          variantIsActive: true,
        });
        if (!cancelled) setProductResults(response.data ?? []);
      } catch {
        if (!cancelled) setProductResults([]);
      } finally {
        if (!cancelled) setProductsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedProductSearchTerm, open]);

  useEffect(() => {
    if (!selectedProduct?.id) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setVariantsLoading(true);
      try {
        const variants = await getProductVariants(selectedProduct.id, { isActive: true });
        if (!cancelled) setVariantOptions(variants ?? []);
      } catch {
        if (!cancelled) setVariantOptions([]);
      } finally {
        if (!cancelled) setVariantsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedProduct?.id]);

  useEffect(() => {
    if (!resolvedWarehouseId) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setLocationsLoading(true);
      setWavesLoading(true);
      try {
        const [locations, waves] = await Promise.all([
          getWarehouseLocations(resolvedWarehouseId),
          getWaves({ warehouseId: resolvedWarehouseId }),
        ]);
        if (cancelled) return;
        setLocationOptions(locations);
        setWaveOptions(waves);
        if (!locations.some((location) => location.id === fromLocationId)) {
          setFromLocationId("");
        }
        if (!waves.some((wave) => wave.id === waveId)) {
          setWaveId("");
        }
      } catch {
        if (cancelled) return;
        setLocationOptions([]);
        setWaveOptions([]);
        setFromLocationId("");
        setWaveId("");
      } finally {
        if (!cancelled) {
          setLocationsLoading(false);
          setWavesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fromLocationId, resolvedWarehouseId, waveId]);

  const handleSubmit = async () => {
    if (!resolvedWarehouseId) {
      setFormError(t("warehouse.pickingTasks.warehouseRequired"));
      return;
    }
    if (!selectedVariantId) {
      setFormError(t("warehouse.pickingTasks.variantRequired"));
      return;
    }
    if (!fromLocationId) {
      setFormError(t("warehouse.pickingTasks.locationRequired"));
      return;
    }
    if (!waveId) {
      setFormError(t("warehouse.pickingTasks.waveRequired"));
      return;
    }
    const parsedQuantity = Number(requestedQuantity);
    if (Number.isNaN(parsedQuantity) || parsedQuantity <= 0) {
      setFormError(t("warehouse.pickingTasks.quantityRequired"));
      return;
    }

    setFormError("");
    await onSubmit({
      warehouseId: resolvedWarehouseId,
      productVariantId: selectedVariantId,
      requestedQuantity: parsedQuantity,
      fromLocationId,
      saleId: saleId.trim() || undefined,
      waveId,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      title={t("warehouse.pickingTasks.createTitle")}
      closeDisabled={submitting}
      mobileFullscreen
      className="!max-w-[640px]"
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button label={t("common.cancel")} onClick={onClose} disabled={submitting} variant="secondary" />
          <Button
            label={submitting ? t("common.saving") : t("common.save")}
            onClick={() => void handleSubmit()}
            disabled={submitting}
            loading={submitting}
            variant="primarySolid"
          />
        </div>
      )}
    >
      <div className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.warehouse")} *</label>
          <SearchableDropdown
            options={warehouseOptions}
            value={resolvedWarehouseId}
            onChange={(value) => {
              setWarehouseId(value);
              setLocationOptions([]);
              setWaveOptions([]);
              setFromLocationId("");
              setWaveId("");
              setFormError("");
            }}
            placeholder={t("warehouse.common.warehousePlaceholder")}
            showEmptyOption={false}
            allowClear={false}
            disabled={warehouseOptions.length === 0}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.product")} *</label>
          <SearchableDropdown
            options={productOptions}
            value={selectedProduct?.id ?? ""}
            searchValue={productSearchTerm}
            onSearchChange={setProductSearchTerm}
            searchPlaceholder={t("warehouse.countSessions.productSearchPlaceholder")}
            loading={productsLoading}
            loadingText={t("warehouse.countSessions.productsLoading")}
            onChange={(value) => {
              const product = productResults.find((item) => item.id === value) ?? null;
              setSelectedProduct(product);
              setVariantOptions([]);
              setSelectedVariantId("");
              setProductSearchTerm("");
              setFormError("");
            }}
            placeholder={t("warehouse.countSessions.productPlaceholder")}
            showEmptyOption={false}
            allowClear={false}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.variant")} *</label>
          <SearchableDropdown
            options={variantDropdownOptions}
            value={selectedVariantId}
            onChange={(value) => {
              setSelectedVariantId(value);
              setFormError("");
            }}
            placeholder={t("warehouse.countSessions.variantPlaceholder")}
            showEmptyOption={false}
            allowClear={false}
            disabled={variantDropdownOptions.length === 0 || variantsLoading}
          />
          {variantsLoading ? <p className="mt-1 text-xs text-muted">{t("warehouse.countSessions.variantsLoading")}</p> : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.pickingTasks.sourceLocation")} *</label>
          <SearchableDropdown
            options={locationDropdownOptions}
            value={fromLocationId}
            onChange={(value) => {
              setFromLocationId(value);
              setFormError("");
            }}
            placeholder={t("warehouse.countSessions.locationPlaceholder")}
            showEmptyOption={false}
            allowClear={false}
            disabled={locationDropdownOptions.length === 0 || locationsLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.pickingTasks.wave")} *</label>
          <SearchableDropdown
            options={waveDropdownOptions}
            value={waveId}
            onChange={(value) => {
              setWaveId(value);
              setFormError("");
            }}
            placeholder={t("warehouse.pickingTasks.wave")}
            showEmptyOption={false}
            allowClear={false}
            disabled={waveDropdownOptions.length === 0 || wavesLoading}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.pickingTasks.requestedQuantity")} *</label>
          <input
            type="number"
            min="0"
            step="1"
            value={requestedQuantity}
            onChange={(event) => {
              setRequestedQuantity(event.target.value);
              setFormError("");
            }}
            className={INPUT_CLASSNAME}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.pickingTasks.sale")}</label>
          <input
            type="text"
            value={saleId}
            onChange={(event) => setSaleId(event.target.value)}
            placeholder={t("warehouse.pickingTasks.salePlaceholder")}
            className={INPUT_CLASSNAME}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-muted">{t("warehouse.common.note")}</label>
          <textarea
            className="min-h-28 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("warehouse.pickingTasks.notesPlaceholder")}
          />
        </div>

        {formError ? <p className="text-sm text-error">{formError}</p> : null}
      </div>
    </Drawer>
  );
}
