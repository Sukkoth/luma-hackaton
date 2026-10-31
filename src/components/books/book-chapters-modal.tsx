import { X, CheckCircle2 } from "lucide-react";
import type { BibleBook } from "@/data/bibleData";

type Props = {
  book: BibleBook;
  readChapters: ReadonlyArray<number>;
  onClose: () => void;
  onToggleChapter: (params: { bookId: string; chapter: number }) => void;
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-dialog-title"
      className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm duration-200"
    >
      <div className="glass-panel relative flex max-h-[85vh] w-full max-w-[580px] flex-col rounded-[30px] border border-white/90 bg-white/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-7 dark:border-white/10 dark:bg-[#121215]/95">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-black/[0.06] pb-4 dark:border-white/[0.08]">
          <div>
            <span className="text-[11px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
              {book.testament === "OT" ? "Old Testament" : "New Testament"} •{" "}
              {book.category}
            </span>
            <h3
              id="chapter-dialog-title"
              className="mt-0.5 text-[24px] font-normal tracking-tight text-black dark:text-white"
            >
              {book.name}
            </h3>
            <p className="text-[13px] text-[#666666] dark:text-[#9CA3AF]">
              {readCount} of {book.chapters} chapters read
            </p>
          </div>

          <button
            type="button"
            aria-label="Close chapter sheet"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-black/5 text-[#555555] transition-colors hover:bg-black/10 hover:text-black dark:bg-white/10 dark:text-[#9CA3AF] dark:hover:bg-white/20 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center justify-between py-3">
          <span className="text-[12px] font-normal text-[#777777] dark:text-[#9CA3AF]">
            Tap chapters to toggle
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onMarkAll({ book })}
              className="flex items-center gap-1.5 rounded-[12px] border border-white/90 bg-white px-3.5 py-1.5 text-[12px] font-medium text-black shadow-xs transition-all hover:bg-black hover:text-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white dark:hover:text-black"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark All Read</span>
            </button>
            <button
              type="button"
              onClick={() => onClearAll({ bookId: book.id })}
              className="rounded-[12px] border border-white/60 bg-white/40 px-3.5 py-1.5 text-[12px] font-normal text-[#555555] backdrop-blur-md transition-all hover:border-white/80 hover:bg-white hover:text-black dark:border-white/5 dark:bg-white/5 dark:text-[#9CA3AF] dark:hover:bg-white/10 dark:hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Scrollable Chapter Grid */}
        <div className="my-2 max-h-[46vh] overflow-y-auto pr-1">
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
                        chapter: ch,
                      })
                    }
                    className={`flex h-10 items-center justify-center rounded-[11px] text-[13px] transition-all ${
                      isRead
                        ? "bg-[#82ADD4] font-medium text-white shadow-xs hover:bg-[#6894BC]"
                        : "border border-black/[0.06] bg-white/60 font-normal text-black hover:border-black/20 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.1]"
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
        <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] pt-4 dark:border-white/[0.08]">
          <span className="text-[12px] text-[#777777] dark:text-[#9CA3AF]">
            Progress:{" "}
            <strong className="font-medium text-black dark:text-white">
              {progressPercent}%
            </strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[12px] bg-black px-5 py-2 text-[13px] font-medium text-white shadow-xs transition-colors hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/85"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
