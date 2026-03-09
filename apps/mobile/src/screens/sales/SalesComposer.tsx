import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  Banner,
  Button,
  Card,
  ComposerStepIndicator,
  ListRow,
  ModalSheet,
  ScreenHeader,
  SearchBar,
  SectionTitle,
  SelectionList,
  SkeletonBlock,
  StickyActionBar,
  TextField,
} from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { ScrollView, StyleSheet, View } from "react-native";
import { formatCount, formatCurrency } from "@/src/lib/format";
import { createCustomer, type Store } from "@gase/core";
import { useMemo, useState } from "react";
import { trackEvent } from "@/src/lib/analytics";
import type { SalesRecentCustomer, SalesRecentVariant } from "@/src/lib/salesRecents";
import type { useSalesComposer } from "./hooks/useSalesComposer";
import type { useCustomerPicker } from "./hooks/useCustomerPicker";
import type { useVariantPicker } from "./hooks/useVariantPicker";
import type { StepStatus } from "@/src/components/ui/ComposerStepIndicator";
import { createQuickPickFromRecent, getPreferredStoreSummary } from "./hooks/validators";
import type { ComposerStep } from "./hooks/types";
import { ComposerCustomerStep } from "./steps/ComposerCustomerStep";
import { ComposerItemsStep } from "./steps/ComposerItemsStep";
import { ComposerPaymentStep } from "./steps/ComposerPaymentStep";
import { ComposerReviewStep } from "./steps/ComposerReviewStep";

type SalesComposerProps = {
  composer: ReturnType<typeof useSalesComposer>;
  customerPicker: ReturnType<typeof useCustomerPicker>;
  variantPicker: ReturnType<typeof useVariantPicker>;
  visibleStores: Store[];
  recentCustomers: SalesRecentCustomer[];
  recentVariants: SalesRecentVariant[];
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: mobileTheme.colors.dark.bg },
  screenContent: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  modalSection: { gap: 8 },
  list: { marginTop: 12, gap: 12 },
  loadingList: { gap: 12, paddingBottom: 120 },
});

