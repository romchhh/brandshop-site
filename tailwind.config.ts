import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Montserrat",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "var(--font-sans)",
          "Montserrat",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        ink: "#121316",
        mute: "#5c5e63",
        line: "#e0e0dc",
        /** Бордовий акцент (пара з чорним, як у hero) */
        sale: {
          DEFAULT: "#8c2f39",
          soft: "#f6ecee",
          deep: "#6e2229",
        },
        ph: "#f4f4f2",
      },
      fontSize: {
        body: ["1rem", { lineHeight: "1.55", fontWeight: "500" }],
        lead: ["1.125rem", { lineHeight: "1.5", fontWeight: "500" }],
      },
      spacing: {
        section: "7.5rem",
      },
      letterSpacing: {
        brand: "0.18em",
        caps: "0.08em",
      },
    },
  },
  plugins: [],
};

export default config;
