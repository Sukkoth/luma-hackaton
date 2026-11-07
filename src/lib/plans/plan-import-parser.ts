import {
  ALL_CANONS_BOOKS,
  BIBLE_BOOK_MAP,
  type BibleBook,
} from "@/data/bibleData";
import {
  type PlanReadingItem,
  type ReadingPlanTemplate,
  type PlanSection,
  type PlanCategory,
  deducePlanCategory,
} from "@/data/readingPlans";

/**
 * Normalizes a raw string by removing non-alphanumeric characters, lowering case,
 * and converting Roman numeral and ordinal prefixes ('i ', 'first ', '1st ') to ('1', '2', '3').
 */
type NormalizeBookStringParams = {
  raw: string;
};

export function normalizeBookString({
  raw,
}: NormalizeBookStringParams): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^i\s+/, "1");
  s = s.replace(/^ii\s+/, "2");
  s = s.replace(/^iii\s+/, "3");
  s = s.replace(/^first\s+/, "1");
  s = s.replace(/^second\s+/, "2");
  s = s.replace(/^third\s+/, "3");
  s = s.replace(/^1st\s+/, "1");
  s = s.replace(/^2nd\s+/, "2");
  s = s.replace(/^3rd\s+/, "3");
  return s.replace(/[^a-z0-9]/g, "");
}

/**
 * Comprehensive dictionary of aliases mapping to canonical book IDs
 */
