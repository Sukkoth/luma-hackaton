import type {
  BibleCanon,
  BibleCanonConfig,
  BibleBook,
  BibleCategory,
} from "./canons/types";

export * from "./canons/types";

export const BIBLE_CANONS_CONFIG: Record<BibleCanon, BibleCanonConfig> = {
  protestant: {
    id: "protestant",
    name: "Protestant / Standard",
    shortName: "Standard 66",
    badge: "66 Books",
    description: "Standard 66-book canon (39 Old Testament + 27 New Testament)",
    totalBooks: 66,
    totalChapters: 1189,
    otBooks: 39,
    ntBooks: 27,
  },
  catholic: {
    id: "catholic",
    name: "Catholic",
    shortName: "Catholic 73",
    badge: "73 Books",
    description:
      "Includes 7 Deuterocanonical books (Tobit, Judith, Wisdom, Sirach, Baruch, 1-2 Maccabees)",
    totalBooks: 73,
    totalChapters: 1334,
    otBooks: 46,
    ntBooks: 27,
  },
  eastern_orthodox: {
    id: "eastern_orthodox",
    name: "Eastern Orthodox",
    shortName: "Orthodox 78",
    badge: "78 Books",
    description:
      "Includes Greek Ezra, 3-4 Maccabees, Prayer of Manasseh, Psalm 151, and Deuterocanon",
    totalBooks: 78,
    totalChapters: 1370,
    otBooks: 51,
    ntBooks: 27,
  },
  ethiopian_orthodox: {
    id: "ethiopian_orthodox",
    name: "Ethiopian Orthodox Tewahedo",
    shortName: "Ethiopian 81",
    badge: "81 Books",
    description:
      "Complete 81-book canon including Enoch, Jubilees, 1-3 Meqabyan, and Sinodos",
    totalBooks: 81,
    totalChapters: 1927,
    otBooks: 54,
    ntBooks: 27,
  },
};

import { PROTESTANT_BIBLE_BOOKS } from "./canons/protestant";
import { CATHOLIC_BIBLE_BOOKS } from "./canons/catholic";
import { EASTERN_ORTHODOX_BIBLE_BOOKS } from "./canons/eastern-orthodox";
import { ETHIOPIAN_ORTHODOX_BIBLE_BOOKS } from "./canons/ethiopian-orthodox";

export {
  PROTESTANT_BIBLE_BOOKS,
  CATHOLIC_BIBLE_BOOKS,
  EASTERN_ORTHODOX_BIBLE_BOOKS,
  ETHIOPIAN_ORTHODOX_BIBLE_BOOKS,
};

/**
 * Standard default books list (backward compatibility alias for Protestant 66 books)
 */
export const BIBLE_BOOKS: BibleBook[] = PROTESTANT_BIBLE_BOOKS;

export const TOTAL_BIBLE_CHAPTERS = 1189;
export const TOTAL_OT_CHAPTERS = 929;
export const TOTAL_NT_CHAPTERS = 260;

/**
 * Returns the ordered list of books for a given Bible canon.
 */
export function getBibleBooks(canon: BibleCanon = "protestant"): BibleBook[] {
  switch (canon) {
    case "catholic":
      return CATHOLIC_BIBLE_BOOKS;
    case "eastern_orthodox":
      return EASTERN_ORTHODOX_BIBLE_BOOKS;
    case "ethiopian_orthodox":
      return ETHIOPIAN_ORTHODOX_BIBLE_BOOKS;
    case "protestant":
    default:
      return PROTESTANT_BIBLE_BOOKS;
  }
}

/**
 * Returns OT and NT chapter breakdown for a given Bible canon.
 */
export function getCanonTestamentChapters(canon: BibleCanon = "protestant"): {
  ot: number;
  nt: number;
  total: number;
} {
  const books = getBibleBooks(canon);
  let ot = 0;
  let nt = 0;
  for (const b of books) {
    if (b.testament === "OT") ot += b.chapters;
    else nt += b.chapters;
  }
  return { ot, nt, total: ot + nt };
}

