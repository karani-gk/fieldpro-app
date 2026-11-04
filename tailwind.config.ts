import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // One palette with the GitHub social cards: deep ink green, a teal brand, mint accents.
        brand: { DEFAULT: "#0f766e", dark: "#115e59", light: "#ccfbf1" },
        ink: { DEFAULT: "#0f2a24", soft: "#163d34" },
        mint: { DEFAULT: "#7fd3b0", soft: "#d9f5ea" },
      },
      fontFamily: {
        // Inter when the machine has it; the system UI font otherwise. No web-font download, so
        // the app still looks right offline.
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
        rise: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        rise: "rise 0.6s ease-out both",
      },
      boxShadow: {
        soft: "0 1px 2px rgb(15 42 36 / 0.04), 0 4px 16px -4px rgb(15 42 36 / 0.08)",
        lift: "0 2px 4px rgb(15 42 36 / 0.06), 0 12px 32px -8px rgb(15 42 36 / 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
