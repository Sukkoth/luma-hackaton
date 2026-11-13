import dns from "node:dns";
import fs from "node:fs/promises";
import path from "node:path";
import { type NextRequest } from "next/server";

// Force IPv4 first to prevent unreachable IPv6 timeouts in Linux environments
dns.setDefaultResultOrder("ipv4first");

type ExtractChapterContentParams = {
  html: string;
};

function extractChapterContent({
  html,
}: ExtractChapterContentParams): string | null {
  // 1. Full chapter pages contain data-testid="chapter-content"
  const startTag = 'data-testid="chapter-content"';
  const startIdx = html.indexOf(startTag);
  if (startIdx !== -1) {
    const divStart = html.lastIndexOf("<div", startIdx);
    if (divStart !== -1) {
      let depth = 0;
      let pos = divStart;
      let endPos = -1;

      while (pos < html.length) {
        const nextOpen = html.indexOf("<div", pos);
        const nextClose = html.indexOf("</div>", pos);

        if (nextClose === -1) break;

        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + 4;
        } else {
          depth--;
          if (depth === 0) {
            endPos = nextClose + 6;
            break;
          }
          pos = nextClose + 6;
        }
      }

      if (endPos !== -1) {
        return html.substring(divStart, endPos);
      }
    }
  }

  // 2. Verse range pages (e.g. /bible/1/MRK.1.10-15.KJV or JHN.3.16.NIV)
  // Verse pages present a concise card with heading and text paragraphs.
  const h2Match = html.match(
    /<h2[^>]*class="[^"]*font-bold[^"]*"[^>]*>([A-Za-z0-9:\-\s]+<!-- -->[\s\S]*?)<\/h2>/i
  );
  const pMatch = html.match(
    /<p[^>]*class="[^"]*(?:text-16|text-20)[^"]*"[^>]*>([\s\S]*?)<\/p>/i
  );

  if (pMatch) {
    const copyrightMatch = html.match(
      /<div[^>]*class="[^"]*(?:version-copyright|copyright)[^"]*"[^>]*>[\s\S]*?<\/div>/i
    );
    const headingHtml = h2Match
      ? `<h2 class="luma-verse-range-title">${h2Match[1].replace(/<!--[\s\S]*?-->/g, "").trim()}</h2>`
      : "";
    const copyrightHtml = copyrightMatch ? copyrightMatch[0] : "";

    return `<div class="luma-verse-range-card">
      ${headingHtml}
      <div class="luma-verse-range-content">
        ${pMatch[0]}
      </div>
      ${copyrightHtml}
    </div>`;
  }

  return null;
}

type ExtractHeadLinksParams = {
  html: string;
};

function extractHeadLinks({ html }: ExtractHeadLinksParams): string {
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch || !headMatch[1]) return "";
  const headContent = headMatch[1];
  const links = headContent.match(/<link[^>]+>/gi) || [];
  return links
    .filter(
      (link) =>
        link.includes('rel="stylesheet"') ||
        link.includes('rel="preload"') ||
        link.includes("typekit")
    )
    .join("\n");
}

type SanitizeHtmlContentParams = {
  html: string;
};

/**
 * Strips executable scripts, embeds, forms, and inline JS event handlers from external markup.
 */
function sanitizeHtmlContent({ html }: SanitizeHtmlContentParams): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, "")
    .replace(/<base\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*http-equiv[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^>\s]+/gi, "")
    .replace(/href\s*=\s*['"](?:javascript|data):[^'"]*['"]/gi, 'href="#"');
}

type BuildCleanReaderDocumentParams = {
  chapterContent: string;
  headLinks: string;
  theme: "light" | "dark";
  fontSize?: number;
};

