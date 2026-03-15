/**
 * BarcodeScannerSheet — Camera-based barcode / QR scanner overlay.
 *
 * Requires expo-camera to be installed:
 *   npx expo install expo-camera
 *
 * And add to app.json:
 *   "plugins": [["expo-camera", { "cameraPermission": "Barkod taramak icin kamera izni gerekiyor." }]]
 *
 * If expo-camera is not installed the sheet immediately closes (no-op).
 * The scanner calls `onScanned(barcode)` with the first scanned value and closes itself.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

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
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CameraViewRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      setScanned(false);
      setHasPermission(null);
      return;
    }

    // Lazy-require expo-camera
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let Camera: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      Camera = require("expo-camera");
    } catch {
      // expo-camera not installed — close immediately
      onClose();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    CameraViewRef.current = Camera.CameraView ?? Camera.Camera;

    void (async () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const { status } = await Camera.Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    })();
  }, [visible, onClose]);

  const handleBarcode = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (event: any) => {
      if (scanned) return;
      setScanned(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const data = String(event?.data ?? event?.nativeEvent?.data ?? "");
      if (data) {
        onScanned(data);
        onClose();
      }
    },
    [scanned, onScanned, onClose],
  );

  const CameraView = CameraViewRef.current;

  const renderBody = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text style={styles.hint}>Kamera izni isteniyor...</Text>
        </View>
      );
    }
    if (!hasPermission) {
      return (
        <View style={styles.centered}>
          <MaterialCommunityIcons name="camera-off" size={48} color={colors.muted} />
          <Text style={styles.hint}>Kamera izni reddedildi.</Text>
          <Text style={styles.hintSub}>Ayarlardan kamera iznini etkinlestirin.</Text>
        </View>
      );
    }
    if (!CameraView) {
      return (
        <View style={styles.centered}>
          <Text style={styles.hint}>Kamera yuklenemedi.</Text>
        </View>
      );
    }
    return (
      <CameraView
        style={StyleSheet.absoluteFillObject}
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "qr", "code128", "code39", "upc_a", "upc_e"] }}
        onBarcodeScanned={handleBarcode}
      />
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {renderBody()}

        {/* Finder overlay */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.finder} />
          <Text style={styles.finderHint}>Barkodu cerceve icine hizalayin</Text>
        </View>

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

// ─── Convenience button ──────────────────────────────────────────────────────

type BarcodeScannerButtonProps = {
  onScanned: (barcode: string) => void;
  color?: string;
  size?: number;
};

/**
 * A small icon button that opens the barcode scanner sheet.
 * Drop it anywhere next to a search input.
 */
export function BarcodeScannerButton({
  onScanned,
  color = colors.text2,
  size = 22,
}: BarcodeScannerButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={8}>
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.bg,
    padding: 32,
  },
  hint: { color: colors.text, fontSize: 16, fontWeight: "600", textAlign: "center" },
  hintSub: { color: colors.text2, fontSize: 13, textAlign: "center" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  finder: {
    width: 240,
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: brand.primary,
    backgroundColor: "transparent",
  },
  finderHint: { color: "#fff", fontSize: 13, textShadowColor: "#000", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
