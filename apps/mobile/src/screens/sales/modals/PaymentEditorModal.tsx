import { Banner, Button, FilterTabs, ModalSheet, TextField } from "@/src/components/ui";
import type { usePaymentEditor } from "../hooks/usePaymentEditor";
import { paymentMethodOptions } from "../hooks/validators";

type PaymentEditorModalProps = {
  paymentEditor: ReturnType<typeof usePaymentEditor>;
};

export function PaymentEditorModal({ paymentEditor }: PaymentEditorModalProps) {
  const { editor, setEditor, submitting, error, setError, amountError, close, submit } = paymentEditor;

  return (
    <ModalSheet
      visible={Boolean(editor)}
      title={editor?.paymentId ? "Odemeyi duzenle" : "Odeme ekle"}
      subtitle="Odeme kalemini guncelle"
      onClose={close}
    >
      {editor ? (
        <>
          {error ? <Banner text={error} /> : null}
          <FilterTabs
            value={editor.paymentMethod}
            options={paymentMethodOptions}
            onChange={(value) => setEditor((current) => current ? { ...current, paymentMethod: value } : current)}
          />
          <TextField
            label="Tutar"
            value={editor.amount}
            onChangeText={(value) => {
              setError("");
              setEditor((current) => current ? { ...current, amount: value } : current);
            }}
            keyboardType="numeric"
            inputMode="decimal"
            errorText={amountError}
          />
          <TextField
            label="Not"
            value={editor.note}
            onChangeText={(value) => setEditor((current) => current ? { ...current, note: value } : current)}
            multiline
          />
          <Button
            label="Odemeyi kaydet"
            onPress={() => void submit()}
            loading={submitting}
            disabled={Boolean(amountError)}
          />
        </>
      ) : null}
    </ModalSheet>
  );
}
