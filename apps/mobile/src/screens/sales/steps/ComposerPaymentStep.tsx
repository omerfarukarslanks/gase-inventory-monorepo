import { Card, FilterTabs, SectionTitle, TextField } from "@/src/components/ui";
import { View, StyleSheet } from "react-native";
import type { useSalesComposer } from "../hooks/useSalesComposer";
import { paymentMethodOptions } from "../hooks/validators";

type ComposerPaymentStepProps = {
  composer: ReturnType<typeof useSalesComposer>;
};

const styles = StyleSheet.create({
  sectionContent: { marginTop: 12, gap: 12 },
});

export function ComposerPaymentStep({ composer }: ComposerPaymentStepProps) {
  const { draft, setDraft, stepErrors } = composer;

  return (
    <Card>
      <SectionTitle title="Ilk odeme ve not" />
      <View style={styles.sectionContent}>
        <FilterTabs
          value={draft.paymentMethod}
          options={paymentMethodOptions}
          onChange={(value) => setDraft((current) => ({ ...current, paymentMethod: value }))}
        />
        <TextField
          label="Odeme tutari"
          value={draft.paymentAmount}
          onChangeText={(value) => setDraft((current) => ({ ...current, paymentAmount: value }))}
          keyboardType="numeric"
          inputMode="decimal"
          helperText="Pesin odeme yoksa 0 birakilabilir."
          errorText={stepErrors.payment}
        />
        <TextField
          label="Not"
          value={draft.note}
          onChangeText={(value) => setDraft((current) => ({ ...current, note: value }))}
          multiline
        />
      </View>
    </Card>
  );
}
