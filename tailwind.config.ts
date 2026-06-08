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
        sans: ["Rubik", "Heebo", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        neon: {
          cyan: "#22e0d0",
          violet: "#8b5cf6",
          magenta: "#ec4899",
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
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "glow-sm": "0 0 12px -2px hsl(var(--primary) / 0.45)",
        glow: "0 0 24px -4px hsl(var(--primary) / 0.55)",
        "glow-lg": "0 0 48px -6px hsl(var(--primary) / 0.65)",
        "glow-violet": "0 0 24px -4px hsl(var(--secondary) / 0.6)",
      },
      backgroundImage: {
        "gradient-aurora":
          "radial-gradient(60% 50% at 15% 0%, hsl(var(--primary) / 0.16) 0%, transparent 60%), radial-gradient(55% 45% at 100% 10%, hsl(var(--secondary) / 0.18) 0%, transparent 55%), radial-gradient(50% 60% at 80% 100%, hsl(var(--accent) / 0.12) 0%, transparent 60%)",
        "gradient-neon":
          "linear-gradient(120deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 18px -6px hsl(var(--primary) / 0.5)" },
          "50%": { boxShadow: "0 0 30px -4px hsl(var(--primary) / 0.85)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
