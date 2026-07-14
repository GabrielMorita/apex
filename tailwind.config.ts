import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--surface-canvas)",
        "canvas-glass": "var(--surface-canvas-glass)",
        surface: {
          DEFAULT: "var(--surface-base)",
          glass: "var(--surface-base-glass)",
          raised: "var(--surface-raised)",
          overlay: "var(--surface-overlay)",
          hover: "var(--surface-hover)",
        },
        ink: {
          DEFAULT: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          strong: "var(--accent-strong)",
          muted: "var(--accent-muted)",
          subtle: "var(--accent-subtle)",
        },
        line: {
          DEFAULT: "var(--border-default)",
          subtle: "var(--border-subtle)",
          strong: "var(--border-strong)",
          accent: "var(--border-accent)",
        },
        status: {
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          error: "var(--status-error)",
          info: "var(--status-info)",
        },

        /* Legacy aliases. Existing screens inherit the new system while
           they are progressively migrated to the semantic tokens above. */
        apex: {
          bg: "var(--surface-canvas)",
          surface: "var(--surface-base)",
          card: "var(--surface-raised)",
          border: "var(--border-default)",
          border2: "var(--border-strong)",
          white: "var(--text-primary)",
          muted: "var(--text-secondary)",
          faint: "var(--text-muted)",
          gold: "var(--accent-primary)",
          "gold-dim": "var(--accent-muted)",
          "gold-bg": "var(--accent-subtle)",
          ember: "var(--status-warning)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        control: "var(--radius-control)",
        card: "var(--radius-card)",
        panel: "var(--radius-panel)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        float: "var(--shadow-float)",
        gold: "var(--shadow-accent)",
        "glow-gold": "var(--shadow-accent)",
      },
      transitionTimingFunction: {
        product: "cubic-bezier(.22,.61,.36,1)",
      },
    },
  },
  plugins: [],
};

export default config;
