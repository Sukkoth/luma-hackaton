import crypto from "node:crypto";
import { type NextRequest } from "next/server";
import sanitizeHtml from "sanitize-html";
import * as v from "valibot";
import {
  BIBLE_VERSIONS,
  isBookSupportedInSixtySixBookVersions,
} from "@/lib/bible-versions";

const CONTENT_VERSION = "yvp-v1";
const MEMORY_CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const MAX_MEMORY_CACHE_ENTRIES = 500;

const ALLOWED_VERSION_IDS = new Set(BIBLE_VERSIONS.map((ver) => ver.id));

const YouVersionHtmlPassageSchema = v.object({
  id: v.string(),
  content: v.string(),
  reference: v.string(),
});

type CachedPassage = {
  reference: string;
  contentHtml: string;
  versionLabel: string;
  timestamp: number;
};

const passageCache = new Map<string, CachedPassage>();
const inFlightFetches = new Map<string, Promise<CachedPassage>>();

const STANDARD_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
} as const;

type ParsedBiblePath = {
  versionId: number;
  reference: string;
  bookCode: string;
};

function parseBiblePath({ path }: { path: string }): ParsedBiblePath | null {
  const trimmed = path.trim().replace(/^\/+/, "");
  const parts = trimmed.split("/");
  if (parts.length !== 2) return null;

  const versionId = Number.parseInt(parts[0] ?? "", 10);
  const reference = parts[1]?.trim() ?? "";
  if (!Number.isFinite(versionId) || !reference) return null;

  const bookCode = reference.split(".")[0]?.trim() ?? "";
  if (!bookCode || !/^[A-Za-z0-9.+-]+$/.test(reference)) return null;

  return { versionId, reference, bookCode };
}

function sanitizePassageHtml({ html }: { html: string }): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "div",
      "span",
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "b",
      "i",
      "sup",
      "sub",
    ],
    allowedAttributes: {
      div: ["class"],
      span: ["class", "v"],
      p: ["class"],
    },
  });
}

