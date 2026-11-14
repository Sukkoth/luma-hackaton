import dns from "node:dns";
import fs from "node:fs/promises";
import nodePath from "node:path";
import crypto from "node:crypto";
import { type NextRequest } from "next/server";
import sanitizeHtml from "sanitize-html";

// Force IPv4 first to prevent unreachable IPv6 timeouts in Linux environments
dns.setDefaultResultOrder("ipv4first");

// Content version for cache invalidation — bump when extractor logic changes
const CONTENT_VERSION = "v4";

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
  // Use sanitize-html to parse and extract only the passage content,
  // filtering out ads, images, navigation, and other junk.
  const sanitized = sanitizeHtml(html, {
    allowedTags: [
      "h1",
      "h2",
      "h3",
      "h4",
      "p",
      "span",
      "a",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "sup",
      "div",
    ],
    allowedAttributes: {
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
      p: ["class"],
      span: ["class", "data-usfm"],
      a: ["href"],
      div: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { a: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) => {
      // Aggressively filter out ads, images, navigation, promo content
      const tag = frame.tag;
      const className = frame.attribs?.class || "";
      const id = frame.attribs?.id || "";
      const role = frame.attribs?.role || "";
      const style = frame.attribs?.style || "";
      const src = frame.attribs?.src || "";
      const dataSrc = frame.attribs?.["data-src"] || "";
      const backgroundImage = frame.attribs?.["background-image"] || "";

      // Also check for background-image in style attribute
      const hasBackgroundImage = style.includes("background-image") || backgroundImage !== "";

      return (
        tag === "img" ||
        tag === "picture" ||
        tag === "source" ||
        tag === "svg" ||
        tag === "canvas" ||
        tag === "video" ||
        tag === "audio" ||
        tag === "iframe" ||
        tag === "script" ||
        tag === "style" ||
        tag === "nav" ||
        tag === "header" ||
        tag === "footer" ||
        tag === "aside" ||
        tag === "button" ||
        tag === "form" ||
        hasBackgroundImage ||
        src.includes("ad") ||
        dataSrc.includes("ad") ||
        className.includes("Ad") ||
        className.includes("ad-") ||
        className.includes("Banner") ||
        className.includes("banner") ||
        className.includes("Promo") ||
        className.includes("promo") ||
        className.includes("Sponsor") ||
        className.includes("sponsor") ||
        className.includes("Cookie") ||
        className.includes("cookie") ||
        className.includes("Modal") ||
        className.includes("modal") ||
        className.includes("Popup") ||
        className.includes("popup") ||
        className.includes("Overlay") ||
        className.includes("overlay") ||
        className.includes("Fullscreen") ||
        className.includes("fullscreen") ||
        className.includes("ImageGallery") ||
        className.includes("image-gallery") ||
        className.includes("Carousel") ||
        className.includes("carousel") ||
        className.includes("Slider") ||
        className.includes("slider") ||
        className.includes("Nav") ||
        className.includes("Header") ||
        className.includes("Footer") ||
        className.includes("AppBanner") ||
        className.includes("Video") ||
        className.includes("Audio") ||
        className.includes("Partner") ||
        className.includes("CTA") ||
        className.includes("cta") ||
        className.includes("Interstitial") ||
        className.includes("interstitial") ||
        className.includes("Section") ||
        className.includes("section") ||
        className.includes("Heading") ||
        className.includes("heading") ||
        className.includes("ChapterTitle") ||
        className.includes("chapter-title") ||
        className.includes("PassageHeader") ||
        className.includes("passage-header") ||
        id.includes("ad") ||
        id.includes("banner") ||
        id.includes("cookie") ||
        id.includes("onetrust") ||
        id.includes("modal") ||
        id.includes("popup") ||
        role === "banner" ||
        role === "navigation" ||
        role === "contentinfo" ||
        role === "dialog" ||
        role === "alertdialog" ||
        style.includes("display: none") ||
        style.includes("visibility: hidden") ||
        style.includes("opacity: 0")
      );
    },
  });

  // After sanitization, look for the verse range structure:
  // heading (h2 with font-bold) + paragraph(s) with text-16/text-20
  const h2Match = sanitized.match(
    /<h2[^>]*class="[^"]*font-bold[^"]*"[^>]*>([\s\S]*?)<\/h2>/i
  );
  // Match ALL paragraphs with text-16 or text-20 (not just first)
  const rawPMatches = sanitized.match(
    /<p[^>]*class="[^"]*(?:text-16|text-20)[^"]*"[^>]*>([\s\S]*?)<\/p>/gi
  );
  // Filter out any "Compare All Versions" or promo helper paragraphs
  const pMatches = rawPMatches?.filter(
    (p) =>
      !p.includes("Compare") &&
      !p.includes("compare") &&
      !p.includes("Save verses")
  );
  const copyrightMatch = sanitized.match(
    /<div[^>]*class="[^"]*(?:version-copyright|copyright)[^"]*"[^>]*>[\s\S]*?<\/div>/i
  );

  if (pMatches && pMatches.length > 0) {
    const headingHtml = h2Match
      ? `<h2 class="luma-verse-range-title">${h2Match[1].replace(/<!--[\s\S]*?-->/g, "").trim()}</h2>`
      : "";
    const copyrightHtml = copyrightMatch ? copyrightMatch[0] : "";

    // Join all matching paragraphs (verse content may span multiple <p>)
    const versesHtml = pMatches.join("");

    const cardHtml = `<div class="luma-verse-range-card">
      ${headingHtml}
      <div class="luma-verse-range-content">
        ${versesHtml}
      </div>
      ${copyrightHtml}
    </div>`;

    // Heuristic: if the extracted card is too large (>15KB), it likely contains
    // junk that slipped through (common for verse-1 starts with chapter headings).
    // Fall back to plain-text extraction which is more aggressive.
    if (cardHtml.length > 15000) {
      return null; // triggers fallback to extractPlainTextContent
    }

    return cardHtml;
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

/**
 * Extracts only text content from a page — used when structured extraction fails.
 * Returns sanitized plain text + inline links, no layout/navigation markup.
 */
function extractPlainTextContent({ html }: { html: string }): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "span", "a", "br", "strong", "em", "b", "i", "sup", "h1", "h2", "h3", "h4"],
    allowedAttributes: {
      a: ["href"],
      span: ["data-usfm"],
      p: ["class"],
      h1: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { a: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) => {
      // Drop nav, header, footer, script containers, ads, etc.
      const tag = frame.tag;
      const className = frame.attribs?.class || "";
      const id = frame.attribs?.id || "";
      const role = frame.attribs?.role || "";
      return (
        tag === "nav" ||
        tag === "header" ||
        tag === "footer" ||
        tag === "aside" ||
        tag === "script" ||
        tag === "style" ||
        tag === "button" ||
        className.includes("Nav") ||
        className.includes("Header") ||
        className.includes("Footer") ||
        className.includes("Banner") ||
        className.includes("Cookie") ||
        className.includes("Video") ||
        className.includes("Audio") ||
        className.includes("Partner") ||
        id.includes("cookie") ||
        id.includes("onetrust") ||
        role === "banner" ||
        role === "navigation" ||
        role === "contentinfo"
      );
    },
  });
}

