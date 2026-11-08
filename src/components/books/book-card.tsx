import { Check } from "lucide-react";
import type { BibleBook } from "@/data/bibleData";

type Props = {
  book: BibleBook;
  readCount: number;
  onSelect: (params: { book: BibleBook }) => void;
};

export function BookCard({ book, readCount, onSelect }: Props) {
  const isFullyRead = readCount === book.chapters;
  const progressPercent = Math.round((readCount / book.chapters) * 100);

  return (
    <button
      type="button"
      onClick={() => onSelect({ book })}
      className="ui-card group flex flex-col justify-between p-4 text-left cursor-pointer transition-colors duration-150"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-wider text-foreground-dim uppercase">
            {book.testament === "OT" ? "Old Test." : "New Test."}
          </span>
          {isFullyRead ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
              <Check className="size-3" strokeWidth={2.5} />
            </span>
          ) : readCount > 0 ? (
            <span className="ui-pill text-[10px] px-1.5 py-0.5">
              {progressPercent}%
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 text-[15px] font-medium tracking-tight text-foreground transition-colors group-hover:text-foreground-secondary">
          {book.name}
        </h3>
        <p className="text-[11px] font-normal text-foreground-secondary">
          {book.category}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-foreground-dim">
          <span>
            {readCount} / {book.chapters} ch
          </span>
        </div>

        {/* Micro Progress Track */}
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-subtle">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyRead ? "bg-primary" : "bg-foreground-secondary"
            }`}
          />
        </div>
      </div>
    </button>
  );
}