function escapeHtml({ text }: { text: string }): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderHtmlDocument({
  reference,
  contentHtml,
  theme,
  fontSize,
}: {
  reference: string;
  contentHtml: string;
  theme: "dark" | "light";
  fontSize: number;
}): string {
  const isDark = theme === "dark";
  const safeReference = escapeHtml({ text: reference });

  return `<!DOCTYPE html>
<html lang="en" class="${theme}" style="--bible-font-size: ${fontSize}px;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeReference}</title>
  <style>
    :root, html.light, body.light {
      --luma-bg: #ffffff;
      --luma-text: #1c1917;
      --luma-heading: #1c1917;
      --luma-muted: #78716c;
      --luma-accent: #d97706;
      --luma-border: #e7e5e0;
      --luma-scroll: rgba(28, 25, 23, 0.16);
    }

    html.dark, body.dark {
      --luma-bg: #111110;
      --luma-text: #e4e4e7;
      --luma-heading: #ffffff;
      --luma-muted: #a1a1aa;
      --luma-accent: #f59e0b;
      --luma-border: rgba(255, 255, 255, 0.1);
      --luma-scroll: rgba(255, 255, 255, 0.18);
    }

    * {
      box-sizing: border-box;
    }

    *::-webkit-scrollbar {
      width: 5px;
      height: 5px;
    }

    *::-webkit-scrollbar-track {
      background: transparent;
    }

    *::-webkit-scrollbar-thumb {
      background-color: var(--luma-scroll);
      border-radius: 9999px;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: var(--luma-bg, ${isDark ? "#111110" : "#ffffff"});
      color: var(--luma-text, ${isDark ? "#e4e4e7" : "#1c1917"});
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Ethiopic", "Nyala", Roboto, sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .luma-reader {
      max-width: 760px;
      margin: 0 auto;
      padding: 2.5rem 2rem 5rem;
      font-size: var(--bible-font-size, ${fontSize}px);
      line-height: 1.95;
      letter-spacing: 0.01em;
      word-spacing: 0.04em;
    }

    .luma-passage .p,
    .luma-passage .pi,
    .luma-passage .m,
    .luma-passage .mi,
    .luma-passage .pc,
    .luma-passage .li1 {
      margin: 0 0 1.35em;
    }

    .luma-passage .pi {
      text-indent: 1.25em;
    }

    .luma-passage .q1,
    .luma-passage .q2,
    .luma-passage .q3 {
      margin: 0.35em 0;
      padding-left: 1.25em;
      line-height: 1.85;
    }

    .luma-passage .q2,
    .luma-passage .q3 {
      padding-left: 2.25em;
    }

    .luma-passage .d {
      margin: 0 0 1.1em;
      font-style: italic;
      color: var(--luma-muted);
      font-size: 0.92em;
    }

    .luma-passage .s,
    .luma-passage .s1,
    .luma-passage .s2 {
      margin: 1.75em 0 0.65em;
      font-size: 1em;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--luma-heading);
    }

    .luma-passage .yv-vlbl {
      font-size: 0.62em;
      font-weight: 700;
      color: var(--luma-accent);
      vertical-align: super;
      line-height: 0;
      margin-right: 0.4em;
      margin-left: 0.25em;
      user-select: none;
    }

    .luma-passage .nd {
      font-variant: small-caps;
    }

    .luma-passage .b {
      height: 1.1em;
    }
  </style>
  <script>
    window.addEventListener("message", function(e) {
      if (!e || !e.data || e.origin !== window.location.origin) return;
      if (e.data.type === "SET_FONT_SIZE") {
        var size = Number(e.data.fontSize);
        if (!isNaN(size)) {
          var clamped = Math.min(32, Math.max(20, size));
          document.documentElement.style.setProperty("--bible-font-size", clamped + "px");
          if (document.body) {
            document.body.style.setProperty("--bible-font-size", clamped + "px");
          }
        }
      } else if (e.data.type === "SET_THEME") {
        var newTheme = e.data.theme === "dark" ? "dark" : "light";
        document.documentElement.className = newTheme;
        if (document.body) {
          document.body.className = newTheme;
        }
      }
    });
  </script>
</head>
<body class="${theme}" style="--bible-font-size: ${fontSize}px;">
  <main class="luma-reader">
    <article class="luma-passage">${contentHtml}</article>
  </main>
</body>
</html>`;
}

