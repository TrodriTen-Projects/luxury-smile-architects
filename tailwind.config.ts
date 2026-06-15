import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        lg: "2.5rem",
        xl: "4rem",
      },
      screens: {
        "2xl": "1320px",
      },
    },
    extend: {
      colors: {
        // "Carbón & Oro cálido" palette (approved)
        base: "hsl(var(--base) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        elevated: "hsl(var(--elevated) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        gold: {
          DEFAULT: "hsl(var(--gold) / <alpha-value>)",
          deep: "hsl(var(--gold-deep) / <alpha-value>)",
          soft: "hsl(var(--beige) / <alpha-value>)",
        },
        ring: "hsl(var(--gold) / <alpha-value>)",
      },
      fontFamily: {
        serif: ["'Fraunces Variable'", "Fraunces", "Georgia", "serif"],
        sans: ["'Montserrat Variable'", "Montserrat", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        luxe: "0.28em",
        wide2: "0.18em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      maxWidth: {
        prose: "65ch",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(24px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "marquee": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.16,1,0.3,1) both",
        shimmer: "shimmer 6s linear infinite",
        marquee: "marquee 38s linear infinite",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
