import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-bg-primary)",
        panel: "var(--color-bg-secondary)",
        elevated: "var(--color-bg-elevated)",
        line: "var(--color-border)",
        primary: "var(--color-text-primary)",
        secondary: "var(--color-text-secondary)",
        muted: "var(--color-text-muted)",
        accent: "var(--color-accent)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(96,165,250,0.12), 0 16px 50px rgba(0,0,0,0.22)"
      }
    }
  },
  plugins: []
};

export default config;
