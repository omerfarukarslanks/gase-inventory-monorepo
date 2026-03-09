import type { PropsWithChildren } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { mobileTheme } from "@/src/theme";
import { Button } from "./primitives";

const colors = mobileTheme.colors.dark;

// ─── ModalSheet ────────────────────────────────────────────────────────────

export function ModalSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
}>) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalWrapper}
        >
          <View style={styles.modalCard} accessibilityViewIsModal>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>{title}</Text>
                {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
              </View>
              <Button label="Kapat" onPress={onClose} variant="ghost" size="sm" fullWidth={false} />
            </View>
            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── ConfirmSheet ──────────────────────────────────────────────────────────

export function ConfirmSheet({
  visible,
  title,
  subtitle,
  confirmLabel,
  cancelLabel = "Vazgec",
  tone = "danger",
  onConfirm,
  onClose,
  loading,
  children,
}: PropsWithChildren<{
  visible: boolean;
  title: string;
  subtitle?: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}>) {
  return (
    <ModalSheet visible={visible} title={title} subtitle={subtitle} onClose={onClose}>
      {children}
      <View style={styles.confirmActions}>
        <Button label={cancelLabel} onPress={onClose} variant="ghost" />
        <Button
          label={confirmLabel}
          onPress={onConfirm}
          loading={loading}
          variant={tone === "danger" ? "danger" : "primary"}
        />
      </View>
    </ModalSheet>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  modalWrapper: {
    maxHeight: "92%",
  },
  modalCard: {
    minHeight: 320,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  modalHandle: {
    alignSelf: "center",
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  modalBody: {
    paddingTop: 16,
    gap: 14,
    paddingBottom: 40,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 12,
  },
});