export const BOOK_ALIAS_MAP: Record<string, string> = {
  // Old Testament
  gen: "gen",
  gene: "gen",
  genesis: "gen",
  ge: "gen",
  gn: "gen",
  exo: "exo",
  exod: "exo",
  exodus: "exo",
  ex: "exo",
  lev: "lev",
  levi: "lev",
  leviticus: "lev",
  lv: "lev",
  num: "num",
  numb: "num",
  numbers: "num",
  nm: "num",
  nu: "num",
  deu: "deu",
  deut: "deu",
  deuteronomy: "deu",
  dt: "deu",
  jos: "jos",
  josh: "jos",
  joshua: "jos",
  jsh: "jos",
  jdg: "jdg",
  judg: "jdg",
  judges: "jdg",
  jdgs: "jdg",
  jg: "jdg",
  rut: "rut",
  ruth: "rut",
  ru: "rut",
  rth: "rut",
  "1sa": "1sa",
  "1sam": "1sa",
  "1samuel": "1sa",
  "1s": "1sa",
  "1sm": "1sa",
  "2sa": "2sa",
  "2sam": "2sa",
  "2samuel": "2sa",
  "2s": "2sa",
  "2sm": "2sa",
  "1ki": "1ki",
  "1kgs": "1ki",
  "1kings": "1ki",
  "1k": "1ki",
  "2ki": "2ki",
  "2kgs": "2ki",
  "2kings": "2ki",
  "2k": "2ki",
  "1ch": "1ch",
  "1chr": "1ch",
  "1chron": "1ch",
  "1chronicles": "1ch",
  "2ch": "2ch",
  "2chr": "2ch",
  "2chron": "2ch",
  "2chronicles": "2ch",
  ezr: "ezr",
  ezra: "ezr",
  neh: "neh",
  nehemiah: "neh",
  est: "est",
  esth: "est",
  esther: "est",
  job: "job",
  jb: "job",
  psa: "psa",
  psalm: "psa",
  psalms: "psa",
  ps: "psa",
  pss: "psa",
  pro: "pro",
  prov: "pro",
  proverbs: "pro",
  pr: "pro",
  prv: "pro",
  ecc: "ecc",
  eccl: "ecc",
  ecclesiastes: "ecc",
  ec: "ecc",
  sng: "sng",
  song: "sng",
  songofsolomon: "sng",
  songofsongs: "sng",
  canticles: "sng",
  sos: "sng",
  isa: "isa",
  isai: "isa",
  isaiah: "isa",
  is: "isa",
  jer: "jer",
  jere: "jer",
  jeremiah: "jer",
  jr: "jer",
  lam: "lam",
  lamentations: "lam",
  la: "lam",
  eze: "eze",
  ezek: "eze",
  ezekiel: "eze",
  ezk: "eze",
  dan: "dan",
  daniel: "dan",
  dn: "dan",
  hos: "hos",
  hosea: "hos",
  ho: "hos",
  jol: "jol",
  joel: "jol",
  jl: "jol",
  amo: "amo",
  amos: "amo",
  am: "amo",
  oba: "oba",
  obad: "oba",
  obadiah: "oba",
  ob: "oba",
  jon: "jon",
  jona: "jon",
  jonah: "jon",
  jnh: "jon",
  mic: "mic",
  mica: "mic",
  micah: "mic",
  mc: "mic",
  nah: "nah",
  nahu: "nah",
  nahum: "nah",
  na: "nah",
  hab: "hab",
  haba: "hab",
  habakkuk: "hab",
  hb: "hab",
  zep: "zep",
  zeph: "zep",
  zephaniah: "zep",
  zp: "zep",
  hag: "hag",
  hagg: "hag",
  haggai: "hag",
  hg: "hag",
  zec: "zec",
  zech: "zec",
  zechariah: "zec",
  zc: "zec",
  mal: "mal",
  mala: "mal",
  malachi: "mal",
  ml: "mal",

  // Deuterocanon & Orthodox
  tob: "tob",
  tobit: "tob",
  tb: "tob",
  jdt: "jdt",
  judith: "jdt",
  jth: "jdt",
  wis: "wis",
  wisdom: "wis",
  wisdomofsolomon: "wis",
  ws: "wis",
  sir: "sir",
  sirach: "sir",
  ecclesiasticus: "sir",
  bar: "bar",
  baruch: "bar",
  "1ma": "1ma",
  "1mac": "1ma",
  "1maccabees": "1ma",
  "2ma": "2ma",
  "2mac": "2ma",
  "2maccabees": "2ma",
  "3ma": "3ma",
  "3mac": "3ma",
  "3maccabees": "3ma",
  "4ma": "4ma",
  "4mac": "4ma",
  "4maccabees": "4ma",
  "1es": "1es",
  "1esdras": "1es",
  man: "man",
  manasseh: "man",
  prayerofmanasseh: "man",
  ps151: "ps151",
  psalm151: "ps151",
  enoch: "enoch",
  "1enoch": "enoch",
  henok: "enoch",
  jub: "jub",
  jubilees: "jub",
  kufale: "jub",
  "1meq": "1meq",
  "1meqabyan": "1meq",
  "2meq": "2meq",
  "2meqabyan": "2meq",
  "3meq": "3meq",
  "3meqabyan": "3meq",
  tegsats: "tegsats",

  // New Testament
  mat: "mat",
  matt: "mat",
  matthew: "mat",
  mt: "mat",
  mrk: "mrk",
  mark: "mrk",
  mk: "mrk",
  mr: "mrk",
  luk: "luk",
  luke: "luk",
  lk: "luk",
  lu: "luk",
  jhn: "jhn",
  john: "jhn",
  jn: "jhn",
  act: "act",
  acts: "act",
  ac: "act",
  rom: "rom",
  roma: "rom",
  romans: "rom",
  ro: "rom",
  rm: "rom",
  "1co": "1co",
  "1cor": "1co",
  "1corinthians": "1co",
  "1c": "1co",
  "2co": "2co",
  "2cor": "2co",
  "2corinthians": "2co",
  "2c": "2co",
  gal: "gal",
  gala: "gal",
  galatians: "gal",
  ga: "gal",
  eph: "eph",
  ephe: "eph",
  ephesians: "eph",
  php: "php",
  phil: "php",
  philippians: "php",
  pp: "php",
  col: "col",
  colo: "col",
  colossians: "col",
  "1th": "1th",
  "1the": "1th",
  "1thess": "1th",
  "1thessalonians": "1th",
  "2th": "2th",
  "2the": "2th",
  "2thess": "2th",
  "2thessalonians": "2th",
  "1ti": "1ti",
  "1tim": "1ti",
  "1timothy": "1ti",
  "1tm": "1ti",
  "2ti": "2ti",
  "2tim": "2ti",
  "2timothy": "2ti",
  "2tm": "2ti",
  tit: "tit",
  titu: "tit",
  titus: "tit",
  tt: "tit",
  phm: "phm",
  phlm: "phm",
  philemon: "phm",
  pm: "phm",
  heb: "heb",
  hebr: "heb",
  hebrews: "heb",
  he: "heb",
  jas: "jas",
  jame: "jas",
  james: "jas",
  jm: "jas",
  js: "jas",
  "1pe": "1pe",
  "1pet": "1pe",
  "1peter": "1pe",
  "1p": "1pe",
  "1pt": "1pe",
  "2pe": "2pe",
  "2pet": "2pe",
  "2peter": "2pe",
  "2p": "2pe",
  "2pt": "2pe",
  "1jn": "1jn",
  "1jhn": "1jn",
  "1john": "1jn",
  "1j": "1jn",
  "2jn": "2jn",
  "2jhn": "2jn",
  "2john": "2jn",
  "2j": "2jn",
  "3jn": "3jn",
  "3jhn": "3jn",
  "3john": "3jn",
  "3j": "3jn",
  jud: "jud",
  jude: "jud",
  jd: "jud",
  rev: "rev",
  reve: "rev",
  revelation: "rev",
  revelations: "rev",
  apocalypse: "rev",
  rv: "rev",
};

