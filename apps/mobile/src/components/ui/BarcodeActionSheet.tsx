/**
 * BarcodeActionSheet — Context menu shown after a barcode scan.
 *
 * Presents permission-gated actions:
 *   • Stok Sorgula  (always visible — navigates to Stock tab with barcode search)
 *   • Satişa Ekle   (requires SALE_CREATE)
 *   • Mal Kabul     (requires PO_READ)
 */

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ModalSheet } from "./modals";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type BarcodeActionSheetProps = {
  visible: boolean;
  barcode: string;
  onStockSearch: (barcode: string) => void;
  onAddToSale: (barcode: string) => void;
  onGoodsReceipt: (barcode: string) => void;
  onClose: () => void;
  canSell: boolean;
  canReceive: boolean;
};

type ActionRowProps = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  description: string;
  onPress: () => void;
};

function ActionRow({ icon, label, description, onPress }: ActionRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
      onPress={onPress}
    >
      <View style={styles.actionIcon}>
        <MaterialCommunityIcons name={icon} size={22} color={brand.primary} />
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionLabel}>{label}</Text>
        <Text style={styles.actionDesc}>{description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.muted} />
    </Pressable>
  );
}

export function BarcodeActionSheet({
  visible,
  barcode,
  onStockSearch,
  onAddToSale,
  onGoodsReceipt,
  onClose,
  canSell,
  canReceive,
}: BarcodeActionSheetProps) {
  return (
    <ModalSheet visible={visible} title="Barkod tarandı" onClose={onClose}>
      <View style={styles.barcodeChip}>
        <MaterialCommunityIcons name="barcode" size={16} color={colors.text2} />
        <Text style={styles.barcodeText} numberOfLines={1}>
          {barcode}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionRow
          icon="warehouse"
          label="Stok Sorgula"
          description="Stok ekranında bu barkodu ara"
          onPress={() => {
            onClose();
            onStockSearch(barcode);
          }}
        />

        {canSell && (
          <ActionRow
            icon="receipt-text-outline"
            label="Satişa Ekle"
            description="Satış taslağına bu ürünü ekle"
            onPress={() => {
              onClose();
              onAddToSale(barcode);
            }}
          />
        )}

        {canReceive && (
          <ActionRow
            icon="inbox-arrow-down"
            label="Mal Kabul"
            description="Görevler ekranında mal kabul aç"
            onPress={() => {
              onClose();
              onGoodsReceipt(barcode);
            }}
          />
        )}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  barcodeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  barcodeText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    flex: 1,
  },
  actions: {
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  actionRowPressed: {
    backgroundColor: colors.surface,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: `${brand.primary}1A`,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  actionDesc: {
    color: colors.text2,
    fontSize: 12,
  },
});
