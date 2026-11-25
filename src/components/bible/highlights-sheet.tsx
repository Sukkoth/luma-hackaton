"use client";

import { useEffect, useMemo, useState } from "react";
import { Highlighter, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteHighlightAction,
  getAllUserHighlightsAction,
  type BibleHighlightDetail,
} from "@/actions/highlights";
import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";
import { BIBLE_VERSIONS } from "@/lib/bible-versions";
import {
  HIGHLIGHT_COLORS,
  type HighlightColor,
} from "@/lib/schemas/highlights";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const COLOR_DOT_CLASSES: Record<HighlightColor, string> = {
  amber: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

const COLOR_BAR_CLASSES: Record<HighlightColor, string> = {
  amber: "bg-amber-400",
  green: "bg-emerald-400",
  blue: "bg-sky-400",
  rose: "bg-rose-400",
  purple: "bg-purple-400",
};

const COLOR_LABELS: Record<HighlightColor, string> = {
  amber: "Amber",
  green: "Green",
  blue: "Blue",
  rose: "Rose",
  purple: "Purple",
};

function formatHighlightReference({
  highlight,
}: {
  highlight: BibleHighlightDetail;
}): { title: string; versionAbbr: string } {
  const book = PROTESTANT_BIBLE_BOOKS.find(
    (b) => b.id === highlight.bookId.toLowerCase()
  );
  const bookName = book?.name ?? highlight.bookId.toUpperCase();
  const versePart =
    highlight.startVerse === highlight.endVerse
      ? `${highlight.startVerse}`
      : `${highlight.startVerse}–${highlight.endVerse}`;
  const version = BIBLE_VERSIONS.find((v) => v.id === highlight.versionId);

  return {
    title: `${bookName} ${highlight.chapter}:${versePart}`,
    versionAbbr: version?.abbreviation ?? String(highlight.versionId),
  };
}

export type HighlightsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBookId: string;
  currentBookName: string;
  onNavigateToHighlight: (params: {
    bookId: string;
    chapter: number;
    versionId: number;
  }) => void;
  onHighlightDeleted: (params: { highlightId: string }) => void;
};

export function HighlightsSheet({
  open,
  onOpenChange,
  currentBookId,
  currentBookName,
  onNavigateToHighlight,
  onHighlightDeleted,
}: HighlightsSheetProps) {
  const [items, setItems] = useState<BibleHighlightDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "book">("all");
  const [colorFilter, setColorFilter] = useState<HighlightColor | "all">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let isCancelled = false;

    async function fetchAll() {
      setIsLoading(true);
      setIsUnauthorized(false);
      const result = await getAllUserHighlightsAction();
      if (isCancelled) return;
      setIsLoading(false);

      if (!result.success) {
        if (result.error === "Unauthorized") {
          setIsUnauthorized(true);
        } else {
          toast.error(result.error);
        }
        setItems([]);
        return;
      }
      setItems(result.highlights);
    }

    void fetchAll();
    return () => {
      isCancelled = true;
    };
  }, [open]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const normalizedCurrentBook = currentBookId.toLowerCase();
    return items.filter((item) => {
      if (
        scopeFilter === "book" &&
        item.bookId.toLowerCase() !== normalizedCurrentBook
      ) {
        return false;
      }
      if (colorFilter !== "all" && item.color !== colorFilter) {
        return false;
      }
      if (!query) return true;
      const { title } = formatHighlightReference({ highlight: item });
      return (
        title.toLowerCase().includes(query) ||
        item.selectedText.toLowerCase().includes(query)
      );
    });
  }, [items, scopeFilter, currentBookId, colorFilter, searchQuery]);

  async function handleDelete({ highlightId }: { highlightId: string }) {
    setDeletingId(highlightId);
    try {
      const result = await deleteHighlightAction({ highlightId });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== highlightId));
      onHighlightDeleted({ highlightId });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background"
      >
        <SheetHeader className="px-5 py-4 border-b border-border/70 space-y-3">
          <div className="flex items-center justify-between pr-6">
            <SheetTitle className="flex items-center gap-2 text-base font-bold">
              <Highlighter className="size-4 text-primary" />
              <span>Highlights</span>
              {items.length > 0 ? (
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground-dim">
                  {items.length}
                </span>
              ) : null}
            </SheetTitle>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setScopeFilter("all")}
              className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                scopeFilter === "all"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-foreground-dim hover:text-foreground"
              }`}
            >
              All Books
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("book")}
              className={`truncate rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                scopeFilter === "book"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-foreground-dim hover:text-foreground"
              }`}
            >
              This Book ({currentBookName})
            </button>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-foreground-dim" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search verse or text..."
              aria-label="Search highlights"
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setColorFilter("all")}
              className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                colorFilter === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground-dim hover:text-foreground"
              }`}
            >
              All
            </button>
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setColorFilter(color)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  colorFilter === color
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-card text-foreground-dim hover:text-foreground"
                }`}
              >
                <span
                  className={`size-2.5 rounded-full ${COLOR_DOT_CLASSES[color]}`}
                />
                <span>{COLOR_LABELS[color]}</span>
              </button>
            ))}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center text-foreground-dim">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : isUnauthorized ? (
            <div className="rounded-xl border border-border bg-card p-5 text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">
                Sign in to view your highlights
              </p>
              <p className="text-xs text-foreground-dim">
                Your saved scripture highlights sync across devices once you are
                signed in.
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-6 text-center space-y-1.5">
              <Highlighter className="mx-auto size-6 text-foreground-dim/70" />
              <p className="text-sm font-medium text-foreground">
                {items.length === 0
                  ? "No highlights yet"
                  : "No matching highlights"}
              </p>
              <p className="text-xs text-foreground-dim">
                {items.length === 0
                  ? "Tap any verse or select text while reading to highlight it."
                  : "Try clearing your search or color filter."}
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const { title, versionAbbr } = formatHighlightReference({
                highlight: item,
              });
              return (
                <div
                  key={item.id}
                  className="group relative rounded-r-xl rounded-l-none border border-border bg-card py-3.5 pr-3.5 pl-4 transition-colors hover:bg-muted/40"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-y-0 left-0 w-[2px] ${COLOR_BAR_CLASSES[item.color]}`}
                  />
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onNavigateToHighlight({
                          bookId: item.bookId,
                          chapter: item.chapter,
                          versionId: item.versionId,
                        });
                        onOpenChange(false);
                      }}
                      className="flex-1 text-left focus:outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          {title}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground-dim">
                          {versionAbbr}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-foreground/90">
                        “{item.selectedText}”
                      </p>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === item.id}
                      aria-label={`Delete highlight ${title}`}
                      onClick={() => handleDelete({ highlightId: item.id })}
                      className="shrink-0 rounded-lg p-1.5 text-foreground-dim transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
