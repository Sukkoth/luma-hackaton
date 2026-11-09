export interface ThemeTokens {
  readonly background: string;
  readonly surface: string;
  readonly surfaceElevated: string;
  readonly surfaceSubtle: string;
  readonly border: string;
  readonly borderSubtle: string;
  readonly borderStrong: string;
  readonly foreground: string;
  readonly foregroundSecondary: string;
  readonly foregroundDim: string;
  readonly primary: string;
  readonly primaryForeground: string;
  readonly primaryMuted: string;
  readonly primaryBorder: string;
  readonly destructive: string;
  readonly destructiveForeground: string;
  readonly destructiveSubtle: string;
  readonly success: string;
  readonly warning: string;
}

export type ThemeMode = "light" | "dark" | "system";
