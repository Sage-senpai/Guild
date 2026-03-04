import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Guild brand palette
        ink:   "#0E2931",  // Deep Teal — primary text, dark surfaces
        teal:  "#12484C",  // Muted Teal — secondary surfaces, nav
        mint:  "#2B7574",  // Sea Green — interactive, success, links
        flare: "#861211",  // Crimson — accent, CTAs, alerts
        ember: "#f8b400",  // Amber — highlights, warnings
        stone: "#E2E2E0",  // Neutral — borders, separators
        chalk: "#F6F6F4",  // Off-white — page background

        // Radix/shadcn tokens
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },

      fontFamily: {
        display: ["var(--font-display)", "Playfair Display", "Georgia", "serif"],
        body:    ["var(--font-body)", "Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono:    ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
        sans:    ["var(--font-body)", "Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },

      boxShadow: {
        sm:    "0 1px 2px rgba(14,41,49,0.04)",
        panel: "0 2px 8px rgba(14,41,49,0.06), 0 1px 3px rgba(14,41,49,0.04)",
        card:  "0 2px 8px rgba(14,41,49,0.06), 0 0 0 1px rgba(43,117,116,0.08)",
        "card-hover": "0 8px 24px rgba(14,41,49,0.12), 0 0 0 1px rgba(43,117,116,0.22)",
        lg:    "0 8px 32px rgba(14,41,49,0.12), 0 4px 12px rgba(14,41,49,0.06)",
      },

      backgroundImage: {
        haze: "radial-gradient(ellipse 60% 40% at 10% 0%, rgba(43,117,116,0.14), transparent), radial-gradient(ellipse 50% 30% at 90% 5%, rgba(134,18,17,0.09), transparent)",
        "gradient-aurora": "linear-gradient(135deg,#0E2931 0%,#2B7574 100%)",
        "gradient-sunset": "linear-gradient(135deg,#861211 0%,#12484C 100%)",
        "gradient-ocean":  "linear-gradient(135deg,#12484C 0%,#2B7574 70%,#4a9e9d 100%)",
        "gradient-ember":  "linear-gradient(135deg,#861211 20%,#2B7574 100%)",
        "gradient-cosmic": "linear-gradient(135deg,#0E2931 0%,#861211 50%,#2B7574 100%)",
      },

      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        "3xl": "1.75rem",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        rise: {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "bg-shift": {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        rise:      "rise 420ms ease-out both",
        "fade-up": "fade-up 420ms ease-out both",
        "bg-shift":"bg-shift 8s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