type ResolveBibleBookParams = {
  input: string;
};

/**
 * Resolves a book name, abbreviation, or ID into a canonical BibleBook object.
 */
export function resolveBibleBook({
  input,
}: ResolveBibleBookParams): BibleBook | null {
  if (!input) return null;
  const rawClean = input.trim();
  if (BIBLE_BOOK_MAP[rawClean.toLowerCase()]) {
    return BIBLE_BOOK_MAP[rawClean.toLowerCase()];
  }

  const normalized = normalizeBookString({ raw: rawClean });
  const matchedId = BOOK_ALIAS_MAP[normalized];
  if (matchedId && BIBLE_BOOK_MAP[matchedId]) {
    return BIBLE_BOOK_MAP[matchedId];
  }

  // Fallback prefix search in all canon books
  const found = ALL_CANONS_BOOKS.find((b) => {
    const bNorm = normalizeBookString({ raw: b.name });
    return (
      bNorm === normalized ||
      bNorm.startsWith(normalized) ||
      normalized.startsWith(bNorm)
    );
  });

  return found || null;
}

type ResolveTrackForBookParams = {
  book: BibleBook;
};

/**
 * Automatically detects the reading track based on the canonical category of the Bible book.
 */
export function resolveTrackForBook({
  book,
}: ResolveTrackForBookParams): string {
  switch (book.category) {
    case "Law":
      return "Law & Torah";
    case "History":
      return "History";
    case "Poetry & Wisdom":
      return "Poetry & Wisdom";
    case "Major Prophets":
    case "Minor Prophets":
      return "Prophets";
    case "Gospels":
      return "Gospels";
    case "Church History":
      return "Acts & Early Church";
    case "Pauline Epistles":
    case "General Epistles":
      return "Epistles";
    case "Apocalyptic":
      return "Prophecy";
    case "Deuterocanon":
    case "Orthodox Canon":
      return "Deuterocanon";
    default:
      return book.testament === "OT" ? "Old Testament" : "New Testament";
  }
}

export type RawImportReadingRow = {
  day?: number | string;
  book?: string;
  passage?: string;
  chapter?: number | string;
  startVerse?: number | string;
  endVerse?: number | string;
  verses?: string;
  track?: string;
  note?: string;
};

