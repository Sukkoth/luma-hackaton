/**
 * Centralized Design Tokens & Color Palettes
 * (Exact replica of Watermelon design system for Next.js & Tailwind CSS v4)
 *
 * CHANGE YOUR COLORS HERE:
 * Changing tokens here or in globals.css automatically updates
 * all screens, cards, modals, badges, charts, and buttons across the entire app.
 */

import type { ThemeTokens } from "./types";

// --- 1. SINGLE-SOURCE PRIMARY BRAND ACCENTS (EXACT WATERMELON TOKENS) ---
export const PRIMARY_COLOR_LIGHT = "#1A212D";
export const PRIMARY_FOREGROUND_LIGHT = "#FFFFFF";
export const PRIMARY_MUTED_LIGHT = "rgba(26, 33, 45, 0.08)";
export const PRIMARY_BORDER_LIGHT = "rgba(26, 33, 45, 0.25)";

export const PRIMARY_COLOR_DARK = "#DADAD6";
export const PRIMARY_FOREGROUND_DARK = "#10110C";
export const PRIMARY_MUTED_DARK = "rgba(218, 218, 214, 0.12)";
export const PRIMARY_BORDER_DARK = "rgba(218, 218, 214, 0.35)";

export const palette = {
  white: "#FFFFFF",
  black: "#000000",

  // Dark Theme Base (Exact Watermelon Dark)
  darkBg: "#10110C",
  darkSurface: "#181A13",
  darkSurfaceElevated: "#24271D",
  darkSurfaceSubtle: "#1E2018",
  darkBorder: "#26291E",
  darkBorderSubtle: "#1E2018",
  darkBorderStrong: "#363A2B",
  darkText: "#FFFFFF",
  darkTextSecondary: "#9E9F97",
  darkTextDim: "#94968C",

  // Light Theme Base (Exact Watermelon Light - Deep Slate Theme #1A212D)
  lightBg: "#F8F9FA",
  lightSurface: "#FFFFFF",
  lightSurfaceElevated: "#F1F3F5",
  lightSurfaceSubtle: "#E9ECEF",
  lightBorder: "#E1E5EA",
  lightBorderSubtle: "#D4DBE2",
  lightBorderStrong: "#B0BAC5",
  lightText: "#1A212D",
  lightTextSecondary: "#4F5D6E",
  lightTextDim: "#5C6B7E",

  // Status & Utility
  destructive: "#EF4444",
  destructiveLight: "#FEE2E2",
  destructiveDark: "rgba(239, 68, 68, 0.15)",
  success: "#10B981",
  warning: "#F59E0B",
  info: "#3B82F6",
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
