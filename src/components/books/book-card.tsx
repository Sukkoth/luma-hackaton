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
      className="group relative isolate flex flex-col justify-between rounded-[18px] border border-black/8 bg-white/75 p-4 text-left shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] transition-colors duration-150 hover:border-black/18 hover:bg-white hover:shadow-md dark:border-white/8 dark:bg-white/4 dark:shadow-none dark:hover:border-white/18 dark:hover:bg-white/8"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium tracking-wider text-[#888888] uppercase dark:text-[#9CA3AF]">
            {book.testament === "OT" ? "Old Test." : "New Test."}
          </span>
          {isFullyRead ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-[#DDFD2C] text-black shadow-2xs">
              <Check className="size-3" strokeWidth={2.5} />
            </span>
          ) : readCount > 0 ? (
            <span className="rounded-sm bg-[#82ADD4]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#507ea6] dark:bg-[#82ADD4]/25 dark:text-[#82ADD4]">
              {progressPercent}%
            </span>
          ) : null}
        </div>

        <h3 className="mt-2 text-[15px] font-medium tracking-tight text-black group-hover:text-[#6894BC] dark:text-white dark:group-hover:text-[#82ADD4]">
          {book.name}
        </h3>
        <p className="text-[11px] font-normal text-[#777777] dark:text-[#9CA3AF]">
          {book.category}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-[#777777] dark:text-[#9CA3AF]">
          <span>
            {readCount} / {book.chapters} ch
          </span>
        </div>

        {/* Micro Progress Track */}
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/8">
          <div
            style={{ width: `${progressPercent}%` }}
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyRead
                ? "bg-[#DDFD2C]"
                : "bg-linear-to-r from-[#82ADD4] to-[#6894BC]"
            }`}
          />
        </div>
      </div>
    </button>
  );
}
