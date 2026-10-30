import {
  BIBLE_BOOKS,
  BIBLE_BOOK_MAP,
  BibleCanon,
  getBibleBooks,
  getBibleBookById,
} from "./bibleData";

export interface PlanReadingItem {
  id: string; // e.g. "gen_1" or "orig_1" or "gvv_1"
  bookId: string;
  bookName: string;
  chapter: number;
  startVerse?: number; // e.g. 1
  endVerse?: number; // e.g. 5
  verseRange?: string; // e.g. "1-5"
  versesLabel?: string; // e.g. "1:1-5"
  track?: string; // e.g. "Old Testament", "Wisdom", "Gospel"
  displayText?: string; // e.g. "Genesis 1:1-5" or "Genesis 1"
  order: number;
}

export interface PlanSection {
  title: string;
  subtitle: string;
  chaptersCount: number;
  booksDescription: string;
}

export type PlanCategory =
  | "All"
  | "Whole Bible"
  | "New Testament"
  | "Old Testament"
  | "Gospels"
  | "Wisdom & Poetry"
  | "Epistles"
  | "Multi-Track"
  | "Chronological";

export type PlanFilterType =
  | "All"
  | "Custom"
  | "Fixed"
  | "Customizable"
  | "Old"
  | "New"
  | "Gospels"
  | "Epistles"
  | "Short"
  | "Long"
  | "Whole";

export interface PlanFilterOption {
  id: PlanFilterType;
  label: string;
}

export const PLAN_FILTERS: PlanFilterOption[] = [
  { id: "All", label: "All" },
  { id: "Custom", label: "My Custom" },
  { id: "Fixed", label: "Fixed" },
  { id: "Customizable", label: "Customizable" },
  { id: "Old", label: "Old Testament" },
  { id: "New", label: "New Testament" },
  { id: "Gospels", label: "Gospels" },
  { id: "Epistles", label: "Epistles" },
  { id: "Short", label: "Short" },
  { id: "Long", label: "Long" },
  { id: "Whole", label: "Whole Bible" },
];

/**
 * Automatically deduces the canonical reading plan category based on book IDs.
 */
export const deducePlanCategory = (bookIds: string[]): PlanCategory => {
  if (!bookIds || bookIds.length === 0) return "All";

  const validBooks = bookIds
    .map((id) => BIBLE_BOOK_MAP[id])
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  if (validBooks.length === 0) return "All";

  const otBooks = validBooks.filter((b) => b.testament === "OT");
  const ntBooks = validBooks.filter((b) => b.testament === "NT");

  // Both testaments present
  if (otBooks.length > 0 && ntBooks.length > 0) {
    const totalChapters = validBooks.reduce((sum, b) => sum + b.chapters, 0);
    if (validBooks.length >= 60 || totalChapters >= 1000) {
      return "Whole Bible";
    }
    return "Multi-Track";
  }

  // Only New Testament books
  if (ntBooks.length > 0 && otBooks.length === 0) {
    const allGospels = validBooks.every((b) => b.category === "Gospels");
    if (allGospels) {
      return "Gospels";
    }
    const allEpistles = validBooks.every(
      (b) =>
        b.category === "Pauline Epistles" || b.category === "General Epistles"
    );
    if (allEpistles) {
      return "Epistles";
    }
    return "New Testament";
  }

  // Only Old Testament books
  if (otBooks.length > 0 && ntBooks.length === 0) {
    const allWisdom = validBooks.every(
      (b) =>
        b.category === "Poetry & Wisdom" ||
        b.id === "wis" ||
        b.id === "sir" ||
        b.id === "tegsats"
    );
    if (allWisdom) {
      return "Wisdom & Poetry";
    }
    return "Old Testament";
  }

  return "All";
};

export const isPlanMatchingFilter = (
  plan: ReadingPlanTemplate,
  filter: PlanFilterType
): boolean => {
  if (filter === "All") return true;

  if (filter === "Custom") {
    return plan.id.startsWith("custom_") || plan.id.startsWith("imported_");
  }

  if (filter === "Fixed") {
    return plan.allowCustomPace === false;
  }

  if (filter === "Customizable") {
    return plan.allowCustomPace !== false;
  }

  if (filter === "Gospels") {
    if (plan.category === "Gospels") return true;
    return (
      plan.readings.length > 0 &&
      plan.readings.every((r) => {
        const b = BIBLE_BOOK_MAP[r.bookId];
        return b && b.category === "Gospels";
      })
    );
  }

  if (filter === "Epistles") {
    if (plan.category === "Epistles") return true;
    return (
      plan.readings.length > 0 &&
      plan.readings.every((r) => {
        const b = BIBLE_BOOK_MAP[r.bookId];
        return (
          b &&
          (b.category === "Pauline Epistles" ||
            b.category === "General Epistles")
        );
      })
    );
  }

  if (filter === "Old") {
    if (
      plan.category === "Old Testament" ||
      plan.category === "Wisdom & Poetry"
    )
      return true;
    if (plan.category === "Whole Bible") return true;
    return plan.readings.some((r) => {
      const b = BIBLE_BOOK_MAP[r.bookId];
      return b && b.testament === "OT";
    });
  }

  if (filter === "New") {
    if (
      plan.category === "New Testament" ||
      plan.category === "Gospels" ||
      plan.category === "Epistles"
    )
      return true;
    if (plan.category === "Whole Bible") return true;
    return plan.readings.some((r) => {
      const b = BIBLE_BOOK_MAP[r.bookId];
      return b && b.testament === "NT";
    });
  }

  if (filter === "Short") {
    return plan.recommendedDays <= 30;
  }

  if (filter === "Long") {
    return plan.recommendedDays > 30;
  }

  if (filter === "Whole") {
    return plan.category === "Whole Bible" || plan.totalChapters >= 1000;
  }

  return true;
};

export interface ReadingPlanTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: PlanCategory;
  icon: string;
  accentColor: string;
  totalChapters: number;
  defaultDailyTarget: number;
  recommendedDays: number;
  allowCustomPace?: boolean; // If false, pace is locked to recommended schedule (steppers hidden/disabled)
  allowSelfPaced?: boolean; // If false, self-paced option is completely hidden
  canonCompatibility?: BibleCanon | null;
  sections: PlanSection[];
  readings: PlanReadingItem[];
}

// Helper to generate sequential readings from an array of book IDs
const generateReadingsForBooks = (
  bookIds: string[],
  canon?: BibleCanon
): PlanReadingItem[] => {
  const items: PlanReadingItem[] = [];
  let order = 1;

  for (const bookId of bookIds) {
    const book = canon
      ? getBibleBookById(bookId, canon) || BIBLE_BOOK_MAP[bookId]
      : BIBLE_BOOK_MAP[bookId];
    if (!book) continue;

    for (let ch = 1; ch <= book.chapters; ch++) {
      items.push({
        id: `${book.id}_${ch}`,
        bookId: book.id,
        bookName: book.name,
        chapter: ch,
        order: order++,
      });
    }
  }

  return items;
};

// 1. The Four Gospels
const gospelsBookIds = ["mat", "mrk", "luk", "jhn"];
const gospelsReadings = generateReadingsForBooks(gospelsBookIds);

// 2. New Testament
const ntBookIds = BIBLE_BOOKS.filter((b) => b.testament === "NT").map(
  (b) => b.id
);
const ntReadings = generateReadingsForBooks(ntBookIds);

// 3. Canon-Specific Whole Bible Readings
export const generateReadingsForCanon = (
  canon: BibleCanon = "protestant"
): PlanReadingItem[] => {
  const books = getBibleBooks(canon);
  const items: PlanReadingItem[] = [];
  let order = 1;

  for (const book of books) {
    for (let ch = 1; ch <= book.chapters; ch++) {
      items.push({
        id: `${book.id}_${ch}`,
        bookId: book.id,
        bookName: book.name,
        chapter: ch,
        order: order++,
      });
    }
  }

  return items;
};

const wholeBibleReadings = generateReadingsForCanon("protestant");
const catholicBibleReadings = generateReadingsForCanon("catholic");
const easternOrthodoxBibleReadings =
  generateReadingsForCanon("eastern_orthodox");
const ethiopianOrthodoxBibleReadings =
  generateReadingsForCanon("ethiopian_orthodox");

// 3b. Canon-Specific Modular Readings
// Ethiopian Orthodox (EOTC)
const enochBookIds = ["enoch"];
const enochReadings = generateReadingsForBooks(
  enochBookIds,
  "ethiopian_orthodox"
);

const jubileesBookIds = ["jub"];
const jubileesReadings = generateReadingsForBooks(
  jubileesBookIds,
  "ethiopian_orthodox"
);

const meqabyanBookIds = ["1meq", "2meq", "3meq"];
const meqabyanReadings = generateReadingsForBooks(
  meqabyanBookIds,
  "ethiopian_orthodox"
);

const eotcWisdomBookIds = ["wis", "sir", "tegsats"];
const eotcWisdomReadings = generateReadingsForBooks(
  eotcWisdomBookIds,
  "ethiopian_orthodox"
);

