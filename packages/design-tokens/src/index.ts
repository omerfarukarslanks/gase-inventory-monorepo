export const designTokens = {
  colors: {
    light: {
      bg: "#F8FAFC",
      surface: "#FFFFFF",
      surface2: "#F1F5F9",
      border: "#E5E7EB",
      borderHover: "#D1D5DB",
      text: "#111827",
      text2: "#6B7280",
      muted: "#9CA3AF",
    },
    dark: {
      bg: "#0A0E17",
      surface: "#111827",
      surface2: "#1F2937",
      border: "#2D3748",
      borderHover: "#4A5568",
      text: "#F9FAFB",
      text2: "#9CA3AF",
      muted: "#6B7280",
    },
    brand: {
      primary: "#10B981",
      primaryHover: "#34D399",
      accent: "#06D6A0",
      error: "#EF4444",
      warning: "#F59E0B",
    },
  },
  typography: {
    display: "DM Sans",
    body: "DM Sans",
  },
  radius: {
    xl2: 16,
  },
  shadow: {
    glow: {
      shadowColor: "#10B981",
      shadowOpacity: 0.15,
      shadowRadius: 16,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      elevation: 6,
    },
  },
} as const;

export type DesignTokens = typeof designTokens;
