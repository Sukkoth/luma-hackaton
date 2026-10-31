import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export type CanonInfo = {
  id: string;
  name: string;
  totalBooks: number;
  otCount: number;
  ntCount: number;
  tradition: string;
  uniqueHighlights: string[];
};

export const CANONS: ReadonlyArray<CanonInfo> = [
  {
    id: "protestant",
    name: "Protestant Canon",
    totalBooks: 66,
    otCount: 39,
    ntCount: 27,
    tradition: "Historical Standard",
    uniqueHighlights: [
      "Genesis through Malachi (39 OT)",
      "Matthew through Revelation (27 NT)",
      "Standard reading plans and devotional pacing",
    ],
  },
  {
    id: "catholic",
    name: "Catholic Canon",
    totalBooks: 73,
    otCount: 46,
    ntCount: 27,
    tradition: "Deuterocanonical",
    uniqueHighlights: [
      "Includes Tobit, Judith, 1 & 2 Maccabees",
      "Wisdom of Solomon, Sirach, and Baruch",
      "Greek additions to Esther and Daniel",
    ],
  },
  {
    id: "orthodox",
    name: "Eastern Orthodox",
    totalBooks: 78,
    otCount: 51,
    ntCount: 27,
    tradition: "Septuagintal",
    uniqueHighlights: [
      "Includes 1 Esdras, Prayer of Manasseh",
      "Psalm 151, 3 Maccabees, 4 Maccabees",
      "Full Septuagint Old Testament ordering",
    ],
  },
  {
    id: "ethiopian",
    name: "Ethiopian Orthodox",
    totalBooks: 81,
    otCount: 54,
    ntCount: 27,
    tradition: "Broadest Biblical Canon",
    uniqueHighlights: [
      "Includes Book of Enoch (Henok) and Jubilees",
      "1, 2, and 3 Meqabyan (Ethiopian Maccabees)",
      "Historical Ge'ez biblical literature heritage",
    ],
  },
];

type Props = {
  selectedCanonId: string;
  onSelectCanon: (params: { canonId: string }) => void;
};

export function CanonShowcaseSection({
  selectedCanonId,
  onSelectCanon,
}: Props) {
  const selectedCanon =
    CANONS.find((c) => c.id === selectedCanonId) || CANONS[0]!;

  return (
    <section className="mt-8 rounded-3xl border border-black/8 bg-white/60 p-6 shadow-xs backdrop-blur-md sm:p-10 dark:border-white/10 dark:bg-white/2">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <span className="text-[11px] font-medium tracking-[0.16em] text-[#82ADD4] uppercase">
            UNIVERSAL CHRISTIAN TRADITIONS
          </span>
          <h2 className="mt-1 text-[26px] font-normal tracking-tight text-black sm:text-[30px] dark:text-white">
            First-Class Multi-Canon Respect
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-[#666666] dark:text-[#9CA3AF]">
            Select your tradition to experience accurate chapter counts,
            historic books, and custom reading curricula without compromise.
          </p>
        </div>

        {/* Canon Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-black/6 bg-white/80 p-1.5 dark:border-white/10 dark:bg-white/5">
          {CANONS.map((canon) => {
            const isSelected = canon.id === selectedCanonId;
            return (
              <button
                key={canon.id}
                type="button"
                onClick={() => onSelectCanon({ canonId: canon.id })}
                className={`rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition-all ${
                  isSelected
                    ? "bg-black text-white shadow-xs dark:bg-[#DDFD2C] dark:text-black"
                    : "text-[#666666] hover:text-black dark:text-[#9CA3AF] dark:hover:text-white"
                }`}
              >
                {canon.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Canon Detailed Showcase Card */}
      <div className="mt-6 grid grid-cols-1 gap-6 rounded-[20px] border border-black/6 bg-white/80 p-6 sm:grid-cols-3 dark:border-white/10 dark:bg-white/3">
        <div className="sm:col-span-1">
          <span className="rounded-md bg-[#82ADD4]/15 px-2 py-0.5 text-[11px] font-medium text-[#497aa1] dark:bg-[#82ADD4]/20 dark:text-[#99bfdf]">
            {selectedCanon.tradition}
          </span>
          <h3 className="mt-2 text-[22px] font-medium text-black dark:text-white">
            {selectedCanon.name}
          </h3>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-[38px] font-light text-black dark:text-white">
              {selectedCanon.totalBooks}
            </span>
            <span className="text-[13px] text-[#777777] dark:text-[#9CA3AF]">
              Total Books
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-[12px] text-[#666666] dark:text-[#9CA3AF]">
            <span>{selectedCanon.otCount} Old Testament</span>
            <span>•</span>
            <span>{selectedCanon.ntCount} New Testament</span>
          </div>
        </div>

        <div className="border-t border-black/6 pt-4 sm:col-span-2 sm:border-t-0 sm:border-l sm:pl-6 dark:border-white/8">
          <h4 className="text-[12px] font-medium tracking-wide text-black uppercase dark:text-white">
            Tradition Distinctives & Included Texts:
          </h4>
          <ul className="mt-3 space-y-2.5">
            {selectedCanon.uniqueHighlights.map((highlight) => (
              <li
                key={highlight}
                className="flex items-start gap-2.5 text-[13px] text-[#555555] dark:text-[#A1A1AA]"
              >
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#82ADD4]" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-black px-4 py-2 text-[12px] font-medium text-white shadow-2xs hover:bg-black/85 dark:bg-[#DDFD2C] dark:text-black dark:hover:bg-[#d4f329]"
            >
              <span>Track This Canon</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-white px-4 py-2 text-[12px] font-medium text-black shadow-2xs hover:border-black/16 dark:border-white/10 dark:bg-white/5 dark:text-white"
            >
              <span>View Books Grid</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
