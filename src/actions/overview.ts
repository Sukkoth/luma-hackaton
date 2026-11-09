"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  readingTrackers,
  userSettings,
  trackerChapterProgress,
  readingLogs,
  planInstances,
} from "@/db/schema";
import {
  type BibleCanon,
  getBibleBooks,
  getBibleBookById,
  getCanonTestamentChapters,
  getScriptureDivisionForBook,
  SCRIPTURE_DIVISIONS,
  type ScriptureDivisionKey,
} from "@/data/bibleData";
import {
  getLocalDateString,
  shiftDateString,
  getDaysDifference,
} from "@/lib/timezone";

// --- 1. CONCENTRIC ACTIVITY RINGS DATA ---
export type ActivityRingItem = {
  key: "bible" | "ot" | "nt" | "today";
  label: string;
  read: number;
  total: number;
  percent: number;
  opacity: number;
};

export type OverviewActivityRingsData = {
  totalChapters: number;
  readChapters: number;
  overallPercentage: number;
  rings: ActivityRingItem[];
  thisWeekChapters: number;
  avgDay30d: number;
  projectedFinishDate: string;
  nextReading: {
    bookName: string;
    chapter: number;
    displayText: string;
  } | null;
};

// --- 2. STACKED AREA CHART DATA ---
export type StackedProgressPoint = {
  date: string;
  label: string;
  otActual: number | null;
  ntActual: number | null;
  totalActual: number | null;
  projected: number | null;
};

export type OverviewStackedProgressData = {
  ranges: {
    "14d": StackedProgressPoint[];
    "30d": StackedProgressPoint[];
    "90d": StackedProgressPoint[];
  };
  defaultRange: "14d" | "30d" | "90d";
  takeaway: string;
  totalChapters: number;
};

// --- 3. STREAK + CALENDAR HEATMAP DATA ---
export type OverviewStreakDay = {
  dateStr: string;
  dayLabel: string;
  isToday: boolean;
  isRead: boolean;
  isFrozen: boolean;
  isMissed: boolean;
  isFuture: boolean;
};

