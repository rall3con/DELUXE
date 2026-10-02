// Design tokens — dark theme only, from design_guidelines.json
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces
  surface: "#050505",
  onSurface: "#FFFFFF",
  surfaceSecondary: "#151515",
  onSurfaceSecondary: "#A3A3A3",
  surfaceTertiary: "#1F1F1F",
  onSurfaceTertiary: "#D4D4D4",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#000000",
  muted: "#8E8E93",

  // Brand (purple / pink / green accents)
  brand: "#BF5AF2",
  onBrand: "#FFFFFF",
  brandPrimary: "#BF5AF2", // Purple
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF375F", // Pink
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#32D74B", // Green
  onBrandTertiary: "#000000",

  // Status
  success: "#32D74B",
  onSuccess: "#000000",
  warning: "#FF9F0A",
  onWarning: "#000000",
  error: "#FF375F",
  onError: "#FFFFFF",
  info: "#0A84FF",
  onInfo: "#FFFFFF",

  // Lines
  border: "#2C2C2E",
  borderStrong: "#48484A",
  divider: "#1C1C1E",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

export const colors = dark;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  // Force dark since we only ship dark
  return { scheme: "dark", colors: dark };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
