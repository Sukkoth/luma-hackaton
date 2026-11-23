import { test, expect } from "@playwright/test";
import {
  getReadingPlanById,
  isPlanCanonCompatible,
} from "../src/data/readingPlans";
import { PROTESTANT_BIBLE_BOOKS } from "../src/data/canons/protestant";
import { buildPlanSessions } from "../src/lib/plans/export-plan-pdf";

test.describe("Extracted 1-Year Reading Plans from Blue Letter Bible", () => {
  test("1-Year Blended Plan has 365 days, 1189 separate chapters, and resolves all abbreviations", () => {
    const plan = getReadingPlanById("blended_1_year");
    expect(plan).toBeDefined();
    if (!plan) return;

    expect(plan.id).toBe("blended_1_year");
    expect(plan.title).toBe("1-Year Blended Plan");
    expect(plan.category).toBe("Whole Bible");
    expect(plan.recommendedDays).toBe(365);
    expect(plan.totalChapters).toBe(1189);
    expect(plan.readings.length).toBe(1189);
    expect(plan.sections.length).toBe(4);

    // Verify day numbers range from 1 to 365
    const dayNumbers = new Set(plan.readings.map((r) => r.dayNumber));
    expect(dayNumbers.size).toBe(365);
    expect(Math.min(...Array.from(dayNumbers as Set<number>))).toBe(1);
    expect(Math.max(...Array.from(dayNumbers as Set<number>))).toBe(365);

    // Verify Day 1 has separate items for Gen 1, Gen 2, Gen 3, Rom 1
    const day1Readings = plan.readings.filter((r) => r.dayNumber === 1);
    expect(day1Readings.length).toBe(4);
    expect(day1Readings.map((r) => r.displayText)).toEqual([
      "Genesis 1",
      "Genesis 2",
      "Genesis 3",
      "Romans 1",
    ]);
    expect(day1Readings[0]?.bookId).toBe("gen");
    expect(day1Readings[0]?.chapter).toBe(1);
    expect(day1Readings[3]?.bookId).toBe("rom");
    expect(day1Readings[3]?.chapter).toBe(1);

    // Verify Mark is properly resolved from 'Mar'
    const markReadings = plan.readings.filter((r) => r.bookId === "mrk");
    expect(markReadings.length).toBe(16);
    expect(markReadings[0]?.bookName).toBe("Mark");

    // Verify 100% chapter coverage of all 66 Protestant Bible books
    const chapterTracker = new Map<string, Set<number>>();
    for (const b of PROTESTANT_BIBLE_BOOKS) {
      chapterTracker.set(b.id, new Set());
    }

    for (const item of plan.readings) {
      expect(item.order).toBeGreaterThan(0);
      expect(item.bookId).toBeTruthy();
      expect(item.bookName).toBeTruthy();
      expect(item.chapter).toBeGreaterThan(0);
      chapterTracker.get(item.bookId)?.add(item.chapter);
    }

    for (const b of PROTESTANT_BIBLE_BOOKS) {
      const readChapters = chapterTracker.get(b.id);
      expect(
        readChapters?.size,
        `Book ${b.name} (${b.id}) must have all ${b.chapters} chapters read`
      ).toBe(b.chapters);
    }

    // Canon compatibility
    expect(isPlanCanonCompatible({ plan, trackerCanon: "protestant" })).toBe(
      true
    );
  });

  test("1-Year Chronological Plan has 365 days, 1189 separate chapters, and 4 era sections", () => {
    const plan = getReadingPlanById("chronological_1_year");
    expect(plan).toBeDefined();
    if (!plan) return;

    expect(plan.id).toBe("chronological_1_year");
    expect(plan.title).toBe("1-Year Chronological Plan");
    expect(plan.category).toBe("Chronological");
    expect(plan.recommendedDays).toBe(365);
    expect(plan.totalChapters).toBe(1189);
    expect(plan.readings.length).toBe(1189);
    expect(plan.sections.length).toBe(4);

    // Verify day numbers range from 1 to 365
    const dayNumbers = new Set(plan.readings.map((r) => r.dayNumber));
    expect(dayNumbers.size).toBe(365);
    expect(Math.min(...Array.from(dayNumbers as Set<number>))).toBe(1);
    expect(Math.max(...Array.from(dayNumbers as Set<number>))).toBe(365);

    // Verify Day 1 has separate items for Gen 1, Gen 2, Gen 3
    const day1Readings = plan.readings.filter((r) => r.dayNumber === 1);
    expect(day1Readings.length).toBe(3);
    expect(day1Readings.map((r) => r.displayText)).toEqual([
      "Genesis 1",
      "Genesis 2",
      "Genesis 3",
    ]);

    // Verify complex comma-separated psalm days like Psa 7, 27, 31, 34, 52 are separate
    const psaMultiDay = plan.readings.filter(
      (r) =>
        r.bookId === "psa" &&
        [7, 27, 31, 34, 52].includes(r.chapter) &&
        r.dayNumber === 105
    );
    expect(psaMultiDay.length).toBe(5);

    // Verify 100% chapter coverage of all 66 Protestant Bible books
    const chapterTracker = new Map<string, Set<number>>();
    for (const b of PROTESTANT_BIBLE_BOOKS) {
      chapterTracker.set(b.id, new Set());
    }

    for (const item of plan.readings) {
      chapterTracker.get(item.bookId)?.add(item.chapter);
    }

    for (const b of PROTESTANT_BIBLE_BOOKS) {
      const readChapters = chapterTracker.get(b.id);
      expect(
        readChapters?.size,
        `Book ${b.name} (${b.id}) must have all ${b.chapters} chapters read`
      ).toBe(b.chapters);
    }

    // Sections chapter count sum equals 1189
    const sectionTotal = plan.sections.reduce(
      (sum, s) => sum + s.chaptersCount,
      0
    );
    expect(sectionTotal).toBe(1189);

    // Canon compatibility
    expect(isPlanCanonCompatible({ plan, trackerCanon: "protestant" })).toBe(
      true
    );
  });

  test("Chronological Plan respects curated uneven sessions by default, but distributes evenly when customized", () => {
    const plan = getReadingPlanById("chronological_1_year");
    expect(plan).toBeDefined();
    if (!plan) return;

    // 1. Default / Curated pace: keeps author's 365 narrative sessions with uneven chapters
    const curatedSessions = buildPlanSessions({
      readings: plan.readings,
      dailyTarget: 4,
      paceType: "curated",
    });
    expect(curatedSessions.length).toBe(365);
    // Session 1 has Gen 1, 2, 3 (3 chapters)
    expect(curatedSessions[0]?.items.length).toBe(3);
    // Session 2 has Gen 4, 5, 6, 7 (4 chapters)
    expect(curatedSessions[1]?.items.length).toBe(4);

    // 2. Custom pace of 4 chapters per day: evenly distributes readings into chunks of 4
    const even4Sessions = buildPlanSessions({
      readings: plan.readings,
      dailyTarget: 4,
      paceType: "by_daily_target",
    });
    // 1189 / 4 = 297.25 => 298 sessions
    expect(even4Sessions.length).toBe(298);
    // Every session except the last has exactly 4 chapters
    for (let i = 0; i < even4Sessions.length - 1; i++) {
      expect(even4Sessions[i]?.items.length).toBe(4);
    }
    // Last session has remainder 1189 % 4 = 1 chapter
    expect(even4Sessions[even4Sessions.length - 1]?.items.length).toBe(1);

    // 3. Custom pace of 5 chapters per day: evenly distributes readings into chunks of 5
    const even5Sessions = buildPlanSessions({
      readings: plan.readings,
      dailyTarget: 5,
      paceType: "by_daily_target",
    });
    // 1189 / 5 = 237.8 => 238 sessions
    expect(even5Sessions.length).toBe(238);
    for (let i = 0; i < even5Sessions.length - 1; i++) {
      expect(even5Sessions[i]?.items.length).toBe(5);
    }
    expect(even5Sessions[even5Sessions.length - 1]?.items.length).toBe(4);
  });
});
