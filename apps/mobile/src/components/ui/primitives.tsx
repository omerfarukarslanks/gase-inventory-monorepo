import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import type {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleProp,
  TextStyle,
  TextInputProps,
  ViewStyle,
} from "react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm";
export type BadgeTone = "positive" | "warning" | "danger" | "neutral" | "info";

// ─── Button ────────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled,
  loading,
  icon,
  fullWidth = true,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={isDisabled ? { disabled: true } : undefined}
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        sizeStyles[size],
        variantStyles[variant],
        !fullWidth && styles.buttonAuto,
        (pressed || isDisabled) && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "secondary" || variant === "ghost" ? colors.text : "#FFFFFF"} />
      ) : (
        <View style={styles.buttonContent}>
          {icon ? <View style={styles.buttonIcon}>{icon}</View> : null}
          <Text style={[styles.buttonLabel, buttonTextStyles[size], variantTextStyles[variant]]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── TextField ─────────────────────────────────────────────────────────────

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  multiline,
  helperText,
  errorText,
  editable = true,
  returnKeyType,
  onSubmitEditing,
  autoCapitalize = "sentences",
  autoCorrect = false,
  textContentType,
  autoFocus = false,
  inputRef,
  inputMode,
  maxLength,
  trailingAction,
  accessibilityLabel,
  blurOnSubmit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  multiline?: boolean;
  helperText?: string;
  errorText?: string;
  editable?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  textContentType?: TextInputProps["textContentType"];
  autoFocus?: boolean;
  inputRef?: { current: TextInput | null } | null;
  inputMode?: TextInputProps["inputMode"];
  maxLength?: number;
  trailingAction?: ReactNode;
  accessibilityLabel?: string;
  blurOnSubmit?: boolean;
}) {
  const helper = errorText ?? helperText;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View
        style={[
          styles.inputShell,
          !editable && styles.inputDisabled,
          errorText && styles.inputError,
          multiline && styles.inputShellMultiline,
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          textContentType={textContentType}
          autoFocus={autoFocus}
          inputMode={inputMode}
          maxLength={maxLength}
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityHint={helperText && !errorText ? helperText : undefined}
          blurOnSubmit={blurOnSubmit}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {trailingAction ? <View style={styles.inputTrailing}>{trailingAction}</View> : null}
      </View>
      {helper ? (
        <Text style={[styles.fieldHelper, errorText ? styles.fieldHelperError : null]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

// ─── SearchBar ─────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChangeText,
  placeholder,
  hint,
  onClear,
  accessibilityLabel = "Arama alani",
  autoFocus = false,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  onClear?: () => void;
  accessibilityLabel?: string;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.searchWrap}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.text2} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel}
          autoFocus={autoFocus}
        />
        {value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aramayi temizle"
            hitSlop={6}
            onPress={() => {
              onClear?.();
              if (!onClear) onChangeText("");
            }}
            style={({ pressed }) => [styles.searchClear, pressed && styles.buttonPressed]}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.text2} />
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.searchHint}>{hint}</Text> : null}
    </View>
  );
}

