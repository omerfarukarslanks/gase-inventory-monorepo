import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { PropsWithChildren, ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";

const colors = mobileTheme.colors.dark;

// ─── AppScreen ─────────────────────────────────────────────────────────────

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

// ─── ScreenHeader ──────────────────────────────────────────────────────────

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
              <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
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

// ─── Card ──────────────────────────────────────────────────────────────────

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

// ─── StickyActionBar ───────────────────────────────────────────────────────

export function StickyActionBar({ children }: PropsWithChildren) {
  return (
    <View style={styles.stickyShell}>
      <View style={styles.stickyBar}>{children}</View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

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
    color: mobileTheme.colors.brand.primary,
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
});