export type ParsedReadingItem = PlanReadingItem & {
  dayNumber: number;
  note?: string;
};

export type PlanValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  template: ReadingPlanTemplate | null;
  dayReadings: Map<number, ParsedReadingItem[]>;
  summary: {
    totalDays: number;
    totalReadings: number;
    uniqueBooks: number;
    tracks: string[];
  };
};

type ParsePassageStringParams = {
  raw: string;
};

export type ParsedPassageResult = {
  bookName: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  verseRange?: string;
};

/**
 * Parses single passage text like "Genesis 1:1-25", "Matt 5", "1 Cor 13", "Psalm 119:1-88"
 */
export function parsePassageString({
  raw,
}: ParsePassageStringParams): ParsedPassageResult | null {
  if (!raw) return null;
  const str = raw.trim();

  // Pattern: [book name] [chapter]:[verses] or [chapter]
  const match = str.match(/^([\d\s\w]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (match) {
    const bookName = (match[1] || "").trim();
    const chapter = parseInt(match[2] || "0", 10);
    const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
    const endVerse = match[4]
      ? parseInt(match[4], 10)
      : startVerse !== undefined
        ? startVerse
        : undefined;
    const verseRange =
      startVerse !== undefined && endVerse !== undefined
        ? `${startVerse}-${endVerse}`
        : undefined;

    return {
      bookName,
      chapter,
      startVerse,
      endVerse,
      verseRange,
    };
  }

  // Pattern without space before number, e.g. "Gen1:1"
  const altMatch = str.match(/^([a-zA-Z]+)(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (altMatch) {
    const bookName = (altMatch[1] || "").trim();
    const chapter = parseInt(altMatch[2] || "0", 10);
    const startVerse = altMatch[3] ? parseInt(altMatch[3], 10) : undefined;
    const endVerse = altMatch[4]
      ? parseInt(altMatch[4], 10)
      : startVerse !== undefined
        ? startVerse
        : undefined;
    const verseRange =
      startVerse !== undefined && endVerse !== undefined
        ? `${startVerse}-${endVerse}`
        : undefined;

    return {
      bookName,
      chapter,
      startVerse,
      endVerse,
      verseRange,
    };
  }

  return null;
}

type ParseCsvTextParams = {
  csvText: string;
};

/**
 * Parses raw CSV/TSV/DSV text into array of row objects
 */
export function parseCsvText({
  csvText,
}: ParseCsvTextParams): RawImportReadingRow[] {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));

  if (lines.length === 0) return [];

  // Detect delimiter (comma, tab, semicolon, pipe)
  const firstLine = lines[0] || "";
  let delimiter = ",";
  if (firstLine.includes("\t")) delimiter = "\t";
  else if (firstLine.includes(";") && !firstLine.includes(",")) delimiter = ";";
  else if (firstLine.includes("|")) delimiter = "|";

  const splitRow = (rowStr: string): string[] => {
    const res: string[] = [];
    let inQuotes = false;
    let field = "";
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        res.push(field.trim());
        field = "";
      } else {
        field += char;
      }
    }
    res.push(field.trim());
    return res;
  };

  const rawHeader = splitRow(lines[0] || "").map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, "")
  );
  const hasHeader = rawHeader.some((h) =>
    ["day", "book", "passage", "chapter", "reading"].includes(h)
  );

  let startIndex = 0;
  const headerColMap: Record<string, number> = {};

  if (hasHeader) {
    startIndex = 1;
    rawHeader.forEach((col, idx) => {
      if (col.includes("day")) headerColMap.day = idx;
      else if (col.includes("book")) headerColMap.book = idx;
      else if (
        col.includes("passage") ||
        col.includes("reference") ||
        col.includes("ref")
      )
        headerColMap.passage = idx;
      else if (col.includes("chap")) headerColMap.chapter = idx;
      else if (col.includes("verse") || col.includes("range"))
        headerColMap.verses = idx;
      else if (
        col.includes("track") ||
        col.includes("category") ||
        col.includes("section")
      )
        headerColMap.track = idx;
      else if (
        col.includes("note") ||
        col.includes("desc") ||
        col.includes("title")
      )
        headerColMap.note = idx;
    });
  }

  const resultRows: RawImportReadingRow[] = [];
  let autoDay = 1;

  for (let i = startIndex; i < lines.length; i++) {
    const cols = splitRow(lines[i] || "");
    if (cols.length === 0 || cols.every((c) => c === "")) continue;

    const row: RawImportReadingRow = {};

    if (hasHeader) {
      if (headerColMap.day !== undefined && cols[headerColMap.day]) {
        row.day = cols[headerColMap.day];
      }
      if (headerColMap.passage !== undefined && cols[headerColMap.passage]) {
        row.passage = cols[headerColMap.passage];
      }
      if (headerColMap.book !== undefined && cols[headerColMap.book]) {
        row.book = cols[headerColMap.book];
      }
      if (headerColMap.chapter !== undefined && cols[headerColMap.chapter]) {
        row.chapter = cols[headerColMap.chapter];
      }
      if (headerColMap.verses !== undefined && cols[headerColMap.verses]) {
        row.verses = cols[headerColMap.verses];
      }
      if (headerColMap.track !== undefined && cols[headerColMap.track]) {
        row.track = cols[headerColMap.track];
      }
      if (headerColMap.note !== undefined && cols[headerColMap.note]) {
        row.note = cols[headerColMap.note];
      }
    } else {
      // Positional fallback: if col 0 is a number, it's Day. Otherwise, day is auto-incremented.
      if (cols[0] && /^\d+$/.test(cols[0])) {
        row.day = parseInt(cols[0], 10);
        row.book = cols[1];
        row.chapter = cols[2];
        row.verses = cols[3];
        row.track = cols[4];
        row.note = cols[5];
      } else {
        row.day = autoDay++;
        row.book = cols[0];
        row.chapter = cols[1];
        row.verses = cols[2];
        row.track = cols[3];
        row.note = cols[4];
      }
    }

    resultRows.push(row);
  }

  return resultRows;
}

