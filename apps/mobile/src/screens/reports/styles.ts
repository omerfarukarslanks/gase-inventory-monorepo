import { StyleSheet } from "react-native";
import { mobileTheme } from "@/src/theme";

export const reportStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: mobileTheme.colors.dark.bg,
  },
  screenContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },
  scopeBlock: {
    marginTop: 12,
    gap: 12,
  },
  scopeStats: {
    gap: 12,
  },
  scopeStat: {
    gap: 4,
  },
  scopeLabel: {
    color: mobileTheme.colors.dark.text2,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  scopeValue: {
    color: mobileTheme.colors.dark.text,
    fontSize: 15,
    fontWeight: "700",
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricItem: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 150,
  },
  metricSkeletonCard: {
    minHeight: 132,
    gap: 8,
  },
  skeletonGap: {
    marginVertical: 6,
  },
  loadingList: {
    marginTop: 12,
    gap: 12,
  },
  list: {
    marginTop: 12,
    gap: 12,
  },
  detailStats: {
    marginTop: 12,
    gap: 12,
  },
  noteText: {
    marginTop: 12,
    color: mobileTheme.colors.dark.text2,
    fontSize: 13,
    lineHeight: 19,
  },
  catalogList: {
    marginTop: 12,
    gap: 12,
  },
  catalogIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: mobileTheme.colors.dark.surface2,
  },
  catalogIconText: {
    color: mobileTheme.colors.brand.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