const ethiopicDidascaliaClementBookIds = ["eth_dida", "eth_clem"];
const ethiopicDidascaliaClementReadings = generateReadingsForBooks(
  ethiopicDidascaliaClementBookIds,
  "ethiopian_orthodox"
);

// Catholic
const tobitJudithBookIds = ["tob", "jdt"];
const tobitJudithReadings = generateReadingsForBooks(
  tobitJudithBookIds,
  "catholic"
);

const catholicMaccabeesBookIds = ["1mac", "2mac"];
const catholicMaccabeesReadings = generateReadingsForBooks(
  catholicMaccabeesBookIds,
  "catholic"
);

const catholicWisdomBookIds = ["wis", "sir"];
const catholicWisdomReadings = generateReadingsForBooks(
  catholicWisdomBookIds,
  "catholic"
);

// Eastern Orthodox
const orthodoxMaccabeesBookIds = ["1mac", "2mac", "3mac", "4mac"];
const orthodoxMaccabeesReadings = generateReadingsForBooks(
  orthodoxMaccabeesBookIds,
  "eastern_orthodox"
);

const orthodoxNarrativesBookIds = ["1esd", "tob", "jdt"];
const orthodoxNarrativesReadings = generateReadingsForBooks(
  orthodoxNarrativesBookIds,
  "eastern_orthodox"
);

const orthodoxWisdomProphecyBookIds = ["wis", "sir", "man", "bar", "lje"];
const orthodoxWisdomProphecyReadings = generateReadingsForBooks(
  orthodoxWisdomProphecyBookIds,
  "eastern_orthodox"
);

// 4. Wisdom & Poetry
const wisdomBookIds = ["job", "psa", "pro", "ecc", "sng"];
const wisdomReadings = generateReadingsForBooks(wisdomBookIds);

// 5. Pauline Epistles
const paulineBookIds = [
  "rom",
  "1co",
  "2co",
  "gal",
  "eph",
  "php",
  "col",
  "1th",
  "2th",
  "1ti",
  "2ti",
  "tit",
  "phm",
];
const paulineReadings = generateReadingsForBooks(paulineBookIds);

// 6. Torah / Books of the Law
const torahBookIds = ["gen", "exo", "lev", "num", "deu"];
const torahReadings = generateReadingsForBooks(torahBookIds);

// 7. General Epistles & Revelation
const generalEpistlesIds = [
  "heb",
  "jas",
  "1pe",
  "2pe",
  "1jn",
  "2jn",
  "3jn",
  "jud",
  "rev",
];
const generalEpistlesReadings = generateReadingsForBooks(generalEpistlesIds);

// 8. Book of Hebrews (Short 13-Chapter Plan)
const hebrewsBookIds = ["heb"];
const hebrewsReadings = generateReadingsForBooks(hebrewsBookIds);

// 9. Genesis, Proverbs & Gospel of John (3 Tracks Daily - 102 Chapters)
const generateTriTrackReadings = (): PlanReadingItem[] => {
  const items: PlanReadingItem[] = [];
  let order = 1;
  const genMax = 50;
  const prvMax = 31;
  const jhnMax = 21;
  const totalDays = Math.max(genMax, prvMax, jhnMax); // 50 days

  for (let day = 1; day <= totalDays; day++) {
    if (day <= genMax) {
      items.push({
        id: `gen_pro_jhn_gen_${day}`,
        bookId: "gen",
        bookName: "Genesis",
        chapter: day,
        track: "Old Testament",
        displayText: `Genesis ${day}`,
        order: order++,
      });
    }
    if (day <= prvMax) {
      items.push({
        id: `gen_pro_jhn_pro_${day}`,
        bookId: "pro",
        bookName: "Proverbs",
        chapter: day,
        track: "Wisdom",
        displayText: `Proverbs ${day}`,
        order: order++,
      });
    }
    if (day <= jhnMax) {
      items.push({
        id: `gen_pro_jhn_jhn_${day}`,
        bookId: "jhn",
        bookName: "John",
        chapter: day,
        track: "Gospel",
        displayText: `John ${day}`,
        order: order++,
      });
    }
  }

  return items;
};

const triTrackReadings = generateTriTrackReadings();

// 10. Origins: Creation to Babel (Verse-Level Readings Example)
const originsVerseReadings: PlanReadingItem[] = [
  {
    id: "orig_1",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 1,
    endVerse: 31,
    verseRange: "1-31",
    versesLabel: "1:1-31",
    displayText: "Genesis 1:1-31",
    order: 1,
  },
  {
    id: "orig_2",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 2,
    startVerse: 1,
    endVerse: 25,
    verseRange: "1-25",
    versesLabel: "2:1-25",
    displayText: "Genesis 2:1-25",
    order: 2,
  },
  {
    id: "orig_3",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 3,
    startVerse: 1,
    endVerse: 24,
    verseRange: "1-24",
    versesLabel: "3:1-24",
    displayText: "Genesis 3:1-24",
    order: 3,
  },
  {
    id: "orig_4",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 4,
    startVerse: 1,
    endVerse: 26,
    verseRange: "1-26",
    versesLabel: "4:1-26",
    displayText: "Genesis 4:1-26",
    order: 4,
  },
  {
    id: "orig_5",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 6,
    startVerse: 1,
    endVerse: 22,
    verseRange: "1-22",
    versesLabel: "6:1-22",
    displayText: "Genesis 6:1-22",
    order: 5,
  },
  {
    id: "orig_6",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 9,
    startVerse: 1,
    endVerse: 17,
    verseRange: "1-17",
    versesLabel: "9:1-17",
    displayText: "Genesis 9:1-17",
    order: 6,
  },
  {
    id: "orig_7",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 11,
    startVerse: 1,
    endVerse: 9,
    verseRange: "1-9",
    versesLabel: "11:1-9",
    displayText: "Genesis 11:1-9",
    order: 7,
  },
  {
    id: "orig_8",
    bookId: "jhn",
    bookName: "John",
    chapter: 1,
    startVerse: 1,
    endVerse: 18,
    verseRange: "1-18",
    versesLabel: "1:1-18",
    displayText: "John 1:1-18",
    order: 8,
  },
];

// 11. Genesis Creation & Fall (Granular Verse-by-Verse Walk - 12 Readings)
const genesisVerseByVerseReadings: PlanReadingItem[] = [
  // Day 1 & 2 (Genesis 1 - 31 verses total)
  {
    id: "gvv_1",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 1,
    endVerse: 5,
    verseRange: "1-5",
    versesLabel: "1:1-5",
    displayText: "Genesis 1:1-5",
    order: 1,
  },
  {
    id: "gvv_2",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 6,
    endVerse: 8,
    verseRange: "6-8",
    versesLabel: "1:6-8",
    displayText: "Genesis 1:6-8",
    order: 2,
  },
  {
    id: "gvv_3",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 9,
    endVerse: 13,
    verseRange: "9-13",
    versesLabel: "1:9-13",
    displayText: "Genesis 1:9-13",
    order: 3,
  },
  {
    id: "gvv_4",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 14,
    endVerse: 19,
    verseRange: "14-19",
    versesLabel: "1:14-19",
    displayText: "Genesis 1:14-19",
    order: 4,
  },
  {
    id: "gvv_5",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 20,
    endVerse: 23,
    verseRange: "20-23",
    versesLabel: "1:20-23",
    displayText: "Genesis 1:20-23",
    order: 5,
  },
  {
    id: "gvv_6",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 1,
    startVerse: 24,
    endVerse: 31,
    verseRange: "24-31",
    versesLabel: "1:24-31",
    displayText: "Genesis 1:24-31",
    order: 6,
  },
  // Day 3 & 4 (Genesis 2 - 25 verses total)
  {
    id: "gvv_7",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 2,
    startVerse: 1,
    endVerse: 3,
    verseRange: "1-3",
    versesLabel: "2:1-3",
    displayText: "Genesis 2:1-3",
    order: 7,
  },
  {
    id: "gvv_8",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 2,
    startVerse: 4,
    endVerse: 17,
    verseRange: "4-17",
    versesLabel: "2:4-17",
    displayText: "Genesis 2:4-17",
    order: 8,
  },
  {
    id: "gvv_9",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 2,
    startVerse: 18,
    endVerse: 25,
    verseRange: "18-25",
    versesLabel: "2:18-25",
    displayText: "Genesis 2:18-25",
    order: 9,
  },
  // Day 5 & 6 (Genesis 3 - 24 verses total)
  {
    id: "gvv_10",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 3,
    startVerse: 1,
    endVerse: 7,
    verseRange: "1-7",
    versesLabel: "3:1-7",
    displayText: "Genesis 3:1-7",
    order: 10,
  },
  {
    id: "gvv_11",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 3,
    startVerse: 8,
    endVerse: 19,
    verseRange: "8-19",
    versesLabel: "3:8-19",
    displayText: "Genesis 3:8-19",
    order: 11,
  },
  {
    id: "gvv_12",
    bookId: "gen",
    bookName: "Genesis",
    chapter: 3,
    startVerse: 20,
    endVerse: 24,
    verseRange: "20-24",
    versesLabel: "3:20-24",
    displayText: "Genesis 3:20-24",
    order: 12,
  },
];

