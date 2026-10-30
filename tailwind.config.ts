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
          950: "#04110c",
          900: "#071a14",
          800: "#0d2a20",
          700: "#14382b",
          600: "#1c4a39",
        },
        gold: {
          50: "#ecfdf5",
          100: "#d1fae5",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        volt: {
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
        },
        flame: {
          400: "#fb7185",
          500: "#f43f5e",
        },
        cream: "#f0fdf6",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 48px rgba(52, 211, 153, 0.32)",
        volt: "0 0 36px rgba(74, 222, 128, 0.28)",
        lift: "0 28px 70px rgba(0, 0, 0, 0.55)",
        glow: "0 0 0 1px rgba(52, 211, 153, 0.35), 0 18px 50px rgba(16, 185, 129, 0.18)",
      },
      backgroundImage: {
        mesh: "radial-gradient(ellipse at 20% 0%, rgba(52, 211, 153, 0.22), transparent 50%), radial-gradient(ellipse at 90% 10%, rgba(74, 222, 128, 0.14), transparent 45%), radial-gradient(ellipse at 80% 90%, rgba(16, 185, 129, 0.12), transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;
