import {
  createCustomer,
  getCustomerBalance,
  getCustomers,
  type Customer,
  type CustomerBalance,
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
  InlineStat,
  ModalSheet,
  SectionTitle,
  TextField,
} from "@/src/components/ui";
import { useAuth } from "@/src/context/AuthContext";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { formatCount, formatCurrency } from "@/src/lib/format";
import { mobileTheme } from "@/src/theme";

type StatusFilter = "all" | "true" | "false";

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

export default function CustomersScreen() {
  const { signOut } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState<CustomerBalance | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 350);

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
    void fetchCustomers();
  }, [fetchCustomers]);

  const selectedCustomerName = useMemo(() => {
    if (!selectedCustomer) return "";
    return `${selectedCustomer.name} ${selectedCustomer.surname}`.trim();
  }, [selectedCustomer]);

  const openBalance = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setBalance(null);
    setBalanceLoading(true);
    try {
      const nextBalance = await getCustomerBalance(customer.id);
      setBalance(nextBalance);
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  };

  const onCreateCustomer = async () => {
    if (!form.name.trim() || !form.surname.trim()) {
      setError("Ad ve soyad zorunlu.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await createCustomer({
        name: form.name.trim(),
        surname: form.surname.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      setComposerOpen(false);
      setForm(emptyForm);
      await fetchCustomers();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Musteri olusturulamadi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen
      title="Musteriler"
      subtitle="Arama, hizli olusturma ve bakiye goruntuleme"
      action={<Button label="Cikis" onPress={() => void signOut()} variant="ghost" />}
    >
      {error ? <Banner text={error} /> : null}

      <Card>
        <View style={styles.filterStack}>
          <TextField
            label="Ara"
            value={search}
            onChangeText={setSearch}
            placeholder="Ad, soyad veya telefon"
          />
          <FilterTabs value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
          <Button label="Yeni musteri" onPress={() => setComposerOpen(true)} />
        </View>
      </Card>

      <Card>
        <SectionTitle title={`Liste (${customers.length})`} />
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
          </View>
        ) : customers.length ? (
          <View style={styles.list}>
            {customers.map((customer) => (
              <Pressable
                key={customer.id}
                style={styles.customerRow}
                onPress={() => void openBalance(customer)}
              >
                <View style={styles.customerCopy}>
                  <Text style={styles.customerName}>{customer.name} {customer.surname}</Text>
                  <Text style={styles.customerMeta}>
                    {customer.phoneNumber ?? customer.email ?? "Iletisim bilgisi yok"}
                  </Text>
                </View>
                <Text style={styles.customerCta}>Bakiye</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <EmptyState title="Musteri bulunamadi." subtitle="Arama veya filtreyi degistir." />
        )}
      </Card>

      <ModalSheet
        visible={composerOpen}
        title="Yeni musteri"
        subtitle="Hizli musteri kaydi"
        onClose={() => setComposerOpen(false)}
      >
        <TextField label="Ad" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} />
        <TextField label="Soyad" value={form.surname} onChangeText={(value) => setForm((current) => ({ ...current, surname: value }))} />
        <TextField label="Telefon" value={form.phoneNumber} onChangeText={(value) => setForm((current) => ({ ...current, phoneNumber: value }))} />
        <TextField label="E-posta" value={form.email} onChangeText={(value) => setForm((current) => ({ ...current, email: value }))} keyboardType="email-address" />
        <Button label="Musteriyi kaydet" onPress={() => void onCreateCustomer()} loading={submitting} />
      </ModalSheet>

      <ModalSheet
        visible={Boolean(selectedCustomer)}
        title={selectedCustomerName || "Musteri bakiyesi"}
        subtitle="Satis ve odeme ozeti"
        onClose={() => setSelectedCustomer(null)}
      >
        {balanceLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={mobileTheme.colors.brand.primary} />
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
          <EmptyState title="Bakiye getirilemedi." />
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
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
    backgroundColor: mobileTheme.colors.dark.surface2,
    padding: 14,
  },
  customerCopy: {
    flex: 1,
    gap: 4,
  },
  customerName: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  customerMeta: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
  },
  customerCta: {
    color: mobileTheme.colors.brand.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  balanceGrid: {
    gap: 12,
  },
});
