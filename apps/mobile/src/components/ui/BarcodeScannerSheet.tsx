/**
 * BarcodeScannerSheet — Camera-based barcode / QR scanner.
 *
 * Uses expo-camera v15 (Expo SDK 54) with CameraView + useCameraPermissions.
 *
 * app.json'a ekle:
 *   "plugins": [["expo-camera", { "cameraPermission": "Barkod taramak icin kamera izni gerekiyor." }]]
 */

import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

// ─── Scanner sheet ────────────────────────────────────────────────────────────

type BarcodeScannerSheetProps = {
  visible: boolean;
  onScanned: (barcode: string) => void;
  onClose: () => void;
};

export function BarcodeScannerSheet({
  visible,
  onScanned,
  onClose,
}: BarcodeScannerSheetProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const scannedRef = useRef(false);

  // Reset scannedRef when sheet closes
  const handleClose = () => {
    scannedRef.current = false;
    onClose();
  };

  const handleBarcode = useCallback(
    (event: { data: string; type: string }) => {
      if (scannedRef.current) return;
      scannedRef.current = true;
      const barcode = event.data ?? "";
      if (barcode) {
        onScanned(barcode);
        handleClose();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onScanned],
  );

  const renderBody = () => {
    // Permission not determined yet — ask
    if (!permission) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text style={styles.hint}>Kamera izni kontrol ediliyor...</Text>
        </View>
      );
    }

    if (!permission.granted) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="camera-off" size={48} color={colors.muted} />
          <Text style={styles.hint}>Kamera izni gerekli</Text>
          <Text style={styles.hintSub}>
            Barkod taramak icin kamera izni verilmeli.
          </Text>
          <Pressable style={styles.permissionBtn} onPress={() => void requestPermission()}>
            <Text style={styles.permissionBtnText}>Izin Ver</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "qr", "code128", "code39", "upc_a", "upc_e"],
        }}
        onBarcodeScanned={handleBarcode}
      />
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {renderBody()}

        {/* Finder overlay (rendered on top of the camera) */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.finderOuter}>
            <View style={styles.finderInner} />
          </View>
          <Text style={styles.finderHint}>Barkodu cerceve icine hizalayin</Text>
        </View>

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Convenience button ───────────────────────────────────────────────────────

type BarcodeScannerButtonProps = {
  onScanned: (barcode: string) => void;
  color?: string;
  size?: number;
};

/**
 * Küçük barkod ikonu butonu — SearchBar yanına koyulabilir.
 * Basılınca tam ekran kamera scanner açılır; barkod taranınca onScanned() çağrılır.
 */
export function BarcodeScannerButton({
  onScanned,
  color = colors.text2,
  size = 22,
}: BarcodeScannerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        hitSlop={12}
        style={styles.scanBtn}
      >
        <MaterialCommunityIcons name="barcode-scan" size={size} color={color} />
      </TouchableOpacity>
      <BarcodeScannerSheet
        visible={open}
        onScanned={(barcode) => {
          setOpen(false);
          onScanned(barcode);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: colors.bg,
    padding: 32,
  },
  hint: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  hintSub: {
    color: colors.text2,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  permissionBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: brand.primary,
  },
  permissionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  finderOuter: {
    width: 260,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  finderInner: {
    width: 260,
    height: 200,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: brand.primary,
    backgroundColor: "transparent",
    // Corner effect via box shadow on a transparent box
    shadowColor: brand.primary,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
  },
  finderHint: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtn: {
    padding: 4,
  },
});
