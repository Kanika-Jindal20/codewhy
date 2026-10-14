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
          bg: "#0B1020",
          panel: "#111827",
          surface: "#172033",
          border: "#273449",
        },
        text: {
          primary: "#F3F6FC",
          secondary: "#A7B2C4",
          muted: "#78869B",
        },
        accent: {
          primary: "#6485F5",
          secondary: "#9B8AFB",
        },
        status: {
          success: "#35B88A",
          warning: "#E7B65C",
          error: "#F07878",
          info: "#64B5F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      borderRadius: {
        DEFAULT: "8px",
        md: "8px",
        lg: "10px",
        xl: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
