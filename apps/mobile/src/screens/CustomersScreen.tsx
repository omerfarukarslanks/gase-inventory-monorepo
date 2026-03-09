import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  createCustomer,
  getCustomerBalance,
  getCustomers,
  type Customer,
  type CustomerBalance,
} from "@gase/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
  Banner,
  Button,
  Card,
  EmptyStateWithAction,
  FilterTabs,
  InlineStat,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { trackEvent } from "@/src/lib/analytics";
import type { RequestEnvelope, CustomersRequest, SalesDraftSeed } from "@/src/lib/workflows";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCount, formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

type CustomersScreenProps = {
  isActive?: boolean;
  request?: RequestEnvelope<CustomersRequest> | null;
  onStartSale?: (seed?: SalesDraftSeed) => void;
};

const statusOptions = [
  { label: "Tum", value: "all" as const },
  { label: "Aktif", value: "true" as const },
  { label: "Pasif", value: "false" as const },
];

const emptyForm = {
  name: "",
  surname: "",
  phoneNumber: "",
  email: "",
};

export default function CustomersScreen({
  isActive = true,
  onStartSale,
  request,
}: CustomersScreenProps = {}) {
  const handledRequestId = useRef<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formAttempted, setFormAttempted] = useState(false);
  const [composerError, setComposerError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);
  const surnameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const phoneDigits = useMemo(
    () => form.phoneNumber.replace(/\D/g, ""),
    [form.phoneNumber],
  );
  const emailValue = form.email.trim().toLowerCase();
  const nameError = useMemo(() => {
    if (!formAttempted && !form.name.trim()) return "";
    return form.name.trim() ? "" : "Ad zorunlu.";
  }, [form.name, formAttempted]);
  const surnameError = useMemo(() => {
    if (!formAttempted && !form.surname.trim()) return "";
    return form.surname.trim() ? "" : "Soyad zorunlu.";
  }, [form.surname, formAttempted]);
  const phoneError = useMemo(() => {
    if (!form.phoneNumber.trim()) return "";
    return phoneDigits.length >= 10 ? "" : "Telefon en az 10 haneli olmali.";
  }, [form.phoneNumber, phoneDigits.length]);
  const emailError = useMemo(() => {
    if (!emailValue) return "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)
      ? ""
      : "Gecerli bir e-posta girin.";
  }, [emailValue]);
  const formHasErrors = Boolean(nameError || surnameError || phoneError || emailError);
  const canSubmit = Boolean(
    form.name.trim() &&
      form.surname.trim() &&
      !phoneError &&
      !emailError,
  );
  const activeFilterLabel = useMemo(() => {
    if (statusFilter === "true") return "Aktif musteriler";
    if (statusFilter === "false") return "Pasif musteriler";
    return "Tum musteriler";
  }, [statusFilter]);
  const hasCustomerFilters = Boolean(search.trim() || statusFilter !== "all");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getCustomers({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        isActive:
          statusFilter === "all"
            ? "all"
            : statusFilter === "true",
      });
      setCustomers(response.data ?? []);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Musteriler yuklenemedi.");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    if (!isActive) return;
    void fetchCustomers();
  }, [fetchCustomers, isActive]);

  const openComposerModal = useCallback(() => {
    setComposerOpen(true);
    setFormAttempted(false);
    setComposerError("");
    setForm(emptyForm);
  }, []);

  const closeComposerModal = useCallback(() => {
    setComposerOpen(false);
    setComposerError("");
    setFormAttempted(false);
    setForm(emptyForm);
  }, []);

  useEffect(() => {
    if (!request || handledRequestId.current === request.id) return;
    handledRequestId.current = request.id;

    if (request.payload.kind === "compose") {
      openComposerModal();
    }
  }, [openComposerModal, request]);

  const openCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setBalance(null);
    setBalanceLoading(true);
    try {
      const nextBalance = await getCustomerBalance(customer.id);
      setBalance(nextBalance);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Musteri bakiyesi getirilemedi.");
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const onCreateCustomer = async () => {
    setFormAttempted(true);

    if (formHasErrors || !canSubmit) {
      trackEvent("validation_error", { screen: "customers", field: "name_surname" });
      setComposerError("Zorunlu alanlari duzeltip tekrar dene.");
      return;
    }

    setSubmitting(true);
    setComposerError("");
    try {
      await createCustomer({
        name: form.name.trim(),
        surname: form.surname.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: emailValue || undefined,
      });
      closeComposerModal();
      await fetchCustomers();
    } catch (nextError) {
      setComposerError(nextError instanceof Error ? nextError.message : "Musteri olusturulamadi.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  if (selectedCustomer) {
    const fullName = `${selectedCustomer.name} ${selectedCustomer.surname}`.trim();

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenContent}>
          <ScreenHeader
            title={fullName}
            subtitle="Bakiye ve satis ozeti"
            onBack={() => {
              setSelectedCustomer(null);
              setBalance(null);
            }}
          />

          {error ? <Banner text={error} /> : null}

          <Card>
            <SectionTitle title="Musteri profili" />
            <View style={styles.detailStats}>
              <View style={styles.detailStat}>
                <Text style={styles.detailLabel}>Iletisim</Text>
                <Text style={styles.detailValue}>
                  {selectedCustomer.phoneNumber ?? selectedCustomer.email ?? "Kayitli bilgi yok"}
                </Text>
              </View>
              <View style={styles.detailStat}>
                <Text style={styles.detailLabel}>Durum</Text>
                <Text style={styles.detailValue}>
                  {selectedCustomer.isActive === false ? "Pasif musteri" : "Aktif musteri"}
                </Text>
              </View>
            </View>
          </Card>

          <Card>
            <SectionTitle title="Bakiye ozeti" />
            {balanceLoading ? (
              <View style={styles.loadingList}>
                <SkeletonBlock height={18} />
                <SkeletonBlock height={18} width="80%" />
                <SkeletonBlock height={18} width="60%" />
              </View>
            ) : balance ? (
              <View style={styles.balanceGrid}>
                <InlineStat label="Toplam satis" value={formatCount(balance.totalSalesCount)} />
                <InlineStat label="Toplam tutar" value={formatCurrency(balance.totalSaleAmount, "TRY")} />
                <InlineStat label="Odenen" value={formatCurrency(balance.totalPaidAmount, "TRY")} />
                <InlineStat label="Iade" value={formatCurrency(balance.totalReturnAmount, "TRY")} />
                <InlineStat label="Bakiye" value={formatCurrency(balance.balance, "TRY")} />
              </View>
            ) : (
              <EmptyStateWithAction
                title="Bakiye getirilemedi."
                subtitle="Musteri hesabini yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void openCustomer(selectedCustomer)}
              />
            )}
          </Card>
        </ScrollView>

        <StickyActionBar>
          <Button
            label="Listeye don"
            onPress={() => {
              setSelectedCustomer(null);
              setBalance(null);
            }}
            variant="ghost"
          />
          <Button
            label="Satis baslat"
            onPress={() => {
              trackEvent("sale_started", { source: "customer_detail", customerId: selectedCustomer.id });
              onStartSale?.({
                customerId: selectedCustomer.id,
                customerLabel: fullName,
              });
            }}
            icon={<MaterialCommunityIcons name="cart-plus" size={16} color="#FFFFFF" />}
          />
        </StickyActionBar>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.screenContent}>
        <ScreenHeader
          title="Musteriler"
          subtitle="Arama, hizli olusturma ve satisa gecis"
          action={<Button label="Yenile" onPress={() => void fetchCustomers()} variant="secondary" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <View style={styles.filterStack}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Ad, soyad veya telefon ara"
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
          data={customers}
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
                  <Text style={styles.detailValue}>{formatCount(customers.length)}</Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={styles.detailLabel}>Arama</Text>
                  <Text style={styles.detailValue}>
                    {search.trim() ? `"${search.trim()}"` : "Tum musteriler"}
                  </Text>
                </View>
              </View>
            </Card>
          }
          renderItem={({ item }) => (
            <ListRow
              title={`${item.name} ${item.surname}`.trim()}
              subtitle={item.phoneNumber ?? item.email ?? "Iletisim bilgisi yok"}
              caption={item.isActive === false ? "Pasif kayit" : "Aktif musteri"}
              badgeLabel="Detay"
              badgeTone="info"
              onPress={() => void openCustomer(item)}
              icon={<MaterialCommunityIcons name="account-outline" size={20} color={mobileTheme.colors.brand.primary} />}
            />
          )}
          ListEmptyComponent={
            error ? (
              <EmptyStateWithAction
                title="Musteri listesi yuklenemedi."
                subtitle="Baglanti problemi olabilir. Listeyi yeniden sorgula."
                actionLabel="Tekrar dene"
                onAction={() => void fetchCustomers()}
              />
            ) : (
              <EmptyStateWithAction
                title={hasCustomerFilters ? "Filtreye uygun musteri yok." : "Musteri bulunamadi."}
                subtitle={
                  hasCustomerFilters
                    ? "Aramayi temizle veya durum filtresini genislet."
                    : "Yeni musteri olusturarak satis akisini hizlandirabilirsin."
                }
                actionLabel={hasCustomerFilters ? "Filtreyi temizle" : "Yeni musteri"}
                onAction={() => {
                  if (hasCustomerFilters) {
                    trackEvent("empty_state_action_clicked", {
                      screen: "customers",
                      target: "reset_filters",
                    });
                    resetFilters();
                    return;
                  }
                  trackEvent("empty_state_action_clicked", {
                    screen: "customers",
                    target: "create_customer",
                  });
                  openComposerModal();
                }}
              />
            )
          }
        />
      )}

      <StickyActionBar>
        <Button label="Filtreyi temizle" onPress={resetFilters} variant="ghost" />
        <Button
          label="Yeni musteri"
          onPress={openComposerModal}
          icon={<MaterialCommunityIcons name="account-plus-outline" size={16} color="#FFFFFF" />}
        />
      </StickyActionBar>

      <ModalSheet
        visible={composerOpen}
        title="Yeni musteri"
        subtitle="Saha operasyonu icin hizli kayit"
        onClose={closeComposerModal}
      >
        {composerError ? <Banner text={composerError} /> : null}
        <TextField
          label="Ad"
          value={form.name}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, name: value }));
            if (composerError) setComposerError("");
          }}
          errorText={nameError || undefined}
          returnKeyType="next"
          onSubmitEditing={() => surnameRef.current?.focus()}
          blurOnSubmit={false}
        />
        <TextField
          label="Soyad"
          value={form.surname}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, surname: value }));
            if (composerError) setComposerError("");
          }}
          errorText={surnameError || undefined}
          inputRef={surnameRef}
          returnKeyType="next"
          onSubmitEditing={() => phoneRef.current?.focus()}
          blurOnSubmit={false}
        />
        <TextField
          label="Telefon"
          value={form.phoneNumber}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, phoneNumber: value }));
            if (composerError) setComposerError("");
          }}
          keyboardType="phone-pad"
          inputMode="tel"
          helperText="Opsiyonel. Tahsilat ve aramada hiz kazandirir."
          errorText={phoneError || undefined}
          inputRef={phoneRef}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
        />
        <TextField
          label="E-posta"
          value={form.email}
          onChangeText={(value) => {
            setForm((current) => ({ ...current, email: value }));
            if (composerError) setComposerError("");
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          textContentType="emailAddress"
          inputMode="email"
          helperText="Opsiyonel. Varsa musteri kaydini daha sonra bulmak kolaylasir."
          errorText={emailError || undefined}
          inputRef={emailRef}
          returnKeyType="done"
          onSubmitEditing={() => void onCreateCustomer()}
        />
        <Button
          label="Musteriyi kaydet"
          onPress={() => void onCreateCustomer()}
          loading={submitting}
          disabled={!canSubmit}
        />
      </ModalSheet>
    </View>
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
  balanceGrid: {
    marginTop: 12,
    gap: 14,
  },
  summaryStats: {
    marginTop: 12,
    gap: 12,
  },
  summaryStat: {
    gap: 4,
  },
});