export const READING_PLANS: ReadingPlanTemplate[] = [
  {
    id: "hebrews_short_7",
    title: "Book of Hebrews",
    subtitle: "Jesus Christ: Our Supreme High Priest (13 Chapters)",
    description:
      "A short, focused 13-chapter plan through the Epistle to the Hebrews. Perfect for quick testing and deep reflection on Christ's eternal covenant, the Hall of Faith, and steadfast endurance.",
    category: "Epistles",
    icon: "compass",
    accentColor: "#F59E0B",
    totalChapters: hebrewsReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 7,
    allowCustomPace: false, // Locked to author's recommended pace (2 ch/day)
    allowSelfPaced: false, // Time-paced only (Self-paced button completely hidden)
    sections: [
      {
        title: "The Superiority of Christ",
        subtitle: "Greater than Angels & Moses",
        chaptersCount: 4,
        booksDescription: "Hebrews 1–4",
      },
      {
        title: "Our Great High Priest",
        subtitle: "The Eternal Covenant & Sacrifice",
        chaptersCount: 6,
        booksDescription: "Hebrews 5–10",
      },
      {
        title: "The Hall of Faith & Race",
        subtitle: "Faith, Discipline & Kingdom Unshakable",
        chaptersCount: 3,
        booksDescription: "Hebrews 11–13",
      },
    ],
    readings: hebrewsReadings,
  },
  {
    id: "the_four_gospels_30",
    title: "The Four Gospels",
    subtitle: "Life & Teachings of Jesus Christ",
    description:
      "Immerse yourself in Matthew, Mark, Luke, and John. Experience the life, parables, miracles, death, and resurrection of Jesus across all 89 chapters.",
    category: "Gospels",
    icon: "heart",
    accentColor: "#10B981",
    totalChapters: gospelsReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 30,
    sections: [
      {
        title: "The Gospel of Matthew",
        subtitle: "The King & The Kingdom",
        chaptersCount: 28,
        booksDescription: "Matthew (28 Chapters)",
      },
      {
        title: "The Gospel of Mark",
        subtitle: "The Servant in Action",
        chaptersCount: 16,
        booksDescription: "Mark (16 Chapters)",
      },
      {
        title: "The Gospel of Luke",
        subtitle: "The Compassionate Son of Man",
        chaptersCount: 24,
        booksDescription: "Luke (24 Chapters)",
      },
      {
        title: "The Gospel of John",
        subtitle: "The Word Made Flesh",
        chaptersCount: 21,
        booksDescription: "John (21 Chapters)",
      },
    ],
    readings: gospelsReadings,
  },
  {
    id: "new_testament_90",
    title: "New Testament in 90 Days",
    subtitle: "From Gospels to Revelation",
    description:
      "Complete all 27 books and 260 chapters of the New Testament. Covers the life of Christ, the early church in Acts, apostolic letters, and final Revelation.",
    category: "New Testament",
    icon: "zap",
    accentColor: "#3B82F6",
    totalChapters: ntReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 90,
    sections: [
      {
        title: "The Four Gospels",
        subtitle: "Life & Ministry of Jesus Christ",
        chaptersCount: 89,
        booksDescription: "Matthew, Mark, Luke, John",
      },
      {
        title: "The Early Church",
        subtitle: "The Holy Spirit & Apostolic Witness",
        chaptersCount: 28,
        booksDescription: "Acts of the Apostles",
      },
      {
        title: "The Pauline Epistles",
        subtitle: "Church Doctrine & Christian Living",
        chaptersCount: 87,
        booksDescription: "Romans through Philemon (13 Books)",
      },
      {
        title: "General Epistles & Revelation",
        subtitle: "Perseverance & Consummation",
        chaptersCount: 56,
        booksDescription: "Hebrews through Revelation (9 Books)",
      },
    ],
    readings: ntReadings,
  },
  {
    id: "whole_bible_365",
    title: "Bible in One Year",
    subtitle: "Complete Genesis to Revelation",
    description:
      "Read the entire Holy Bible from cover to cover. A comprehensive 1,189-chapter journey through all 66 books of the Old and New Testaments.",
    category: "Whole Bible",
    icon: "book-open",
    accentColor: "#FAFAFA",
    totalChapters: wholeBibleReadings.length,
    defaultDailyTarget: 4,
    recommendedDays: 365,
    canonCompatibility: "protestant",
    sections: [
      {
        title: "The Books of the Law",
        subtitle: "Creation, Patriarchs & Mosaic Covenant",
        chaptersCount: 187,
        booksDescription: "Genesis, Exodus, Leviticus, Numbers, Deuteronomy",
      },
      {
        title: "Old Testament History",
        subtitle: "Kingdom of Israel, Exile & Return",
        chaptersCount: 249,
        booksDescription: "Joshua through Esther (12 Books)",
      },
      {
        title: "Wisdom & Poetry",
        subtitle: "Praise, Prayers & Practical Discernment",
        chaptersCount: 243,
        booksDescription:
          "Job, Psalms, Proverbs, Ecclesiastes, Song of Solomon",
      },
      {
        title: "The Prophets",
        subtitle: "Major & Minor Prophetic Messages",
        chaptersCount: 250,
        booksDescription: "Isaiah through Malachi (17 Books)",
      },
      {
        title: "The New Testament",
        subtitle: "Christ, the Apostles & Revelation",
        chaptersCount: 260,
        booksDescription: "Matthew through Revelation (27 Books)",
      },
    ],
    readings: wholeBibleReadings,
  },
  {
    id: "catholic_bible_365",
    title: "Catholic Bible in a Year",
    subtitle: "Complete 73-Book Catholic Canon with Deuterocanon",
    description:
      "Read the complete Catholic Holy Bible in 365 days. A comprehensive 1,334-chapter journey through all 73 books of Sacred Scripture, including Tobit, Judith, 1 & 2 Maccabees, Wisdom, Sirach, and Baruch.",
    category: "Whole Bible",
    icon: "book-open",
    accentColor: "#3B82F6",
    totalChapters: catholicBibleReadings.length,
    defaultDailyTarget: 4,
    recommendedDays: 365,
    canonCompatibility: "catholic",
    sections: [
      {
        title: "The Books of the Law",
        subtitle: "Creation, Patriarchs & Mosaic Covenant",
        chaptersCount: 187,
        booksDescription: "Genesis, Exodus, Leviticus, Numbers, Deuteronomy",
      },
      {
        title: "Historical Books & Deuterocanon",
        subtitle: "Kingdoms, Return & Deuterocanonical Histories",
        chaptersCount: 341,
        booksDescription: "Joshua through 2 Maccabees (16 Books)",
      },
      {
        title: "Wisdom & Poetry",
        subtitle: "Praise, Wisdom of Solomon & Sirach",
        chaptersCount: 284,
        booksDescription:
          "Job, Psalms, Proverbs, Ecclesiastes, Song, Wisdom, Sirach",
      },
      {
        title: "The Prophets",
        subtitle: "Major & Minor Prophets with Baruch",
        chaptersCount: 262,
        booksDescription: "Isaiah through Malachi with Baruch (18 Books)",
      },
      {
        title: "The New Testament",
        subtitle: "Christ, the Church & Revelation",
        chaptersCount: 260,
        booksDescription: "Matthew through Revelation (27 Books)",
      },
    ],
    readings: catholicBibleReadings,
  },
  {
    id: "eastern_orthodox_bible_365",
    title: "Orthodox Bible in a Year",
    subtitle: "Complete 78-Book Eastern Orthodox Canon",
    description:
      "A comprehensive journey through all 78 books of the Eastern Orthodox Bible (1,370 chapters), including Greek Ezra, 3 & 4 Maccabees, Prayer of Manasseh, Psalm 151, and the Deuterocanon.",
    category: "Whole Bible",
    icon: "book-open",
    accentColor: "#8B5CF6",
    totalChapters: easternOrthodoxBibleReadings.length,
    defaultDailyTarget: 4,
    recommendedDays: 365,
    canonCompatibility: "eastern_orthodox",
    sections: [
      {
        title: "The Books of the Law",
        subtitle: "The Law of Moses (Pentateuch)",
        chaptersCount: 187,
        booksDescription: "Genesis, Exodus, Leviticus, Numbers, Deuteronomy",
      },
      {
        title: "Historical Books",
        subtitle: "Kingdoms, Greek Ezra, Tobit, Judith & Maccabees",
        chaptersCount: 367,
        booksDescription: "Joshua through 4 Maccabees (18 Books)",
      },
      {
        title: "Wisdom & Poetry",
        subtitle: "Psalms with Ps 151, Prayer of Manasseh & Wisdom Literature",
        chaptersCount: 286,
        booksDescription: "Job through Sirach with Psalm 151 (9 Books)",
      },
      {
        title: "The Prophets",
        subtitle: "Major & Minor Prophets with Baruch & Letter of Jeremiah",
        chaptersCount: 270,
        booksDescription: "Isaiah through Malachi with Baruch (19 Books)",
      },
      {
        title: "The New Testament",
        subtitle: "Christ, Apostolic Letters & Revelation",
        chaptersCount: 260,
        booksDescription: "Matthew through Revelation (27 Books)",
      },
    ],
    readings: easternOrthodoxBibleReadings,
  },
  {
    id: "ethiopian_orthodox_bible_365",
    title: "EOTC Bible in a Year",
    subtitle: "Complete 81-Book Ethiopian Orthodox Tewahedo Canon",
    description:
      "The complete 81-book Ethiopian Orthodox Tewahedo Church (EOTC) biblical journey through all 1,927 chapters, including Enoch, Jubilees, 1-3 Meqabyan, Sinodos, and the broader New Testament.",
    category: "Whole Bible",
    icon: "book-open",
    accentColor: "#10B981",
    totalChapters: ethiopianOrthodoxBibleReadings.length,
    defaultDailyTarget: 6,
    recommendedDays: 365,
    canonCompatibility: "ethiopian_orthodox",
    sections: [
      {
        title: "The Orit & Patriarchs",
        subtitle: "Octateuch with Jubilees & Enoch",
        chaptersCount: 328,
        booksDescription: "Genesis to Deuteronomy, Jubilees, Enoch (7 Books)",
      },
      {
        title: "Historical Books",
        subtitle: "Kingdoms, Captivity, Return & 1-3 Meqabyan",
        chaptersCount: 348,
        booksDescription:
          "Joshua through Nehemiah, Tobit, Judith, 1-3 Meqabyan (17 Books)",
      },
      {
        title: "Wisdom & Poetry",
        subtitle: "Psalms, Proverbs, Tegsats, Wisdom & Sirach",
        chaptersCount: 284,
        booksDescription: "Job through Sirach with Tegsats (8 Books)",
      },
      {
        title: "The Prophets",
        subtitle: "Major & Minor Prophets with Baruch & 4 Baruch",
        chaptersCount: 276,
        booksDescription: "Isaiah through Malachi, Baruch, 4 Baruch (18 Books)",
      },
      {
        title: "The New Testament",
        subtitle: "Gospels, Acts, Epistles & Revelation",
        chaptersCount: 260,
        booksDescription: "Matthew through Revelation (27 Books)",
      },
      {
        title: "The Broader Canon",
        subtitle: "Sinodos, Covenant & Apostolic Orders",
        chaptersCount: 431,
        booksDescription:
          "Sinodos, Covenant 1-2, Ethiopic Clement & Didascalia (4 Books)",
      },
    ],
    readings: ethiopianOrthodoxBibleReadings,
  },

  // --- Canon-Specific Modular Reading Plans ---
  // 1. Ethiopian Orthodox Tewahedo (EOTC) Plans
  {
    id: "enoch_journey_30",
    title: "Book of Enoch (Henok)",
    subtitle: "The Celestial Visions & Parables (108 Chapters)",
    description:
      "Journey through the monumental Book of Enoch (Henok), an integral part of the Ethiopian Orthodox Tewahedo canon. Experience the Book of the Watchers, Similitudes of the Messiah, Heavenly Luminaries, and Dream Visions.",
    category: "Old Testament",
    icon: "compass",
    accentColor: "#D97706",
    totalChapters: enochReadings.length,
    defaultDailyTarget: 4,
    recommendedDays: 30,
    canonCompatibility: "ethiopian_orthodox",
    sections: [
      {
        title: "The Book of the Watchers",
        subtitle: "Fall of the Angels & Enoch’s Journeys",
        chaptersCount: 36,
        booksDescription: "Enoch 1–36",
      },
      {
        title: "The Similitudes of the Messiah",
        subtitle: "The Son of Man & Righteous Judge",
        chaptersCount: 35,
        booksDescription: "Enoch 37–71",
      },
      {
        title: "The Heavenly Luminaries",
        subtitle: "The Revolutions of Heavenly Lights & Calendar",
        chaptersCount: 11,
        booksDescription: "Enoch 72–82",
      },
      {
        title: "The Dream Visions",
        subtitle: "Animal Apocalypse & Apocalypse of Weeks",
        chaptersCount: 8,
        booksDescription: "Enoch 83–90",
      },
      {
        title: "The Epistle of Enoch",
        subtitle: "Exhortations, Wisdom & Final Blessing",
        chaptersCount: 18,
        booksDescription: "Enoch 91–108",
      },
    ],
    readings: enochReadings,
  },
  {
    id: "jubilees_kufale_25",
    title: "Book of Jubilees (Kufale)",
    subtitle: "The Division of Days & Patriarchal History (50 Chapters)",
    description:
      "Read the ancient Book of Jubilees (Kufale), chronicling biblical history divided into 49-year jubilees, from the creation of the world to the covenant at Mount Sinai.",
    category: "Old Testament",
    icon: "layers",
    accentColor: "#B45309",
    totalChapters: jubileesReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 25,
    canonCompatibility: "ethiopian_orthodox",
    sections: [
      {
        title: "Creation to the Patriarchs",
        subtitle: "From the Garden of Eden to Noah",
        chaptersCount: 10,
        booksDescription: "Jubilees 1–10",
      },
      {
        title: "Abraham & the Everlasting Covenant",
        subtitle: "Faith, Circumcision & the Feast of Weeks",
        chaptersCount: 13,
        booksDescription: "Jubilees 11–23",
      },
      {
        title: "Isaac, Jacob & the Twelve Tribes",
        subtitle: "The Blessings of Israel & the Sons of Jacob",
        chaptersCount: 15,
        booksDescription: "Jubilees 24–38",
      },
      {
        title: "Joseph, the Descent & Jubilee Law",
        subtitle: "From Egypt to the Revelation at Sinai",
        chaptersCount: 12,
        booksDescription: "Jubilees 39–50",
      },
    ],
    readings: jubileesReadings,
  },
  {
    id: "meqabyan_orthodox_21",
    title: "The Ethiopian Maccabees (Meqabyan)",
    subtitle: "Faithful Endurance & Divine Deliverance (67 Chapters)",
    description:
      "Explore 1, 2, and 3 Meqabyan—unique to the Ethiopian Orthodox canon—depicting the steadfast resistance and faith of Meqabis and his sons against idolatry.",
    category: "Old Testament",
    icon: "shield",
    accentColor: "#DC2626",
    totalChapters: meqabyanReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 21,
    canonCompatibility: "ethiopian_orthodox",
    sections: [
      {
        title: "1 Meqabyan",
        subtitle: "The Resistance of Meqabis & His Sons",
        chaptersCount: 36,
        booksDescription: "1 Meqabyan (36 Chapters)",
      },
      {
        title: "2 Meqabyan",
        subtitle: "King Tsirutsaydan & Steadfast Faith",
        chaptersCount: 21,
        booksDescription: "2 Meqabyan (21 Chapters)",
      },
      {
        title: "3 Meqabyan",
        subtitle: "Victory, Repentance & Divine Justice",
        chaptersCount: 10,
        booksDescription: "3 Meqabyan (10 Chapters)",
      },
    ],
    readings: meqabyanReadings,
  },
  {
    id: "eotc_wisdom_poetry_25",
    title: "EOTC Wisdom: Sirak & Tegsats",
    subtitle: "Wisdom of Solomon, Sirach & Book of Reproof (77 Chapters)",
    description:
      "Meditate on profound wisdom literature cherished in Ethiopian tradition: Wisdom of Solomon, the wisdom of Sirach (Sirak), and the Book of Reproof (Tegsats).",
    category: "Wisdom & Poetry",
    icon: "feather",
    accentColor: "#059669",
    totalChapters: eotcWisdomReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 25,
    canonCompatibility: "ethiopian_orthodox",
    sections: [
      {
        title: "Wisdom of Solomon",
        subtitle: "Immortality, Righteousness & Divine Wisdom",
        chaptersCount: 19,
        booksDescription: "Wisdom of Solomon (19 Chapters)",
      },
      {
        title: "Book of Sirach (Sirak)",
        subtitle: "Practical Discernment & Fear of the Lord",
        chaptersCount: 51,
        booksDescription: "Sirach (51 Chapters)",
      },
      {
        title: "The Book of Reproof (Tegsats)",
        subtitle: "Moral Admonition & Godly Discipline",
        chaptersCount: 7,
        booksDescription: "Tegsats (7 Chapters)",
      },
    ],
    readings: eotcWisdomReadings,
  },
  {
    id: "ethiopic_didascalia_clement_20",
    title: "Early Church Order: Didascalia & Clement",
    subtitle: "Apostolic Ordinances & Pastoral Guidance (50 Chapters)",
    description:
      "Study the revered broader New Testament books of the Ethiopian tradition: the Ethiopic Didascalia and Ethiopic Clement, detailing apostolic worship, discipline, and ministry.",
    category: "New Testament",
    icon: "book-open",
    accentColor: "#7C3AED",
    totalChapters: ethiopicDidascaliaClementReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 20,
    canonCompatibility: "ethiopian_orthodox",
    sections: [
      {
        title: "Ethiopic Didascalia",
        subtitle: "Christian Living & Apostolic Fellowship",
        chaptersCount: 43,
        booksDescription: "Ethiopic Didascalia (43 Chapters)",
      },
      {
        title: "Ethiopic Clement",
        subtitle: "Apostolic Faith, Revelations & Pastoral Letters",
        chaptersCount: 7,
        booksDescription: "Ethiopic Clement (7 Chapters)",
      },
    ],
    readings: ethiopicDidascaliaClementReadings,
  },

  // 2. Catholic Canon Plans
  {
    id: "tobit_judith_15",
    title: "Tobit & Judith: Faith & Deliverance",
    subtitle: "Heroic Faith, Angelic Guidance & Courage (30 Chapters)",
    description:
      "Two inspiring narratives of the Catholic deuterocanon: the family piety and divine guidance of the archangel Raphael in Tobit, followed by Judith’s heroic courage delivering Bethulia.",
    category: "Old Testament",
    icon: "heart",
    accentColor: "#EC4899",
    totalChapters: tobitJudithReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 15,
    canonCompatibility: "catholic",
    sections: [
      {
        title: "The Book of Tobit",
        subtitle: "Providence, Prayer & St. Raphael",
        chaptersCount: 14,
        booksDescription: "Tobit (14 Chapters)",
      },
      {
        title: "The Book of Judith",
        subtitle: "Courage, Devotion & Deliverance",
        chaptersCount: 16,
        booksDescription: "Judith (16 Chapters)",
      },
    ],
    readings: tobitJudithReadings,
  },
  {
    id: "catholic_maccabees_20",
    title: "1 & 2 Maccabees: The Battle for Faith",
    subtitle: "The Maccabean Revolt & Holy Martyrs (31 Chapters)",
    description:
      "Follow the heroic defense of the covenant, the restoration and cleansing of the Temple (Hanukkah), and the steadfast witness of the holy martyrs in 1 and 2 Maccabees.",
    category: "Old Testament",
    icon: "shield",
    accentColor: "#EA580C",
    totalChapters: catholicMaccabeesReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 20,
    canonCompatibility: "catholic",
    sections: [
      {
        title: "1 Maccabees",
        subtitle: "The Revolt & Cleansing of the Sanctuary",
        chaptersCount: 16,
        booksDescription: "1 Maccabees (16 Chapters)",
      },
      {
        title: "2 Maccabees",
        subtitle: "Prayer, Resurrection & Holy Martyrs",
        chaptersCount: 15,
        booksDescription: "2 Maccabees (15 Chapters)",
      },
    ],
    readings: catholicMaccabeesReadings,
  },
  {
    id: "catholic_wisdom_25",
    title: "Wisdom of Solomon & Sirach",
    subtitle: "Divine Wisdom, Justice & Life of Virtue (70 Chapters)",
    description:
      "Immerse yourself in the poetic and instructional treasures of the Catholic wisdom books: the radiance of Divine Wisdom in Solomon, and the practical daily guidance of Ben Sira.",
    category: "Wisdom & Poetry",
    icon: "feather",
    accentColor: "#2563EB",
    totalChapters: catholicWisdomReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 25,
    canonCompatibility: "catholic",
    sections: [
      {
        title: "Wisdom of Solomon",
        subtitle: "The Spirit of Wisdom & Justice",
        chaptersCount: 19,
        booksDescription: "Wisdom of Solomon (19 Chapters)",
      },
      {
        title: "Book of Sirach",
        subtitle: "Wisdom in Daily Life & Praise of the Ancestors",
        chaptersCount: 51,
        booksDescription: "Sirach (51 Chapters)",
      },
    ],
    readings: catholicWisdomReadings,
  },

  // 3. Eastern Orthodox Canon Plans
  {
    id: "orthodox_maccabees_20",
    title: "The Four Books of Maccabees",
    subtitle: "Defense of the Law & Devout Reason (56 Chapters)",
    description:
      "Experience all four books of Maccabees preserved in Eastern Orthodox tradition: the Hasmonean struggle (1-2 Maccabees), Egyptian deliverance (3 Maccabees), and philosophical praise of devout reason (4 Maccabees).",
    category: "Old Testament",
    icon: "shield",
    accentColor: "#7C3AED",
    totalChapters: orthodoxMaccabeesReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 20,
    canonCompatibility: "eastern_orthodox",
    sections: [
      {
        title: "1 & 2 Maccabees",
        subtitle: "The Hasmonean Defense of the Law",
        chaptersCount: 31,
        booksDescription: "1 & 2 Maccabees (31 Chapters)",
      },
      {
        title: "3 Maccabees",
        subtitle: "Persecution & Deliverance in Egypt",
        chaptersCount: 7,
        booksDescription: "3 Maccabees (7 Chapters)",
      },
      {
        title: "4 Maccabees",
        subtitle: "The Triumph of Devout Reason",
        chaptersCount: 18,
        booksDescription: "4 Maccabees (18 Chapters)",
      },
    ],
    readings: orthodoxMaccabeesReadings,
  },
  {
    id: "orthodox_narratives_20",
    title: "Orthodox Narratives: 1 Esdras, Tobit & Judith",
    subtitle: "Return from Exile, Healing & Courage (39 Chapters)",
    description:
      "A rich 20-day journey through three beloved narrative texts: Greek 1 Esdras (the feast of Darius and temple rebuild), Tobit (angelic accompaniment), and Judith (courage in faith).",
    category: "Old Testament",
    icon: "compass",
    accentColor: "#0EA5E9",
    totalChapters: orthodoxNarrativesReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 20,
    canonCompatibility: "eastern_orthodox",
    sections: [
      {
        title: "1 Esdras",
        subtitle: "Return from Exile & the Feast of Darius",
        chaptersCount: 9,
        booksDescription: "1 Esdras (9 Chapters)",
      },
      {
        title: "The Book of Tobit",
        subtitle: "Faithfulness & Divine Healing",
        chaptersCount: 14,
        booksDescription: "Tobit (14 Chapters)",
      },
      {
        title: "The Book of Judith",
        subtitle: "Deliverance of Bethulia",
        chaptersCount: 16,
        booksDescription: "Judith (16 Chapters)",
      },
    ],
    readings: orthodoxNarrativesReadings,
  },
  {
    id: "orthodox_wisdom_prophecy_25",
    title: "Orthodox Wisdom & Prophecy",
    subtitle: "Solomon, Sirach, Prayer of Manasseh & Baruch (77 Chapters)",
    description:
      "Delve into the Orthodox Anagignoskomena: Wisdom of Solomon, Sirach, the penitent Prayer of Manasseh, the Book of Baruch, and the Letter of Jeremiah.",
    category: "Wisdom & Poetry",
    icon: "feather",
    accentColor: "#F59E0B",
    totalChapters: orthodoxWisdomProphecyReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 25,
    canonCompatibility: "eastern_orthodox",
    sections: [
      {
        title: "Wisdom of Solomon",
        subtitle: "The Glory of Divine Wisdom",
        chaptersCount: 19,
        booksDescription: "Wisdom of Solomon (19 Chapters)",
      },
      {
        title: "Book of Sirach",
        subtitle: "Discipline, Friendship & Creation",
        chaptersCount: 51,
        booksDescription: "Sirach (51 Chapters)",
      },
      {
        title: "Prayer of Manasseh & Prophecies of Baruch",
        subtitle: "Penitence, Hope & the Law",
        chaptersCount: 7,
        booksDescription:
          "Manasseh (1 ch), Baruch (5 ch), Letter of Jeremiah (1 ch)",
      },
    ],
    readings: orthodoxWisdomProphecyReadings,
  },
  {
    id: "wisdom_poetry_60",
    title: "Wisdom & Poetry",
    subtitle: "Psalms, Proverbs & Reflections",
    description:
      "A reflective, poetic journey through Job, Psalms, Proverbs, Ecclesiastes, and the Song of Solomon (243 chapters of worship and practical wisdom).",
    category: "Wisdom & Poetry",
    icon: "feather",
    accentColor: "#8B5CF6",
    totalChapters: wisdomReadings.length,
    defaultDailyTarget: 4,
    recommendedDays: 60,
    sections: [
      {
        title: "The Book of Job",
        subtitle: "Sovereignty & Faith in Trial",
        chaptersCount: 42,
        booksDescription: "Job (42 Chapters)",
      },
      {
        title: "The Book of Psalms",
        subtitle: "Songs of Prayer & Worship",
        chaptersCount: 150,
        booksDescription: "Psalms 1 to 150",
      },
      {
        title: "The Book of Proverbs",
        subtitle: "Daily Wisdom & Discipline",
        chaptersCount: 31,
        booksDescription: "Proverbs 1 to 31",
      },
      {
        title: "Ecclesiastes & Song of Solomon",
        subtitle: "Life Purpose & Devotional Love",
        chaptersCount: 20,
        booksDescription: "Ecclesiastes & Song of Solomon",
      },
    ],
    readings: wisdomReadings,
  },
  {
    id: "pauline_epistles_30",
    title: "The Pauline Epistles",
    subtitle: "The Letters of Paul",
    description:
      "Study the 13 letters of the Apostle Paul from Romans to Philemon (87 chapters). Essential foundational theology, church doctrine, and practical living.",
    category: "Epistles",
    icon: "mail",
    accentColor: "#6366F1",
    totalChapters: paulineReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 30,
    sections: [
      {
        title: "Foundational Epistles",
        subtitle: "Grace, Justification & Freedom",
        chaptersCount: 58,
        booksDescription: "Romans, 1 & 2 Corinthians, Galatians",
      },
      {
        title: "The Prison Epistles",
        subtitle: "Christ Exalted & Daily Unity",
        chaptersCount: 15,
        booksDescription: "Ephesians, Philippians, Colossians, Philemon",
      },
      {
        title: "Pastoral & Church Letters",
        subtitle: "Leadership, Hope & Ministry Order",
        chaptersCount: 14,
        booksDescription: "1 & 2 Thessalonians, 1 & 2 Timothy, Titus",
      },
    ],
    readings: paulineReadings,
  },
  {
    id: "torah_books_60",
    title: "The Books of the Law",
    subtitle: "The Pentateuch (Genesis to Deuteronomy)",
    description:
      "Discover creation, covenant, the Exodus, and the Law of Moses across the first 5 books of the Bible (187 chapters).",
    category: "Old Testament",
    icon: "shield",
    accentColor: "#F59E0B",
    totalChapters: torahReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 60,
    sections: [
      {
        title: "Genesis",
        subtitle: "In the Beginning: Patriarchs & Promises",
        chaptersCount: 50,
        booksDescription: "Genesis (50 Chapters)",
      },
      {
        title: "Exodus & Leviticus",
        subtitle: "Redemption, Tabernacle & Holiness",
        chaptersCount: 67,
        booksDescription: "Exodus & Leviticus",
      },
      {
        title: "Numbers & Deuteronomy",
        subtitle: "Wilderness & Covenant Renewal",
        chaptersCount: 70,
        booksDescription: "Numbers & Deuteronomy",
      },
    ],
    readings: torahReadings,
  },
  {
    id: "general_epistles_rev_30",
    title: "Apostolic Epistles & Revelation",
    subtitle: "Hebrews through Revelation",
    description:
      "Journey through Hebrews, James, Peter, John, Jude, and the prophetic visions of Revelation (56 chapters).",
    category: "Epistles",
    icon: "globe",
    accentColor: "#EC4899",
    totalChapters: generalEpistlesReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 28,
    sections: [
      {
        title: "Hebrews & James",
        subtitle: "Superiority of Christ & Active Faith",
        chaptersCount: 18,
        booksDescription: "Hebrews & James",
      },
      {
        title: "Letters of Peter & Jude",
        subtitle: "Living Hope & Holy Vigilance",
        chaptersCount: 9,
        booksDescription: "1 & 2 Peter, Jude",
      },
      {
        title: "Letters of John",
        subtitle: "Love, Truth & Eternal Life",
        chaptersCount: 7,
        booksDescription: "1, 2, 3 John",
      },
      {
        title: "The Revelation of Jesus Christ",
        subtitle: "The Victory of the Lamb",
        chaptersCount: 22,
        booksDescription: "Revelation 1 to 22",
      },
    ],
    readings: generalEpistlesReadings,
  },
  {
    id: "gen_pro_jhn_50",
    title: "Genesis, Proverbs & Gospel of John",
    subtitle: "3 Parallel Tracks Daily (102 Chapters)",
    description:
      "A rich multi-stream daily rhythm: read 1 chapter of Genesis (OT History), 1 chapter of Proverbs (Wisdom), and 1 chapter of John (Gospel) every day.",
    category: "Multi-Track",
    icon: "layers",
    accentColor: "#10B981",
    totalChapters: triTrackReadings.length,
    defaultDailyTarget: 3,
    recommendedDays: 50,
    allowCustomPace: false, // Strict 3-track rhythm per cycle
    allowSelfPaced: true, // Supports self-paced session flow
    sections: [
      {
        title: "Genesis Track",
        subtitle: "Creation, Patriarchs & Providence",
        chaptersCount: 50,
        booksDescription: "Genesis 1 to 50",
      },
      {
        title: "Proverbs Track",
        subtitle: "Daily Wisdom for Skillful Living",
        chaptersCount: 31,
        booksDescription: "Proverbs 1 to 31",
      },
      {
        title: "Gospel of John Track",
        subtitle: "Life, Light & The Word Made Flesh",
        chaptersCount: 21,
        booksDescription: "John 1 to 21",
      },
    ],
    readings: triTrackReadings,
  },
  {
    id: "origins_verses_7",
    title: "Origins: Creation to Babel",
    subtitle: "Verse-by-Verse Thematic Journey (7 Days)",
    description:
      "A curated thematic roadmap with specific verse ranges (Genesis 1:1-31, 2:1-25, 3:1-24, John 1:1-18) exploring creation, the Fall, the Flood, and the Word made flesh.",
    category: "Chronological",
    icon: "compass",
    accentColor: "#8B5CF6",
    totalChapters: originsVerseReadings.length,
    defaultDailyTarget: 1,
    recommendedDays: 7,
    allowCustomPace: true,
    allowSelfPaced: true,
    sections: [
      {
        title: "Creation & Paradise",
        subtitle: "The Cosmos & The Garden",
        chaptersCount: 2,
        booksDescription: "Gen 1:1-31, Gen 2:1-25",
      },
      {
        title: "The Fall & First Murder",
        subtitle: "Rebellion & Consequences",
        chaptersCount: 2,
        booksDescription: "Gen 3:1-24, Gen 4:1-26",
      },
      {
        title: "Judgment & The Nations",
        subtitle: "Noah’s Ark & Tower of Babel",
        chaptersCount: 3,
        booksDescription: "Gen 6:1-22, Gen 9:1-17, Gen 11:1-9",
      },
      {
        title: "The True Origin",
        subtitle: "The Eternal Word",
        chaptersCount: 1,
        booksDescription: "John 1:1-18",
      },
    ],
    readings: originsVerseReadings,
  },
  {
    id: "passion_week_7",
    title: "Passion Week: The Cross & Resurrection",
    subtitle: "7-Day Strict Scheduled Holy Week Itinerary",
    description:
      "A strictly scheduled 7-day chronological devotion following the final steps of Jesus from the Triumphal Entry to the Empty Tomb (Luke 19–24 & John 20).",
    category: "Gospels",
    icon: "sun",
    accentColor: "#EF4444",
    totalChapters: 7,
    defaultDailyTarget: 1,
    recommendedDays: 7,
    allowCustomPace: false, // Strict 1-chapter per day schedule
    allowSelfPaced: false, // Scheduled calendar mode only (Self-paced button hidden)
    sections: [
      {
        title: "Triumphal Entry & Cleansing",
        subtitle: "Palm Sunday & Temple",
        chaptersCount: 2,
        booksDescription: "Luke 19–20",
      },
      {
        title: "The Olivet Discourse & Upper Room",
        subtitle: "Last Supper & Gethsemane",
        chaptersCount: 2,
        booksDescription: "Luke 21–22",
      },
      {
        title: "Crucifixion & Resurrection",
        subtitle: "Calvary, Tomb & Living Lord",
        chaptersCount: 3,
        booksDescription: "Luke 23–24, John 20",
      },
    ],
    readings: [
      {
        id: "pass_1",
        bookId: "luk",
        bookName: "Luke",
        chapter: 19,
        displayText: "Luke 19 (The Triumphal Entry)",
        order: 1,
      },
      {
        id: "pass_2",
        bookId: "luk",
        bookName: "Luke",
        chapter: 20,
        displayText: "Luke 20 (Authority & Vineyard)",
        order: 2,
      },
      {
        id: "pass_3",
        bookId: "luk",
        bookName: "Luke",
        chapter: 21,
        displayText: "Luke 21 (The Olivet Discourse)",
        order: 3,
      },
      {
        id: "pass_4",
        bookId: "luk",
        bookName: "Luke",
        chapter: 22,
        displayText: "Luke 22 (The Last Supper)",
        order: 4,
      },
      {
        id: "pass_5",
        bookId: "luk",
        bookName: "Luke",
        chapter: 23,
        displayText: "Luke 23 (The Crucifixion)",
        order: 5,
      },
      {
        id: "pass_6",
        bookId: "luk",
        bookName: "Luke",
        chapter: 24,
        displayText: "Luke 24 (The Empty Tomb)",
        order: 6,
      },
      {
        id: "pass_7",
        bookId: "jhn",
        bookName: "John",
        chapter: 20,
        displayText: "John 20 (The Risen Savior)",
        order: 7,
      },
    ],
  },
  {
    id: "psalms_peace_14",
    title: "Psalms of Peace & Comfort",
    subtitle: "14-Day Devotional Journey in the Psalms",
    description:
      "Find rest, strength, and quiet trust in God with 14 beloved Psalms of assurance, protection, and thanksgiving.",
    category: "Wisdom & Poetry",
    icon: "heart",
    accentColor: "#8B5CF6",
    totalChapters: 14,
    defaultDailyTarget: 1,
    recommendedDays: 14,
    allowCustomPace: true,
    allowSelfPaced: true,
    sections: [
      {
        title: "The Lord Our Shepherd & Fortress",
        subtitle: "Peace in the Shadow of the Almighty",
        chaptersCount: 7,
        booksDescription: "Psalms 23, 27, 34, 46, 62, 91, 103",
      },
      {
        title: "Praise, Deliverance & Eternal Care",
        subtitle: "Thanksgiving & Unshakable Trust",
        chaptersCount: 7,
        booksDescription: "Psalms 116, 121, 130, 139, 143, 145, 150",
      },
    ],
    readings: [
      {
        id: "psa_p_1",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 23,
        displayText: "Psalm 23 (The Lord Is My Shepherd)",
        order: 1,
      },
      {
        id: "psa_p_2",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 27,
        displayText: "Psalm 27 (Light & Salvation)",
        order: 2,
      },
      {
        id: "psa_p_3",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 34,
        displayText: "Psalm 34 (Taste and See)",
        order: 3,
      },
      {
        id: "psa_p_4",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 46,
        displayText: "Psalm 46 (God Is Our Refuge)",
        order: 4,
      },
      {
        id: "psa_p_5",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 62,
        displayText: "Psalm 62 (My Soul Waits in Silence)",
        order: 5,
      },
      {
        id: "psa_p_6",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 91,
        displayText: "Psalm 91 (Dwelling in Secret Place)",
        order: 6,
      },
      {
        id: "psa_p_7",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 103,
        displayText: "Psalm 103 (Bless the Lord, O My Soul)",
        order: 7,
      },
      {
        id: "psa_p_8",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 116,
        displayText: "Psalm 116 (Thanksgiving for Deliverance)",
        order: 8,
      },
      {
        id: "psa_p_9",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 121,
        displayText: "Psalm 121 (My Help Comes from the Lord)",
        order: 9,
      },
      {
        id: "psa_p_10",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 130,
        displayText: "Psalm 130 (Out of the Depths)",
        order: 10,
      },
      {
        id: "psa_p_11",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 139,
        displayText: "Psalm 139 (Fearfully & Wonderfully Made)",
        order: 11,
      },
      {
        id: "psa_p_12",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 143,
        displayText: "Psalm 143 (Teach Me to Do Your Will)",
        order: 12,
      },
      {
        id: "psa_p_13",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 145,
        displayText: "Psalm 145 (Great Is the Lord)",
        order: 13,
      },
      {
        id: "psa_p_14",
        bookId: "psa",
        bookName: "Psalms",
        chapter: 150,
        displayText: "Psalm 150 (Let Everything Praise the Lord)",
        order: 14,
      },
    ],
  },
  {
    id: "proverbs_31",
    title: "Proverbs: 31 Days of Wisdom",
    subtitle: "1 Chapter a Day for Skillful Living",
    description:
      "Read 1 chapter of Proverbs each day for a month. Practical guidance for work, speech, relationships, discipline, and reverence for God.",
    category: "Wisdom & Poetry",
    icon: "feather",
    accentColor: "#F59E0B",
    totalChapters: 31,
    defaultDailyTarget: 1,
    recommendedDays: 31,
    allowCustomPace: true,
    allowSelfPaced: true,
    sections: [
      {
        title: "The Beginning of Wisdom",
        subtitle: "Youth, Discernment & The Call of Wisdom",
        chaptersCount: 9,
        booksDescription: "Proverbs 1 to 9",
      },
      {
        title: "Solomonic Sayings & Counsel",
        subtitle: "Righteous Living & Honest Speech",
        chaptersCount: 15,
        booksDescription: "Proverbs 10 to 24",
      },
      {
        title: "Royal Proverbs & Virtuous Character",
        subtitle: "Wisdom for Leaders & Daily Faith",
        chaptersCount: 7,
        booksDescription: "Proverbs 25 to 31",
      },
    ],
    readings: Array.from({ length: 31 }, (_, i) => ({
      id: `pro_31_${i + 1}`,
      bookId: "pro",
      bookName: "Proverbs",
      chapter: i + 1,
      displayText: `Proverbs ${i + 1}`,
      order: i + 1,
    })),
  },
  {
    id: "romans_grace_16",
    title: "Romans: The Gospel of Grace",
    subtitle: "16-Day Masterclass in Christian Theology",
    description:
      "Walk deeply through the Apostle Paul’s masterpiece on justification, grace, the Spirit-filled life, and transformed living.",
    category: "Epistles",
    icon: "mail",
    accentColor: "#3B82F6",
    totalChapters: 16,
    defaultDailyTarget: 1,
    recommendedDays: 16,
    allowCustomPace: true,
    allowSelfPaced: true,
    sections: [
      {
        title: "The Power of the Gospel",
        subtitle: "Righteousness by Faith Alone",
        chaptersCount: 4,
        booksDescription: "Romans 1 to 4",
      },
      {
        title: "Peace, Grace & Life in the Spirit",
        subtitle: "No Condemnation in Christ",
        chaptersCount: 4,
        booksDescription: "Romans 5 to 8",
      },
      {
        title: "God’s Sovereign Plan & Mercy",
        subtitle: "Israel, the Nations & Doxology",
        chaptersCount: 3,
        booksDescription: "Romans 9 to 11",
      },
      {
        title: "Living Sacrifices & Community",
        subtitle: "Practical Christian Ethics",
        chaptersCount: 5,
        booksDescription: "Romans 12 to 16",
      },
    ],
    readings: Array.from({ length: 16 }, (_, i) => ({
      id: `rom_16_${i + 1}`,
      bookId: "rom",
      bookName: "Romans",
      chapter: i + 1,
      displayText: `Romans ${i + 1}`,
      order: i + 1,
    })),
  },
  {
    id: "genesis_creation_verses",
    title: "Genesis: Creation in Depth",
    subtitle: "Verse-by-Verse Journey Through Days of Creation (6 Days)",
    description:
      "A granular verse-by-verse devotional plan walking through Genesis 1–3 by section (Gen 1:1-5, 1:6-8, 1:9-13, 1:14-19, 1:20-23, 1:24-31, and Genesis 2–3). Completing all sections automatically marks Genesis chapters complete.",
    category: "Old Testament",
    icon: "sun",
    accentColor: "#10B981",
    totalChapters: genesisVerseByVerseReadings.length,
    defaultDailyTarget: 2,
    recommendedDays: 6,
    allowCustomPace: true,
    allowSelfPaced: true,
    sections: [
      {
        title: "The Six Days of Creation",
        subtitle: "From Formless Void to the Living Cosmos",
        chaptersCount: 6,
        booksDescription: "Genesis 1:1–31",
      },
      {
        title: "The Sabbath & Garden of Eden",
        subtitle: "Rest, Breath of Life & Sacred Covenant",
        chaptersCount: 3,
        booksDescription: "Genesis 2:1–25",
      },
      {
        title: "The Fall & First Promise",
        subtitle: "Temptation, Brokenness & the Seed of Promise",
        chaptersCount: 3,
        booksDescription: "Genesis 3:1–24",
      },
    ],
    readings: genesisVerseByVerseReadings,
  },
];

