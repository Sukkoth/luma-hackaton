const DEFAULT_SITE_URL = "https://luma.sukkoth.dev";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) {
    return DEFAULT_SITE_URL;
  }
  return configured.replace(/\/+$/, "");
}
