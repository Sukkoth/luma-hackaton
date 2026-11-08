/**
 * Centralized Design Tokens & Color Palettes
 * (Adapted from Watermelon architecture for Next.js & Tailwind CSS v4)
 *
 * CHANGE YOUR COLORS HERE:
 * Changing tokens here or in globals.css automatically updates
 * all screens, cards, modals, badges, charts, and buttons across the entire app.
 */

import type { ThemeTokens } from "./types";

// --- 1. SINGLE-SOURCE PRIMARY BRAND ACCENTS ---
export const PRIMARY_COLOR_LIGHT = "#18181B";
export const PRIMARY_FOREGROUND_LIGHT = "#FFFFFF";
export const PRIMARY_MUTED_LIGHT = "rgba(24, 24, 27, 0.08)";
export const PRIMARY_BORDER_LIGHT = "rgba(24, 24, 27, 0.25)";

export const PRIMARY_COLOR_DARK = "#FAFAFA";
export const PRIMARY_FOREGROUND_DARK = "#09090B";
export const PRIMARY_MUTED_DARK = "rgba(250, 250, 250, 0.12)";
export const PRIMARY_BORDER_DARK = "rgba(250, 250, 250, 0.35)";

export const palette = {
  white: "#FFFFFF",
  black: "#000000",

  // Dark Theme Base (Luma / Watermelon dark)
  darkBg: "#09090B",
  darkSurface: "#121215",
  darkSurfaceElevated: "#18181B",
  darkSurfaceSubtle: "#27272A",
  darkBorder: "#27272A",
  darkBorderSubtle: "#1F1F23",
  darkBorderStrong: "#3F3F46",
  darkText: "#FAFAFA",
  darkTextSecondary: "#A1A1AA",
  darkTextDim: "#71717A",

  // Light Theme Base
  lightBg: "#F8F9FA",
  lightSurface: "#FFFFFF",
  lightSurfaceElevated: "#F4F4F5",
  lightSurfaceSubtle: "#ECECEF",
  lightBorder: "#E4E4E7",
  lightBorderSubtle: "#F4F4F5",
  lightBorderStrong: "#A1A1AA",
  lightText: "#18181B",
  lightTextSecondary: "#52525B",
  lightTextDim: "#71717A",

  // Status & Utility
  destructive: "#EF4444",
  destructiveLight: "#FEE2E2",
  destructiveDark: "rgba(239, 68, 68, 0.15)",
  success: "#10B981",
  warning: "#F59E0B",
} as const;

export const lightTokens: ThemeTokens = {
  background: palette.lightBg,
  surface: palette.lightSurface,
  surfaceElevated: palette.lightSurfaceElevated,
  surfaceSubtle: palette.lightSurfaceSubtle,
  border: palette.lightBorder,
  borderSubtle: palette.lightBorderSubtle,
  borderStrong: palette.lightBorderStrong,
  foreground: palette.lightText,
  foregroundSecondary: palette.lightTextSecondary,
  foregroundDim: palette.lightTextDim,
  primary: PRIMARY_COLOR_LIGHT,
  primaryForeground: PRIMARY_FOREGROUND_LIGHT,
  primaryMuted: PRIMARY_MUTED_LIGHT,
  primaryBorder: PRIMARY_BORDER_LIGHT,
  destructive: palette.destructive,
  destructiveForeground: palette.white,
  destructiveSubtle: "rgba(239, 68, 68, 0.1)",
  success: palette.success,
  warning: palette.warning,
};

export const darkTokens: ThemeTokens = {
  background: palette.darkBg,
  surface: palette.darkSurface,
  surfaceElevated: palette.darkSurfaceElevated,
  surfaceSubtle: palette.darkSurfaceSubtle,
  border: palette.darkBorder,
  borderSubtle: palette.darkBorderSubtle,
  borderStrong: palette.darkBorderStrong,
  foreground: palette.darkText,
  foregroundSecondary: palette.darkTextSecondary,
  foregroundDim: palette.darkTextDim,
  primary: PRIMARY_COLOR_DARK,
  primaryForeground: PRIMARY_FOREGROUND_DARK,
  primaryMuted: PRIMARY_MUTED_DARK,
  primaryBorder: PRIMARY_BORDER_DARK,
  destructive: palette.destructive,
  destructiveForeground: palette.white,
  destructiveSubtle: palette.destructiveDark,
  success: palette.success,
  warning: palette.warning,
};