// Master book lookup table containing all unique books across all canons (deduplicated 81 books with max chapter counts)
export const ALL_CANONS_BOOKS: BibleBook[] = (() => {
  const map = new Map<string, BibleBook>();
  const all = [
    ...PROTESTANT_BIBLE_BOOKS,
    ...CATHOLIC_BIBLE_BOOKS,
    ...EASTERN_ORTHODOX_BIBLE_BOOKS,
    ...ETHIOPIAN_ORTHODOX_BIBLE_BOOKS,
  ];
  for (const b of all) {
    const existing = map.get(b.id);
    if (!existing || b.chapters > existing.chapters) {
      map.set(b.id, b);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.order - b.order);
})();

export const BIBLE_BOOK_MAP: Record<string, BibleBook> = Object.fromEntries(
  ALL_CANONS_BOOKS.map((b) => [b.id, b])
);

export function getBibleBookById(
  bookId: string,
  canon?: BibleCanon
): BibleBook | undefined {
  if (canon) {
    const canonBooks = getBibleBooks(canon);
    const found = canonBooks.find((b) => b.id === bookId);
    if (found) return found;
  }
  return BIBLE_BOOK_MAP[bookId];
}

/**
 * Returns unique Bible books merged from multiple canons in canonical order.
 */
export function getUnionBibleBooks(
  canons: BibleCanon[] = ["protestant"]
): BibleBook[] {
  if (canons.length === 0) return PROTESTANT_BIBLE_BOOKS;
  if (canons.length === 1) return getBibleBooks(canons[0]);

  const map = new Map<string, BibleBook>();

  for (const canon of canons) {
    const books = getBibleBooks(canon);
    for (const b of books) {
      const existing = map.get(b.id);
      if (!existing || b.chapters > existing.chapters) {
        map.set(b.id, b);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.order - b.order);
}

/**
 * Determines the widest canon among a list of canons.
 */
export function getWidestCanon(
  canons: BibleCanon[] = ["protestant"]
): BibleCanon {
  if (canons.includes("ethiopian_orthodox")) return "ethiopian_orthodox";
  if (canons.includes("eastern_orthodox")) return "eastern_orthodox";
  if (canons.includes("catholic")) return "catholic";
  return "protestant";
}

export const CATEGORIES = [
  "All",
  "Old Testament",
  "New Testament",
  "Law",
  "History",
  "Poetry & Wisdom",
  "Major Prophets",
  "Minor Prophets",
  "Deuterocanon",
  "Gospels",
  "Church History",
  "Pauline Epistles",
  "General Epistles",
  "Apocalyptic",
  "Orthodox Canon",
] as const;

export type CategoryFilter = (typeof CATEGORIES)[number];

export function getCategoriesForCanon(
  canon: BibleCanon = "protestant"
): CategoryFilter[] {
  const books = getBibleBooks(canon);
  const bookCategories = new Set(books.map((b) => b.category));
  const base: CategoryFilter[] = ["All", "Old Testament", "New Testament"];

  const possibleCategories: BibleCategory[] = [
    "Law",
    "History",
    "Poetry & Wisdom",
    "Major Prophets",
    "Minor Prophets",
    "Deuterocanon",
    "Gospels",
    "Church History",
    "Pauline Epistles",
    "General Epistles",
    "Apocalyptic",
    "Orthodox Canon",
  ];

  for (const cat of possibleCategories) {
    if (bookCategories.has(cat)) {
      base.push(cat);
    }
  }
  return base;
}

export type ScriptureDivisionKey =
  "law" | "history" | "wisdom" | "prophets" | "gospels" | "epistles";

export interface ScriptureDivisionInfo {
  key: ScriptureDivisionKey;
  name: string;
  shortName: string;
  subtitle: string;
  icon: string;
  totalBibleChapters: number;
  categories: BibleCategory[];
}

export const SCRIPTURE_DIVISIONS: ScriptureDivisionInfo[] = [
  {
    key: "law",
    name: "The Law (Pentateuch)",
    shortName: "Law",
    subtitle: "Genesis – Deuteronomy",
    icon: "book",
    totalBibleChapters: 187,
    categories: ["Law"],
  },
  {
    key: "history",
    name: "History",
    shortName: "History",
    subtitle: "Joshua – Esther & Acts",
    icon: "shield",
    totalBibleChapters: 277,
    categories: ["History", "Church History", "Deuterocanon"],
  },
  {
    key: "wisdom",
    name: "Wisdom & Poetry",
    shortName: "Wisdom",
    subtitle: "Job – Song of Solomon",
    icon: "sun",
    totalBibleChapters: 243,
    categories: ["Poetry & Wisdom"],
  },
  {
    key: "prophets",
    name: "Prophets",
    shortName: "Prophets",
    subtitle: "Isaiah – Malachi",
    icon: "compass",
    totalBibleChapters: 250,
    categories: ["Major Prophets", "Minor Prophets"],
  },
  {
    key: "gospels",
    name: "Gospels",
    shortName: "Gospels",
    subtitle: "Matthew – John",
    icon: "heart",
    totalBibleChapters: 89,
    categories: ["Gospels"],
  },
  {
    key: "epistles",
    name: "Epistles & Revelation",
    shortName: "Epistles",
    subtitle: "Romans – Revelation",
    icon: "mail",
    totalBibleChapters: 143,
    categories: [
      "Pauline Epistles",
      "General Epistles",
      "Apocalyptic",
      "Orthodox Canon",
    ],
  },
];

export const BOOK_DIVISION_MAP: Record<string, ScriptureDivisionKey> =
  Object.fromEntries(
    ALL_CANONS_BOOKS.map((book) => {
      let div: ScriptureDivisionKey = "epistles";
      if (book.category === "Law") div = "law";
      else if (
        book.category === "History" ||
        book.category === "Church History" ||
        book.category === "Deuterocanon"
      )
        div = "history";
      else if (book.category === "Poetry & Wisdom") div = "wisdom";
      else if (
        book.category === "Major Prophets" ||
        book.category === "Minor Prophets"
      )
        div = "prophets";
      else if (book.category === "Gospels") div = "gospels";
      return [book.id, div];
    })
  );

export function getScriptureDivisionForBook(
  bookId: string
): ScriptureDivisionKey {
  return BOOK_DIVISION_MAP[bookId] || "history";
}

export interface ComputedDivisionStat {
  division: ScriptureDivisionInfo;
  planChaptersCount: number;
  completedChaptersCount: number;
  totalBibleChapters: number;
  planPercentage: number;
  bibleCoveragePercentage: number;
}

export function calculateScriptureDivisionStats(
  readings: { bookId: string }[],
  totalChaptersOverride?: number,
  canon: BibleCanon = "protestant"
): ComputedDivisionStat[] {
  const total =
    totalChaptersOverride && totalChaptersOverride > 0
      ? totalChaptersOverride
      : Math.max(1, readings.length);
  const counts: Record<string, number> = {
    law: 0,
    history: 0,
    wisdom: 0,
    prophets: 0,
    gospels: 0,
    epistles: 0,
  };

  for (let i = 0; i < readings.length; i++) {
    const divKey = getScriptureDivisionForBook(readings[i].bookId);
    counts[divKey] = (counts[divKey] || 0) + 1;
  }

  // Calculate division chapter totals for the specified canon
  const canonBooks = getBibleBooks(canon);
  const canonDivTotals: Record<ScriptureDivisionKey, number> = {
    law: 0,
    history: 0,
    wisdom: 0,
    prophets: 0,
    gospels: 0,
    epistles: 0,
  };
  for (const b of canonBooks) {
    const divKey = getScriptureDivisionForBook(b.id);
    canonDivTotals[divKey] = (canonDivTotals[divKey] || 0) + b.chapters;
  }

  return SCRIPTURE_DIVISIONS.map((div) => {
    const planCount = counts[div.key] || 0;
    const planPct = Math.round((planCount / total) * 100);
    const divTotalBibleChapters =
      canonDivTotals[div.key] || div.totalBibleChapters;
    const bibleCoveragePct =
      divTotalBibleChapters > 0
        ? Math.round((planCount / divTotalBibleChapters) * 100)
        : 0;

    return {
      division: {
        ...div,
        totalBibleChapters: divTotalBibleChapters,
      },
      planChaptersCount: planCount,
      completedChaptersCount: 0,
      totalBibleChapters: divTotalBibleChapters,
      planPercentage: planPct,
      bibleCoveragePercentage: bibleCoveragePct,
    };
  });
}