export type HeatmapCell = {
  dateStr: string;
  dayOfWeek: number; // 0=Mon, 6=Sun
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isRead: boolean;
  isFrozen: boolean;
  isMissed: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type HeatmapMonthLabel = {
  label: string;
  colIndex: number;
};

export type OverviewStreakHeatmapData = {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
  weekDays: OverviewStreakDay[]; // Mon-Sun current week strip
  heatmapWeeks: HeatmapCell[][]; // 16 columns of 7 rows
  monthLabels: HeatmapMonthLabel[];
  timeLeftUntilMidnight: string | null;
  isTodayCompleted: boolean;
  takeaway: string;
};

// --- 4. SUNBURST, RADAR & TREEMAP DATA ---
export type SunburstSlice = {
  id: string;
  name: string;
  abbrev?: string;
  depth: 1 | 2 | 3; // 1 = OT/NT, 2 = Section, 3 = Book
  testament?: "OT" | "NT";
  sectionKey?: string;
  completed: number;
  total: number;
  percent: number;
  startAngle: number;
  endAngle: number;
};

export type SectionRadarItem = {
  section: string;
  key: string;
  completed: number;
  total: number;
  percent: number;
  fullMark: 100;
};

export type BookTreemapItem = {
  name: string;
  abbrev: string;
  size: number;
  completed: number;
  percent: number;
  section: string;
  testament: "OT" | "NT";
};

export type OverviewSunburstData = {
  slices: SunburstSlice[];
  radarData: SectionRadarItem[];
  treemapData: BookTreemapItem[];
  overallPercentage: number;
  readChapters: number;
  totalChapters: number;
  takeaway: string;
};

// --- 5. 24-HOUR RADIAL CLOCK & WEEKDAY RADAR ---
export type PolarClockWedge = {
  hour: number; // 0..23
  label: string; // "12 AM", "1 AM", ...
  shortLabel: string; // "12a", "1a", ...
  chapters: number;
  percentOfMax: number;
  isQuietLabel: boolean; // true for 0, 6, 12, 18
};

export type WeekdayActivityItem = {
  day: string; // "Mon", "Tue", ...
  fullName: string;
  chapters: number;
  percentOfMax: number;
};

export type OverviewRadialClockData = {
  hourlyWedges: PolarClockWedge[];
  weekdayItems: WeekdayActivityItem[];
  peakHourLabel: string;
  peakWeekdayLabel: string;
  takeaway: string;
};

// --- 6. HALF-CIRCLE GAUGE & BURN-UP DATA ---
export type PlanBurnUpPoint = {
  date: string;
  label: string;
  actual: number | null;
  expected: number | null;
};

export type OverviewPlanGaugeItem = {
  instanceId: string;
  planName: string;
  isSelfPaced: boolean;
  totalChapters: number;
  completedChapters: number;
  actualPercent: number;
  expectedChapters: number | null;
  expectedPercent: number | null;
  statusText: string;
  dailyTarget: number;
  burnUpPoints: PlanBurnUpPoint[];
};

export type OverviewPlanGaugeData = {
  plans: OverviewPlanGaugeItem[];
  hasActivePlans: boolean;
  takeaway: string;
};

// --- AGGREGATED RESULT ---
export type OverviewDataResult = {
  trackerName: string;
  trackerCanon: string;
  activityRings: OverviewActivityRingsData;
  progressOverTime: OverviewStackedProgressData;
  streakHeatmap: OverviewStreakHeatmapData;
  sunburst: OverviewSunburstData;
  radialClock: OverviewRadialClockData;
  planGauge: OverviewPlanGaugeData;
};

export type GetOverviewDataParams = {
  userId: string;
  trackerId: string;
};

export async function getOverviewData({
  userId,
  trackerId,
}: GetOverviewDataParams): Promise<OverviewDataResult> {
  // 1. Fetch tracker & settings in parallel
  const [tracker, settings] = await Promise.all([
    db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.id, trackerId),
        eq(readingTrackers.userId, userId)
      ),
    }),
    db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    }),
  ]);

  const canon = ((tracker?.canon as BibleCanon) || "protestant") as BibleCanon;
  const timeZone = settings?.timezone || "UTC";
  const canonStats = getCanonTestamentChapters(canon);
  const totalChapters = canonStats.total;
  const canonBooks = getBibleBooks(canon);

  // 2. Fetch tracker chapter progress, logs, and active plans in parallel
  const [progress, logs, activePlansRows] = await Promise.all([
    db.query.trackerChapterProgress.findMany({
      where: eq(trackerChapterProgress.trackerId, trackerId),
    }),
    db.query.readingLogs.findMany({
      where: eq(readingLogs.trackerId, trackerId),
      orderBy: (readingLogs, { asc }) => [asc(readingLogs.loggedAt)],
    }),
    db.query.planInstances.findMany({
      where: and(
        eq(planInstances.trackerId, trackerId),
        eq(planInstances.status, "active")
      ),
      with: {
        completedReadings: true,
        dayOverrides: true,
      },
    }),
  ]);

  const todayStr = getLocalDateString({ timeZone });
  const completedKeysSet = new Set(
    progress.map((p) => `${p.bookId}:${p.chapter}`)
  );

  // Map progress & logs to calendar dates and testaments
  const dailyChaptersReadMap: Record<string, number> = {};
  const dailyOtChaptersMap: Record<string, number> = {};
  const dailyNtChaptersMap: Record<string, number> = {};

  for (const log of logs) {
    const dStr = getLocalDateString({ date: log.loggedAt, timeZone });
    dailyChaptersReadMap[dStr] = (dailyChaptersReadMap[dStr] ?? 0) + 1;
    const b = getBibleBookById(log.bookId, canon);
    if (b?.testament === "OT") {
      dailyOtChaptersMap[dStr] = (dailyOtChaptersMap[dStr] ?? 0) + 1;
    } else if (b?.testament === "NT") {
      dailyNtChaptersMap[dStr] = (dailyNtChaptersMap[dStr] ?? 0) + 1;
    }
  }

  // Also include trackerChapterProgress items if logs were omitted
  for (const p of progress) {
    const dStr = getLocalDateString({ date: p.completedAt, timeZone });
    if (!dailyChaptersReadMap[dStr]) {
      dailyChaptersReadMap[dStr] = 1;
      const b = getBibleBookById(p.bookId, canon);
      if (b?.testament === "OT") dailyOtChaptersMap[dStr] = 1;
      else if (b?.testament === "NT") dailyNtChaptersMap[dStr] = 1;
    }
  }

  // --- CARD 1: CONCENTRIC ACTIVITY RINGS DATA ---
  let otRead = 0;
  let ntRead = 0;
  for (const p of progress) {
    const book = getBibleBookById(p.bookId, canon);
    if (book?.testament === "OT") otRead++;
    else if (book?.testament === "NT") ntRead++;
  }
  const readChapters = progress.length;
  const overallPercentage =
    totalChapters > 0 ? Math.round((readChapters / totalChapters) * 100) : 0;
  const otPercentage =
    canonStats.ot > 0 ? Math.round((otRead / canonStats.ot) * 100) : 0;
  const ntPercentage =
    canonStats.nt > 0 ? Math.round((ntRead / canonStats.nt) * 100) : 0;

  const todayRead = dailyChaptersReadMap[todayStr] ?? 0;
  const activePlanDailyTarget = activePlansRows[0]?.dailyTarget;
  const todayTarget =
    activePlanDailyTarget && activePlanDailyTarget > 0
      ? activePlanDailyTarget
      : 3;
  const todayPercentage = Math.min(
    100,
    Math.round((todayRead / todayTarget) * 100)
  );

  // This week's chapters (Monday to Sunday)
  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const todayUtcMidday = new Date(
    Date.UTC(tY ?? 2026, (tM ?? 1) - 1, tD ?? 1, 12, 0, 0)
  );
  const dayOfWeek = todayUtcMidday.getUTCDay(); // 0 is Sun, 1 is Mon...
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const currentWeekMondayStr = shiftDateString({
    dateStr: todayStr,
    daysOffset: diffToMon,
  });

  let thisWeekChapters = 0;
  for (let i = 0; i < 7; i++) {
    const dayStr = shiftDateString({
      dateStr: currentWeekMondayStr,
      daysOffset: i,
    });
    if (dayStr <= todayStr) {
      thisWeekChapters += dailyChaptersReadMap[dayStr] ?? 0;
    }
  }

  // 30-day average pace
  let last30DaysCount = 0;
  for (let i = -29; i <= 0; i++) {
    const dStr = shiftDateString({ dateStr: todayStr, daysOffset: i });
    last30DaysCount += dailyChaptersReadMap[dStr] ?? 0;
  }
  const avgDay30d = Math.round((last30DaysCount / 30) * 10) / 10;

  // Projected finish date
  const remainingChapters = Math.max(0, totalChapters - readChapters);
  let projectedFinishDate = "—";
  if (remainingChapters === 0) {
    projectedFinishDate = "Completed";
  } else if (avgDay30d > 0) {
    const daysNeeded = Math.ceil(remainingChapters / avgDay30d);
    const finishDateStr = shiftDateString({
      dateStr: todayStr,
      daysOffset: daysNeeded,
    });
    const [fY, fM] = finishDateStr.split("-").map(Number);
    const finishDate = new Date(Date.UTC(fY ?? 2026, (fM ?? 1) - 1, 15));
    projectedFinishDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "numeric",
    }).format(finishDate);
  }

  // Next reading
  let nextReading: {
    bookName: string;
    chapter: number;
    displayText: string;
  } | null = null;
  for (const book of canonBooks) {
    for (let c = 1; c <= book.chapters; c++) {
      if (!completedKeysSet.has(`${book.id}:${c}`)) {
        nextReading = {
          bookName: book.name,
          chapter: c,
          displayText: `${book.name} ${c}`,
        };
        break;
      }
    }
    if (nextReading) break;
  }

  const rings: ActivityRingItem[] = [
    {
      key: "bible",
      label: "Bible",
      read: readChapters,
      total: totalChapters,
      percent: overallPercentage,
      opacity: 1.0,
    },
    {
      key: "ot",
      label: "Old Testament",
      read: otRead,
      total: canonStats.ot,
      percent: otPercentage,
      opacity: 0.7,
    },
    {
      key: "nt",
      label: "New Testament",
      read: ntRead,
      total: canonStats.nt,
      percent: ntPercentage,
      opacity: 0.45,
    },
    {
      key: "today",
      label: "Today's Target",
      read: todayRead,
      total: todayTarget,
      percent: todayPercentage,
      opacity: 0.25,
    },
  ];

  const activityRings: OverviewActivityRingsData = {
    totalChapters,
    readChapters,
    overallPercentage,
    rings,
    thisWeekChapters,
    avgDay30d,
    projectedFinishDate,
    nextReading,
  };

  // --- CARD 2: STACKED AREA CHART DATA (14d, 30d, 90d) ---
  const activeDaysIn30d = Array.from({ length: 30 }).filter((_, i) => {
    const dStr = shiftDateString({ dateStr: todayStr, daysOffset: -i });
    return (dailyChaptersReadMap[dStr] ?? 0) > 0;
  }).length;
  const defaultRange = activeDaysIn30d < 7 ? "14d" : "30d";

  function buildStackedRangePoints({
    days,
  }: {
    days: number;
  }): StackedProgressPoint[] {
    const pastDates: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      pastDates.push(shiftDateString({ dateStr: todayStr, daysOffset: -i }));
    }

    // Cumulative chapters read before the window
    const firstDate = pastDates[0]!;
    let otCumulative = 0;
    let ntCumulative = 0;
    for (const p of progress) {
      const dStr = getLocalDateString({ date: p.completedAt, timeZone });
      if (dStr < firstDate) {
        const b = getBibleBookById(p.bookId, canon);
        if (b?.testament === "OT") otCumulative++;
        else if (b?.testament === "NT") ntCumulative++;
      }
    }

    const points: StackedProgressPoint[] = [];
    for (let idx = 0; idx < pastDates.length; idx++) {
      const dStr = pastDates[idx]!;
      otCumulative += dailyOtChaptersMap[dStr] ?? 0;
      ntCumulative += dailyNtChaptersMap[dStr] ?? 0;
      const totalActual = otCumulative + ntCumulative;

      const parts = dStr.split("-");
      const monthNum = parseInt(parts[1] || "1", 10);
      const dayNum = parseInt(parts[2] || "1", 10);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const label = `${monthNames[monthNum - 1]} ${dayNum}`;

      points.push({
        date: dStr,
        label,
        otActual: otCumulative,
        ntActual: ntCumulative,
        totalActual,
        projected: null,
      });
    }

    // Projection for next 14 days
    const todayPoint = points[points.length - 1]!;
    todayPoint.projected = todayPoint.totalActual;

    const rangeSum = points.reduce((acc, pt, i) => {
      if (i === 0) return 0;
      return acc + ((pt.totalActual ?? 0) - (points[i - 1]?.totalActual ?? 0));
    }, 0);
    const rangePace = Math.max(0.5, Math.round((rangeSum / days) * 10) / 10);

    let projectedVal = todayPoint.totalActual ?? 0;
    for (let offset = 1; offset <= 14; offset++) {
      const fDateStr = shiftDateString({
        dateStr: todayStr,
        daysOffset: offset,
      });
      const parts = fDateStr.split("-");
      const monthNum = parseInt(parts[1] || "1", 10);
      const dayNum = parseInt(parts[2] || "1", 10);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const label = `${monthNames[monthNum - 1]} ${dayNum}`;
      projectedVal = Math.min(
        totalChapters,
        Math.round(projectedVal + rangePace)
      );

      points.push({
        date: fDateStr,
        label,
        otActual: null,
        ntActual: null,
        totalActual: null,
        projected: projectedVal,
      });
    }

    return points;
  }

  const progressOverTime: OverviewStackedProgressData = {
    ranges: {
      "14d": buildStackedRangePoints({ days: 14 }),
      "30d": buildStackedRangePoints({ days: 30 }),
      "90d": buildStackedRangePoints({ days: 90 }),
    },
    defaultRange,
    takeaway:
      remainingChapters === 0
        ? `All ${totalChapters.toLocaleString()} chapters completed`
        : `On pace to finish ${projectedFinishDate}`,
    totalChapters,
  };

  // --- CARD 3: STREAK + 16-WEEK CALENDAR HEATMAP DATA ---
  const currentStreak = settings?.currentStreak ?? 0;
  const longestStreak = settings?.longestStreak ?? 0;
  const lastReadDateStr = settings?.lastReadDate ?? null;
  const yesterdayStr = shiftDateString({ dateStr: todayStr, daysOffset: -1 });

  let frozenDatesSet = new Set<string>();
  if (settings?.frozenDatesJson) {
    try {
      const parsed = JSON.parse(settings.frozenDatesJson);
      if (Array.isArray(parsed)) {
        frozenDatesSet = new Set(parsed);
      }
    } catch {
      // ignore
    }
  }

  let effectiveStreak = currentStreak;
  if (
    !lastReadDateStr ||
    (lastReadDateStr < yesterdayStr && !frozenDatesSet.has(yesterdayStr))
  ) {
    effectiveStreak = 0;
  }

  // Weekdays (Mon-Sun)
  const weekDays: OverviewStreakDay[] = [];
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  for (let i = 0; i < 7; i++) {
    const dStr = shiftDateString({
      dateStr: currentWeekMondayStr,
      daysOffset: i,
    });
    const isToday = dStr === todayStr;
    const isFuture = dStr > todayStr;
    const isRead = (dailyChaptersReadMap[dStr] ?? 0) > 0;
    const isFrozen = frozenDatesSet.has(dStr);
    const isMissed = !isRead && !isFrozen && !isFuture;

    weekDays.push({
      dateStr: dStr,
      dayLabel: dayNames[i] ?? "Day",
      isToday,
      isRead,
      isFrozen,
      isMissed,
      isFuture,
    });
  }

  // Heatmap: 16 weeks (112 days) up to current week Sunday
  const currentWeekSundayStr = shiftDateString({
    dateStr: currentWeekMondayStr,
    daysOffset: 6,
  });
  const heatmapStartDateStr = shiftDateString({
    dateStr: currentWeekSundayStr,
    daysOffset: -(16 * 7 - 1),
  });

  const heatmapWeeks: HeatmapCell[][] = [];
  const monthLabels: HeatmapMonthLabel[] = [];
  let prevMonth = "";

  for (let w = 0; w < 16; w++) {
    const weekCells: HeatmapCell[] = [];
    const weekMondayStr = shiftDateString({
      dateStr: heatmapStartDateStr,
      daysOffset: w * 7,
    });

    for (let d = 0; d < 7; d++) {
      const cellDateStr = shiftDateString({
        dateStr: weekMondayStr,
        daysOffset: d,
      });
      const count = dailyChaptersReadMap[cellDateStr] ?? 0;
      const isToday = cellDateStr === todayStr;
      const isFuture = cellDateStr > todayStr;
      const isRead = count > 0;
      const isFrozen = frozenDatesSet.has(cellDateStr);
      const isMissed = !isRead && !isFrozen && !isFuture;

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 7) level = 4;
      else if (count >= 4) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      weekCells.push({
        dateStr: cellDateStr,
        dayOfWeek: d,
        count,
        level,
        isRead,
        isFrozen,
        isMissed,
        isToday,
        isFuture,
      });

      // Month label check on first day of week
      if (d === 0) {
        const parts = cellDateStr.split("-");
        const monthNum = parseInt(parts[1] || "1", 10);
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const monthName = monthNames[monthNum - 1] || "";
        if (monthName !== prevMonth) {
          monthLabels.push({ label: monthName, colIndex: w });
          prevMonth = monthName;
        }
      }
    }
    heatmapWeeks.push(weekCells);
  }

  // Countdown until midnight in user's timezone
  let timeLeftUntilMidnight: string | null = null;
  const isTodayCompleted = (dailyChaptersReadMap[todayStr] ?? 0) > 0;
  if (!isTodayCompleted) {
    try {
      const nowInTz = new Date(
        new Date().toLocaleString("en-US", { timeZone })
      );
      const midnightInTz = new Date(nowInTz);
      midnightInTz.setHours(24, 0, 0, 0);
      const diffMs = midnightInTz.getTime() - nowInTz.getTime();
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        timeLeftUntilMidnight = `${diffHrs}h ${diffMins}m left`;
      }
    } catch {
      timeLeftUntilMidnight = null;
    }
  }

  const streakHeatmap: OverviewStreakHeatmapData = {
    currentStreak: effectiveStreak,
    longestStreak,
    streakFreezes: settings?.streakFreezesAvailable ?? 0,
    weekDays,
    heatmapWeeks,
    monthLabels,
    timeLeftUntilMidnight,
    isTodayCompleted,
    takeaway:
      effectiveStreak >= 7
        ? `${effectiveStreak}-day streak · Strong momentum`
        : effectiveStreak > 0
          ? `${effectiveStreak}-day streak · Keep reading`
          : "Read today to start streak",
  };

  // --- CARD 4: SUNBURST, RADAR & TREEMAP DATA ---
  // Division totals
  const canonDivTotals: Record<ScriptureDivisionKey, number> = {
    law: 0,
    history: 0,
    wisdom: 0,
    prophets: 0,
    gospels: 0,
    epistles: 0,
  };
  const divisionCompleted: Record<ScriptureDivisionKey, number> = {
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
  for (const p of progress) {
    const divKey = getScriptureDivisionForBook(p.bookId);
    divisionCompleted[divKey] = (divisionCompleted[divKey] || 0) + 1;
  }

  const booksCompletedMap: Record<string, number> = {};
  for (const p of progress) {
    booksCompletedMap[p.bookId] = (booksCompletedMap[p.bookId] || 0) + 1;
  }

  // Build Sunburst Slices (Angles 0 to 360)
  const sunburstSlices: SunburstSlice[] = [];

  // Layer 1: OT & NT
  const otAngleSpan =
    totalChapters > 0 ? (canonStats.ot / totalChapters) * 360 : 180;
  sunburstSlices.push({
    id: "layer1-ot",
    name: "Old Testament",
    depth: 1,
    testament: "OT",
    completed: otRead,
    total: canonStats.ot,
    percent: otPercentage,
    startAngle: 0,
    endAngle: otAngleSpan,
  });
  sunburstSlices.push({
    id: "layer1-nt",
    name: "New Testament",
    depth: 1,
    testament: "NT",
    completed: ntRead,
    total: canonStats.nt,
    percent: ntPercentage,
    startAngle: otAngleSpan,
    endAngle: 360,
  });

  // Layer 2: Sections & Layer 3: Books
  let currentAngle = 0;
  const radarData: SectionRadarItem[] = [];
  const treemapData: BookTreemapItem[] = [];

  for (const div of SCRIPTURE_DIVISIONS) {
    const divTotal = canonDivTotals[div.key] || div.totalBibleChapters;
    const divComp = divisionCompleted[div.key] || 0;
    const divPct = divTotal > 0 ? Math.round((divComp / divTotal) * 100) : 0;
    const divSpan = totalChapters > 0 ? (divTotal / totalChapters) * 360 : 60;
    const divStart = currentAngle;
    const divEnd = currentAngle + divSpan;

    const cleanSectionName =
      div.key === "epistles" ? "Epistles" : div.shortName || div.name;

    sunburstSlices.push({
      id: `layer2-${div.key}`,
      name: cleanSectionName,
      depth: 2,
      sectionKey: div.key,
      completed: divComp,
      total: divTotal,
      percent: divPct,
      startAngle: divStart,
      endAngle: divEnd,
    });

    radarData.push({
      section: cleanSectionName,
      key: div.key,
      completed: divComp,
      total: divTotal,
      percent: divPct,
      fullMark: 100,
    });

    // Books in this division
    const divBooks = canonBooks.filter(
      (b) => getScriptureDivisionForBook(b.id) === div.key
    );
    let bookAngle = divStart;
    for (const b of divBooks) {
      const bComp = booksCompletedMap[b.id] || 0;
      const bPct = b.chapters > 0 ? Math.round((bComp / b.chapters) * 100) : 0;
      const bSpan = totalChapters > 0 ? (b.chapters / totalChapters) * 360 : 5;
      const bStart = bookAngle;
      const bEnd = bookAngle + bSpan;

      sunburstSlices.push({
        id: `layer3-${b.id}`,
        name: b.name,
        abbrev: b.name.slice(0, 3),
        depth: 3,
        testament: b.testament,
        sectionKey: div.key,
        completed: bComp,
        total: b.chapters,
        percent: bPct,
        startAngle: bStart,
        endAngle: bEnd,
      });

      treemapData.push({
        name: b.name,
        abbrev: b.name.slice(0, 3),
        size: b.chapters,
        completed: bComp,
        percent: bPct,
        section: cleanSectionName,
        testament: b.testament,
      });

      bookAngle = bEnd;
    }

    currentAngle = divEnd;
  }

  const lawPct =
    canonDivTotals.law > 0
      ? Math.round((divisionCompleted.law / canonDivTotals.law) * 100)
      : 0;
  const sunburstTakeaway = `Law ${lawPct}% complete · Epistles next`;

  const sunburst: OverviewSunburstData = {
    slices: sunburstSlices,
    radarData,
    treemapData,
    overallPercentage,
    readChapters,
    totalChapters,
    takeaway: sunburstTakeaway,
  };

  // --- CARD 5: 24-HOUR RADIAL CLOCK & WEEKDAY RADAR ---
  // Bucket readingLogs into hours (0..23) and weekdays (0..6)
  const hourlyCounts = Array(24).fill(0);
  const weekdayCounts = Array(7).fill(0);

  // Consider logs from last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  for (const log of logs) {
    if (log.loggedAt < ninetyDaysAgo) continue;
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hourCycle: "h23",
        weekday: "short",
      });
      const parts = formatter.formatToParts(log.loggedAt);
      const hourPart = parts.find((p) => p.type === "hour");
      const weekdayPart = parts.find((p) => p.type === "weekday");

      if (hourPart) {
        const hr = parseInt(hourPart.value, 10) % 24;
        hourlyCounts[hr] = (hourlyCounts[hr] || 0) + 1;
      }
      if (weekdayPart) {
        const wMap: Record<string, number> = {
          Mon: 0,
          Tue: 1,
          Wed: 2,
          Thu: 3,
          Fri: 4,
          Sat: 5,
          Sun: 6,
        };
        const wIdx = wMap[weekdayPart.value] ?? 0;
        weekdayCounts[wIdx] = (weekdayCounts[wIdx] || 0) + 1;
      }
    } catch {
      const hr = log.loggedAt.getUTCHours();
      hourlyCounts[hr] = (hourlyCounts[hr] || 0) + 1;
    }
  }

  const maxHourCount = Math.max(...hourlyCounts, 1);
  const hourlyWedges: PolarClockWedge[] = hourlyCounts.map((count, hour) => {
    const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`;
    const shortLabel = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? "p" : "a"}`;
    return {
      hour,
      label,
      shortLabel,
      chapters: count,
      percentOfMax: Math.round((count / maxHourCount) * 100),
      isQuietLabel: hour === 0 || hour === 6 || hour === 12 || hour === 18,
    };
  });

  const maxWeekdayCount = Math.max(...weekdayCounts, 1);
  const weekdayFullNames = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const weekdayShortNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekdayItems: WeekdayActivityItem[] = weekdayCounts.map(
    (count, idx) => ({
      day: weekdayShortNames[idx] || "Day",
      fullName: weekdayFullNames[idx] || "Day",
      chapters: count,
      percentOfMax: Math.round((count / maxWeekdayCount) * 100),
    })
  );

  let peakWeekdayIdx = 0;
  let peakWeekdayCount = -1;
  weekdayCounts.forEach((c, idx) => {
    if (c > peakWeekdayCount) {
      peakWeekdayCount = c;
      peakWeekdayIdx = idx;
    }
  });
  const peakWeekdayStr = weekdayFullNames[peakWeekdayIdx] || "Sunday";

  let peakHour = 0;
  let peakHourCount = -1;
  hourlyCounts.forEach((c, h) => {
    if (c > peakHourCount) {
      peakHourCount = c;
      peakHour = h;
    }
  });

  const peakHourStr = `${peakHour === 0 ? 12 : peakHour > 12 ? peakHour - 12 : peakHour} ${peakHour >= 12 ? "PM" : "AM"}`;
  const clockTakeaway =
    peakHourCount > 0
      ? `Most active around ${peakHourStr}`
      : "Log readings to see reading rhythm";

  const radialClock: OverviewRadialClockData = {
    hourlyWedges,
    weekdayItems,
    peakHourLabel: peakHourStr,
    peakWeekdayLabel: peakWeekdayStr,
    takeaway: clockTakeaway,
  };

  // --- CARD 6: HALF-CIRCLE GAUGE & BURN-UP DATA ---
  const activePlans: OverviewPlanGaugeItem[] = activePlansRows.map(
    (instance) => {
      const isSelfPaced = instance.paceType === "self_paced";
      const completedChapters = instance.completedReadings.length;
      const planTotal = instance.totalChapters;
      const actualPercent =
        planTotal > 0
          ? Math.min(100, Math.round((completedChapters / planTotal) * 100))
          : 0;

      const planStartStr = getLocalDateString({
        date: instance.startDate,
        timeZone,
      });
      const activeMask = instance.activeDaysMask || "1111111";

      // Expected chapters calculation
      const daysSinceStart = Math.max(
        0,
        getDaysDifference({ startDateStr: planStartStr, endDateStr: todayStr })
      );

      let expectedChapters: number | null = null;
      let expectedPercent: number | null = null;
      let statusText = "Self-paced";

      if (!isSelfPaced) {
        let expRunning = 0;
        for (let d = 0; d <= daysSinceStart; d++) {
          const dStr = shiftDateString({
            dateStr: planStartStr,
            daysOffset: d,
          });
          const dObj = new Date(dStr);
          const dayIdx = dObj.getDay();
          if (activeMask[dayIdx] === "1") {
            expRunning = Math.min(planTotal, expRunning + instance.dailyTarget);
          }
        }
        expectedChapters = expRunning;
        expectedPercent =
          planTotal > 0
            ? Math.min(100, Math.round((expectedChapters / planTotal) * 100))
            : 0;

        const delta = completedChapters - expectedChapters;
        if (delta > 0) statusText = `+${delta} ahead`;
        else if (delta < 0) statusText = `${delta} behind`;
        else statusText = "On track";
      }

      // Build burn-up points (14 days window)
      const burnUpPoints: PlanBurnUpPoint[] = [];
      const windowStartStr = shiftDateString({
        dateStr: todayStr,
        daysOffset: -10,
      });
      let cumulativeComp = 0;
      for (const r of instance.completedReadings) {
        const compDateStr = getLocalDateString({
          date: r.completedAt,
          timeZone,
        });
        if (compDateStr < windowStartStr) cumulativeComp++;
      }

      let actRunning = cumulativeComp;
      const expRunning = expectedChapters ?? 0;

      for (let offset = 0; offset <= 14; offset++) {
        const dStr = shiftDateString({
          dateStr: windowStartStr,
          daysOffset: offset,
        });
        const parts = dStr.split("-");
        const label = `${parts[1]}/${parts[2]}`;

        let actualVal: number | null = null;
        if (dStr <= todayStr) {
          const countOnDate = instance.completedReadings.filter((r) => {
            return (
              getLocalDateString({ date: r.completedAt, timeZone }) === dStr
            );
          }).length;
          actRunning += countOnDate;
          actualVal = Math.min(planTotal, actRunning);
        }

        burnUpPoints.push({
          date: dStr,
          label,
          actual: actualVal,
          expected: isSelfPaced ? null : Math.min(planTotal, expRunning),
        });
      }

      return {
        instanceId: instance.id,
        planName: instance.title || "Reading Plan",
        isSelfPaced,
        totalChapters: planTotal,
        completedChapters,
        actualPercent,
        expectedChapters,
        expectedPercent,
        statusText,
        dailyTarget: instance.dailyTarget,
        burnUpPoints,
      };
    }
  );

  const planGauge: OverviewPlanGaugeData = {
    plans: activePlans,
    hasActivePlans: activePlans.length > 0,
    takeaway:
      activePlans.length > 0
        ? activePlans[0]?.statusText || "On track"
        : "No active plan trajectory",
  };

  return {
    trackerName: tracker?.name || "Reading Tracker",
    trackerCanon: formatCanonName({ canon }),
    activityRings,
    progressOverTime,
    streakHeatmap,
    sunburst,
    radialClock,
    planGauge,
  };
}

type FormatCanonParams = {
  canon: string;
};

function formatCanonName({ canon }: FormatCanonParams): string {
  switch (canon) {
    case "catholic":
      return "Catholic Canon (73 Books)";
    case "eastern_orthodox":
      return "Eastern Orthodox (78 Books)";
    case "ethiopian_orthodox":
      return "Ethiopian Orthodox (81 Books)";
    case "protestant":
    default:
      return "Standard 66 Books";
  }
}