function renderMessagePage({
  title,
  message,
  theme,
  showRetry = false,
}: {
  title: string;
  message: string;
  theme: "dark" | "light";
  showRetry?: boolean;
}): Response {
  const isDark = theme === "dark";
  const retryHtml = showRetry
    ? '<button type="button" onclick="window.location.reload()">Retry Passage</button>'
    : "";

  return new Response(
    `<!DOCTYPE html>
    <html lang="en" class="${theme}">
    <head>
      <meta charset="utf-8" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: ${isDark ? "#050505" : "#f8fafc"};
          color: ${isDark ? "#f1f5f9" : "#1e293b"};
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          text-align: center;
          padding: 1rem;
          box-sizing: border-box;
        }
        .box { max-width: 420px; }
        h3 { font-size: 1.05rem; margin-bottom: 0.5rem; }
        p { font-size: 0.875rem; color: ${isDark ? "#a1a1aa" : "#64748b"}; line-height: 1.5; margin: 0.5rem 0; }
        button {
          margin-top: 1rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 0.75rem;
          border: none;
          background-color: ${isDark ? "#ffffff" : "#1e293b"};
          color: ${isDark ? "#050505" : "#ffffff"};
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <h3>${escapeHtml({ text: title })}</h3>
        <p>${escapeHtml({ text: message })}</p>
        ${retryHtml}
      </div>
    </body>
    </html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

async function fetchYouVersionPassage({
  versionId,
  reference,
}: {
  versionId: number;
  reference: string;
}): Promise<CachedPassage> {
  const appKey = process.env.APP_KEY;
  if (!appKey) {
    throw new Error("YouVersion API key (APP_KEY) is not configured.");
  }

  const url = `https://api.youversion.com/v1/bibles/${versionId}/passages/${encodeURIComponent(reference)}?format=html`;
  const response = await fetch(url, {
    headers: {
      "X-YVP-App-Key": appKey,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(12000),
  });

  if (!response.ok) {
    throw new Error(`YouVersion API returned ${response.status}`);
  }

  const rawJson: unknown = await response.json();
  const parsed = v.safeParse(YouVersionHtmlPassageSchema, rawJson);
  if (!parsed.success) {
    throw new Error("Invalid passage response from YouVersion API.");
  }

  const version = BIBLE_VERSIONS.find((item) => item.id === versionId);

  return {
    reference: parsed.output.reference,
    contentHtml: sanitizePassageHtml({ html: parsed.output.content }),
    versionLabel: version?.abbreviation ?? String(versionId),
    timestamp: Date.now(),
  };
}

export async function GET(request: NextRequest): Promise<Response> {
  const path = request.nextUrl.searchParams.get("path") ?? "";
  const theme =
    request.nextUrl.searchParams.get("theme") === "dark" ? "dark" : "light";
  const fontSizeParam = Number(
    request.nextUrl.searchParams.get("fontSize") || "22"
  );
  const fontSize = Math.min(
    32,
    Math.max(20, Number.isNaN(fontSizeParam) ? 22 : fontSizeParam)
  );

  const parsedPath = parseBiblePath({ path });
  if (!parsedPath) {
    return renderMessagePage({
      title: "Invalid passage request",
      message: "The requested passage reference could not be parsed.",
      theme,
    });
  }

  const { versionId, reference, bookCode } = parsedPath;

  if (!ALLOWED_VERSION_IDS.has(versionId)) {
    return renderMessagePage({
      title: "Bible version unavailable",
      message:
        "This Bible version is not enabled. Please select one of the available translations.",
      theme,
    });
  }

  if (!isBookSupportedInSixtySixBookVersions({ bookId: bookCode })) {
    return renderMessagePage({
      title: "Book not available in this version",
      message:
        "The available Bible translations only include the 66-book canon, so this book cannot be opened in the reader.",
      theme,
    });
  }

  const cacheKey = `${CONTENT_VERSION}:${versionId}:${reference}`;
  const etag = `"${crypto
    .createHash("sha256")
    .update(`${cacheKey}:${theme}:${fontSize}`)
    .digest("hex")
    .slice(0, 16)}"`;

  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  const memCached = passageCache.get(cacheKey);
  if (memCached && Date.now() - memCached.timestamp < MEMORY_CACHE_TTL_MS) {
    return new Response(
      renderHtmlDocument({
        reference: memCached.reference,
        contentHtml: memCached.contentHtml,
        theme,
        fontSize,
      }),
      {
        status: 200,
        headers: {
          ...STANDARD_HEADERS,
          ETag: etag,
          "X-Cache": "HIT",
        },
      }
    );
  }

  try {
    let fetchPromise = inFlightFetches.get(cacheKey);
    if (!fetchPromise) {
      fetchPromise = fetchYouVersionPassage({ versionId, reference });
      inFlightFetches.set(cacheKey, fetchPromise);
    }

    let passage: CachedPassage;
    try {
      passage = await fetchPromise;
    } finally {
      inFlightFetches.delete(cacheKey);
    }

    if (passageCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
      const oldestKey = passageCache.keys().next().value;
      if (oldestKey) passageCache.delete(oldestKey);
    }
    passageCache.set(cacheKey, passage);

    return new Response(
      renderHtmlDocument({
        reference: passage.reference,
        contentHtml: passage.contentHtml,
        theme,
        fontSize,
      }),
      {
        status: 200,
        headers: {
          ...STANDARD_HEADERS,
          ETag: etag,
          "X-Cache": "MISS",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return renderMessagePage({
      title: "Unable to load passage",
      message: `${message}. Please check your connection or try again.`,
      theme,
      showRetry: true,
    });
  }
}