// Helper to find plan by ID
const READING_PLANS_MAP = new Map<string, ReadingPlanTemplate>(
  READING_PLANS.map((p) => [p.id, p])
);

export const getReadingPlanById = (
  id: string,
  customPlans?: ReadingPlanTemplate[]
): ReadingPlanTemplate | undefined => {
  if (customPlans && customPlans.length > 0) {
    const found = customPlans.find((p) => p.id === id);
    if (found) return found;
  }
  return READING_PLANS_MAP.get(id);
};

export type CustomPlanOrderType =
  "canonical" | "chronological" | "blended" | "custom";

// Approximate traditional chronological order of biblical writings
export const CHRONOLOGICAL_BOOK_ORDER: string[] = [
  "gen",
  "job",
  "exo",
  "lev",
  "num",
  "deu",
  "jos",
  "jdg",
  "rut",
  "1sa",
  "2sa",
  "psa",
  "sng",
  "pro",
  "ecc",
  "1ki",
  "2ki",
  "1ch",
  "2ch",
  "oba",
  "jol",
  "jon",
  "amo",
  "hos",
  "isa",
  "mic",
  "nah",
  "zep",
  "hab",
  "jer",
  "lam",
  "eze",
  "dan",
  "ezr",
  "neh",
  "est",
  "hag",
  "zec",
  "mal",
  // New Testament Chronological Order
  "jas",
  "gal",
  "1th",
  "2th",
  "1co",
  "2co",
  "rom",
  "luk",
  "act",
  "col",
  "phm",
  "eph",
  "php",
  "mat",
  "1ti",
  "tit",
  "1pe",
  "heb",
  "2ti",
  "2pe",
  "jud",
  "mrk",
  "jhn",
  "1jn",
  "2jn",
  "3jn",
  "rev",
];