// ─── StatusBadge ───────────────────────────────────────────────────────────

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: BadgeTone;
}) {
  return (
    <View style={[styles.badge, badgeStyles[tone]]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ─── SkeletonBlock ─────────────────────────────────────────────────────────

export function SkeletonBlock({
  height = 14,
  width = "100%",
  style,
}: {
  height?: number;
  width?: number | `${number}%` | "100%";
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[styles.skeleton, { height, width }, style]} />;
}

// ─── InlineFieldError ──────────────────────────────────────────────────────

export function InlineFieldError({ text }: { text?: string | null }) {
  if (!text) return null;
  return <Text style={styles.fieldHelperError}>{text}</Text>;
}

// ─── SegmentedControl ─────────────────────────────────────────────────────

export type SegmentItem = {
  key: string;
  label: string;
  badge?: number;
};

export function SegmentedControl({
  segments,
  activeKey,
  onChange,
}: {
  segments: SegmentItem[];
  activeKey: string;
  onChange: (key: string) => void;
}) {
  if (segments.length < 2) return null;

  return (
    <View style={segStyles.container} accessibilityRole="tablist">
      {segments.map((seg) => {
        const active = seg.key === activeKey;
        return (
          <Pressable
            key={seg.key}
            onPress={() => onChange(seg.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={seg.label}
            style={[segStyles.tab, active && segStyles.tabActive]}
          >
            <Text style={[segStyles.tabLabel, active && segStyles.tabLabelActive]}>
              {seg.label}
            </Text>
            {seg.badge != null && seg.badge > 0 ? (
              <View style={segStyles.badge}>
                <Text style={segStyles.badgeText}>
                  {seg.badge > 99 ? "99+" : String(seg.badge)}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const segStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 14,
    backgroundColor: colors.surface2,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: brand.primary,
  },
  tabLabel: {
    color: colors.text2,
    fontSize: 13,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#FFFFFF",
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: brand.error,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  buttonAuto: {
    alignSelf: "flex-start",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.72,
  },
  buttonLabel: {
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
  fieldHelper: {
    color: colors.text2,
    fontSize: 12,
    lineHeight: 17,
  },
  fieldHelperError: {
    color: brand.error,
    fontSize: 12,
    lineHeight: 17,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputShell: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    flexDirection: "row",
    alignItems: "center",
  },
  inputShellMultiline: {
    alignItems: "flex-start",
  },
  inputMultiline: {
    minHeight: 110,
    textAlignVertical: "top",
  },
  inputTrailing: {
    paddingRight: 12,
    paddingTop: 12,
    paddingBottom: 12,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  inputError: {
    borderColor: brand.error,
  },
  searchWrap: {
    gap: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchClear: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  searchHint: {
    color: colors.text2,
    fontSize: 12,
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
  skeleton: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
  },
});

const sizeStyles = StyleSheet.create<Record<ButtonSize, ViewStyle>>({
  md: { minHeight: 48 },
  sm: { minHeight: 40, paddingHorizontal: 14, borderRadius: 14 },
});

const buttonTextStyles = StyleSheet.create<Record<ButtonSize, TextStyle>>({
  md: { fontSize: 14 },
  sm: { fontSize: 13 },
});

const variantStyles = StyleSheet.create<Record<ButtonVariant, ViewStyle>>({
  primary: { backgroundColor: brand.primary },
  secondary: { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border },
  ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: brand.error },
});

const variantTextStyles = StyleSheet.create<Record<ButtonVariant, TextStyle>>({
  primary: { color: "#FFFFFF" },
  secondary: { color: colors.text },
  ghost: { color: colors.text },
  danger: { color: "#FFFFFF" },
});

const badgeStyles = StyleSheet.create<Record<BadgeTone, ViewStyle>>({
  positive: { backgroundColor: "rgba(16,185,129,0.18)" },
  warning: { backgroundColor: "rgba(245,158,11,0.18)" },
  danger: { backgroundColor: "rgba(239,68,68,0.18)" },
  neutral: { backgroundColor: "rgba(156,163,175,0.18)" },
  info: { backgroundColor: "rgba(59,130,246,0.18)" },
});

// ─── SegmentedControl ──────────────────────────────────────────────────────
export type SegmentItem = {
  key: string;
  label: string;
  badge?: number;
};

type SegmentedControlProps = {
  segments: SegmentItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

const segStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6 },
  pill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: mobileTheme.colors.dark.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.dark.border,
  },
  pillActive: {
    backgroundColor: mobileTheme.colors.brand.primary,
    borderColor: mobileTheme.colors.brand.primary,
  },
  pillPressed: { opacity: 0.75 },
  label: { color: mobileTheme.colors.dark.text2, fontSize: 13, fontWeight: "700" },
  labelActive: { color: "#FFFFFF" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  badgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
});

export function SegmentedControl({ segments, activeKey, onChange }: SegmentedControlProps) {
  if (segments.length < 2) return null;
  return (
    <View style={segStyles.row} accessibilityRole="tablist">
      {segments.map((seg) => {
        const active = seg.key === activeKey;
        return (
          <Pressable
            key={seg.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(seg.key)}
            style={({ pressed }) => [
              segStyles.pill,
              active && segStyles.pillActive,
              pressed && segStyles.pillPressed,
            ]}
          >
            <Text style={[segStyles.label, active && segStyles.labelActive]}>{seg.label}</Text>
            {seg.badge != null && seg.badge > 0 ? (
              <View style={segStyles.badge}>
                <Text style={segStyles.badgeText}>{seg.badge > 99 ? "99+" : seg.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
