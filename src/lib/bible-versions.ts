import { PROTESTANT_BIBLE_BOOKS } from "@/data/canons/protestant";

export type BibleVersion = {
  readonly id: number;
  readonly abbreviation: string;
  readonly name: string;
  readonly language: string;
  readonly isPopular?: boolean;
};

export const AMHARIC_NASV_VERSION_ID = 1260;

export const BIBLE_VERSIONS: ReadonlyArray<BibleVersion> = [
  {
    id: AMHARIC_NASV_VERSION_ID,
    abbreviation: "NASV",
    name: "New Amharic Standard Version",
    language: "am",
    isPopular: true,
  },
  {
    id: 111,
    abbreviation: "NIV",
    name: "New International Version",
    language: "en",
    isPopular: true,
  },
  {
    id: 1588,
    abbreviation: "AMP",
    name: "Amplified Bible",
    language: "en",
    isPopular: true,
  },
  {
    id: 2692,
    abbreviation: "NASB2020",
    name: "New American Standard Bible 2020",
    language: "en",
    isPopular: true,
  },
  {
    id: 12,
    abbreviation: "ASV",
    name: "American Standard Version",
    language: "en",
  },
] as const;

export const DEFAULT_BIBLE_VERSION_ID = 111; // NIV
const BIBLE_VERSION_STORAGE_KEY = "luma-bible-version-id";

/**
 * Standard USFM uppercase book abbreviation map
 */
const BOOK_ID_TO_USFM: Record<string, string> = {
  gen: "GEN",
  exo: "EXO",
  lev: "LEV",
  num: "NUM",
  deu: "DEU",
  jos: "JOS",
  jdg: "JDG",
  rut: "RUT",
  "1sa": "1SA",
  "2sa": "2SA",
  "1ki": "1KI",
  "2ki": "2KI",
  "1ch": "1CH",
  "2ch": "2CH",
  ezr: "EZR",
  neh: "NEH",
  est: "EST",
  job: "JOB",
  psa: "PSA",
  pro: "PRO",
  ecc: "ECC",
  sng: "SNG",
  isa: "ISA",
  jer: "JER",
  lam: "LAM",
  ezk: "EZK",
  dan: "DAN",
  hos: "HOS",
  jol: "JOL",
  amo: "AMO",
  oba: "OBA",
  jon: "JON",
  mic: "MIC",
  nam: "NAM",
  hab: "HAB",
  zep: "ZEP",
  hag: "HAG",
  zec: "ZEC",
  mal: "MAL",
  mat: "MAT",
  mrk: "MRK",
  luk: "LUK",
  jhn: "JHN",
  act: "ACT",
  rom: "ROM",
  "1co": "1CO",
  "2co": "2CO",
  gal: "GAL",
  eph: "EPH",
  php: "PHP",
  col: "COL",
  "1th": "1TH",
  "2th": "2TH",
  "1ti": "1TI",
  "2ti": "2TI",
  tit: "TIT",
  phm: "PHM",
  heb: "HEB",
  jas: "JAS",
  "1pe": "1PE",
  "2pe": "2PE",
  "1jn": "1JN",
  "2jn": "2JN",
  "3jn": "3JN",
  jud: "JUD",
  rev: "REV",
  // Deuterocanonical / Apocryphal USFM codes
  tob: "TOB",
  jdt: "JDT",
  wis: "WIS",
  sir: "SIR",
  bar: "BAR",
  "1ma": "1MA",
  "2ma": "2MA",
  "3ma": "3MA",
  "4ma": "4MA",
  man: "MAN",
  ps2: "PS2",
  "1es": "1ES",
  "2es": "2ES",
};

type GetBookUsfmParams = {
  bookId: string;
};

export function getBookUsfm({ bookId }: GetBookUsfmParams): string {
  const normalized = bookId.toLowerCase().trim();
  const found = BOOK_ID_TO_USFM[normalized];
  if (found) return found;
  return normalized.toUpperCase();
}

type BuildBibleComPathParams = {
  versionId: number;
  bookId: string;
  chapter: number;
  startVerse?: number | null;
  endVerse?: number | null;
};

export function buildBibleComPath({
  versionId,
  bookId,
  chapter,
  startVerse,
  endVerse,
}: BuildBibleComPathParams): string {
  const usfm = getBookUsfm({ bookId });

  let reference = `${usfm}.${chapter}`;
  if (startVerse != null && endVerse != null && endVerse >= startVerse) {
    reference = `${reference}.${startVerse}-${endVerse}`;
  } else if (startVerse != null) {
    reference = `${reference}.${startVerse}`;
  }

  // Canonical Bible.com / YouVersion passage path: {versionId}/{reference} (e.g. 1260/HEB.1 or 111/GEN.1)
  return `${versionId}/${reference}`;
}

const SIXTY_SIX_BOOK_IDS = new Set(
  PROTESTANT_BIBLE_BOOKS.map((book) => book.id.toLowerCase())
);

const SIXTY_SIX_BOOK_USFMS = new Set(
  PROTESTANT_BIBLE_BOOKS.map((book) => getBookUsfm({ bookId: book.id }))
);

export type IsBookSupportedInSixtySixBookVersionsParams = {
  bookId: string;
};

/**
 * All currently integrated YouVersion API versions contain the 66-book Protestant canon.
 */
export function isBookSupportedInSixtySixBookVersions({
  bookId,
}: IsBookSupportedInSixtySixBookVersionsParams): boolean {
  const normalized = bookId.trim().toLowerCase();
  if (!normalized) return false;
  return (
    SIXTY_SIX_BOOK_IDS.has(normalized) ||
    SIXTY_SIX_BOOK_USFMS.has(normalized.toUpperCase())
  );
}

type DetectDefaultVersionParams = {
  userTimezone?: string | null;
};

export function detectDefaultVersion({
  userTimezone,
}: DetectDefaultVersionParams): BibleVersion {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(BIBLE_VERSION_STORAGE_KEY);
    if (saved) {
      const parsedId = Number.parseInt(saved, 10);
      const match = BIBLE_VERSIONS.find((v) => v.id === parsedId);
      if (match) return match;
    }
  }

  // Detect Ethiopian location via timezone or locale
  const tz =
    userTimezone ||
    (typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "");

  const isEthiopia =
    tz?.toLowerCase().includes("addis_ababa") ||
    tz?.toLowerCase().includes("ethiopia");

  if (isEthiopia) {
    const amharic = BIBLE_VERSIONS.find(
      (v) => v.id === AMHARIC_NASV_VERSION_ID
    );
    if (amharic) return amharic;
  }

  // Default to NIV
  return (
    BIBLE_VERSIONS.find((v) => v.id === DEFAULT_BIBLE_VERSION_ID) ||
    BIBLE_VERSIONS[0]
  );
}

type SaveSelectedVersionParams = {
  versionId: number;
};

export function saveSelectedVersion({
  versionId,
}: SaveSelectedVersionParams): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(BIBLE_VERSION_STORAGE_KEY, versionId.toString());
  }
}

type GetSortedVersionsParams = {
  defaultVersionId: number;
};

export function getSortedVersions({
  defaultVersionId,
}: GetSortedVersionsParams): ReadonlyArray<BibleVersion> {
  const selected = BIBLE_VERSIONS.find((v) => v.id === defaultVersionId);
  const others = BIBLE_VERSIONS.filter((v) => v.id !== defaultVersionId);

  // Put currently selected first, then popular ones, then remaining
  const popular = others.filter((v) => v.isPopular);
  const regular = others.filter((v) => !v.isPopular);

  return selected ? [selected, ...popular, ...regular] : BIBLE_VERSIONS;
}
