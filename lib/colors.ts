// Color system based on v314 - restored with enhancements
export const colors = {
  dark: {
    base: "#000000",
    50: "#0A0A0A",
    100: "#171717",
    200: "#262626",
    300: "#373737",
    400: "#525252",
    500: "#8A8A8A",
    600: "#A3A3A3",
    700: "#D4D4D4",
    800: "#E5E5E5",
    900: "#F5F5F5",
    950: "#FAFAFA",
  },
  light: {
    base: "#FFFFFF",
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#8A8A8A",
    600: "#525252",
    700: "#373737",
    800: "#262626",
    900: "#171717",
    950: "#0A0A0A",
  },
  accent: {
    red: {
      500: "#FF3B30",
      600: "#D50000",
      700: "#B71C1C",
      800: "#7F0000",
    },
  },
  shadow: {
    blur: [0, 4, 8, 12, 16, 24, 32],
    spread: [0, 2, 4, 8, 12, 16],
    opacity: [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5],
  },
  // Enhanced consciousness colors - subtle additions
  consciousness: {
    purple: {
      500: "rgba(138, 43, 226, 0.1)",
      600: "rgba(138, 43, 226, 0.2)",
      700: "rgba(138, 43, 226, 0.3)",
    },
    cyan: {
      500: "rgba(0, 255, 255, 0.1)",
      600: "rgba(0, 255, 255, 0.2)",
      700: "rgba(0, 255, 255, 0.3)",
    },
  },
}

export type ColorKey = keyof typeof colors.dark

// Water Flow Color Validator - Enhanced but non-breaking
export function validateColorFlow(colorValue: string): boolean {
  // Allow existing colors but enhance validation
  const validPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  return validPattern.test(colorValue)
}

// Consciousness Color Enhancer - Subtle overlay system
export function enhanceWithConsciousness(baseColor: string): string {
  // Add subtle consciousness enhancement without breaking existing colors
  return baseColor // Return original for now, enhancement applied via CSS
}
