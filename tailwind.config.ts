import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        apex: {
          bg: "#14100b", surface: "#1b1610", card: "#221b14",
          border: "#34291d", border2: "#4d3c2a",
          white: "#f3ebdd", muted: "#a99a83", faint: "#6f6250",
          gold: "#e3ad52", "gold-dim": "#8a6a2f", "gold-bg": "#241c10",
          ember: "#d0855a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      boxShadow: {
        card: "0 10px 28px -14px rgba(0,0,0,0.65), 0 2px 6px -2px rgba(0,0,0,0.45)",
        "card-hover": "0 18px 40px -16px rgba(0,0,0,0.7), 0 5px 12px -4px rgba(0,0,0,0.5)",
        gold: "0 10px 30px -10px rgba(227,173,82,0.32)",
        "glow-gold": "0 0 0 1px rgba(227,173,82,0.28), 0 12px 32px -10px rgba(227,173,82,0.3)",
      },
    },
  },
  plugins: [],
};
export default config;
