import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

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
          "--bg": "248 250 252",
          "--surface": "255 255 255",
          "--surface-2": "241 245 249",
          "--border": "229 231 235",
          "--border-hover": "209 213 219",
          "--text": "17 24 39",
          "--text-2": "107 114 128",
          "--muted": "156 163 175",
          "--primary": "16 185 129",
          "--primary-hover": "52 211 153",
          "--accent": "6 214 160",
          "--error": "239 68 68",
          "--warning": "245 158 11",
        },
        ".dark": {
          "--bg": "10 14 23",
          "--surface": "17 24 39",
          "--surface-2": "31 41 55",
          "--border": "45 55 72",
          "--border-hover": "74 85 104",
          "--text": "249 250 251",
          "--text-2": "156 163 175",
          "--muted": "107 114 128",
          "--primary": "16 185 129",
          "--primary-hover": "52 211 153",
          "--accent": "6 214 160",
          "--error": "239 68 68",
          "--warning": "245 158 11",
        },
      });
    }),
  ],
};

export default config;
