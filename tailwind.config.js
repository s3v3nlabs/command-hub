/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
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
        // Dark theme colors
        "dark-base": "#000000",
        "dark-50": "#0A0A0A",
        "dark-100": "#171717",
        "dark-200": "#262626",
        "dark-300": "#373737",
        "dark-400": "#525252",
        "dark-500": "#8A8A8A",
        "dark-600": "#A3A3A3",
        "dark-700": "#D4D4D4",
        "dark-800": "#E5E5E5",
        "dark-900": "#F5F5F5",
        "dark-950": "#FAFAFA",

        // Light theme colors
        "light-base": "#FFFFFF",
        "light-50": "#FAFAFA",
        "light-100": "#F5F5F5",
        "light-200": "#E5E5E5",
        "light-300": "#D4D4D4",
        "light-400": "#A3A3A3",
        "light-500": "#8A8A8A",
        "light-600": "#525252",
        "light-700": "#373737",
        "light-800": "#262626",
        "light-900": "#171717",
        "light-950": "#0A0A0A",

        // Accent colors for light theme
        "accent-red-500": "#FF3B30",
        "accent-red-600": "#D50000",
        "accent-red-700": "#B71C1C",
        "accent-red-800": "#7F0000",

        // System colors that adapt to theme
        // background: "var(--background)",
        // foreground: "var(--foreground)",
        // card: "var(--card)",
        // "card-foreground": "var(--card-foreground)",
        // "card-border": "var(--card-border)",
        // "card-shadow": "var(--card-shadow)",
        // muted: "var(--muted)",
        // "muted-foreground": "var(--muted-foreground)",
        // accent: "var(--accent)",
        // "accent-foreground": "var(--accent-foreground)",
        // border: "var(--border)",
        // ring: "var(--ring)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        // Custom shadows based on the shadow reference image
        "glow-sm": "0 0 4px 0 rgba(255, 255, 255, 0.1)",
        "glow-md": "0 0 8px 2px rgba(255, 255, 255, 0.15)",
        "glow-lg": "0 0 12px 4px rgba(255, 255, 255, 0.2)",
        "glow-xl": "0 0 16px 8px rgba(255, 255, 255, 0.25)",
        "glow-2xl": "0 0 24px 12px rgba(255, 255, 255, 0.3)",
        "glow-inner": "inset 0 0 8px 0 rgba(255, 255, 255, 0.15)",
        "red-glow-sm": "0 0 4px 0 rgba(255, 59, 48, 0.3)",
        "red-glow-md": "0 0 8px 2px rgba(255, 59, 48, 0.4)",
        "red-glow-lg": "0 0 12px 4px rgba(255, 59, 48, 0.5)",
      },
      backgroundImage: {
        "grid-pattern":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23262626' fill-opacity='0.3' d='M1,1 L1,1 L1,19 L19,19 L19,1 L1,1 Z M0,0 L20,0 L20,20 L0,20 L0,0 Z'/%3E%3C/svg%3E\")",
        "grid-pattern-light":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Cpath fill='%23E5E5E5' fill-opacity='0.3' d='M1,1 L1,1 L1,19 L19,19 L19,1 L1,1 Z M0,0 L20,0 L20,20 L0,20 L0,0 Z'/%3E%3C/svg%3E\")",
        "dot-pattern":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23373737' fill-opacity='0.4'/%3E%3C/svg%3E\")",
        "dot-pattern-light":
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23A3A3A3' fill-opacity='0.4'/%3E%3C/svg%3E\")",
        "gradient-dark": "linear-gradient(180deg, rgba(10, 10, 10, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%)",
        "gradient-light": "linear-gradient(180deg, rgba(250, 250, 250, 0.8) 0%, rgba(255, 255, 255, 0.9) 100%)",
        "gradient-card-dark": "linear-gradient(135deg, rgba(38, 38, 38, 0.7) 0%, rgba(23, 23, 23, 0.8) 100%)",
        "gradient-card-light": "linear-gradient(135deg, rgba(245, 245, 245, 0.7) 0%, rgba(229, 229, 229, 0.8) 100%)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "border-pulse": "border-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow-pulse": "glow-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "text-shimmer": "text-shimmer 2.5s ease infinite",
        "consciousness-pulse": "consciousness-pulse 6s ease-in-out infinite",
        "water-flow": "water-flow 8s ease-in-out infinite",
        "tai-chi-energy": "tai-chi-energy 8s ease-in-out infinite",
        "signal-pulse": "signal-pulse 4s ease-in-out infinite",
      },
      keyframes: {
        "border-pulse": {
          "0%, 100%": { borderColor: "rgba(255, 255, 255, 0.2)" },
          "50%": { borderColor: "rgba(255, 255, 255, 0.1)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 8px 2px rgba(255, 255, 255, 0.15)" },
          "50%": { boxShadow: "0 0 12px 4px rgba(255, 255, 255, 0.25)" },
        },
        "text-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "consciousness-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(138, 43, 226, 0.1)" },
          "50%": { boxShadow: "0 0 20px rgba(138, 43, 226, 0.2)" },
        },
        "water-flow": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "tai-chi-energy": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "signal-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.98" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
