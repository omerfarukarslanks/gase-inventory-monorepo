import { Banner, Button, Card, EmptyStateWithAction, ModalSheet, TextField } from "@/src/components/ui";
import { Text } from "react-native";
import { mobileTheme } from "@/src/theme";
import { StyleSheet } from "react-native";
import type { useReturnSale } from "../hooks/useReturnSale";

type ReturnSaleModalProps = {
  returnSale: ReturnType<typeof useReturnSale>;
};

const styles = StyleSheet.create({
  lineLabel: {
    color: mobileTheme.colors.dark.text,
    fontSize: 14,
    fontWeight: "700",
  },
  mutedText: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    lineHeight: 17,
  },
});

export function ReturnSaleModal({ returnSale: rs }: ReturnSaleModalProps) {
  const { open, submitting, attempted, error, lines, notes, setNotes, lineErrors, canSubmit, close, updateLine, submit } = rs;

  return (
    <ModalSheet
      visible={open}
      title="Iade olustur"
      subtitle="Her satir icin iade miktarini gir"
      onClose={close}
    >
      {lines.length ? (
        <>
          {error ? <Banner text={error} /> : null}
          {lines.map((line) => (
            <Card key={line.saleLineId}>
              <Text style={styles.lineLabel}>{line.label}</Text>
              <Text style={styles.mutedText}>Maksimum {line.maxQuantity} adet</Text>
              <TextField
                label="Iade miktari"
                value={line.quantity}
                onChangeText={(value) => updateLine(line.saleLineId, value)}
                keyboardType="numeric"
                inputMode="numeric"
                helperText="Iade etmeyeceksen 0 birak."
                errorText={attempted ? lineErrors[line.saleLineId] : ""}
              />
            </Card>
          ))}
          <TextField label="Not" value={notes} onChangeText={setNotes} multiline />
          <Button
            label="Iadeyi kaydet"
            onPress={() => void submit()}
            loading={submitting}
            disabled={!canSubmit}
          />
        </>
      ) : (
        <EmptyStateWithAction
          title="Iadeye uygun satir kalmadi."
          subtitle="Tum satirlar zaten iade edilmis olabilir."
          actionLabel="Kapat"
          onAction={close}
        />
      )}
    </ModalSheet>
  );
}
