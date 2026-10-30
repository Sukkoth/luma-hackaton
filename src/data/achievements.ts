import {
  BIBLE_BOOKS,
  TOTAL_OT_CHAPTERS,
  TOTAL_NT_CHAPTERS,
  TOTAL_BIBLE_CHAPTERS,
} from "./bibleData";

export type AchievementCategory =
  | "Daily Streaks"
  | "Reading Plans"
  | "Bible Volumes"
  | "Old Testament"
  | "New Testament"
  | "Wisdom & Poetry"
  | "Deuterocanon & Heritage"
  | "Trackers";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  iconName: string;
  accentColor: string;
  bgLight: string;
  checkUnlocked: (
    progress: Record<string, number[]>,
    trackerCount: number,
    totalChaptersRead: number,
    streakCount?: number,
    completedPlansCount?: number
  ) => {
    unlocked: boolean;
    current: number;
    total: number;
  };
}

const standardBookChapterLimits: Record<string, number> = {
  est: 10,
  dan: 12,
  psa: 150,
};

// Helper to count unique read chapters for a list of book IDs
const countReadChapters = (
  bookIds: string[],
  progress: Record<string, number[]>,
  capStandard: boolean = true
): number => {
  let count = 0;
  for (let i = 0; i < bookIds.length; i++) {
    const bookId = bookIds[i];
    const list = progress[bookId];
    if (list && list.length > 0) {
      const uniqueCount = new Set(list).size;
      const limit =
        capStandard && standardBookChapterLimits[bookId]
          ? standardBookChapterLimits[bookId]
          : Infinity;
      count += Math.min(uniqueCount, limit);
    }
  }
  return count;
};

const getUniqueBookCount = (
  bookId: string,
  progress: Record<string, number[]>,
  capLimit?: number
): number => {
  const list = progress[bookId];
  const count = list && list.length > 0 ? new Set(list).size : 0;
  return capLimit !== undefined ? Math.min(count, capLimit) : count;
};