export interface BuildCustomPlanParams {
  id?: string;
  title: string;
  subtitle?: string;
  description?: string;
  category?: PlanCategory;
  icon?: string;
  accentColor?: string;
  bookIds: string[];
  orderType?: CustomPlanOrderType;
  defaultDailyTarget?: number;
  recommendedDays?: number;
  allowCustomPace?: boolean;
  allowSelfPaced?: boolean;
  canonCompatibility?: BibleCanon | null;
}

export const buildCustomReadingPlanTemplate = (
  params: BuildCustomPlanParams
): ReadingPlanTemplate => {
  const {
    id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    subtitle = "Custom Reading Plan",
    description = "A personalized reading plan curated for your reading journey.",
    category = params.category && params.category !== "All"
      ? params.category
      : deducePlanCategory(params.bookIds),
    icon = "bookmark",
    accentColor = "#6366F1",
    bookIds,
    orderType = "canonical",
    defaultDailyTarget = 3,
    recommendedDays,
  } = params;

  // Filter valid books
  const validBooks = bookIds
    .map((bId) => BIBLE_BOOK_MAP[bId])
    .filter((b): b is NonNullable<typeof b> => Boolean(b));

  const sortedBooks = [...validBooks];

  if (orderType === "canonical") {
    sortedBooks.sort((a, b) => a.order - b.order);
  } else if (orderType === "chronological") {
    sortedBooks.sort((a, b) => {
      const idxA = CHRONOLOGICAL_BOOK_ORDER.indexOf(a.id);
      const idxB = CHRONOLOGICAL_BOOK_ORDER.indexOf(b.id);
      const safeA = idxA >= 0 ? idxA : a.order + 100;
      const safeB = idxB >= 0 ? idxB : b.order + 100;
      return safeA - safeB;
    });
  }

  const readings: PlanReadingItem[] = [];
  let orderCounter = 1;

  if (orderType === "blended" && sortedBooks.length > 1) {
    // Group books into OT vs NT or categories
    const otBooks = sortedBooks.filter((b) => b.testament === "OT");
    const ntBooks = sortedBooks.filter((b) => b.testament === "NT");

    if (otBooks.length > 0 && ntBooks.length > 0) {
      // Build chapter arrays for each stream
      const otItems: PlanReadingItem[] = [];
      const ntItems: PlanReadingItem[] = [];

      for (const b of otBooks) {
        for (let ch = 1; ch <= b.chapters; ch++) {
          otItems.push({
            id: `${b.id}_${ch}`,
            bookId: b.id,
            bookName: b.name,
            chapter: ch,
            track: "Old Testament",
            order: 0,
          });
        }
      }

      for (const b of ntBooks) {
        for (let ch = 1; ch <= b.chapters; ch++) {
          ntItems.push({
            id: `${b.id}_${ch}`,
            bookId: b.id,
            bookName: b.name,
            chapter: ch,
            track: "New Testament",
            order: 0,
          });
        }
      }

      // Interleave items
      let otIdx = 0;
      let ntIdx = 0;
      while (otIdx < otItems.length || ntIdx < ntItems.length) {
        if (otIdx < otItems.length) {
          const item = otItems[otIdx++];
          readings.push({ ...item, order: orderCounter++ });
        }
        if (ntIdx < ntItems.length) {
          const item = ntItems[ntIdx++];
          readings.push({ ...item, order: orderCounter++ });
        }
      }
    } else {
      // Single testament blended - sequential
      for (const book of sortedBooks) {
        for (let ch = 1; ch <= book.chapters; ch++) {
          readings.push({
            id: `${book.id}_${ch}`,
            bookId: book.id,
            bookName: book.name,
            chapter: ch,
            track: book.category,
            order: orderCounter++,
          });
        }
      }
    }
  } else {
    // Canonical or Chronological sequential items
    for (const book of sortedBooks) {
      for (let ch = 1; ch <= book.chapters; ch++) {
        readings.push({
          id: `${book.id}_${ch}`,
          bookId: book.id,
          bookName: book.name,
          chapter: ch,
          track: book.category,
          order: orderCounter++,
        });
      }
    }
  }

  const totalChapters = readings.length;

  // Build sections from grouped categories
  const categoryGroups = new Map<string, typeof validBooks>();
  for (const b of sortedBooks) {
    const list = categoryGroups.get(b.category) || [];
    list.push(b);
    categoryGroups.set(b.category, list);
  }

  const sections: PlanSection[] = [];
  for (const [catName, booksList] of categoryGroups.entries()) {
    const chCount = booksList.reduce((sum, b) => sum + b.chapters, 0);
    const names = booksList.map((b) => b.name).join(", ");
    sections.push({
      title: catName,
      subtitle: `${booksList.length} ${booksList.length === 1 ? "Book" : "Books"} · ${chCount} Chapters`,
      chaptersCount: chCount,
      booksDescription: names.length > 70 ? `${names.slice(0, 67)}...` : names,
    });
  }

  const safePace = Math.max(1, defaultDailyTarget);
  const calculatedDays =
    recommendedDays || Math.max(1, Math.ceil(totalChapters / safePace));

  return {
    id,
    title,
    subtitle,
    description,
    category,
    icon,
    accentColor,
    totalChapters,
    defaultDailyTarget: safePace,
    recommendedDays: calculatedDays,
    allowCustomPace:
      params.allowCustomPace !== undefined ? params.allowCustomPace : true,
    allowSelfPaced:
      params.allowSelfPaced !== undefined ? params.allowSelfPaced : true,
    canonCompatibility: params.canonCompatibility ?? null,
    sections:
      sections.length > 0
        ? sections
        : [
            {
              title: "Scripture Readings",
              subtitle: `${sortedBooks.length} Books · ${totalChapters} Chapters`,
              chaptersCount: totalChapters,
              booksDescription: sortedBooks.map((b) => b.name).join(", "),
            },
          ],
    readings,
  };
};

