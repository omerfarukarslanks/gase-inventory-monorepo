import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { designTokens } from "@gase/design-tokens";

/** Converts a hex color string like "#F8FAFC" to "248 250 252" (Tailwind CSS variable format). */
function hexToRgbSpace(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

const { colors } = designTokens;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        borderHover: "rgb(var(--border-hover) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        text2: "rgb(var(--text-2) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        primaryHover: "rgb(var(--primary-hover) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
        warning: "rgb(var(--warning) / <alpha-value>)",
        grid: "rgb(var(--primary) / <alpha-value>)",
      },
      boxShadow: {
        glow: "0 4px 16px rgb(var(--primary) / 0.15)",
      },
      keyframes: {
        su: { from: { opacity: "0", transform: "translateY(14px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        si: { from: { opacity: "0", transform: "translateX(-8px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        fi: { from: { opacity: "0" }, to: { opacity: "1" } },
        sp: { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        su: "su .4s ease both",
        si: "si .3s ease both",
        fi: "fi .5s ease both",
        sp: "sp 1s linear infinite",
      },
      borderRadius: {
        xl2: "1rem",
      },
    },
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        ":root": {
          "--bg": hexToRgbSpace(colors.light.bg),
          "--surface": hexToRgbSpace(colors.light.surface),
          "--surface-2": hexToRgbSpace(colors.light.surface2),
          "--border": hexToRgbSpace(colors.light.border),
          "--border-hover": hexToRgbSpace(colors.light.borderHover),
          "--text": hexToRgbSpace(colors.light.text),
          "--text-2": hexToRgbSpace(colors.light.text2),
          "--muted": hexToRgbSpace(colors.light.muted),
          "--primary": hexToRgbSpace(colors.brand.primary),
          "--primary-hover": hexToRgbSpace(colors.brand.primaryHover),
          "--accent": hexToRgbSpace(colors.brand.accent),
          "--error": hexToRgbSpace(colors.brand.error),
          "--warning": hexToRgbSpace(colors.brand.warning),
        },
        ".dark": {
          "--bg": hexToRgbSpace(colors.dark.bg),
          "--surface": hexToRgbSpace(colors.dark.surface),
          "--surface-2": hexToRgbSpace(colors.dark.surface2),
          "--border": hexToRgbSpace(colors.dark.border),
          "--border-hover": hexToRgbSpace(colors.dark.borderHover),
          "--text": hexToRgbSpace(colors.dark.text),
          "--text-2": hexToRgbSpace(colors.dark.text2),
          "--muted": hexToRgbSpace(colors.dark.muted),
          "--primary": hexToRgbSpace(colors.brand.primary),
          "--primary-hover": hexToRgbSpace(colors.brand.primaryHover),
          "--accent": hexToRgbSpace(colors.brand.accent),
          "--error": hexToRgbSpace(colors.brand.error),
          "--warning": hexToRgbSpace(colors.brand.warning),
        },
      });
    }),
  ],
};

export default config;