const lawBookIds = ["gen", "exo", "lev", "num", "deu"];
const historyOtBookIds = [
  "jos",
  "jdg",
  "rut",
  "1sa",
  "2sa",
  "1ki",
  "2ki",
  "1ch",
  "2ch",
  "ezr",
  "neh",
  "est",
];
const wisdomBookIds = ["job", "psa", "pro", "ecc", "sng"];
const majorProphetsIds = ["isa", "jer", "lam", "ezk", "dan"];
const minorProphetsIds = [
  "hos",
  "jol",
  "amo",
  "oba",
  "jon",
  "mic",
  "nah",
  "hab",
  "zep",
  "hag",
  "zec",
  "mal",
];
const gospelsIds = ["mat", "mrk", "luk", "jhn"];
const paulineIds = [
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
const generalEpistlesIds = [
  "heb",
  "jas",
  "1pe",
  "2pe",
  "1jn",
  "2jn",
  "3jn",
  "jud",
];
const otBookIds = BIBLE_BOOKS.filter((b) => b.testament === "OT").map(
  (b) => b.id
);
const ntBookIds = BIBLE_BOOKS.filter((b) => b.testament === "NT").map(
  (b) => b.id
);

// Deuterocanonical & Extended Orthodox Books
const deuterocanonBookIds = ["tob", "jdt", "1mac", "2mac", "wis", "sir", "bar"];
const catholicAllBookIds = [...otBookIds, ...deuterocanonBookIds, ...ntBookIds];
const orthodoxHeritageBookIds = [
  "1esd",
  "3mac",
  "4mac",
  "man",
  "eno",
  "jub",
  "1meq",
  "2meq",
  "3meq",
  "bar_4",
  "sin_zion",
  "sin_tizaz",
  "sin_gitzew",
  "sin_abtelis",
  "cov_1",
  "cov_2",
  "eth_clem",
  "eth_dida",
];

// Precomputed static totals (zero runtime recalculation)
const TOTAL_LAW = 187;
const TOTAL_HISTORY_OT = 249;
const TOTAL_WISDOM = 243;
const TOTAL_MAJOR_PROPHETS = 183;
const TOTAL_MINOR_PROPHETS = 67;
const TOTAL_GOSPELS = 89;
const TOTAL_PAULINE = 87;
const TOTAL_GENERAL_EPISTLES = 34;
const TOTAL_DEUTEROCANON = 137;
const TOTAL_CATHOLIC = 1334;

export const ACHIEVEMENTS: Achievement[] = [
  // --- DAILY STREAKS ---
  {
    id: "streak_3_days",
    title: "3-Day Spark",
    description: "Maintain a 3-day daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "zap",
    accentColor: "#10B981",
    bgLight: "#17241F",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 3,
        current: Math.min(streakCount, 3),
        total: 3,
      };
    },
  },
  {
    id: "streak_7_days",
    title: "7-Day Flame",
    description:
      "Maintain a 7-day daily Scripture reading streak across any tracker",
    category: "Daily Streaks",
    iconName: "award",
    accentColor: "#F59E0B",
    bgLight: "#241E15",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 7,
        current: Math.min(streakCount, 7),
        total: 7,
      };
    },
  },
  {
    id: "streak_14_days",
    title: "14-Day Momentum",
    description: "Maintain a 14-day daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "trending-up",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 14,
        current: Math.min(streakCount, 14),
        total: 14,
      };
    },
  },
  {
    id: "streak_30_days",
    title: "30-Day Steadfast",
    description: "Maintain a 30-day daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "compass",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 30,
        current: Math.min(streakCount, 30),
        total: 30,
      };
    },
  },
  {
    id: "streak_100_days",
    title: "100-Day Centurion",
    description: "Maintain a 100-day daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "star",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 100,
        current: Math.min(streakCount, 100),
        total: 100,
      };
    },
  },
  {
    id: "streak_365_days",
    title: "365-Day Faithful",
    description: "Maintain a 1-year (365 days) daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "sun",
    accentColor: "#F59E0B",
    bgLight: "#241E15",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 365,
        current: Math.min(streakCount, 365),
        total: 365,
      };
    },
  },
  {
    id: "streak_548_days",
    title: "18-Month Luminary",
    description:
      "Maintain a 1.5-year (548 days) daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "shield",
    accentColor: "#10B981",
    bgLight: "#17241F",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 548,
        current: Math.min(streakCount, 548),
        total: 548,
      };
    },
  },
  {
    id: "streak_730_days",
    title: "2-Year Pillar",
    description: "Maintain a 2-year (730 days) daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "bookmark",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 730,
        current: Math.min(streakCount, 730),
        total: 730,
      };
    },
  },
  {
    id: "streak_1095_days",
    title: "3-Year Legacy",
    description:
      "Maintain a 3-year (1,095 days) daily Scripture reading streak",
    category: "Daily Streaks",
    iconName: "award",
    accentColor: "#EC4899",
    bgLight: "#281720",
    checkUnlocked: (_progress, _trackerCount, _totalRead, streakCount = 0) => {
      return {
        unlocked: streakCount >= 1095,
        current: Math.min(streakCount, 1095),
        total: 1095,
      };
    },
  },
  // --- BIBLE VOLUMES ---
  {
    id: "first_step",
    title: "First Step",
    description: "Read your first chapter of the Bible",
    category: "Bible Volumes",
    iconName: "flag",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (_progress, _trackerCount, totalRead) => {
      return {
        unlocked: totalRead >= 1,
        current: Math.min(totalRead, 1),
        total: 1,
      };
    },
  },
  {
    id: "marathon_25",
    title: "Quarter Century",
    description: "Read 25 chapters across any books",
    category: "Bible Volumes",
    iconName: "compass",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (_progress, _trackerCount, totalRead) => {
      return {
        unlocked: totalRead >= 25,
        current: Math.min(totalRead, 25),
        total: 25,
      };
    },
  },
  {
    id: "centurion_100",
    title: "Centurion Reader",
    description: "Complete 100 chapters in total",
    category: "Bible Volumes",
    iconName: "award",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (_progress, _trackerCount, totalRead) => {
      return {
        unlocked: totalRead >= 100,
        current: Math.min(totalRead, 100),
        total: 100,
      };
    },
  },
  {
    id: "halfway_mark",
    title: "Equator of Truth",
    description: "Reach 595 chapters (halfway through the entire Bible)",
    category: "Bible Volumes",
    iconName: "target",
    accentColor: "#10B981",
    bgLight: "#17241F",
    checkUnlocked: (_progress, _trackerCount, totalRead) => {
      return {
        unlocked: totalRead >= 595,
        current: Math.min(totalRead, 595),
        total: 595,
      };
    },
  },
  {
    id: "whole_bible_complete",
    title: "Standard 66 Finisher",
    description: "Complete all 66 books of the Holy Bible (1,189 chapters)",
    category: "Bible Volumes",
    iconName: "check-circle",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (progress) => {
      const current = countReadChapters(
        [...otBookIds, ...ntBookIds],
        progress,
        true
      );
      return {
        unlocked: current >= TOTAL_BIBLE_CHAPTERS,
        current: Math.min(current, TOTAL_BIBLE_CHAPTERS),
        total: TOTAL_BIBLE_CHAPTERS,
      };
    },
  },

  // --- OLD TESTAMENT ---
  {
    id: "genesis_complete",
    title: "In The Beginning",
    description: "Complete all 50 chapters of Genesis",
    category: "Old Testament",
    iconName: "sun",
    accentColor: "#F59E0B",
    bgLight: "#241E15",
    checkUnlocked: (progress) => {
      const read = getUniqueBookCount("gen", progress);
      return { unlocked: read >= 50, current: read, total: 50 };
    },
  },
  {
    id: "torah_pentateuch",
    title: "Torah Pioneer",
    description: "Complete the Books of the Law (Genesis to Deuteronomy)",
    category: "Old Testament",
    iconName: "shield",
    accentColor: "#F59E0B",
    bgLight: "#241E15",
    checkUnlocked: (progress) => {
      const current = countReadChapters(lawBookIds, progress);
      return { unlocked: current >= TOTAL_LAW, current, total: TOTAL_LAW };
    },
  },
  {
    id: "israel_history",
    title: "Chronicler of Israel",
    description: "Complete all Historical Books (Joshua through Esther)",
    category: "Old Testament",
    iconName: "bookmark",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (progress) => {
      const current = countReadChapters(historyOtBookIds, progress);
      return {
        unlocked: current >= TOTAL_HISTORY_OT,
        current,
        total: TOTAL_HISTORY_OT,
      };
    },
  },
  {
    id: "major_prophets",
    title: "Voice of the Prophets",
    description: "Complete the Major Prophets (Isaiah to Daniel)",
    category: "Old Testament",
    iconName: "volume-2",
    accentColor: "#EC4899",
    bgLight: "#281720",
    checkUnlocked: (progress) => {
      const current = countReadChapters(majorProphetsIds, progress);
      return {
        unlocked: current >= TOTAL_MAJOR_PROPHETS,
        current,
        total: TOTAL_MAJOR_PROPHETS,
      };
    },
  },
  {
    id: "minor_prophets",
    title: "The Twelve Minor",
    description: "Complete all 12 Minor Prophets (Hosea to Malachi)",
    category: "Old Testament",
    iconName: "layers",
    accentColor: "#F97316",
    bgLight: "#261C16",
    checkUnlocked: (progress) => {
      const current = countReadChapters(minorProphetsIds, progress);
      return {
        unlocked: current >= TOTAL_MINOR_PROPHETS,
        current,
        total: TOTAL_MINOR_PROPHETS,
      };
    },
  },
  {
    id: "ot_champion",
    title: "Old Testament Champion",
    description: "Complete all 39 Old Testament books (929 chapters)",
    category: "Old Testament",
    iconName: "star",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (progress) => {
      const current = countReadChapters(otBookIds, progress);
      return {
        unlocked: current >= TOTAL_OT_CHAPTERS,
        current,
        total: TOTAL_OT_CHAPTERS,
      };
    },
  },

  // --- WISDOM & POETRY ---
  {
    id: "psalms_king",
    title: "Psalm Singer",
    description: "Read all 150 Psalms",
    category: "Wisdom & Poetry",
    iconName: "music",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (progress) => {
      const read = getUniqueBookCount("psa", progress, 150);
      return { unlocked: read >= 150, current: read, total: 150 };
    },
  },
  {
    id: "fountain_wisdom",
    title: "Fountain of Wisdom",
    description: "Complete all 31 chapters of Proverbs",
    category: "Wisdom & Poetry",
    iconName: "feather",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (progress) => {
      const read = getUniqueBookCount("pro", progress);
      return { unlocked: read >= 31, current: read, total: 31 };
    },
  },
  {
    id: "wisdom_literature",
    title: "Wisdom Sage",
    description: "Complete Job, Proverbs, Ecclesiastes, and Song of Solomon",
    category: "Wisdom & Poetry",
    iconName: "book",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (progress) => {
      const current = countReadChapters(wisdomBookIds, progress);
      return {
        unlocked: current >= TOTAL_WISDOM,
        current,
        total: TOTAL_WISDOM,
      };
    },
  },

  // --- NEW TESTAMENT ---
  {
    id: "the_four_gospels",
    title: "The Four Gospels",
    description: "Complete Matthew, Mark, Luke, and John",
    category: "New Testament",
    iconName: "heart",
    accentColor: "#10B981",
    bgLight: "#17241F",
    checkUnlocked: (progress) => {
      const current = countReadChapters(gospelsIds, progress);
      return {
        unlocked: current >= TOTAL_GOSPELS,
        current,
        total: TOTAL_GOSPELS,
      };
    },
  },
  {
    id: "acts_apostles",
    title: "Apostolic Witness",
    description: "Complete the Book of Acts (28 chapters)",
    category: "New Testament",
    iconName: "send",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (progress) => {
      const read = getUniqueBookCount("act", progress);
      return { unlocked: read >= 28, current: read, total: 28 };
    },
  },
  {
    id: "pauline_scholar",
    title: "Pauline Scholar",
    description: "Complete all 13 Pauline Epistles (Romans to Philemon)",
    category: "New Testament",
    iconName: "mail",
    accentColor: "#6366F1",
    bgLight: "#1C1D2B",
    checkUnlocked: (progress) => {
      const current = countReadChapters(paulineIds, progress);
      return {
        unlocked: current >= TOTAL_PAULINE,
        current,
        total: TOTAL_PAULINE,
      };
    },
  },
  {
    id: "general_epistles_master",
    title: "General Epistles Master",
    description: "Complete Hebrews through Jude",
    category: "New Testament",
    iconName: "globe",
    accentColor: "#06B6D4",
    bgLight: "#152326",
    checkUnlocked: (progress) => {
      const current = countReadChapters(generalEpistlesIds, progress);
      return {
        unlocked: current >= TOTAL_GENERAL_EPISTLES,
        current,
        total: TOTAL_GENERAL_EPISTLES,
      };
    },
  },
  {
    id: "revelation_unveiled",
    title: "Revelation Unveiled",
    description: "Complete all 22 chapters of Revelation",
    category: "New Testament",
    iconName: "eye",
    accentColor: "#EC4899",
    bgLight: "#281720",
    checkUnlocked: (progress) => {
      const read = getUniqueBookCount("rev", progress);
      return { unlocked: read >= 22, current: read, total: 22 };
    },
  },
  {
    id: "nt_champion",
    title: "New Testament Champion",
    description: "Complete all 27 New Testament books (260 chapters)",
    category: "New Testament",
    iconName: "zap",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (progress) => {
      const current = countReadChapters(ntBookIds, progress);
      return {
        unlocked: current >= TOTAL_NT_CHAPTERS,
        current,
        total: TOTAL_NT_CHAPTERS,
      };
    },
  },

  // --- DEUTEROCANON & HERITAGE ---
  {
    id: "deuterocanon_scholar",
    title: "Deuterocanon Scholar",
    description:
      "Complete all 7 Deuterocanonical books (Tobit through 2 Maccabees)",
    category: "Deuterocanon & Heritage",
    iconName: "shield",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (progress) => {
      const current = countReadChapters(deuterocanonBookIds, progress, false);
      return {
        unlocked: current >= TOTAL_DEUTEROCANON,
        current: Math.min(current, TOTAL_DEUTEROCANON),
        total: TOTAL_DEUTEROCANON,
      };
    },
  },
  {
    id: "catholic_canon_complete",
    title: "Catholic 73 Finisher",
    description: "Complete all 73 books of the Catholic Bible (1,334 chapters)",
    category: "Deuterocanon & Heritage",
    iconName: "award",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (progress) => {
      const current = countReadChapters(catholicAllBookIds, progress, false);
      return {
        unlocked: current >= TOTAL_CATHOLIC,
        current: Math.min(current, TOTAL_CATHOLIC),
        total: TOTAL_CATHOLIC,
      };
    },
  },
  {
    id: "orthodox_heritage",
    title: "Orthodox Heritage",
    description:
      "Read 50 chapters from extended Eastern & Ethiopian Orthodox scriptures",
    category: "Deuterocanon & Heritage",
    iconName: "feather",
    accentColor: "#10B981",
    bgLight: "#17241F",
    checkUnlocked: (progress) => {
      const current = countReadChapters(
        orthodoxHeritageBookIds,
        progress,
        false
      );
      return {
        unlocked: current >= 50,
        current: Math.min(current, 50),
        total: 50,
      };
    },
  },
  {
    id: "ethiopian_canon_complete",
    title: "Grand 81-Book Master",
    description:
      "Complete all 81 books of the Ethiopian Orthodox canon (1,927 chapters)",
    category: "Deuterocanon & Heritage",
    iconName: "star",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (_progress, _trackerCount, totalRead) => {
      return {
        unlocked: totalRead >= 1927,
        current: Math.min(totalRead, 1927),
        total: 1927,
      };
    },
  },

  // --- READING PLANS ---
  {
    id: "first_plan_complete",
    title: "Plan Pioneer",
    description: "Successfully complete your first Bible reading plan",
    category: "Reading Plans",
    iconName: "flag",
    accentColor: "#10B981",
    bgLight: "#17241F",
    checkUnlocked: (
      _progress,
      _trackerCount,
      _totalRead,
      _streak,
      completedPlans = 0
    ) => {
      return {
        unlocked: completedPlans >= 1,
        current: Math.min(completedPlans, 1),
        total: 1,
      };
    },
  },
  {
    id: "plans_completed_3",
    title: "Plan Navigator",
    description: "Successfully complete 3 Bible reading plans",
    category: "Reading Plans",
    iconName: "compass",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (
      _progress,
      _trackerCount,
      _totalRead,
      _streak,
      completedPlans = 0
    ) => {
      return {
        unlocked: completedPlans >= 3,
        current: Math.min(completedPlans, 3),
        total: 3,
      };
    },
  },
  {
    id: "plans_completed_5",
    title: "Master of Journeys",
    description: "Successfully complete 5 Bible reading plans",
    category: "Reading Plans",
    iconName: "award",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (
      _progress,
      _trackerCount,
      _totalRead,
      _streak,
      completedPlans = 0
    ) => {
      return {
        unlocked: completedPlans >= 5,
        current: Math.min(completedPlans, 5),
        total: 5,
      };
    },
  },
  {
    id: "plans_completed_10",
    title: "Biblical Scholar",
    description: "Successfully complete 10 Bible reading plans",
    category: "Reading Plans",
    iconName: "star",
    accentColor: "#FAFAFA",
    bgLight: "#1F2219",
    checkUnlocked: (
      _progress,
      _trackerCount,
      _totalRead,
      _streak,
      completedPlans = 0
    ) => {
      return {
        unlocked: completedPlans >= 10,
        current: Math.min(completedPlans, 10),
        total: 10,
      };
    },
  },

  // --- TRACKERS & DISCIPLINE ---
  {
    id: "multi_tracker_2",
    title: "Dual Track Scholar",
    description: "Create and maintain at least 2 active reading trackers",
    category: "Trackers",
    iconName: "grid",
    accentColor: "#3B82F6",
    bgLight: "#181E29",
    checkUnlocked: (_progress, trackerCount) => {
      return {
        unlocked: trackerCount >= 2,
        current: Math.min(trackerCount, 2),
        total: 2,
      };
    },
  },
  {
    id: "multi_tracker_organizer",
    title: "Spiritual Discipline",
    description: "Maintain 3 or more separate reading trackers",
    category: "Trackers",
    iconName: "folder-plus",
    accentColor: "#8B5CF6",
    bgLight: "#201C2B",
    checkUnlocked: (_progress, trackerCount) => {
      return {
        unlocked: trackerCount >= 3,
        current: Math.min(trackerCount, 3),
        total: 3,
      };
    },
  },
];