export function SalesComposer({
  composer,
  customerPicker,
  variantPicker,
  visibleStores,
  recentCustomers,
  recentVariants,
}: SalesComposerProps) {
  const { draft, step, error, loading, stepErrors, nextStep, previousStep, changeStep, reset, submit, canProceedStep } = composer;

  const allSteps: Array<{ value: ComposerStep; label: string }> = [
    { value: "customer", label: "Musteri" },
    { value: "items", label: "Urunler" },
    { value: "payment", label: "Odeme" },
    { value: "review", label: "Onay" },
  ];

  const currentStepIndex = allSteps.findIndex((s) => s.value === step);

  const indicatorSteps = useMemo(() => allSteps.map((s, index) => {
    let status: StepStatus;
    if (index < currentStepIndex) {
      status = stepErrors[s.value as keyof typeof stepErrors] ? "error" : "completed";
    } else if (index === currentStepIndex) {
      status = stepErrors[s.value as keyof typeof stepErrors] ? "error" : "active";
    } else {
      status = "locked";
    }
    return { value: s.value, label: s.label, status };
  }), [step, stepErrors, currentStepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick customer creation — local state (compose-only concern)
  const [qcOpen, setQcOpen] = useState(false);
  const [qcLoading, setQcLoading] = useState(false);
  const [qcError, setQcError] = useState("");
  const [qcAttempted, setQcAttempted] = useState(false);
  const [qcForm, setQcForm] = useState({ name: "", surname: "", phoneNumber: "" });

  const qcPhoneDigits = useMemo(() => qcForm.phoneNumber.replace(/\D/g, ""), [qcForm.phoneNumber]);
  const qcNameError = !qcAttempted && !qcForm.name.trim() ? "" : qcForm.name.trim() ? "" : "Ad zorunlu.";
  const qcSurnameError = !qcAttempted && !qcForm.surname.trim() ? "" : qcForm.surname.trim() ? "" : "Soyad zorunlu.";
  const qcPhoneError = !qcForm.phoneNumber.trim() ? "" : qcPhoneDigits.length >= 10 ? "" : "Telefon en az 10 haneli olmali.";
  const qcCanCreate = Boolean(qcForm.name.trim() && qcForm.surname.trim() && !qcPhoneError);

  const openQc = () => {
    setQcAttempted(false);
    setQcError("");
    setQcForm({ name: "", surname: "", phoneNumber: "" });
    setQcOpen(true);
  };

  const createQcCustomer = async () => {
    setQcAttempted(true);
    if (!qcCanCreate || qcNameError || qcSurnameError || qcPhoneError) {
      trackEvent("validation_error", { screen: "sales", action: "quick_customer" });
      setQcError("Alanlari duzeltip tekrar dene.");
      return;
    }
    setQcLoading(true);
    setQcError("");
    try {
      const customer = await createCustomer({
        name: qcForm.name.trim(),
        surname: qcForm.surname.trim(),
        phoneNumber: qcForm.phoneNumber.trim() || undefined,
      });
      composer.selectCustomer(customer);
      setQcOpen(false);
      setQcAttempted(false);
      setQcForm({ name: "", surname: "", phoneNumber: "" });
    } catch (err) {
      setQcError(err instanceof Error ? err.message : "Musteri olusturulamadi.");
    } finally {
      setQcLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.screenContent} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          title="Yeni satis"
          subtitle="Adim adim satis olustur"
          onBack={previousStep}
          action={<Button label="Taslagi sifirla" onPress={reset} variant="ghost" size="sm" fullWidth={false} />}
        />

        {error ? <Banner text={error} /> : null}

        <Card>
          <ComposerStepIndicator steps={indicatorSteps} onChange={changeStep} />
        </Card>

        {step === "customer" ? (
          <ComposerCustomerStep
            composer={composer}
            visibleStores={visibleStores}
            recentCustomers={recentCustomers}
            onOpenCustomerPicker={() => customerPicker.setOpen(true)}
            onOpenQuickCustomer={openQc}
          />
        ) : null}

        {step === "items" ? (
          <ComposerItemsStep
            composer={composer}
            recentVariants={recentVariants}
            onOpenVariantPicker={variantPicker.openForLine}
          />
        ) : null}

        {step === "payment" ? <ComposerPaymentStep composer={composer} /> : null}

        {step === "review" ? <ComposerReviewStep composer={composer} visibleStores={visibleStores} /> : null}
      </ScrollView>

      <StickyActionBar>
        <Button
          label={step === "customer" ? "Listeye don" : "Geri"}
          onPress={previousStep}
          variant="ghost"
        />
        {step === "review" ? (
          <Button
            label="Satisi olustur"
            onPress={() => void submit()}
            loading={loading}
            disabled={Boolean(stepErrors.review)}
          />
        ) : (
          <Button
            label="Ilerle"
            onPress={nextStep}
            disabled={
              (step === "customer" && Boolean(stepErrors.customer)) ||
              (step === "items" && Boolean(stepErrors.items))
            }
          />
        )}
      </StickyActionBar>

      {/* Customer picker modal */}
      <ModalSheet
        visible={customerPicker.open}
        title="Musteri sec"
        subtitle="Hizli arama ile musteriyi bagla"
        onClose={() => customerPicker.setOpen(false)}
      >
        <SearchBar
          value={customerPicker.search}
          onChangeText={customerPicker.setSearch}
          placeholder="Ad, soyad veya telefon ara"
          hint="Son musteriler ustte, detayli arama altta listelenir."
        />
        {!customerPicker.search.trim() && recentCustomers.length ? (
          <View style={styles.modalSection}>
            <SectionTitle title="Son musteriler" />
            <View style={styles.list}>
              {recentCustomers.map((customer) => (
                <ListRow
                  key={customer.id}
                  title={customer.label}
                  subtitle={customer.phoneNumber ?? "Hizli secim"}
                  onPress={() => customerPicker.select(customer)}
                  icon={
                    <MaterialCommunityIcons
                      name="account-clock-outline"
                      size={20}
                      color={mobileTheme.colors.brand.primary}
                    />
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
        {customerPicker.loading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={72} />
            <SkeletonBlock height={72} />
          </View>
        ) : (
          <SelectionList
            items={customerPicker.options.map((customer) => ({
              label: `${customer.name} ${customer.surname}`.trim(),
              value: customer.id,
              description: customer.phoneNumber ?? customer.email ?? "",
            }))}
            selectedValue={draft.customerId}
            onSelect={(value) => {
              const customer = customerPicker.options.find((item) => item.id === value);
              if (!customer) return;
              customerPicker.select(customer);
            }}
          />
        )}
      </ModalSheet>

      {/* Variant picker modal */}
      <ModalSheet
        visible={variantPicker.open}
        title="Varyant sec"
        subtitle="Satisa eklenecek varyanti sec"
        onClose={() => variantPicker.setOpen(false)}
      >
        <SearchBar
          value={variantPicker.search}
          onChangeText={variantPicker.setSearch}
          placeholder="Barkod, SKU, varyant veya urun ara"
          hint="Tam barkod ve SKU eslesmeleri ustte gosterilir."
        />
        {!variantPicker.search.trim() && recentVariants.length ? (
          <View style={styles.modalSection}>
            <SectionTitle title="Son kullanilan varyantlar" />
            <View style={styles.list}>
              {recentVariants.map((variant) => (
                <ListRow
                  key={variant.productVariantId}
                  title={variant.label}
                  subtitle={variant.code ?? "Hizli secim"}
                  caption={`${formatCount(variant.totalQuantity)} adet`}
                  onPress={() => {
                    composer.applyVariantQuickPick(createQuickPickFromRecent(variant), variantPicker.lineId);
                    variantPicker.setOpen(false);
                  }}
                  icon={
                    <MaterialCommunityIcons
                      name="barcode-scan"
                      size={20}
                      color={mobileTheme.colors.brand.primary}
                    />
                  }
                />
              ))}
            </View>
          </View>
        ) : null}
        {variantPicker.loading ? (
          <View style={styles.loadingList}>
            <SkeletonBlock height={72} />
            <SkeletonBlock height={72} />
          </View>
        ) : (
          <SelectionList
            items={variantPicker.options.map((variant) => {
              const storeSummary = getPreferredStoreSummary(variant, draft.storeId);
              return {
                label: variant.variantName,
                value: variant.productVariantId,
                description: `${variant.variantCode ?? "-"} • ${formatCount(variant.totalQuantity)} adet • ${formatCurrency(storeSummary?.salePrice ?? storeSummary?.unitPrice, (storeSummary?.currency ?? "TRY") as "TRY" | "USD" | "EUR")}`,
              };
            })}
            selectedValue={draft.lines.find((line) => line.id === variantPicker.lineId)?.variantId}
            onSelect={(value) => {
              const variant = variantPicker.options.find((item) => item.productVariantId === value);
              if (!variant) return;
              variantPicker.select(variant);
            }}
          />
        )}
      </ModalSheet>

      {/* Quick customer creation modal */}
      <ModalSheet
        visible={qcOpen}
        title="Hizli musteri"
        subtitle="Satis icin yeni musteri olustur"
        onClose={() => {
          setQcOpen(false);
          setQcAttempted(false);
          setQcError("");
        }}
      >
        {qcError ? <Banner text={qcError} /> : null}
        <TextField
          label="Ad"
          value={qcForm.name}
          onChangeText={(value) => {
            setQcError("");
            setQcForm((current) => ({ ...current, name: value }));
          }}
          errorText={qcNameError}
        />
        <TextField
          label="Soyad"
          value={qcForm.surname}
          onChangeText={(value) => {
            setQcError("");
            setQcForm((current) => ({ ...current, surname: value }));
          }}
          errorText={qcSurnameError}
        />
        <TextField
          label="Telefon"
          value={qcForm.phoneNumber}
          onChangeText={(value) => {
            setQcError("");
            setQcForm((current) => ({ ...current, phoneNumber: value }));
          }}
          keyboardType="phone-pad"
          errorText={qcPhoneError}
        />
        <Button
          label="Musteriyi olustur"
          onPress={() => void createQcCustomer()}
          loading={qcLoading}
          disabled={!qcCanCreate || Boolean(qcNameError || qcSurnameError || qcPhoneError)}
        />
      </ModalSheet>
    </View>
  );
}
