"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  buildBibleComPath,
  DEFAULT_BIBLE_VERSION_ID,
  isBookSupportedInSixtySixBookVersions,
} from "@/lib/bible-versions";
import { cn } from "@/lib/utils";

export type ParsedBibleReference = {
  bookId: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  bibleHref: string;
};

type CachedVersePayload = {
  reference: string;
  versionLabel: string;
  text: string;
};

const verseCache = new Map<string, CachedVersePayload>();

export function parseBibleHref({
  href,
}: {
  href?: string;
}): ParsedBibleReference | null {
  if (!href) return null;

  let pathname = "";
  let searchParams: URLSearchParams;

  try {
    if (href.startsWith("/")) {
      const parsed = new URL(href, "http://localhost");
      pathname = parsed.pathname;
      searchParams = parsed.searchParams;
    } else if (href.startsWith("http://") || href.startsWith("https://")) {
      const parsed = new URL(href);
      if (
        typeof window !== "undefined" &&
        parsed.origin !== window.location.origin
      ) {
        return null;
      }
      pathname = parsed.pathname;
      searchParams = parsed.searchParams;
    } else {
      return null;
    }
  } catch {
    return null;
  }

  const match = pathname.match(/^\/bible\/([a-z0-9]+)\/(\d+)\/?$/i);
  if (!match) return null;

  const bookId = match[1]?.toLowerCase() ?? "";
  const chapter = Number.parseInt(match[2] ?? "", 10);
  if (!bookId || !Number.isFinite(chapter) || chapter < 1) return null;

  const rawStart =
    searchParams.get("startVerse") ?? searchParams.get("v") ?? "";
  const rawEnd = searchParams.get("endVerse") ?? "";
  const parsedStart = Number.parseInt(rawStart, 10);
  const parsedEnd = Number.parseInt(rawEnd, 10);

  const startVerse =
    Number.isFinite(parsedStart) && parsedStart > 0 ? parsedStart : undefined;
  const endVerse =
    Number.isFinite(parsedEnd) && parsedEnd > 0
      ? Math.max(startVerse ?? parsedEnd, parsedEnd)
      : startVerse;

  const query = new URLSearchParams();
  if (startVerse !== undefined) {
    query.set("startVerse", String(startVerse));
    if (endVerse !== undefined) {
      query.set("endVerse", String(endVerse));
    }
  }
  const queryString = query.toString();
  const bibleHref = `/bible/${bookId}/${chapter}${queryString ? `?${queryString}` : ""}`;

  return {
    bookId,
    chapter,
    ...(startVerse !== undefined ? { startVerse } : {}),
    ...(endVerse !== undefined ? { endVerse } : {}),
    bibleHref,
  };
}

function extractVersePlainText({
  contentHtml,
}: {
  contentHtml: string;
}): string {
  if (typeof DOMParser === "undefined") {
    return contentHtml
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const doc = new DOMParser().parseFromString(contentHtml, "text/html");
  doc
    .querySelectorAll(".note, .x, .rq, .f, .ft, .fr, .xt")
    .forEach((node) => node.remove());
  doc.querySelectorAll(".label, .v").forEach((node) => {
    const labelText = node.textContent?.trim();
    if (labelText) {
      node.textContent = ` ${labelText} `;
    }
  });
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
}

type BibleVerseHoverLinkProps = {
  parsed: ParsedBibleReference;
  children: ReactNode;
  className?: string;
};

type FetchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: CachedVersePayload }
  | { status: "error" };

export function BibleVerseHoverLink({
  parsed,
  children,
  className,
}: BibleVerseHoverLinkProps) {
  const [open, setOpen] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>({ status: "idle" });
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSupported = isBookSupportedInSixtySixBookVersions({
    bookId: parsed.bookId,
  });
  const biblePath = isSupported
    ? buildBibleComPath({
        versionId: DEFAULT_BIBLE_VERSION_ID,
        bookId: parsed.bookId,
        chapter: parsed.chapter,
        startVerse: parsed.startVerse,
        endVerse: parsed.endVerse,
      })
    : "";

  const cachedVerse = biblePath ? verseCache.get(biblePath) : undefined;
  const resolvedState: FetchState = cachedVerse
    ? { status: "success", data: cachedVerse }
    : fetchState;

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 160);
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  useEffect(() => {
    if (!open || !biblePath || verseCache.has(biblePath)) return;

    const controller = new AbortController();

    void (async () => {
      setFetchState({ status: "loading" });
      try {
        const res = await fetch(
          `/api/bible-proxy?path=${encodeURIComponent(biblePath)}&format=json&cv=3`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          if (!controller.signal.aborted) {
            setFetchState({ status: "error" });
          }
          return;
        }
        const json = (await res.json()) as {
          reference?: string;
          versionLabel?: string;
          contentHtml?: string;
        };
        if (!json.contentHtml) {
          if (!controller.signal.aborted) {
            setFetchState({ status: "error" });
          }
          return;
        }
        const payload: CachedVersePayload = {
          reference: json.reference ?? String(children),
          versionLabel: json.versionLabel ?? "NIV",
          text: extractVersePlainText({ contentHtml: json.contentHtml }),
        };
        verseCache.set(biblePath, payload);
        if (!controller.signal.aborted) {
          setFetchState({ status: "success", data: payload });
        }
      } catch {
        if (!controller.signal.aborted) {
          setFetchState({ status: "error" });
        }
      }
    })();

    return () => controller.abort();
  }, [open, biblePath, children]);

  const verseData =
    resolvedState.status === "success" ? resolvedState.data : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <a
          href={parsed.bibleHref}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => {
            clearCloseTimer();
            setOpen(true);
          }}
          onMouseLeave={scheduleClose}
          className={cn(
            "inline-flex items-baseline gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors hover:bg-primary/18 hover:decoration-primary",
            className
          )}
        >
          <span>{children}</span>
        </a>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleClose}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-80 sm:w-96 rounded-2xl border border-border bg-card p-3.5 shadow-lg space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="size-3.5 shrink-0 text-primary" />
            <span className="text-xs font-bold text-foreground truncate">
              {verseData?.reference ?? children}
            </span>
          </div>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            {verseData?.versionLabel ?? "NIV"}
          </span>
        </div>

        <div className="max-h-48 overflow-y-auto luma-thin-scroll pr-1 text-xs sm:text-sm leading-relaxed text-foreground">
          {!isSupported ? (
            <p className="text-muted-foreground">
              Preview unavailable for this book. Open in the Bible reader to
              view.
            </p>
          ) : resolvedState.status === "loading" ||
            resolvedState.status === "idle" ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>Loading verse...</span>
            </div>
          ) : resolvedState.status === "error" ? (
            <p className="text-xs text-muted-foreground">
              Couldn&apos;t load preview right now. Open in the Bible reader
              below.
            </p>
          ) : (
            <p>{verseData?.text}</p>
          )}
        </div>

        <div className="flex items-center justify-end border-t border-border/70 pt-2">
          <a
            href={parsed.bibleHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <span>Open in Bible</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </PopoverContent>
    </Popover>
  );
}
