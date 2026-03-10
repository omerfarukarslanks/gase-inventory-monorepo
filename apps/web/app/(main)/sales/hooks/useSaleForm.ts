"use client";
import { useCallback, useState } from "react";
import {
  getSaleById,
  createSale,
  updateSale,
  type PaymentMethod,
  type SaleListItem,
  type UpdateSalePayload,
  type CreateSalePayload,
  type CreateSaleLinePayload,
} from "@/lib/sales";
import { normalizeSaleDetail } from "@/lib/sales-normalize";
import {
  createLineRow,
  type SaleLineForm,
  type FieldErrors,
  type VariantPreset,
} from "@/components/sales/types";
import { createCustomer, type Customer, type CreateCustomerRequest } from "@/lib/customers";
import { toNumberOrNull } from "@/lib/format";

type Options = {
  scopeReady: boolean;
  canTenantOnly: boolean;
  scopedStoreId: string;
  isWholesaleStoreType: boolean;
  variantPresetsById: Record<string, VariantPreset>;
  onSuccess: (message: string) => void;
  refetchList: () => Promise<void>;
  t: (key: string) => string;
};

export function useSaleForm({
  canTenantOnly,
  scopedStoreId,
  isWholesaleStoreType,
  variantPresetsById,
  onSuccess,
  refetchList,
}: Options) {
  const [saleDrawerOpen, setSaleDrawerOpen] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [storeId, setStoreId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerDropdownRefreshKey, setCustomerDropdownRefreshKey] = useState(0);
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("CASH");
  const [initialPaymentAmount, setInitialPaymentAmount] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<SaleLineForm[]>([createLineRow()]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const resetSaleForm = useCallback(() => {
    setEditingSaleId(null);
    setStoreId(canTenantOnly ? scopedStoreId : "");
    setCustomerId("");
    setName("");
    setSurname("");
    setPhoneNumber("");
    setEmail("");
    setPaymentMethod("CASH");
    setInitialPaymentAmount("");
    setNote("");
    setLines([createLineRow()]);
    setErrors({});
    setFormError("");
  }, [canTenantOnly, scopedStoreId]);

  const openSaleDrawer = () => {
    resetSaleForm();
    setSaleDrawerOpen(true);
  };

  const closeSaleDrawer = () => {
    if (submitting) return;
    setFormError("");
    setSaleDrawerOpen(false);
  };

  const openEditDrawer = async (sale: SaleListItem) => {
    resetSaleForm();
    setFormError("");
    setSaleDrawerOpen(true);
    setEditingSaleId(sale.id);
    setSubmitting(true);
    try {
      const response = await getSaleById(sale.id);
      const detail = normalizeSaleDetail(response);
      if (!detail) {
        setFormError("Satis detayi alinamadi.");
        return;
      }
      setName(detail.name ?? "");
      setSurname(detail.surname ?? "");
      setPhoneNumber(detail.phoneNumber ?? "");
      setEmail(detail.email ?? "");
      setCustomerId(detail.customerId ?? "");
      setNote(detail.note ?? "");
      if (detail.storeId) setStoreId(detail.storeId);
      setLines(
        detail.lines.length > 0
          ? detail.lines.map((line) => ({
              rowId: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              productVariantId: line.productVariantId ?? line.productPackageId ?? "",
              quantity: line.quantity != null ? String(line.quantity) : "1",
              currency: line.currency ?? "TRY",
              unitPrice: line.unitPrice != null ? String(line.unitPrice) : "",
              discountMode: line.discountAmount != null ? ("amount" as const) : ("percent" as const),
              discountPercent: line.discountPercent != null ? String(line.discountPercent) : "",
              discountAmount: line.discountAmount != null ? String(line.discountAmount) : "",
              taxMode: line.taxAmount != null ? ("amount" as const) : ("percent" as const),
              taxPercent: line.taxPercent != null ? String(line.taxPercent) : "",
              taxAmount: line.taxAmount != null ? String(line.taxAmount) : "",
              campaignCode: line.campaignCode ?? "",
            }))
          : [createLineRow()],
      );
    } catch {
      setFormError("Satis detayi yuklenemedi.");
    } finally {
      setSubmitting(false);
    }
  };

  const onChangeLine = (rowId: string, patch: Partial<SaleLineForm>) => {
    setErrors((prev) => ({ ...prev, lines: undefined }));
    setLines((prev) => prev.map((line) => (line.rowId === rowId ? { ...line, ...patch } : line)));
  };

  const applyVariantPreset = useCallback(
    (rowId: string, variantId: string) => {
      const preset = variantPresetsById[variantId];
      if (!preset) {
        onChangeLine(rowId, { productVariantId: variantId });
        return;
      }

      const storePreset = storeId
        ? preset.stores.find((store) => store.storeId === storeId) ?? preset.stores[0]
        : preset.stores[0];
      const selected = storePreset ?? preset;

      onChangeLine(rowId, {
        productVariantId: variantId,
        currency: selected.currency,
        unitPrice:
          selected.unitPrice != null
            ? String(selected.unitPrice)
            : selected.lineTotal != null
              ? String(selected.lineTotal)
              : "",
        discountMode: selected.discountAmount != null ? "amount" : "percent",
        discountPercent: selected.discountPercent != null ? String(selected.discountPercent) : "",
        discountAmount: selected.discountAmount != null ? String(selected.discountAmount) : "",
        taxMode: selected.taxAmount != null ? "amount" : "percent",
        taxPercent: selected.taxPercent != null ? String(selected.taxPercent) : "",
        taxAmount: selected.taxAmount != null ? String(selected.taxAmount) : "",
      });
    },
    [variantPresetsById, storeId],
  );

  const addLine = () => setLines((prev) => [...prev, createLineRow()]);
  const removeLine = (rowId: string) =>
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((line) => line.rowId !== rowId)));

  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};
    if (!customerId) nextErrors.customerId = "Musteri secimi zorunludur.";

    if (!editingSaleId && canTenantOnly && !storeId) {
      nextErrors.storeId = "Magaza secimi zorunludur.";
    }

    if (!editingSaleId && !paymentMethod) nextErrors.paymentMethod = "Odeme yontemi zorunludur.";
    if (!editingSaleId) {
      const amount = toNumberOrNull(initialPaymentAmount);
      if (amount == null || amount < 0) {
        nextErrors.initialPaymentAmount = "Gecerli bir odenen tutar girin.";
      }
    }

    if (!editingSaleId) {
      if (lines.length === 0) {
        nextErrors.lines = "En az bir satis satiri eklemelisiniz.";
      } else {
        const invalidLine = lines.some((line) => {
          const quantity = toNumberOrNull(line.quantity);
          const unitPrice = toNumberOrNull(line.unitPrice);
          return !line.productVariantId || quantity == null || quantity <= 0 || unitPrice == null || unitPrice < 0;
        });
        if (invalidLine) {
          nextErrors.lines = isWholesaleStoreType
            ? "Tum satirlarda paket, adet ve birim fiyat alanlari gecerli olmalidir."
            : "Tum satirlarda varyant, adet ve birim fiyat alanlari gecerli olmalidir.";
        }
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildLinePayloads = (): CreateSaleLinePayload[] =>
    lines.map((line) => {
      const common = {
        quantity: Number(line.quantity),
        currency: line.currency,
        unitPrice: Number(line.unitPrice),
        ...(line.discountMode === "percent" && line.discountPercent
          ? { discountPercent: Number(line.discountPercent) }
          : {}),
        ...(line.discountMode === "amount" && line.discountAmount
          ? { discountAmount: Number(line.discountAmount) }
          : {}),
        ...(line.taxMode === "percent" && line.taxPercent
          ? { taxPercent: Number(line.taxPercent) }
          : {}),
        ...(line.taxMode === "amount" && line.taxAmount
          ? { taxAmount: Number(line.taxAmount) }
          : {}),
        ...(line.campaignCode.trim() ? { campaignCode: line.campaignCode.trim() } : {}),
      };

      if (isWholesaleStoreType) {
        return {
          productPackageId: line.productVariantId,
          ...common,
        };
      }

      return {
        productVariantId: line.productVariantId,
        ...common,
      };
    });

  const onSelectCustomer = useCallback((customer: Customer) => {
    setCustomerId(customer.id);
    setName(customer.name ?? "");
    setSurname(customer.surname ?? "");
    setPhoneNumber(customer.phoneNumber ?? "");
    setEmail(customer.email ?? "");
  }, []);

  const onQuickCreateCustomer = useCallback(async (payload: CreateCustomerRequest) => {
    const created = await createCustomer(payload);
    setCustomerDropdownRefreshKey((prev) => prev + 1);
    return created;
  }, []);

  const onSubmit = async () => {
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingSaleId) {
        const payload: UpdateSalePayload = {
          customerId,
          ...(note.trim() ? { meta: { note: note.trim() } } : {}),
        };
        await updateSale(editingSaleId, payload);
        onSuccess("Satis kaydi guncellendi.");
      } else {
        const normalizedStoreId = storeId.trim();
        const payload: CreateSalePayload = {
          ...(canTenantOnly || !normalizedStoreId ? {} : { storeId: normalizedStoreId }),
          customerId,
          meta: {
            note: note.trim() || undefined,
          },
          lines: buildLinePayloads(),
          initialPayment: {
            amount: Number(initialPaymentAmount),
            paymentMethod: paymentMethod as PaymentMethod,
          },
        };
        await createSale(payload);
        onSuccess("Satis kaydi olusturuldu.");
      }
      resetSaleForm();
      setSaleDrawerOpen(false);
      await refetchList();
    } catch {
      setFormError(
        editingSaleId
          ? "Satis guncellenemedi. Lutfen tekrar deneyin."
          : "Satis olusturulamadi. Lutfen tekrar deneyin.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    saleDrawerOpen,
    editingSaleId,
    storeId,
    setStoreId,
    customerId,
    setCustomerId,
    customerDropdownRefreshKey,
    name,
    setName,
    surname,
    setSurname,
    phoneNumber,
    setPhoneNumber,
    email,
    setEmail,
    paymentMethod,
    setPaymentMethod,
    initialPaymentAmount,
    setInitialPaymentAmount,
    note,
    setNote,
    lines,
    errors,
    setErrors,
    submitting,
    formError,
    resetSaleForm,
    openSaleDrawer,
    closeSaleDrawer,
    openEditDrawer,
    onChangeLine,
    applyVariantPreset,
    addLine,
    removeLine,
    validate,
    buildLinePayloads,
    onSelectCustomer,
    onQuickCreateCustomer,
    onSubmit,
  };
}
