import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";
import { Card } from "./layout";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

// ─── SectionTitle ──────────────────────────────────────────────────────────

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

// ─── MetricCard ────────────────────────────────────────────────────────────

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

// ─── InlineStat ────────────────────────────────────────────────────────────

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

// ─── BarList ───────────────────────────────────────────────────────────────

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

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  metricCard: {
    minHeight: 132,
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
});
