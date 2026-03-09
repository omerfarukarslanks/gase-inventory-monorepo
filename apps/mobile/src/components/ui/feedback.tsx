import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { mobileTheme } from "@/src/theme";
import { Button, SkeletonBlock } from "./primitives";
import { Card } from "./layout";

const colors = mobileTheme.colors.dark;

// ─── Banner ────────────────────────────────────────────────────────────────

export function Banner({
  tone = "error",
  text,
}: {
  tone?: "error" | "info";
  text: string;
}) {
  return (
    <View style={[styles.banner, tone === "error" ? styles.bannerError : styles.bannerInfo]}>
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

// ─── EmptyState ────────────────────────────────────────────────────────────

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

// ─── EmptyStateWithAction ──────────────────────────────────────────────────

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

// ─── ScreenContent ─────────────────────────────────────────────────────────

/**
 * Renders loading skeletons, an error banner, or the actual content based on
 * the state returned by `useScreenState`. Eliminates the loading/error/empty
 * trifecta that all list screens repeat.
 */
export function ScreenContent<T>({
  loading,
  error,
  data,
  skeletonCount = 3,
  skeletonHeight = 84,
  emptyTitle = "Veri bulunamadi.",
  emptySubtitle,
  children,
}: {
  loading: boolean;
  error: string | null;
  data: T[];
  skeletonCount?: number;
  skeletonHeight?: number;
  emptyTitle?: string;
  emptySubtitle?: string;
  children: (data: T[]) => ReactNode;
}) {
  if (loading) {
    return (
      <View style={styles.skeletonList}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonBlock key={index} height={skeletonHeight} />
        ))}
      </View>
    );
  }

  if (error) {
    return <Banner text={error} />;
  }

  if (!data.length) {
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return <>{children(data)}</>;
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
  skeletonList: {
    gap: 12,
  },
});

