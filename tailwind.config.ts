import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070605",
          900: "#0e0c0a",
          800: "#161311",
          700: "#221e1a",
          600: "#2e2923",
        },
        gold: {
          50: "#fbf6ea",
          100: "#f3e6c4",
          300: "#e0c070",
          400: "#d4af37",
          500: "#c9a227",
          600: "#a9841c",
        },
        cream: "#f7f1e4",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 40px rgba(212, 175, 55, 0.18)",
        lift: "0 24px 60px rgba(0,0,0,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