function buildCleanReaderDocument({
  chapterContent,
  headLinks,
  theme,
  fontSize = 22,
}: BuildCleanReaderDocumentParams): string {
  const isDark = theme === "dark";
  const clampedSize = Math.min(32, Math.max(20, fontSize));
  const safeContent = sanitizeHtmlContent({ html: chapterContent });

  return `<!DOCTYPE html>
<html lang="en" class="${theme}" style="--bible-font-size: ${clampedSize}px;">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https://www.bible.com https://use.typekit.net; img-src 'self' https: data:; font-src 'self' https: data:; style-src 'self' 'unsafe-inline' https:; form-action 'none'; frame-ancestors 'self';" />
  <base href="https://www.bible.com" />
  ${headLinks}
  <style id="luma-native-theme">
    :root {
      --bible-font-size: ${clampedSize}px;
    }

    html, body {
      background-color: var(--luma-bg, ${isDark ? "#050505" : "#f8fafc"}) !important;
      color: var(--luma-text, ${isDark ? "#f1f5f9" : "#1e293b"}) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden !important;
    }

    html.dark {
      --luma-bg: #050505;
      --luma-text: #f1f5f9;
      --luma-title: #ffffff;
      --luma-muted: #71717a;
      --luma-note: #a1a1aa;
      --luma-border: rgba(255, 255, 255, 0.1);
      --luma-link: #94a3b8;
    }

    html.light {
      --luma-bg: #f8fafc;
      --luma-text: #1e293b;
      --luma-title: #0f172a;
      --luma-muted: #64748b;
      --luma-note: #64748b;
      --luma-border: #e2e8f0;
      --luma-link: #475569;
    }

    .luma-reader-wrapper {
      max-width: 680px;
      margin-left: auto;
      margin-right: auto;
      padding: 2rem 1.25rem 6rem 1.25rem;
      box-sizing: border-box;
      width: 100%;
    }

    /* Verses & Paragraphs */
    [class*="chapter"], 
    [class*="passage"], 
    [class*="verse"], 
    [class*="content"],
    [class*="reader"],
    [class*="ChapterContent"],
    [data-usfm] {
      color: var(--luma-text, ${isDark ? "#f1f5f9" : "#1e293b"}) !important;
      background: transparent !important;
      line-height: 1.85 !important;
      font-size: var(--bible-font-size, ${clampedSize}px) !important;
    }

    /* Chapter Titles & Headings */
    h1, h2, h3, h4, 
    [class*="heading"], 
    [class*="section_title"] {
      color: var(--luma-title, ${isDark ? "#ffffff" : "#0f172a"}) !important;
      font-weight: 700 !important;
      letter-spacing: -0.015em !important;
      margin-top: 1.5rem !important;
      margin-bottom: 0.75rem !important;
      line-height: 1.3 !important;
      font-size: calc(var(--bible-font-size, ${clampedSize}px) * 1.35) !important;
    }

    /* Verse Number Badges */
    [class*="label"], 
    [class*="verse_number"], 
    [class*="v-num"] {
      color: var(--luma-muted, ${isDark ? "#71717a" : "#64748b"}) !important;
      font-weight: 600 !important;
      font-size: calc(var(--bible-font-size, ${clampedSize}px) * 0.7) !important;
      margin-right: 0.25rem !important;
      vertical-align: baseline !important;
      user-select: none !important;
    }

    /* Footnotes & Cross references */
    [class*="note"], 
    [class*="footnote"] {
      color: var(--luma-note, ${isDark ? "#a1a1aa" : "#64748b"}) !important;
      font-size: calc(var(--bible-font-size, ${clampedSize}px) * 0.8) !important;
    }

    /* Verse Range Presentation */
    .luma-verse-range-card {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-top: 1rem;
    }

    .luma-verse-range-title {
      font-size: 1.25rem !important;
      font-weight: 700 !important;
      color: var(--luma-title, ${isDark ? "#ffffff" : "#0f172a"}) !important;
      margin-bottom: 0.5rem !important;
    }

    .luma-verse-range-content p {
      font-size: var(--bible-font-size, ${clampedSize}px) !important;
      line-height: 1.85 !important;
      color: var(--luma-text, ${isDark ? "#f1f5f9" : "#1e293b"}) !important;
      margin: 0 !important;
    }

    /* Disable links inside reader from jumping externally */
    a {
      color: inherit !important;
      text-decoration: none !important;
      pointer-events: none !important;
    }

    /* Hide Compare, Share, Sign-in prompts, app icons, buttons & SVGs */
    button,
    svg,
    img,
    [class*="canvas-secondary"] {
      display: none !important;
    }

    /* Version Copyright Footer */
    [class*="version-copyright"],
    [class*="copyright"] {
      margin-top: 3rem !important;
      padding-top: 1.5rem !important;
      border-top: 1px solid var(--luma-border, ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}) !important;
      color: var(--luma-muted, ${isDark ? "#71717a" : "#64748b"}) !important;
      font-size: 0.8rem !important;
      line-height: 1.5 !important;
    }

    [class*="version-copyright"] a {
      color: var(--luma-link, ${isDark ? "#94a3b8" : "#475569"}) !important;
      text-decoration: underline !important;
      pointer-events: none !important;
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
<body class="${theme}">
  <div class="luma-reader-wrapper">
    ${safeContent}
  </div>
</body>
</html>`;
}

type FallbackThemedHtmlParams = {
  html: string;
  theme: "light" | "dark";
  fontSize?: number;
};

