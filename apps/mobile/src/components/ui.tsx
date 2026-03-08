import type { PropsWithChildren, ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function AppScreen({
  title,
  subtitle,
  action,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
}>) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.screenTitle}>{title}</Text>
            {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
          {action ? <View style={styles.headerAction}>{action}</View> : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({
  children,
  padded = true,
}: PropsWithChildren<{ padded?: boolean }>) {
  return <View style={[styles.card, padded && styles.cardPadded]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variantStyles[variant],
        (pressed || isDisabled) && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.text : "#FFFFFF"} />
      ) : (
        <Text style={[styles.buttonLabel, variantTextStyles[variant]]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address";
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

export function FilterTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.filterTabs}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.filterTab, active && styles.filterTabActive]}
          >
            <Text style={[styles.filterTabLabel, active && styles.filterTabLabelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {hint ? <Text style={styles.metricHint}>{hint}</Text> : null}
    </Card>
  );
}

export function InlineStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.inlineStat}>
      <Text style={styles.inlineStatLabel}>{label}</Text>
      <Text style={styles.inlineStatValue}>{value}</Text>
    </View>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
    </Card>
  );
}

export function Banner({
  tone = "error",
  text,
}: {
  tone?: "error" | "info";
  text: string;
}) {
  return (
    <View
      style={[
        styles.banner,
        tone === "error" ? styles.bannerError : styles.bannerInfo,
      ]}
    >
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "positive" | "warning" | "danger" | "neutral";
}) {
  return (
    <View style={[styles.badge, badgeStyles[tone]]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? action : null}
    </View>
  );
}

export function BarList({
  items,
  formatter,
}: {
  items: { key: string; label: string; value: number }[];
  formatter?: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <View style={styles.barList}>
      {items.map((item) => (
        <View key={item.key} style={styles.barRow}>
          <View style={styles.barCopy}>
            <Text style={styles.barLabel}>{item.label}</Text>
            <Text style={styles.barValue}>{formatter ? formatter(item.value) : String(item.value)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                { width: `${max > 0 ? Math.max(8, (item.value / max) * 100) : 8}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

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
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>{title}</Text>
                {subtitle ? <Text style={styles.modalSubtitle}>{subtitle}</Text> : null}
              </View>
              <Button label="Kapat" onPress={onClose} variant="ghost" />
            </View>
            <ScrollView contentContainerStyle={styles.modalBody}>{children}</ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function SelectionList<T extends string>({
  items,
  selectedValue,
  onSelect,
  emptyText,
}: {
  items: { label: string; value: T; description?: string }[];
  selectedValue?: T | null;
  onSelect: (value: T) => void;
  emptyText?: string;
}) {
  if (!items.length) {
    return <EmptyState title={emptyText ?? "Kayit bulunamadi."} />;
  }

  return (
    <View style={styles.selectionList}>
      {items.map((item) => {
        const active = item.value === selectedValue;
        return (
          <Pressable
            key={item.value}
            onPress={() => onSelect(item.value)}
            style={[styles.selectionItem, active && styles.selectionItemActive]}
          >
            <Text style={styles.selectionTitle}>{item.label}</Text>
            {item.description ? <Text style={styles.selectionDescription}>{item.description}</Text> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  headerAction: {
    minWidth: 96,
  },
  screenTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "700",
  },
  screenSubtitle: {
    color: colors.text2,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardPadded: {
    padding: 16,
  },
  button: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  filterTabs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
  },
  filterTabActive: {
    borderColor: brand.primary,
    backgroundColor: "rgba(16,185,129,0.18)",
  },
  filterTabLabel: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: "600",
  },
  filterTabLabelActive: {
    color: colors.text,
  },
  metricLabel: {
    color: colors.text2,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  metricValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  metricHint: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
  },
  inlineStat: {
    gap: 4,
  },
  inlineStatLabel: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: "600",
  },
  inlineStatValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  emptySubtitle: {
    marginTop: 6,
    color: colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  banner: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: "rgba(239,68,68,0.16)",
  },
  bannerInfo: {
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  bannerText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  barList: {
    gap: 12,
  },
  barRow: {
    gap: 8,
  },
  barCopy: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  barLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  barValue: {
    color: colors.text2,
    fontSize: 12,
    fontWeight: "700",
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 999,
    backgroundColor: brand.primary,
  },
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
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
  },
  modalBody: {
    paddingTop: 16,
    gap: 14,
    paddingBottom: 40,
  },
  selectionList: {
    gap: 10,
  },
  selectionItem: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
  },
  selectionItemActive: {
    borderColor: brand.primary,
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  selectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  selectionDescription: {
    color: colors.text2,
    fontSize: 12,
    lineHeight: 17,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: brand.primary,
  },
  secondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: brand.error,
  },
});

const variantTextStyles = StyleSheet.create({
  primary: {
    color: "#FFFFFF",
  },
  secondary: {
    color: colors.text,
  },
  ghost: {
    color: colors.text,
  },
  danger: {
    color: "#FFFFFF",
  },
});

const badgeStyles = StyleSheet.create({
  positive: {
    backgroundColor: "rgba(16,185,129,0.18)",
  },
  warning: {
    backgroundColor: "rgba(245,158,11,0.18)",
  },
  danger: {
    backgroundColor: "rgba(239,68,68,0.18)",
  },
  neutral: {
    backgroundColor: "rgba(156,163,175,0.18)",
  },
});
