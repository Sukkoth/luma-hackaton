import { X, CheckCircle2, RotateCcw } from "lucide-react";
import type { BibleBook } from "@/data/bibleData";

type Props = {
  book: BibleBook;
  readChapters: ReadonlyArray<number>;
  onClose: () => void;
  onToggleChapter: (params: {
    bookId: string;
    bookName: string;
    chapter: number;
  }) => void;
  onMarkAll: (params: { book: BibleBook }) => void;
  onClearAll: (params: { bookId: string }) => void;
};

export function BookChaptersModal({
  book,
  readChapters,
  onClose,
  onToggleChapter,
  onMarkAll,
  onClearAll,
}: Props) {
  const readCount = readChapters.length;
  const progressPercent = Math.round((readCount / book.chapters) * 100);
  const isAllComplete = readCount >= book.chapters && book.chapters > 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm transition-opacity duration-200"
    >
      <div className="ui-card relative flex max-h-[85vh] w-full max-w-145 flex-col p-6 shadow-2xl sm:p-7">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="ui-pill-primary text-[10px] font-medium uppercase">
                {book.category}
              </span>
              <span className="ui-pill text-[10px] font-medium uppercase">
                {book.testament === "OT" ? "Old Testament" : "New Testament"}
              </span>
            </div>
            <h3
              id="chapter-dialog-title"
              className="mt-2 text-[24px] font-medium tracking-tight text-foreground"
            >
              {book.name}
            </h3>
            <p className="mt-0.5 text-[13px] font-medium text-foreground-secondary">
              {readCount} of {book.chapters} chapters read ({progressPercent}%)
            </p>
          </div>

          <button
            type="button"
            aria-label="Close chapter sheet"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-surface-elevated text-foreground-secondary transition-colors hover:text-foreground cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between py-3 border-b border-border-subtle">
          <span className="text-[12px] font-medium text-foreground-dim">
            Tap chapter to toggle
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMarkAll({ book })}
              className="ui-btn-primary ui-btn-sm gap-1.5"
            >
              <CheckCircle2 className="size-3.5" />
              <span>{isAllComplete ? "All Marked Read" : "Mark All Read"}</span>
            </button>
            {readCount > 0 && (
              <button
                type="button"
                onClick={() => onClearAll({ bookId: book.id })}
                className="ui-btn-secondary ui-btn-sm gap-1 text-destructive hover:border-destructive/30"
              >
                <RotateCcw className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Chapter Grid */}
        <div className="my-3 max-h-[46vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map(
              (ch) => {
                const isRead = readChapters.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    aria-pressed={isRead}
                    onClick={() =>
                      onToggleChapter({
                        bookId: book.id,
                        bookName: book.name,
                        chapter: ch,
                      })
                    }
                    className={`flex h-11 items-center justify-center rounded-[12px] text-[14px] transition-all cursor-pointer ${
                      isRead
                        ? "bg-primary border border-primary font-semibold text-primary-foreground shadow-xs"
                        : "border border-border bg-surface-elevated font-medium text-foreground-secondary hover:border-border-strong hover:text-foreground"
                    }`}
                  >
                    {ch}
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-2 pt-3 border-t border-border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="ui-btn-primary w-full h-12 rounded-[14px] text-[15px] font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
