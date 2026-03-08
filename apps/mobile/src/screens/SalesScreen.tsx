import {
  cancelSale,
  createCustomer,
  createSale,
  createSalePayment,
  createSaleReturn,
  getCustomers,
  getSaleById,
  getSalePayments,
  getSales,
  getStores,
  getTenantStockSummary,
  normalizeProducts,
  normalizeSaleDetail,
  normalizeSalesResponse,
  updateSalePayment,
  type Customer,
  type InventoryVariantStockItem,
  type PaymentMethod,
  type SaleDetail,
  type SaleListItem,
  type SalePayment,
  type Store,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import {
  AppScreen,
  Banner,
  Button,
  Card,
  EmptyState,
  FilterTabs,
  ModalSheet,
  SectionTitle,
  SelectionList,
  StatusBadge,
  TextField,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCount, formatCurrency, formatDate, toNumber, toNullableNumber } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type SaleStatusFilter = "all" | "CONFIRMED" | "CANCELLED";

type SaleComposerLine = {
  id: string;
  variantId: string;
  label: string;
  quantity: string;
  unitPrice: string;
  currency: "TRY" | "USD" | "EUR";
};

type PaymentEditorState = {
  saleId: string;
  paymentId?: string;
  amount: string;
  note: string;
  paymentMethod: PaymentMethod;
  currency: "TRY" | "USD" | "EUR";
};

type ReturnLineState = {
  saleLineId: string;
  label: string;
  maxQuantity: number;
  quantity: string;
};

const saleStatusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Onayli", value: "CONFIRMED" as const },
  { label: "Iptal", value: "CANCELLED" as const },
];

const paymentMethodOptions = [
  { label: "Nakit", value: "CASH" as const },
  { label: "Kart", value: "CARD" as const },
  { label: "Transfer", value: "TRANSFER" as const },
  { label: "Diger", value: "OTHER" as const },
];

