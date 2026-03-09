import { Banner, Button, ModalSheet, TextField } from "@/src/components/ui";
import type { useCancelSale } from "../hooks/useCancelSale";

type CancelSaleModalProps = {
  cancelSale: ReturnType<typeof useCancelSale>;
};

export function CancelSaleModal({ cancelSale: cs }: CancelSaleModalProps) {
  const { open, submitting, error, setError, reason, setReason, note, setNote, close, submit } = cs;

  return (
    <ModalSheet
      visible={open}
      title="Satisi iptal et"
      subtitle="Iptal nedeni ve not ekle"
      onClose={close}
    >
      {error ? <Banner text={error} /> : null}
      <TextField
        label="Iptal nedeni"
        value={reason}
        onChangeText={(value) => {
          setError("");
          setReason(value);
        }}
        helperText="Opsiyonel ama operasyon notu icin onerilir."
      />
      <TextField label="Not" value={note} onChangeText={setNote} multiline />
      <Button
        label="Iptali onayla"
        onPress={() => void submit()}
        loading={submitting}
        variant="danger"
      />
    </ModalSheet>
  );
}
