import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Core Brand Emerald System
        brand: {
          DEFAULT: "#3ECF8E",
          emerald: "#3ECF8E",
          deep: "#24B47E",
          soft: "#4ADE80",
          foreground: "#171717",
          dark: "#171717",
        },
        // Typography Ink Scale
        ink: {
          primary: "#171717",
          secondary: "#212121",
          muted: "#707070",
          faint: "#B2B2B2",
          subtle: "#9A9A9A",
          white: "#FFFFFF",
        },
        // Surfaces
        surface: {
          canvas: "#FFFFFF",
          secondary: "#FAFAFA",
          muted: "#F4F4F5",
          dark: "#1C1C1C",
          darkElevated: "#202020",
          border: "#EDEDED",
        },
        // Neutral Borders
        line: {
          subtle: "#EDEDED",
          default: "#DFDFDF",
          strong: "#C7C7C7",
          cool: "#EFEFEF",
        },
        // Supporting Accent & Semantic Colors
        accent: {
          purple: "#6B01C2",
          violet: "#644FC1",
          softPurple: "#EDDBF9",
          yellow: "#FFDB13",
          tomato: "#FF2201",
          pink: "#C7007E",
          indigo: "#054CFF",
          crimson: "#E2005A",
          primary: "#3ECF8E",
          hover: "#24B47E",
          secondary: "#707070",
        },
        status: {
          success: "#3ECF8E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#054CFF",
        },
        // Legacy Compatibility Tokens mapped cleanly to the new design system
        app: {
          bg: "#FAFAFA",
          panel: "#FFFFFF",
          surface: "#F4F4F5",
          navy: "#171717",
          border: "#EDEDED",
          borderStrong: "#DFDFDF",
          subtleBlue: "#F0F5FF",
          subtleViolet: "#F7F3FF",
          subtleTeal: "#ECFDF5",
          subtleAmber: "#FFFBEB",
          subtleRose: "#FEF2F2",
          subtleEmerald: "#ECFDF5",
        },
        text: {
          primary: "#171717",
          secondary: "#707070",
          muted: "#9A9A9A",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
        pill: "9999px",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        elevated: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 4px 10px -3px rgba(0, 0, 0, 0.02)",
        subtle: "0 2px 4px 0 rgba(0, 0, 0, 0.02)",
        modal: "0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)",
        glowEmerald: "0 0 20px -3px rgba(62, 207, 142, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