function createLine(): SaleComposerLine {
  return {
    id: `line-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    variantId: "",
    label: "Varyant secilmedi",
    quantity: "1",
    unitPrice: "",
    currency: "TRY",
  };
}

export default function SalesScreen() {
  const { signOut, storeIds } = useAuth();
  const [receiptNo, setReceiptNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [statusFilter, setStatusFilter] = useState<SaleStatusFilter>("all");
  const [sales, setSales] = useState<SaleListItem[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<SaleDetail | null>(null);
  const [payments, setPayments] = useState<SalePayment[]>([]);

  const [composerOpen, setComposerOpen] = useState(false);
  const [composerLoading, setComposerLoading] = useState(false);
  const [composerStoreId, setComposerStoreId] = useState(storeIds[0] ?? "");
  const [composerCustomerId, setComposerCustomerId] = useState("");
  const [composerCustomerLabel, setComposerCustomerLabel] = useState("Musteri sec");
  const [composerNote, setComposerNote] = useState("");
  const [composerPaymentAmount, setComposerPaymentAmount] = useState("");
  const [composerPaymentMethod, setComposerPaymentMethod] = useState<PaymentMethod>("CASH");
  const [composerLines, setComposerLines] = useState<SaleComposerLine[]>([createLine()]);

  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerPickerSearch, setCustomerPickerSearch] = useState("");
  const [customerPickerLoading, setCustomerPickerLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);

  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [variantPickerLineId, setVariantPickerLineId] = useState<string | null>(null);
  const [variantPickerSearch, setVariantPickerSearch] = useState("");
  const [variantPickerLoading, setVariantPickerLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<InventoryVariantStockItem[]>([]);

  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [quickCustomerLoading, setQuickCustomerLoading] = useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: "",
    surname: "",
    phoneNumber: "",
  });

  const [paymentEditor, setPaymentEditor] = useState<PaymentEditorState | null>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnLines, setReturnLines] = useState<ReturnLineState[]>([]);
  const [returnNotes, setReturnNotes] = useState("");

  const debouncedReceipt = useDebouncedValue(receiptNo, 350);
  const debouncedCustomer = useDebouncedValue(customerName, 350);
  const debouncedCustomerPickerSearch = useDebouncedValue(customerPickerSearch, 300);
  const debouncedVariantPickerSearch = useDebouncedValue(variantPickerSearch, 300);

  const scopedStoreIds = useMemo(() => (storeIds.length ? storeIds : undefined), [storeIds]);
  const visibleStores = useMemo(
    () => (stores.length ? stores.filter((store) => !storeIds.length || storeIds.includes(store.id)) : []),
    [storeIds, stores],
  );

  const fetchSalesList = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getSales({
        storeIds: scopedStoreIds,
        page: 1,
        limit: 50,
        receiptNo: debouncedReceipt || undefined,
        name: debouncedCustomer || undefined,
        status: statusFilter === "all" ? undefined : [statusFilter],
      });
      const normalized = normalizeSalesResponse(response);
      setSales(normalized.data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satislar yuklenemedi.");
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedCustomer, debouncedReceipt, scopedStoreIds, statusFilter]);

  const fetchStoresList = useCallback(async () => {
    try {
      const response = await getStores({ page: 1, limit: 100 });
      setStores(response.data ?? []);
    } catch {
      setStores([]);
    }
  }, []);

  useEffect(() => {
    void fetchStoresList();
  }, [fetchStoresList]);

  useEffect(() => {
    void fetchSalesList();
  }, [fetchSalesList]);

  useEffect(() => {
    if (!customerPickerOpen) return;
    let active = true;
    setCustomerPickerLoading(true);
    getCustomers({ page: 1, limit: 30, search: debouncedCustomerPickerSearch || undefined })
      .then((response) => {
        if (active) setCustomerOptions(response.data ?? []);
      })
      .catch(() => {
        if (active) setCustomerOptions([]);
      })
      .finally(() => {
        if (active) setCustomerPickerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [customerPickerOpen, debouncedCustomerPickerSearch]);

  useEffect(() => {
    if (!variantPickerOpen) return;
    let active = true;
    setVariantPickerLoading(true);
    getTenantStockSummary({
      page: 1,
      limit: 20,
      search: debouncedVariantPickerSearch || undefined,
      storeIds: scopedStoreIds,
    })
      .then((response) => {
        if (!active) return;
        const variants = normalizeProducts(response)
          .flatMap((product) => product.variants ?? [])
          .slice(0, 30);
        setVariantOptions(variants);
      })
      .catch(() => {
        if (active) setVariantOptions([]);
      })
      .finally(() => {
        if (active) setVariantPickerLoading(false);
      });
    return () => {
      active = false;
    };
  }, [variantPickerOpen, debouncedVariantPickerSearch, scopedStoreIds]);

  const openDetail = async (sale: SaleListItem) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const [detailResponse, paymentsResponse] = await Promise.all([
        getSaleById(sale.id),
        getSalePayments(sale.id),
      ]);
      const normalizedDetail = normalizeSaleDetail(detailResponse);
      setDetail(normalizedDetail);
      setPayments(paymentsResponse);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satis detayi yuklenemedi.");
      setDetail(null);
      setPayments([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const resetComposer = () => {
    setComposerStoreId(storeIds[0] ?? "");
    setComposerCustomerId("");
    setComposerCustomerLabel("Musteri sec");
    setComposerNote("");
    setComposerPaymentAmount("");
    setComposerPaymentMethod("CASH");
    setComposerLines([createLine()]);
  };

  const submitComposer = async () => {
    if (!composerCustomerId) {
      setError("Musteri secmeden satis olusturulamaz.");
      return;
    }

    const validLines = composerLines
      .filter((line) => line.variantId)
      .map((line) => ({
        productVariantId: line.variantId,
        quantity: toNumber(line.quantity),
        currency: line.currency,
        unitPrice: toNumber(line.unitPrice),
      }));

    if (!validLines.length) {
      setError("En az bir satis satiri ekleyin.");
      return;
    }

    setComposerLoading(true);
    setError("");
    try {
      await createSale({
        storeId: composerStoreId || undefined,
        customerId: composerCustomerId,
        meta: {
          source: "mobile",
          note: composerNote || undefined,
        },
        lines: validLines,
        initialPayment: {
          amount: toNumber(composerPaymentAmount),
          paymentMethod: composerPaymentMethod,
          note: composerNote || undefined,
        },
      });
      setComposerOpen(false);
      resetComposer();
      await fetchSalesList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satis olusturulamadi.");
    } finally {
      setComposerLoading(false);
    }
  };

  const openPaymentEditor = (saleId: string, payment?: SalePayment) => {
    setPaymentEditor({
      saleId,
      paymentId: payment?.id,
      amount: String(payment?.amount ?? ""),
      note: payment?.note ?? "",
      paymentMethod: (payment?.paymentMethod as PaymentMethod | undefined) ?? "CASH",
      currency: ((payment?.currency as "TRY" | "USD" | "EUR" | undefined) ?? detail?.currency ?? "TRY"),
    });
  };

  const submitPayment = async () => {
    if (!paymentEditor) return;

    setPaymentSubmitting(true);
    setError("");
    try {
      if (paymentEditor.paymentId) {
        await updateSalePayment(paymentEditor.saleId, paymentEditor.paymentId, {
          amount: toNumber(paymentEditor.amount),
          note: paymentEditor.note || undefined,
          paymentMethod: paymentEditor.paymentMethod,
          currency: paymentEditor.currency,
        });
      } else {
        await createSalePayment(paymentEditor.saleId, {
          amount: toNumber(paymentEditor.amount),
          note: paymentEditor.note || undefined,
          paymentMethod: paymentEditor.paymentMethod,
          currency: paymentEditor.currency,
        });
      }

      setPaymentEditor(null);
      if (detail) await openDetail({ id: detail.id } as SaleListItem);
      await fetchSalesList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Odeme kaydedilemedi.");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const prepareReturn = () => {
    if (!detail) return;
    const nextLines = detail.lines
      .map((line) => {
        const maxQuantity = Math.max(0, Number(line.quantity ?? 0) - Number(line.returnedQuantity ?? 0));
        return {
          saleLineId: line.id,
          label: line.productVariantName ?? line.productName ?? "Satir",
          maxQuantity,
          quantity: maxQuantity > 0 ? "0" : "",
        };
      })
      .filter((line) => line.maxQuantity > 0);

    setReturnLines(nextLines);
    setReturnNotes("");
    setReturnOpen(true);
  };

  const submitReturn = async () => {
    if (!detail) return;

    const lines = returnLines
      .map((line) => ({
        saleLineId: line.saleLineId,
        quantity: toNullableNumber(line.quantity) ?? 0,
      }))
      .filter((line) => line.quantity > 0);

    if (!lines.length) {
      setError("Iade icin miktar girin.");
      return;
    }

    setReturnSubmitting(true);
    setError("");
    try {
      await createSaleReturn(detail.id, {
        lines,
        notes: returnNotes || undefined,
      });
      setReturnOpen(false);
      await openDetail({ id: detail.id } as SaleListItem);
      await fetchSalesList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Iade olusturulamadi.");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const submitCancel = async () => {
    if (!detail) return;

    setCancelSubmitting(true);
    setError("");
    try {
      await cancelSale(detail.id, {
        reason: cancelReason || undefined,
        note: cancelNote || undefined,
      });
      setCancelOpen(false);
      setCancelReason("");
      setCancelNote("");
      await openDetail({ id: detail.id } as SaleListItem);
      await fetchSalesList();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Satis iptal edilemedi.");
    } finally {
      setCancelSubmitting(false);
    }
  };

  const createQuickCustomer = async () => {
    if (!quickCustomerForm.name.trim() || !quickCustomerForm.surname.trim()) {
      setError("Ad ve soyad zorunlu.");
      return;
    }

    setQuickCustomerLoading(true);
    setError("");
    try {
      const customer = await createCustomer({
        name: quickCustomerForm.name.trim(),
        surname: quickCustomerForm.surname.trim(),
        phoneNumber: quickCustomerForm.phoneNumber.trim() || undefined,
      });
      setComposerCustomerId(customer.id);
      setComposerCustomerLabel(`${customer.name} ${customer.surname}`.trim());
      setQuickCustomerOpen(false);
      setQuickCustomerForm({ name: "", surname: "", phoneNumber: "" });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Musteri olusturulamadi.");
    } finally {
      setQuickCustomerLoading(false);
    }
  };

  return (
    <AppScreen
      title="Satislar"
      subtitle="Listele, detay ac, yeni satis, odeme, iade ve iptal akislari"
      action={<Button label="Cikis" onPress={() => void signOut()} variant="ghost" />}
    >
      {error ? <Banner text={error} /> : null}

      <Card>
        <View style={styles.filterStack}>
          <TextField label="Fis no" value={receiptNo} onChangeText={setReceiptNo} placeholder="ORN-001" />
          <TextField label="Musteri" value={customerName} onChangeText={setCustomerName} placeholder="Ad veya soyad" />
          <FilterTabs value={statusFilter} options={saleStatusOptions} onChange={setStatusFilter} />
          <Button label="Yeni satis" onPress={() => setComposerOpen(true)} />
        </View>
      </Card>

      <Card>
        <SectionTitle title={`Satis listesi (${sales.length})`} action={<Button label="Yenile" onPress={() => void fetchSalesList()} variant="secondary" />} />
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : sales.length ? (
          <View style={styles.list}>
            {sales.map((sale) => (
              <Pressable key={sale.id} style={styles.saleRow} onPress={() => void openDetail(sale)}>
                <View style={styles.saleCopy}>
                  <Text style={styles.saleTitle}>{sale.receiptNo ?? sale.id}</Text>
                  <Text style={styles.saleMeta}>
                    {sale.name ?? "-"} {sale.surname ?? ""} • {formatDate(sale.createdAt)}
                  </Text>
                  <Text style={styles.saleMeta}>
                    {formatCurrency(sale.lineTotal ?? sale.total, sale.currency ?? "TRY")} • {sale.storeName ?? "-"}
                  </Text>
                </View>
                <StatusBadge
                  label={sale.status ?? "DURUM"}
                  tone={sale.status === "CANCELLED" ? "danger" : "positive"}
                />
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState title="Satis bulunamadi." />
        )}
      </Card>

      <ModalSheet
        visible={composerOpen}
        title="Yeni satis"
        subtitle="Musteri, store, satir ve ilk odemeyi tanimla"
        onClose={() => {
          setComposerOpen(false);
          resetComposer();
        }}
      >
        <Text style={styles.sectionLabel}>Magaza</Text>
        <SelectionList
          items={visibleStores.map((store) => ({
            label: store.name,
            value: store.id,
            description: store.code,
          }))}
          selectedValue={composerStoreId}
          onSelect={setComposerStoreId}
        />

        <Card>
          <SectionTitle title="Musteri" action={<Button label="Hizli musteri" onPress={() => setQuickCustomerOpen(true)} variant="secondary" />} />
          <Text style={styles.selectionValue}>{composerCustomerLabel}</Text>
          <Button label="Musteri sec" onPress={() => setCustomerPickerOpen(true)} variant="secondary" />
        </Card>

        <Card>
          <SectionTitle title="Satirlar" action={<Button label="Satir ekle" onPress={() => setComposerLines((current) => [...current, createLine()])} variant="secondary" />} />
          <View style={styles.composerLines}>
            {composerLines.map((line) => (
              <View key={line.id} style={styles.lineCard}>
                <Text style={styles.lineLabel}>{line.label}</Text>
                <Button
                  label="Varyant sec"
                  onPress={() => {
                    setVariantPickerLineId(line.id);
                    setVariantPickerOpen(true);
                  }}
                  variant="secondary"
                />
                <TextField label="Miktar" value={line.quantity} onChangeText={(value) => setComposerLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: value } : item))} keyboardType="numeric" />
                <TextField label="Birim fiyat" value={line.unitPrice} onChangeText={(value) => setComposerLines((current) => current.map((item) => item.id === line.id ? { ...item, unitPrice: value } : item))} keyboardType="numeric" />
                {composerLines.length > 1 ? (
                  <Button
                    label="Satiri sil"
                    onPress={() => setComposerLines((current) => current.filter((item) => item.id !== line.id))}
                    variant="ghost"
                  />
                ) : null}
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <SectionTitle title="Ilk odeme" />
          <FilterTabs value={composerPaymentMethod} options={paymentMethodOptions} onChange={setComposerPaymentMethod} />
          <TextField label="Odeme tutari" value={composerPaymentAmount} onChangeText={setComposerPaymentAmount} keyboardType="numeric" />
          <TextField label="Not" value={composerNote} onChangeText={setComposerNote} multiline />
        </Card>

        <Button label="Satisi olustur" onPress={() => void submitComposer()} loading={composerLoading} />
      </ModalSheet>

      <ModalSheet
        visible={customerPickerOpen}
        title="Musteri sec"
        subtitle="Hizli arama ile musteriyi bagla"
        onClose={() => setCustomerPickerOpen(false)}
      >
        <TextField label="Ara" value={customerPickerSearch} onChangeText={setCustomerPickerSearch} placeholder="Ad, soyad veya telefon" />
        {customerPickerLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : (
          <SelectionList
            items={customerOptions.map((customer) => ({
              label: `${customer.name} ${customer.surname}`.trim(),
              value: customer.id,
              description: customer.phoneNumber ?? customer.email ?? "",
            }))}
            selectedValue={composerCustomerId}
            onSelect={(value) => {
              const customer = customerOptions.find((item) => item.id === value);
              setComposerCustomerId(value);
              setComposerCustomerLabel(customer ? `${customer.name} ${customer.surname}`.trim() : "Musteri sec");
              setCustomerPickerOpen(false);
            }}
          />
        )}
      </ModalSheet>

      <ModalSheet
        visible={variantPickerOpen}
        title="Varyant sec"
        subtitle="Satis satirina varyant bagla"
        onClose={() => setVariantPickerOpen(false)}
      >
        <TextField label="Ara" value={variantPickerSearch} onChangeText={setVariantPickerSearch} placeholder="Varyant veya urun ara" />
        {variantPickerLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : (
          <SelectionList
            items={variantOptions.map((variant) => {
              const storeSummary = variant.stores?.[0];
              return {
                label: variant.variantName,
                value: variant.productVariantId,
                description: `${variant.variantCode ?? "-"} • ${formatCount(variant.totalQuantity)} adet • ${formatCurrency(storeSummary?.salePrice ?? storeSummary?.unitPrice, (storeSummary?.currency ?? "TRY") as "TRY" | "USD" | "EUR")}`,
              };
            })}
            selectedValue={composerLines.find((line) => line.id === variantPickerLineId)?.variantId}
            onSelect={(value) => {
              const variant = variantOptions.find((item) => item.productVariantId === value);
              if (!variantPickerLineId || !variant) return;
              const firstStore = variant.stores?.[0];
              setComposerLines((current) => current.map((line) => (
                line.id === variantPickerLineId
                  ? {
                      ...line,
                      variantId: value,
                      label: variant.variantName,
                      unitPrice: String(firstStore?.salePrice ?? firstStore?.unitPrice ?? ""),
                      currency: ((firstStore?.currency ?? "TRY") as "TRY" | "USD" | "EUR"),
                    }
                  : line
              )));
              setVariantPickerOpen(false);
            }}
          />
        )}
      </ModalSheet>

      <ModalSheet
        visible={quickCustomerOpen}
        title="Hizli musteri"
        subtitle="Satis icin yeni musteri olustur"
        onClose={() => setQuickCustomerOpen(false)}
      >
        <TextField label="Ad" value={quickCustomerForm.name} onChangeText={(value) => setQuickCustomerForm((current) => ({ ...current, name: value }))} />
        <TextField label="Soyad" value={quickCustomerForm.surname} onChangeText={(value) => setQuickCustomerForm((current) => ({ ...current, surname: value }))} />
        <TextField label="Telefon" value={quickCustomerForm.phoneNumber} onChangeText={(value) => setQuickCustomerForm((current) => ({ ...current, phoneNumber: value }))} />
        <Button label="Musteriyi olustur" onPress={() => void createQuickCustomer()} loading={quickCustomerLoading} />
      </ModalSheet>

      <ModalSheet
        visible={detailOpen}
        title={detail?.receiptNo ?? "Satis detayi"}
        subtitle={detail ? `${detail.name ?? "-"} ${detail.surname ?? ""}`.trim() : "Satis ozeti"}
        onClose={() => {
          setDetailOpen(false);
          setDetail(null);
          setPayments([]);
        }}
      >
        {detailLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : detail ? (
          <>
            <Card>
              <View style={styles.detailGrid}>
                <Text style={styles.saleMeta}>Magaza: {detail.storeName ?? "-"}</Text>
                <Text style={styles.saleMeta}>Toplam: {formatCurrency(detail.lineTotal, detail.currency ?? "TRY")}</Text>
                <Text style={styles.saleMeta}>Odenen: {formatCurrency(detail.paidAmount, detail.currency ?? "TRY")}</Text>
                <Text style={styles.saleMeta}>Kalan: {formatCurrency(detail.remainingAmount, detail.currency ?? "TRY")}</Text>
                <Text style={styles.saleMeta}>Not: {detail.note ?? "-"}</Text>
              </View>
            </Card>

            <Card>
              <SectionTitle title={`Satirlar (${detail.lines.length})`} />
              <View style={styles.list}>
                {detail.lines.map((line) => (
                  <View key={line.id} style={styles.detailRow}>
                    <View style={styles.saleCopy}>
                      <Text style={styles.saleTitle}>{line.productVariantName ?? line.productName ?? "-"}</Text>
                      <Text style={styles.saleMeta}>
                        {formatCount(line.quantity)} adet • {formatCurrency(line.lineTotal, line.currency ?? detail.currency ?? "TRY")}
                      </Text>
                    </View>
                    <StatusBadge label={`Iade ${formatCount(line.returnedQuantity)}`} tone="warning" />
                  </View>
                ))}
              </View>
            </Card>

            <Card>
              <SectionTitle title={`Odemeler (${payments.length})`} action={<Button label="Odeme ekle" onPress={() => openPaymentEditor(detail.id)} variant="secondary" />} />
              {payments.length ? (
                <View style={styles.list}>
                  {payments.map((payment) => (
                    <Pressable key={payment.id} style={styles.detailRow} onPress={() => openPaymentEditor(detail.id, payment)}>
                      <View style={styles.saleCopy}>
                        <Text style={styles.saleTitle}>{payment.paymentMethod ?? "PAYMENT"}</Text>
                        <Text style={styles.saleMeta}>
                          {formatCurrency(payment.amount, (payment.currency as "TRY" | "USD" | "EUR" | undefined) ?? "TRY")} • {formatDate(payment.paidAt ?? payment.createdAt)}
                        </Text>
                      </View>
                      <StatusBadge label={payment.status ?? "ACTIVE"} tone="positive" />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <EmptyState title="Odeme bulunamadi." />
              )}
            </Card>

            <View style={styles.operationRow}>
              <Button label="Iade" onPress={prepareReturn} variant="secondary" />
              <Button label="Iptal" onPress={() => setCancelOpen(true)} variant="danger" />
            </View>
          </>
        ) : (
          <EmptyState title="Detay getirilemedi." />
        )}
      </ModalSheet>

      <ModalSheet
        visible={Boolean(paymentEditor)}
        title={paymentEditor?.paymentId ? "Odemeyi duzenle" : "Odeme ekle"}
        subtitle="Satis odeme kalemini guncelle"
        onClose={() => setPaymentEditor(null)}
      >
        {paymentEditor ? (
          <>
            <FilterTabs value={paymentEditor.paymentMethod} options={paymentMethodOptions} onChange={(value) => setPaymentEditor((current) => current ? { ...current, paymentMethod: value } : current)} />
            <TextField label="Tutar" value={paymentEditor.amount} onChangeText={(value) => setPaymentEditor((current) => current ? { ...current, amount: value } : current)} keyboardType="numeric" />
            <TextField label="Not" value={paymentEditor.note} onChangeText={(value) => setPaymentEditor((current) => current ? { ...current, note: value } : current)} multiline />
            <Button label="Odemeyi kaydet" onPress={() => void submitPayment()} loading={paymentSubmitting} />
          </>
        ) : null}
      </ModalSheet>

      <ModalSheet
        visible={cancelOpen}
        title="Satisi iptal et"
        subtitle="Iptal nedeni ve not ekle"
        onClose={() => setCancelOpen(false)}
      >
        <TextField label="Iptal nedeni" value={cancelReason} onChangeText={setCancelReason} />
        <TextField label="Not" value={cancelNote} onChangeText={setCancelNote} multiline />
        <Button label="Iptali onayla" onPress={() => void submitCancel()} loading={cancelSubmitting} variant="danger" />
      </ModalSheet>

      <ModalSheet
        visible={returnOpen}
        title="Iade olustur"
        subtitle="Her satir icin iade miktarini gir"
        onClose={() => setReturnOpen(false)}
      >
        {returnLines.length ? (
          <>
            {returnLines.map((line) => (
              <Card key={line.saleLineId}>
                <Text style={styles.lineLabel}>{line.label}</Text>
                <Text style={styles.saleMeta}>Maksimum {line.maxQuantity} adet</Text>
                <TextField label="Iade miktari" value={line.quantity} onChangeText={(value) => setReturnLines((current) => current.map((item) => item.saleLineId === line.saleLineId ? { ...item, quantity: value } : item))} keyboardType="numeric" />
              </Card>
            ))}
            <TextField label="Not" value={returnNotes} onChangeText={setReturnNotes} multiline />
            <Button label="Iadeyi kaydet" onPress={() => void submitReturn()} loading={returnSubmitting} />
          </>
        ) : (
          <EmptyState title="Iadeye uygun satir kalmadi." />
        )}
      </ModalSheet>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  filterStack: {
    gap: 12,
  },
  loadingWrap: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  saleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 14,
  },
  saleCopy: {
    flex: 1,
    gap: 4,
  },
  saleTitle: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  saleMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    lineHeight: 17,
  },
  sectionLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 13,
    fontWeight: "700",
  },
  selectionValue: {
    marginVertical: 10,
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "600",
  },
  composerLines: {
    marginTop: 12,
    gap: 12,
  },
  lineCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 12,
    gap: 10,
  },
  lineLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  detailGrid: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 12,
  },
  operationRow: {
    flexDirection: "row",
    gap: 12,
  },
});