/**
 * Sanitizes HTML for safe embedding in the reader iframe.
 * Uses sanitize-html (proper parser) instead of regex.
 */
function sanitizeHtmlContent({ html }: { html: string }): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "div",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "span",
      "a",
      "em",
      "strong",
      "br",
      "sup",
      "ul",
      "ol",
      "li",
      "b",
      "i",
      "blockquote",
      "hr",
    ],
    allowedAttributes: {
      a: ["href"],
      span: ["data-usfm", "class"],
      div: ["class"],
      p: ["class"],
      h2: ["class"],
      h3: ["class"],
      h4: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { a: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) => {
      const tag = frame.tag;
      const style = frame.attribs?.style || "";
      const className = frame.attribs?.class || "";
      // Match ad/banner as whole words or with common separators (-, _, space)
      // to avoid false positives like "card", "heading", "sidebar", "luma-verse-range-card"
      const adRegex = /\b(ad|banner)\b/i;
      const hasAdClass = adRegex.test(className);
      return (
        tag === "img" ||
        tag === "picture" ||
        tag === "source" ||
        tag === "svg" ||
        tag === "canvas" ||
        tag === "video" ||
        tag === "audio" ||
        tag === "iframe" ||
        style.includes("background-image") ||
        hasAdClass
      );
    },
  });
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

