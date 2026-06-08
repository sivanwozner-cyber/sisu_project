import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans: ["Heebo", "Rubik", "Segoe UI", "system-ui", "sans-serif"],
        display: ["Heebo", "Rubik", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Aurora brand palette (matches the magazine-cover reference)
        aurora: {
          teal: "#1de9d6",
          cyan: "#22d3ee",
          blue: "#3b82f6",
          violet: "#8b5cf6",
          magenta: "#d946ef",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #1de9d6 0%, #3b82f6 45%, #8b5cf6 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgba(29,233,214,0.18) 0%, rgba(139,92,246,0.18) 100%)",
        "aurora-radial":
          "radial-gradient(60% 60% at 70% 20%, rgba(29,233,214,0.22) 0%, transparent 60%), radial-gradient(50% 50% at 20% 30%, rgba(139,92,246,0.20) 0%, transparent 60%), radial-gradient(55% 55% at 50% 90%, rgba(59,130,246,0.18) 0%, transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(29,233,214,0.20), 0 8px 40px -8px rgba(29,233,214,0.45)",
        "glow-violet":
          "0 0 0 1px rgba(139,92,246,0.20), 0 8px 40px -8px rgba(139,92,246,0.45)",
        "glow-sm": "0 4px 24px -6px rgba(29,233,214,0.40)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(4%,-3%,0) scale(1.08)" },
          "66%": { transform: "translate3d(-3%,3%,0) scale(0.96)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.7" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        aurora: "aurora 18s ease-in-out infinite",
        "aurora-slow": "aurora 26s ease-in-out infinite",
        float: "float 8s ease-in-out infinite",
        "fade-up": "fade-up 0.5s ease-out both",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
