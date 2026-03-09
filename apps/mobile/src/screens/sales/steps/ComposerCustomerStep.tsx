import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Card, InlineFieldError, ListRow, SectionTitle, SelectionList } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";
import { StyleSheet, Text, View } from "react-native";
import type { Store } from "@gase/core";
import type { useSalesComposer } from "../hooks/useSalesComposer";
import type { SalesRecentCustomer } from "@/src/lib/salesRecents";

type ComposerCustomerStepProps = {
  composer: ReturnType<typeof useSalesComposer>;
  visibleStores: Store[];
  recentCustomers: SalesRecentCustomer[];
  onOpenCustomerPicker: () => void;
  onOpenQuickCustomer: () => void;
};

const styles = StyleSheet.create({
  sectionContent: { marginTop: 12, gap: 12 },
  list: { marginTop: 12, gap: 12 },
  selectionValue: { color: mobileTheme.colors.dark.text, fontSize: 15, fontWeight: "700" },
});

export function ComposerCustomerStep({
  composer,
  visibleStores,
  recentCustomers,
  onOpenCustomerPicker,
  onOpenQuickCustomer,
}: ComposerCustomerStepProps) {
  const { draft, setDraft, stepErrors } = composer;

  return (
    <>
      <Card>
        <SectionTitle title="Magaza secimi" />
        <View style={styles.sectionContent}>
          <SelectionList
            items={visibleStores.map((store) => ({
              label: store.name,
              value: store.id,
              description: store.code,
            }))}
            selectedValue={draft.storeId}
            onSelect={(value) => setDraft((current) => ({ ...current, storeId: value }))}
            emptyText="Magaza bulunamadi."
          />
        </View>
      </Card>

      <Card>
        <SectionTitle
          title="Musteri"
          action={
            <Button
              label="Hizli musteri"
              onPress={onOpenQuickCustomer}
              variant="secondary"
              size="sm"
              fullWidth={false}
            />
          }
        />
        <View style={styles.sectionContent}>
          <Text style={styles.selectionValue}>{draft.customerLabel}</Text>
          <Button label="Musteri sec" onPress={onOpenCustomerPicker} variant="ghost" />
          <InlineFieldError text={stepErrors.customer} />
        </View>
      </Card>

      {recentCustomers.length ? (
        <Card>
          <SectionTitle title="Son kullanilan musteriler" />
          <View style={styles.list}>
            {recentCustomers.map((customer) => (
              <ListRow
                key={customer.id}
                title={customer.label}
                subtitle={customer.phoneNumber ?? "Hizli secim"}
                caption="Tek dokunusla devam et"
                onPress={() => composer.selectCustomer(customer)}
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
        </Card>
      ) : null}
    </>
  );
}
