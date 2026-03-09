import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { PropsWithChildren, ReactNode } from "react";
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
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "sm";
type BadgeTone = "positive" | "warning" | "danger" | "neutral" | "info";

export function AppScreen({
  title,
  subtitle,
  action,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle?: string;
  action?: ReactNode;
  footer?: ReactNode;
}>) {
  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.screenContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title={title} subtitle={subtitle} action={action} />
        {children}
      </ScrollView>
      {footer ? <StickyActionBar>{footer}</StickyActionBar> : null}
    </View>
  );
}

export function ScreenHeader({
  title,
  subtitle,
  eyebrow,
  onBack,
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  return (
    <View style={styles.headerRow}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <View style={styles.headerTitleRow}>
          {onBack ? (
            <Pressable
              onPress={onBack}
              accessibilityRole="button"
              accessibilityLabel="Geri don"
              hitSlop={6}
              style={styles.backButton}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={colors.text}
              />
            </Pressable>
          ) : null}
          <View style={styles.headerTitleCopy}>
            <Text style={styles.screenTitle}>{title}</Text>
            {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      </View>
      {action ? <View style={styles.headerAction}>{action}</View> : null}
    </View>
  );
}

export function Card({
  children,
  padded = true,
  style,
}: PropsWithChildren<{
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

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
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            hitSlop={4}
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
    <Card style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} accessibilityRole="header">
        {value}
      </Text>
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

export function EmptyStateWithAction({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <Card>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySubtitle}>{subtitle}</Text> : null}
      <View style={styles.emptyAction}>
        <Button label={actionLabel} onPress={onAction} variant="secondary" fullWidth={false} />
      </View>
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
  tone?: BadgeTone;
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
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
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
            <Text style={styles.barValue}>
              {formatter ? formatter(item.value) : String(item.value)}
            </Text>
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

export function InlineFieldError({ text }: { text?: string | null }) {
  if (!text) return null;
  return <Text style={styles.fieldHelperError}>{text}</Text>;
}

export function StickyActionBar({ children }: PropsWithChildren) {
  return (
    <View style={styles.stickyShell}>
      <View style={styles.stickyBar}>{children}</View>
    </View>
  );
}

export function ListRow({
  title,
  subtitle,
  caption,
  onPress,
  right,
  badgeLabel,
  badgeTone = "neutral",
  icon,
  style,
}: {
  title: string;
  subtitle?: string;
  caption?: string;
  onPress?: () => void;
  right?: ReactNode;
  badgeLabel?: string;
  badgeTone?: BadgeTone;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const content = (
    <>
      {icon ? <View style={styles.listIcon}>{icon}</View> : null}
      <View style={styles.listCopy}>
        <Text style={styles.listTitle}>{title}</Text>
        {subtitle ? <Text style={styles.listSubtitle}>{subtitle}</Text> : null}
        {caption ? <Text style={styles.listCaption}>{caption}</Text> : null}
      </View>
      <View style={styles.listRight}>
        {right ?? (badgeLabel ? <StatusBadge label={badgeLabel} tone={badgeTone} /> : null)}
        {onPress ? (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.text2}
          />
        ) : null}
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.listRow, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, caption].filter(Boolean).join(", ")}
      accessibilityHint="Detayi ac"
      hitSlop={4}
      style={({ pressed }) => [styles.listRow, pressed && styles.buttonPressed, style]}
    >
      {content}
    </Pressable>
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
            accessibilityRole="radio"
            accessibilityLabel={item.label}
            accessibilityHint={item.description}
            accessibilityState={{ checked: active }}
            hitSlop={4}
            style={[styles.selectionItem, active && styles.selectionItemActive]}
          >
            <View style={styles.selectionCopy}>
              <Text style={styles.selectionTitle}>{item.label}</Text>
              {item.description ? (
                <Text style={styles.selectionDescription}>{item.description}</Text>
              ) : null}
            </View>
            {active ? (
              <MaterialCommunityIcons name="check-circle" size={20} color={brand.primary} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },
  eyebrow: {
    color: brand.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 10,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerTitleCopy: {
    flex: 1,
    gap: 6,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerAction: {
    alignSelf: "flex-start",
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
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardPadded: {
    padding: 16,
  },
  metricCard: {
    minHeight: 132,
  },
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
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 8,
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  metricHint: {
    marginTop: 8,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
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
    fontSize: 16,
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
    lineHeight: 19,
  },
  emptyAction: {
    marginTop: 14,
  },
  banner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bannerError: {
    backgroundColor: "rgba(239,68,68,0.16)",
  },
  bannerInfo: {
    backgroundColor: "rgba(16,185,129,0.14)",
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
  skeleton: {
    borderRadius: 12,
    backgroundColor: colors.surface2,
  },
  stickyShell: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  stickyBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(17, 24, 39, 0.98)",
    padding: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  listIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.surface2,
  },
  listCopy: {
    flex: 1,
    gap: 4,
  },
  listTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  listSubtitle: {
    color: colors.text2,
    fontSize: 13,
    lineHeight: 18,
  },
  listCaption: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  listRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
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
  selectionList: {
    gap: 10,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 14,
  },
  selectionItemActive: {
    borderColor: brand.primary,
    backgroundColor: "rgba(16,185,129,0.10)",
  },
  selectionCopy: {
    flex: 1,
    gap: 4,
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

const sizeStyles = StyleSheet.create<Record<ButtonSize, ViewStyle>>({
  md: {
    minHeight: 48,
  },
  sm: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
});

const buttonTextStyles = StyleSheet.create<Record<ButtonSize, TextStyle>>({
  md: {
    fontSize: 14,
  },
  sm: {
    fontSize: 13,
  },
});

const variantStyles = StyleSheet.create<Record<ButtonVariant, ViewStyle>>({
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

const variantTextStyles = StyleSheet.create<Record<ButtonVariant, TextStyle>>({
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

const badgeStyles = StyleSheet.create<Record<BadgeTone, ViewStyle>>({
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
  info: {
    backgroundColor: "rgba(59,130,246,0.18)",
  },
});