// Bidirectional pace calculations
export interface TargetPaceResult {
  dailyTarget: number;
  totalDays: number;
  startDate: Date;
  endDate: Date;
}

export const calculateProjectedEndDate = (
  startDate: Date,
  totalReadingDays: number,
  activeDays: number[] = [0, 1, 2, 3, 4, 5, 6]
): Date => {
  const safeActiveDays =
    activeDays && activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];
  const current = new Date(startDate.getTime());
  current.setHours(0, 0, 0, 0);

  // If start date itself is not an active day, advance to the first active day
  while (!safeActiveDays.includes(current.getDay())) {
    current.setDate(current.getDate() + 1);
  }

  let activeDaysCount = 1;
  while (activeDaysCount < totalReadingDays) {
    current.setDate(current.getDate() + 1);
    if (safeActiveDays.includes(current.getDay())) {
      activeDaysCount++;
    }
  }

  return current;
};

export const calculatePaceByDailyTarget = (
  totalChapters: number,
  chaptersPerDay: number,
  startDate: Date = new Date(),
  activeDays: number[] = [0, 1, 2, 3, 4, 5, 6]
): TargetPaceResult => {
  const safeDailyTarget = Math.max(1, Math.round(chaptersPerDay));
  const totalDays = Math.ceil(totalChapters / safeDailyTarget);
  const endDate = calculateProjectedEndDate(startDate, totalDays, activeDays);

  return {
    dailyTarget: safeDailyTarget,
    totalDays,
    startDate,
    endDate,
  };
};

export const calculatePaceByEndDate = (
  totalChapters: number,
  startDate: Date = new Date(),
  endDate: Date,
  activeDays: number[] = [0, 1, 2, 3, 4, 5, 6]
): TargetPaceResult => {
  const safeActiveDays =
    activeDays && activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];
  const start = new Date(startDate.getTime());
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate.getTime());
  end.setHours(0, 0, 0, 0);

  let activeDaysBetween = 0;
  const curr = new Date(start.getTime());
  while (curr.getTime() <= end.getTime()) {
    if (safeActiveDays.includes(curr.getDay())) {
      activeDaysBetween++;
    }
    curr.setDate(curr.getDate() + 1);
  }

  const effectiveReadingDays = Math.max(1, activeDaysBetween);
  const dailyTarget = Math.max(
    1,
    Math.ceil(totalChapters / effectiveReadingDays)
  );
  const diffTime = endDate.getTime() - startDate.getTime();
  const calendarDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    dailyTarget,
    totalDays: calendarDays,
    startDate,
    endDate,
  };
};