function fallbackThemedHtml({
  html,
  theme,
  fontSize = 22,
}: FallbackThemedHtmlParams): string {
  const isDark = theme === "dark";
  const clampedSize = Math.min(32, Math.max(20, fontSize));
  const safeHtml = sanitizeHtmlContent({ html });

  const customStyles = `
    <base href="https://www.bible.com" />
    <style id="luma-webview-fallback">
      :root {
        --bible-font-size: ${clampedSize}px;
      }
      header, footer, nav, aside,
      [class*="Nav"], [class*="Header"], [class*="Footer"],
      [class*="AppBanner"], [class*="Banner"], [class*="Cookie"],
      [data-testid*="header"], [data-testid*="footer"], [data-testid*="navigation"],
      [data-testid*="video"], [data-testid*="partner"],
      #onetrust-consent-sdk, #cookie-banner, .ot-sdk-container,
      [class*="ChapterNavigation_next"], [class*="ChapterNavigation_prev"],
      [class*="ParallelSection"], [class*="VideoSection"],
      [class*="ReaderFooter"], [aria-label="Breadcrumb"],
      [aria-label*="audio"], [class*="AudioPlayer"],
      a[href*="/videos/"], a[href*="/organizations/"], a[href*="skip"],
      button:has(svg) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }

      html, body {
        background-color: ${isDark ? "#050505" : "#f8fafc"} !important;
        color: ${isDark ? "#f1f5f9" : "#1e293b"} !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        margin: 0 !important;
        padding: 1.5rem 1.25rem 5rem 1.25rem !important;
        box-sizing: border-box !important;
        --bible-font-size: ${clampedSize}px;
      }

      main, [role="main"], article, [class*="Reader_container"] {
        max-width: 680px !important;
        margin: 0 auto !important;
        width: 100% !important;
        background: transparent !important;
      }

      [class*="chapter"], [class*="passage"], [class*="verse"], [class*="content"] {
        color: ${isDark ? "#f1f5f9" : "#1e293b"} !important;
        background: transparent !important;
        line-height: 1.85 !important;
        font-size: var(--bible-font-size, ${clampedSize}px) !important;
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
  `;

  if (safeHtml.includes("</head>")) {
    return safeHtml.replace("</head>", `${customStyles}</head>`);
  }
  return `${customStyles}${safeHtml}`;
}

type ExtractedPassageData = {
  chapterContent: string;
  headLinks: string;
};

const DISK_CACHE_DIR = path.join(process.cwd(), ".cache", "bible-passages");

type ReadDiskCacheParams = {
  pathKey: string;
};

async function readDiskCache({
  pathKey,
}: ReadDiskCacheParams): Promise<ExtractedPassageData | null> {
  try {
    const safeName = pathKey.replace(/[^A-Za-z0-9._-]/g, "_") + ".json";
    const filePath = path.join(DISK_CACHE_DIR, safeName);
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as ExtractedPassageData;
    if (parsed && typeof parsed.chapterContent === "string") {
      return parsed;
    }
  } catch {
    // Disk cache miss or read error
  }
  return null;
}

type WriteDiskCacheParams = {
  pathKey: string;
  data: ExtractedPassageData;
};

async function writeDiskCache({
  pathKey,
  data,
}: WriteDiskCacheParams): Promise<void> {
  try {
    await fs.mkdir(DISK_CACHE_DIR, { recursive: true });
    const safeName = pathKey.replace(/[^A-Za-z0-9._-]/g, "_") + ".json";
    const filePath = path.join(DISK_CACHE_DIR, safeName);
    await fs.writeFile(filePath, JSON.stringify(data), "utf-8");
  } catch {
    // Silently ignore disk write error in restricted filesystems
  }
}

type FetchBibleComHtmlWithRetryParams = {
  path: string;
};

