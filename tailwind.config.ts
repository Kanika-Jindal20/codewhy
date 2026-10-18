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
        app: {
          bg: "#F4F7FF",
          panel: "#FFFFFF",
          surface: "#F8FAFC",
          navy: "#14213D",
          border: "#E2E8F0",
          borderStrong: "#CBD5E1",
          // Soft tinted card backgrounds
          subtleBlue: "#EBF2FF",
          subtleViolet: "#F3EEFF",
          subtleTeal: "#E6FBF7",
          subtleAmber: "#FEF7E6",
          subtleRose: "#FEECEB",
          subtleEmerald: "#EBFBF3",
        },
        brand: {
          navy: "#14213D",
          blue: "#3B82F6",
          violet: "#8B5CF6",
          teal: "#14B8A6",
          dark: "#172033",
        },
        text: {
          primary: "#172033",
          secondary: "#64748B",
          muted: "#94A3B8",
        },
        accent: {
          primary: "#3B82F6",
          hover: "#2563EB",
          violet: "#8B5CF6",
          teal: "#14B8A6",
          secondary: "#64748B",
        },
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "Plus Jakarta Sans", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        "2xs": "0 1px 2px 0 rgba(20, 33, 61, 0.03)",
        xs: "0 1px 3px 0 rgba(20, 33, 61, 0.05), 0 1px 2px -1px rgba(20, 33, 61, 0.05)",
        card: "0 2px 8px -1px rgba(20, 33, 61, 0.06), 0 1px 3px -1px rgba(20, 33, 61, 0.03)",
        elevated: "0 10px 30px -5px rgba(20, 33, 61, 0.08), 0 4px 12px -2px rgba(20, 33, 61, 0.04)",
        glowBlue: "0 0 20px -3px rgba(59, 130, 246, 0.25)",
        glowViolet: "0 0 20px -3px rgba(139, 92, 246, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