type ExtractedPassageData = {
  chapterContent: string;
  headLinks: string;
};

type FinalizeResponseParams = {
  data: ExtractedPassageData;
  theme: "light" | "dark";
  fontSize: number;
};

/**
 * Single point of truth for building the final HTML response.
 * Handles both extracted fragments (run through buildCleanReaderDocument)
 * and already-complete documents (fallback plain-text shell).
 */
function finalizeResponse({
  data,
  theme,
  fontSize,
}: FinalizeResponseParams): string {
  return data.chapterContent.includes("<!DOCTYPE html>")
    ? data.chapterContent
    : buildCleanReaderDocument({
        chapterContent: data.chapterContent,
        headLinks: data.headLinks,
        theme,
        fontSize,
      });
}

const DISK_CACHE_DIR = nodePath.join(process.cwd(), ".cache", "bible-passages");

type ReadDiskCacheParams = {
  pathKey: string;
};

async function readDiskCache({
  pathKey,
}: ReadDiskCacheParams): Promise<ExtractedPassageData | null> {
  try {
    const safeName = `${CONTENT_VERSION}-${pathKey.replace(/[^A-Za-z0-9._-]/g, "_")}.json`;
    const filePath = nodePath.join(DISK_CACHE_DIR, safeName);
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
    const safeName = `${CONTENT_VERSION}-${pathKey.replace(/[^A-Za-z0-9._-]/g, "_")}.json`;
    const filePath = nodePath.join(DISK_CACHE_DIR, safeName);
    await fs.writeFile(filePath, JSON.stringify(data), "utf-8");
  } catch {
    // Silently ignore disk write error in restricted filesystems
  }
}

function getCacheKey(path: string): string {
  return `${CONTENT_VERSION}:${path}`;
}

function getETag(path: string): string {
  // Simple content-versioned ETag — stable across deploys unless CONTENT_VERSION changes
  return `"${CONTENT_VERSION}-${crypto.createHash("md5").update(path).digest("hex").slice(0, 12)}"`;
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
const MEMORY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes — short for correctness
const DISK_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const STANDARD_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-cache, must-revalidate",
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

  // ETag support for conditional requests
  const etag = getETag(path);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ...STANDARD_HEADERS,
        ETag: etag,
        "X-Cache": "REVALIDATED",
      },
    });
  }

  // 1. In-memory Cache check (< 0.1ms)
  const cacheKey = getCacheKey(path);
  const cached = passageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < MEMORY_CACHE_TTL_MS) {
    const finalHtml = finalizeResponse({
      data: cached.data,
      theme,
      fontSize,
    });

    return new Response(finalHtml, {
      status: 200,
      headers: {
        ...STANDARD_HEADERS,
        ETag: etag,
        "X-Cache": "HIT",
      },
    });
  }

  // 2. Persistent Disk Cache check (< 0.5ms)
  const diskCached = await readDiskCache({ pathKey: path });
  if (diskCached) {
    // Check disk cache age
    try {
      const safeName = `${CONTENT_VERSION}-${path.replace(/[^A-Za-z0-9._-]/g, "_")}.json`;
      const filePath = nodePath.join(DISK_CACHE_DIR, safeName);
      const stat = await fs.stat(filePath);
      if (Date.now() - stat.mtimeMs < DISK_CACHE_TTL_MS) {
        passageCache.set(cacheKey, {
          data: diskCached,
          timestamp: Date.now(),
        });

        const finalHtml = finalizeResponse({
          data: diskCached,
          theme,
          fontSize,
        });

        return new Response(finalHtml, {
          status: 200,
          headers: {
            ...STANDARD_HEADERS,
            ETag: etag,
            "X-Cache": "DISK-HIT",
          },
        });
      }
    } catch {
      // Stat failed, treat as miss
    }
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

        // If extraction tag not found, fall back to clean plain-text extraction
        const plainText = extractPlainTextContent({ html: originalHtml });
        return {
          chapterContent: plainText,
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
    passageCache.set(cacheKey, {
      data: extractedData,
      timestamp: Date.now(),
    });

    const finalHtml = finalizeResponse({
      data: extractedData,
      theme,
      fontSize,
    });

    return new Response(finalHtml, {
      status: 200,
      headers: {
        ...STANDARD_HEADERS,
        ETag: etag,
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