async function fetchBibleComHtmlWithRetry({
  path,
}: FetchBibleComHtmlWithRetryParams): Promise<string> {
  const targetUrl = `https://www.bible.com/bible/${path}`;
  const maxAttempts = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const timeoutMs = attempt === 1 ? 12000 : attempt === 2 ? 15000 : 20000;
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!res.ok) {
        throw new Error(`Bible.com returned HTTP ${res.status}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        // Short backoff before retry (300ms, 600ms)
        await new Promise((resolve) => setTimeout(resolve, attempt * 300));
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch passage after retries");
}

// In-memory cache and in-flight deduplication
type CacheEntry = {
  data: ExtractedPassageData;
  timestamp: number;
};

const passageCache = new Map<string, CacheEntry>();
const inFlightFetches = new Map<string, Promise<ExtractedPassageData>>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const STANDARD_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "public, max-age=86400, s-maxage=604800",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
} as const;

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const themeParam = searchParams.get("theme");
  const theme: "light" | "dark" = themeParam === "dark" ? "dark" : "light";
  const fontSizeParam = searchParams.get("fontSize");
  const fontSize = fontSizeParam
    ? Math.min(32, Math.max(20, Number.parseInt(fontSizeParam, 10) || 22))
    : 22;

  if (!path) {
    return new Response("Missing path parameter", { status: 400 });
  }

  // Strict validation to prevent SSRF and path traversal:
  // Must match {versionId}/{USFM_BOOK}.{chapter} or {versionId}/{USFM_BOOK}.{chapter}.{verses}
  // Example: 114/HEB.1 or 3867/GEN.1 or 111/JHN.3.16-17
  const isValidPath = /^[0-9]{1,6}\/[1-3]?[A-Za-z]{2,5}\.[0-9]{1,3}(?:\.[0-9]{1,3}(?:-[0-9]{1,3})?)?$/.test(path);
  if (!isValidPath) {
    return new Response("Invalid Bible reference path format", { status: 400 });
  }

  // 1. In-memory Cache check (< 0.1ms)
  const cached = passageCache.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    const finalHtml = cached.data.chapterContent.includes("<!DOCTYPE html>")
      ? cached.data.chapterContent
      : buildCleanReaderDocument({
          chapterContent: cached.data.chapterContent,
          headLinks: cached.data.headLinks,
          theme,
          fontSize,
        });

    return new Response(finalHtml, {
      status: 200,
      headers: {
        ...STANDARD_HEADERS,
        "X-Cache": "HIT",
      },
    });
  }

  // 2. Persistent Disk Cache check (< 0.5ms)
  const diskCached = await readDiskCache({ pathKey: path });
  if (diskCached) {
    passageCache.set(path, {
      data: diskCached,
      timestamp: Date.now(),
    });

    const finalHtml = diskCached.chapterContent.includes("<!DOCTYPE html>")
      ? diskCached.chapterContent
      : buildCleanReaderDocument({
          chapterContent: diskCached.chapterContent,
          headLinks: diskCached.headLinks,
          theme,
          fontSize,
        });

    return new Response(finalHtml, {
      status: 200,
      headers: {
        ...STANDARD_HEADERS,
        "X-Cache": "DISK-HIT",
      },
    });
  }

  try {
    // 3. In-flight request deduplication to prevent duplicate concurrent network calls to Bible.com
    let fetchPromise = inFlightFetches.get(path);
    if (!fetchPromise) {
      fetchPromise = (async () => {
        const originalHtml = await fetchBibleComHtmlWithRetry({ path });
        const chapterContent = extractChapterContent({ html: originalHtml });
        if (chapterContent) {
          const headLinks = extractHeadLinks({ html: originalHtml });
          const result: ExtractedPassageData = { chapterContent, headLinks };
          void writeDiskCache({ pathKey: path, data: result });
          return result;
        }

        // If extraction tag not found, fall back to styled raw Bible.com page
        return {
          chapterContent: fallbackThemedHtml({
            html: originalHtml,
            theme,
            fontSize,
          }),
          headLinks: "",
        };
      })();
      inFlightFetches.set(path, fetchPromise);
    }

    let extractedData: ExtractedPassageData;
    try {
      extractedData = await fetchPromise;
    } finally {
      inFlightFetches.delete(path);
    }

    // Save extracted raw data to memory cache
    passageCache.set(path, {
      data: extractedData,
      timestamp: Date.now(),
    });

    const finalHtml = extractedData.chapterContent.includes("<!DOCTYPE html>")
      ? extractedData.chapterContent
      : buildCleanReaderDocument({
          chapterContent: extractedData.chapterContent,
          headLinks: extractedData.headLinks,
          theme,
          fontSize,
        });

    return new Response(finalHtml, {
      status: 200,
      headers: {
        ...STANDARD_HEADERS,
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      `<!DOCTYPE html>
      <html lang="en" class="${theme}">
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: ${theme === "dark" ? "#050505" : "#f8fafc"};
            color: ${theme === "dark" ? "#f1f5f9" : "#1e293b"};
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
            padding: 1rem;
            box-sizing: border-box;
          }
          .box {
            max-width: 400px;
          }
          h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
          p { font-size: 0.875rem; color: ${theme === "dark" ? "#a1a1aa" : "#64748b"}; line-height: 1.4; margin: 0.5rem 0; }
          button {
            margin-top: 1rem;
            padding: 0.5rem 1.25rem;
            font-size: 0.875rem;
            font-weight: 600;
            border-radius: 0.75rem;
            border: none;
            background-color: ${theme === "dark" ? "#ffffff" : "#1e293b"};
            color: ${theme === "dark" ? "#050505" : "#ffffff"};
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <div class="box">
          <h3>Unable to load passage</h3>
          <p>${message}</p>
          <p>Please check your connection or tap below to retry.</p>
          <button type="button" onclick="window.location.reload()">Retry Passage</button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
