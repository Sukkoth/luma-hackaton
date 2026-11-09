import { Check, CheckCircle2 } from "lucide-react";
import type { BibleBook } from "@/data/bibleData";

type Props = {
  book: BibleBook;
  readCount: number;
  onSelect: (params: { book: BibleBook }) => void;
};

export function BookCard({ book, readCount, onSelect }: Props) {
  const isFullyRead = readCount >= book.chapters && book.chapters > 0;
  const progressPercent = isFullyRead
    ? 100
    : book.chapters > 0
      ? Math.min(99, Math.round((readCount / book.chapters) * 100))
      : 0;
  const orderFormatted = book.order < 10 ? `0${book.order}` : `${book.order}`;

  return (
    <button
      type="button"
      onClick={() => onSelect({ book })}
      className="group relative flex flex-col justify-between overflow-hidden rounded-[16px] border border-border bg-surface p-3.5 text-left transition-all duration-150 hover:border-border-strong hover:bg-surface-elevated/60 active:scale-[0.98] cursor-pointer"
    >
      {/* Ambient Liquid Progress Wash */}
      {isFullyRead ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-primary/10 rounded-[16px]"
        />
      ) : progressPercent > 0 ? (
        <div
          aria-hidden="true"
          style={{ width: `${progressPercent}%` }}
          className="pointer-events-none absolute inset-y-0 left-0 bg-primary/8 rounded-l-[16px] transition-all duration-300"
        />
      ) : null}

      {/* Top Row: Canonical Index + Dynamic Progress Indicator */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className={`text-[11px] font-normal tracking-tight ${
            isFullyRead || progressPercent > 0
              ? "text-foreground-secondary"
              : "text-foreground-dim"
          }`}
        >
          {orderFormatted}
        </span>

        {isFullyRead ? (
          <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
            <Check className="size-2.5" strokeWidth={3} />
          </span>
        ) : progressPercent > 0 ? (
          <span className="flex items-center gap-1 rounded-full border border-border-subtle bg-surface-elevated px-1.5 py-0.5 text-[10px] font-medium text-foreground">
            <span className="size-1 rounded-full bg-primary" />
            <span>{progressPercent}%</span>
          </span>
        ) : null}
      </div>

      {/* Main Body: Book Name + Reading Stats */}
      <div className="relative z-10 mt-3">
        <h3 className="text-[14.5px] font-normal tracking-tight text-foreground line-clamp-1">
          {book.name}
        </h3>
        <span className="sr-only">{book.category}</span>
        <div className="mt-0.5">
          {isFullyRead ? (
            <span className="flex items-center gap-1 text-[11.5px] font-normal text-foreground-secondary">
              <CheckCircle2 className="size-3 text-primary" />
              <span>All {book.chapters} done</span>
            </span>
          ) : progressPercent > 0 ? (
            <span className="text-[11.5px] font-normal text-foreground-secondary">
              {readCount} of {book.chapters} read
            </span>
          ) : (
            <span className="text-[11.5px] font-normal text-foreground-dim">
              {book.chapters} chapters
            </span>
          )}
        </div>
      </div>

      {/* Micro Progress Track */}
      <div className="relative z-10 mt-3 h-1 w-full overflow-hidden rounded-full bg-surface-elevated">
        <div
          style={{ width: `${progressPercent}%` }}
          className={`h-full rounded-full transition-all duration-300 ${
            isFullyRead ? "bg-primary" : "bg-primary/70"
          }`}
        />
      </div>
    </button>
  );
}