export type ValidateAndBuildPlanTemplateParams = {
  title?: string;
  description?: string;
  category?: PlanCategory;
  rows?: RawImportReadingRow[];
  jsonData?: unknown;
  allowCustomPace?: boolean;
  allowSelfPaced?: boolean;
};

/**
 * Validates and transforms raw reading rows or JSON plan data into a ReadingPlanTemplate.
 */
export function validateAndBuildPlanTemplate({
  title,
  description,
  category,
  rows,
  jsonData,
  allowCustomPace = true,
  allowSelfPaced = true,
}: ValidateAndBuildPlanTemplateParams): PlanValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let planTitle = title?.trim() || "";
  let planDescription = description?.trim() || "";
  const rawRows: RawImportReadingRow[] = [];

  // Extract from JSON if provided
  if (jsonData) {
    if (typeof jsonData === "object" && jsonData !== null) {
      const data = jsonData as Record<string, unknown>;
      if (!planTitle && typeof data.title === "string") planTitle = data.title;
      if (!planDescription && typeof data.description === "string")
        planDescription = data.description;

      const processSession = (session: unknown, fallbackDay: number) => {
        if (typeof session !== "object" || session === null) return;
        const s = session as Record<string, unknown>;
        const dayNum =
          typeof s.day === "number"
            ? s.day
            : typeof s.dayNumber === "number"
              ? s.dayNumber
              : fallbackDay;
        const daySessionNote = String(
          s.sessionNote || s.session_note || s.note || s.title || ""
        );
        const readingsArr = s.readings || s.passages || s.items;

        if (Array.isArray(readingsArr)) {
          readingsArr.forEach((r: unknown) => {
            if (typeof r === "object" && r !== null) {
              const rObj = r as Record<string, unknown>;
              rawRows.push({
                ...(rObj as RawImportReadingRow),
                day: rObj.day !== undefined ? (rObj.day as number) : dayNum,
                note: String(
                  rObj.note ||
                    rObj.passage_note ||
                    rObj.passageNote ||
                    rObj.description ||
                    daySessionNote
                ),
              });
            }
          });
        } else {
          rawRows.push({
            ...(s as RawImportReadingRow),
            day: dayNum,
            note: String(
              s.note ||
                s.sessionNote ||
                s.session_note ||
                s.description ||
                daySessionNote
            ),
          });
        }
      };

      if (Array.isArray(data.sessions)) {
        data.sessions.forEach((s: unknown, idx: number) => {
          processSession(s, idx + 1);
        });
      } else if (Array.isArray(data.days)) {
        data.days.forEach((d: unknown, idx: number) => {
          processSession(d, idx + 1);
        });
      } else if (Array.isArray(data.readings)) {
        data.readings.forEach((item: unknown, idx: number) => {
          if (
            typeof item === "object" &&
            item !== null &&
            (Array.isArray((item as Record<string, unknown>).readings) ||
              Array.isArray((item as Record<string, unknown>).passages))
          ) {
            processSession(item, idx + 1);
          } else if (typeof item === "object" && item !== null) {
            rawRows.push(item as RawImportReadingRow);
          }
        });
      } else if (Array.isArray(jsonData)) {
        jsonData.forEach((item: unknown, idx: number) => {
          if (
            typeof item === "object" &&
            item !== null &&
            (Array.isArray((item as Record<string, unknown>).readings) ||
              (item as Record<string, unknown>).sessionNote)
          ) {
            processSession(item, idx + 1);
          } else if (typeof item === "object" && item !== null) {
            rawRows.push(item as RawImportReadingRow);
          }
        });
      } else {
        errors.push(
          'JSON must contain a "sessions", "days", or "readings" array.'
        );
      }
    } else {
      errors.push("Invalid JSON payload provided.");
    }
  } else if (rows) {
    rawRows.push(...rows);
  }

  if (rawRows.length === 0 && errors.length === 0) {
    errors.push("No reading items found in the imported file or text.");
  }

  if (!planTitle) {
    planTitle = "Custom Imported Plan";
  }

  const parsedItems: ParsedReadingItem[] = [];
  const dayMap = new Map<number, ParsedReadingItem[]>();
  const uniqueBookSet = new Set<string>();
  const trackSet = new Set<string>();

  let currentOrder = 1;
  let currentAutoDay = 1;

  rawRows.forEach((row, index) => {
    const rowNum = index + 1;
    let dayNumber =
      typeof row.day === "number"
        ? row.day
        : parseInt(String(row.day || ""), 10);
    if (isNaN(dayNumber) || dayNumber <= 0) {
      dayNumber = currentAutoDay;
    } else {
      currentAutoDay = dayNumber;
    }

    let bookName = row.book?.trim() || "";
    let chapterNum =
      typeof row.chapter === "number"
        ? row.chapter
        : parseInt(String(row.chapter || ""), 10);
    let startVerse =
      typeof row.startVerse === "number"
        ? row.startVerse
        : parseInt(String(row.startVerse || ""), 10);
    let endVerse =
      typeof row.endVerse === "number"
        ? row.endVerse
        : parseInt(String(row.endVerse || ""), 10);
    let verseRange = row.verses?.trim() || undefined;

    // Check if passage string was provided or book contains chapter/verses (e.g. "Genesis 1:1-20")
    if (
      row.passage ||
      (bookName && (bookName.includes(":") || /\d+$/.test(bookName)))
    ) {
      const parsedPassage = parsePassageString({
        raw: row.passage || bookName,
      });
      if (parsedPassage) {
        bookName = parsedPassage.bookName;
        if (isNaN(chapterNum)) chapterNum = parsedPassage.chapter;
        if (isNaN(startVerse) && parsedPassage.startVerse !== undefined)
          startVerse = parsedPassage.startVerse;
        if (isNaN(endVerse) && parsedPassage.endVerse !== undefined)
          endVerse = parsedPassage.endVerse;
        if (!verseRange && parsedPassage.verseRange)
          verseRange = parsedPassage.verseRange;
      }
    }

    // Resolve book
    const resolvedBook = resolveBibleBook({ input: bookName });
    if (!resolvedBook) {
      errors.push(
        `Row ${rowNum}: Unable to identify Bible book "${bookName || "(blank)"}".`
      );
      return;
    }

    // Validate chapter
    if (isNaN(chapterNum) || chapterNum <= 0) {
      errors.push(
        `Row ${rowNum} (${resolvedBook.name}): Invalid chapter "${row.chapter || "(blank)"}".`
      );
      return;
    }

    if (chapterNum > resolvedBook.chapters) {
      errors.push(
        `Row ${rowNum} (${resolvedBook.name}): Chapter ${chapterNum} exceeds book maximum of ${resolvedBook.chapters} chapters.`
      );
      return;
    }

    // Parse verses range if string like "1-15" or "1:1-15"
    if (verseRange) {
      const vMatch = verseRange.match(/(\d+)\s*(?:-|–|to)\s*(\d+)/);
      if (vMatch && vMatch[1] && vMatch[2]) {
        startVerse = parseInt(vMatch[1], 10);
        endVerse = parseInt(vMatch[2], 10);
      } else {
        const singleV = parseInt(verseRange, 10);
        if (!isNaN(singleV)) {
          startVerse = singleV;
          endVerse = singleV;
        }
      }
    }

    const cleanVerseRange =
      !isNaN(startVerse) && !isNaN(endVerse)
        ? startVerse === endVerse
          ? `${startVerse}`
          : `${startVerse}-${endVerse}`
        : undefined;

    const versesLabel = cleanVerseRange
      ? `${chapterNum}:${cleanVerseRange}`
      : undefined;
    const displayText = cleanVerseRange
      ? `${resolvedBook.name} ${chapterNum}:${cleanVerseRange}`
      : `${resolvedBook.name} ${chapterNum}`;

    const track =
      row.track?.trim() || resolveTrackForBook({ book: resolvedBook });
    trackSet.add(track);
    uniqueBookSet.add(resolvedBook.id);

    const itemId = cleanVerseRange
      ? `${resolvedBook.id}_${chapterNum}_${cleanVerseRange.replace("-", "_")}_${currentOrder}`
      : `${resolvedBook.id}_${chapterNum}`;

    const parsedItem: ParsedReadingItem = {
      id: itemId,
      bookId: resolvedBook.id,
      bookName: resolvedBook.name,
      chapter: chapterNum,
      startVerse: !isNaN(startVerse) ? startVerse : undefined,
      endVerse: !isNaN(endVerse) ? endVerse : undefined,
      verseRange: cleanVerseRange,
      versesLabel,
      track,
      displayText,
      order: currentOrder++,
      dayNumber,
      note: row.note?.trim(),
    };

    parsedItems.push(parsedItem);

    const existingDayItems = dayMap.get(dayNumber) || [];
    existingDayItems.push(parsedItem);
    dayMap.set(dayNumber, existingDayItems);
  });

  let totalDays = 0;
  for (const day of dayMap.keys()) {
    if (day > totalDays) {
      totalDays = day;
    }
  }
  const totalReadings = parsedItems.length;

  if (totalDays > 730) {
    warnings.push(`The imported plan spans ${totalDays} days (over 2 years).`);
  }

  // Build Sections
  const sections: PlanSection[] = Array.from(trackSet).map((trackName) => {
    const trackItems = parsedItems.filter((i) => i.track === trackName);
    const trackBookIds = Array.from(new Set(trackItems.map((i) => i.bookId)));
    const trackBookNames = trackBookIds.map(
      (id) => BIBLE_BOOK_MAP[id]?.name || id
    );
    return {
      title: trackName,
      subtitle: `${trackItems.length} readings across ${trackBookNames.length} books`,
      chaptersCount: trackItems.length,
      booksDescription:
        trackBookNames.slice(0, 5).join(", ") +
        (trackBookNames.length > 5
          ? ` +${trackBookNames.length - 5} more`
          : ""),
    };
  });

  let template: ReadingPlanTemplate | null = null;
  const isValid = errors.length === 0 && parsedItems.length > 0;

  if (isValid) {
    const planId = `custom_import_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const avgDaily = Math.max(
      1,
      Math.round(totalReadings / Math.max(1, totalDays))
    );

    template = {
      id: planId,
      title: planTitle,
      subtitle: `${totalDays} Days · ${totalReadings} Readings`,
      description:
        planDescription ||
        `Custom reading plan imported with ${totalReadings} readings across ${uniqueBookSet.size} books.`,
      category: category ?? deducePlanCategory(Array.from(uniqueBookSet)),
      icon: "bookmark",
      accentColor: "#10b981",
      totalChapters: totalReadings,
      defaultDailyTarget: avgDaily,
      recommendedDays: totalDays,
      allowCustomPace,
      allowSelfPaced,
      sections:
        sections.length > 0
          ? sections
          : [
              {
                title: "Readings",
                subtitle: `${totalReadings} Readings`,
                chaptersCount: totalReadings,
                booksDescription: "Custom Imported Readings",
              },
            ],
      readings: parsedItems,
    };
  }

  return {
    isValid,
    errors,
    warnings,
    template,
    dayReadings: dayMap,
    summary: {
      totalDays,
      totalReadings,
      uniqueBooks: uniqueBookSet.size,
      tracks: Array.from(trackSet),
    },
  };
}

/**
 * Returns a starter CSV template for user reference
 */
export function getSamplePlanCsvTemplate(): string {
  return `Day,Book,Chapter,Verses,Track,Note
1,Genesis,1,,Law,Creation of heavens and earth
1,Matthew,1,,Gospels,Genealogy of Jesus Christ
1,Psalms,1,,Poetry & Wisdom,The way of the righteous
2,Genesis,2,,Law,The Seventh Day and Eden
2,Matthew,2,,Gospels,The visit of the wise men
2,Psalms,2,,Poetry & Wisdom,The Reign of the LORD's Anointed
3,Genesis,3,,Law,The Fall of mankind
3,Matthew,3,,Gospels,John the Baptist prepares the way
3,Psalms,3,,Poetry & Wisdom,A Psalm of David`;
}

/**
 * Returns a starter JSON template for user reference
 */
export function getSamplePlanJsonTemplate(): string {
  return JSON.stringify(
    {
      title: "Gospels & Wisdom 3-Day Journey",
      description: "Read the Gospel of John alongside Proverbs each day.",
      sessions: [
        {
          day: 1,
          sessionNote: "The Word Became Flesh",
          readings: [
            { book: "John", chapter: 1, verses: "1-18", track: "Gospels" },
            { book: "Proverbs", chapter: 1, verses: "1-7", track: "Wisdom" },
          ],
        },
        {
          day: 2,
          sessionNote: "Wedding at Cana",
          readings: [
            { book: "John", chapter: 2, track: "Gospels" },
            { book: "Proverbs", chapter: 2, track: "Wisdom" },
          ],
        },
        {
          day: 3,
          sessionNote: "Nicodemus & God's Love",
          readings: [
            { book: "John", chapter: 3, verses: "1-21", track: "Gospels" },
            { book: "Proverbs", chapter: 3, verses: "1-12", track: "Wisdom" },
          ],
        },
      ],
    },
    null,
    2
  );
}
