// Identidade visual do fortn — herdada do design original (paleta "fortuna" dourada)
export const colors = {
  primary: "#755A26",
  primaryContainer: "#C5A368",
  primaryFixed: "#FFDEA8",
  onPrimary: "#FFFFFF",

  background: "#FBF9F7",
  surface: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.6)",
  surfaceDim: "#F5F3F1",

  onSurface: "#1B1C1B",
  onSurfaceVariant: "#4D463A",
  secondary: "#5F5E5C",

  border: "rgba(0,0,0,0.06)",
  borderStrong: "rgba(117,90,38,0.2)",

  error: "#BA1A1A",
  success: "#4E7A4E",

  shadow: "#755A26",

  // Aliases semânticos (usados nas telas de cartões/perfil)
  text: "#1B1C1B",
  card: "#FFFFFF",
  white: "#FFFFFF",
} as const;

export const fonts = {
  serif: "Caslon",
  serifBold: "CaslonBold",
  sans: "Hanken",
  sansMedium: "HankenMedium",
  sansBold: "HankenBold",
} as const;

// Escala tipográfica — serifa para números/títulos, sans para o resto
export const type = {
  displayXl: { fontFamily: fonts.serif, fontSize: 44, lineHeight: 48 },
  displayLg: { fontFamily: fonts.serif, fontSize: 32, lineHeight: 38 },
  title: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 26 },
  headline: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30 },
  bodyLg: { fontFamily: fonts.sans, fontSize: 18, lineHeight: 26 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 20,
  lg: 28,
  full: 999,
} as const;
