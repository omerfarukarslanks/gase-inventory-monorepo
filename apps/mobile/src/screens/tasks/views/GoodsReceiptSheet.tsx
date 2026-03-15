/**
 * Mal Kabul (Goods Receipt) Sheet
 *
 * Displays the lines of a Purchase Order and lets the operator record
 * the quantities actually received for each line. Submits a goods receipt
 * via createPurchaseOrderReceipt().
 */

import {
  createPurchaseOrderReceipt,
  type PurchaseOrder,
  type PurchaseOrderLine,
} from "@gase/core";
import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Banner, Button, ModalSheet } from "@/src/components/ui";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

// ─── Line state ──────────────────────────────────────────────────────────────

type ReceiptLineState = {
  purchaseOrderLineId: string;
  productLabel: string;
  orderedQuantity: number;
  receivedAlready: number;
  remaining: number;
  inputValue: string;
};

function buildLineStates(lines: PurchaseOrderLine[]): ReceiptLineState[] {
  return lines.map((line) => ({
    purchaseOrderLineId: line.id,
    productLabel: [line.productName, line.variantName].filter(Boolean).join(" — "),
    orderedQuantity: line.quantity,
    receivedAlready: line.receivedQuantity,
    remaining: Math.max(0, line.quantity - line.receivedQuantity),
    inputValue: String(Math.max(0, line.quantity - line.receivedQuantity)),
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────

type GoodsReceiptSheetProps = {
  visible: boolean;
  purchaseOrder: PurchaseOrder | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function GoodsReceiptSheet({
  visible,
  purchaseOrder,
  onClose,
  onSuccess,
}: GoodsReceiptSheetProps) {
  const [lines, setLines] = useState<ReceiptLineState[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Re-init line states when the sheet becomes visible
  const initLines = useCallback(() => {
    if (!purchaseOrder) return;
    setLines(buildLineStates(purchaseOrder.lines ?? []));
    setNotes("");
    setError("");
  }, [purchaseOrder]);

  useEffect(() => {
    if (visible) initLines();
  }, [visible, initLines]);

  const updateLineInput = (purchaseOrderLineId: string, value: string) => {
    setLines((prev) =>
      prev.map((line) =>
        line.purchaseOrderLineId === purchaseOrderLineId
          ? { ...line, inputValue: value }
          : line,
      ),
    );
  };

  const submit = async () => {
    if (!purchaseOrder) return;
    const receiptLines = lines
      .map((line) => {
        const qty = parseInt(line.inputValue, 10);
        return isNaN(qty) || qty <= 0
          ? null
          : { purchaseOrderLineId: line.purchaseOrderLineId, quantity: qty };
      })
      .filter((l): l is NonNullable<typeof l> => Boolean(l));

    if (!receiptLines.length) {
      setError("En az bir kalem icin miktar giriniz.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createPurchaseOrderReceipt(purchaseOrder.id, {
        lines: receiptLines,
        notes: notes.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mal kabul kaydedilemedi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      title="Mal Kabul"
      subtitle={purchaseOrder?.supplierName ?? "Satin alma siparisi"}
      onClose={onClose}
    >
        {error ? <Banner text={error} /> : null}

        {/* PO info row */}
        {purchaseOrder && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Siparis ID</Text>
            <Text style={styles.infoValue}>{purchaseOrder.id.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.infoDivider}>·</Text>
            <Text style={styles.infoLabel}>Durum</Text>
            <Text style={styles.infoValue}>{purchaseOrder.status}</Text>
          </View>
        )}

        {/* Line list */}
        <FlatList
          data={lines}
          keyExtractor={(item) => item.purchaseOrderLineId}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <View style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName} numberOfLines={2}>
                  {item.productLabel || "Urun"}
                </Text>
                <Text style={styles.lineMeta}>
                  Siparis: {item.orderedQuantity}
                  {item.receivedAlready > 0 ? ` · Alindi: ${item.receivedAlready}` : ""}
                  {` · Kalan: ${item.remaining}`}
                </Text>
              </View>
              <TextInput
                style={[styles.qtyInput, item.remaining === 0 && styles.qtyInputDisabled]}
                value={item.inputValue}
                onChangeText={(value) => updateLineInput(item.purchaseOrderLineId, value)}
                keyboardType="numeric"
                maxLength={6}
                selectTextOnFocus
                editable={item.remaining > 0}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyLines}>
              <Text style={styles.emptyText}>Siparis kalemi bulunamadi</Text>
            </View>
          }
        />

        {/* Notes */}
        <View style={styles.notesWrap}>
          <Text style={styles.notesLabel}>Not (opsiyonel)</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Teslimat notu..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Iptal"
            onPress={onClose}
            variant="secondary"
            size="sm"
            fullWidth={false}
          />
          <Button
            label="Mal Kabul Kaydet"
            onPress={() => void submit()}
            loading={loading}
            size="sm"
            fullWidth={false}
          />
        </View>
    </ModalSheet>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  infoLabel: { color: colors.text2, fontSize: 12 },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: "600" },
  infoDivider: { color: colors.muted, fontSize: 12 },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  lineInfo: { flex: 1, gap: 2 },
  lineName: { color: colors.text, fontSize: 14, fontWeight: "600" },
  lineMeta: { color: colors.text2, fontSize: 11 },
  qtyInput: {
    width: 64,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  qtyInputDisabled: {
    opacity: 0.4,
  },
  notesWrap: { marginTop: 16, gap: 6 },
  notesLabel: { color: colors.text2, fontSize: 12, fontWeight: "600" },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  emptyLines: { paddingVertical: 24, alignItems: "center" },
  emptyText: { color: colors.muted, fontSize: 14 },
});
