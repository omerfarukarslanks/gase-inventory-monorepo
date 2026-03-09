import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";
import type { BadgeTone } from "./primitives";
import { StatusBadge } from "./primitives";
import { EmptyState } from "./feedback";

const colors = mobileTheme.colors.dark;
const brand = mobileTheme.colors.brand;

// ─── FilterTabs ────────────────────────────────────────────────────────────

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

// ─── ListRow ───────────────────────────────────────────────────────────────

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
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text2} />
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
      style={({ pressed }) => [styles.listRow, pressed && styles.rowPressed, style]}
    >
      {content}
    </Pressable>
  );
}

// ─── SelectionList ─────────────────────────────────────────────────────────

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

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  rowPressed: {
    opacity: 0.72,
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
