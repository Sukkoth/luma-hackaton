import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { evaluateUserStreak } from "../src/lib/streak";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("Streak Engine Pure Unit Tests", () => {
  const TODAY = "2026-11-10";

  test("empty reading dates results in 0 streak and 0 freezes", () => {
    const result = evaluateUserStreak({
      readingDates: new Set<string>(),
      todayStr: TODAY,
    });

    expect(result.currentStreak).toBe(0);
    expect(result.availableFreezes).toBe(0);
    expect(result.isFreezeUnlocked).toBe(false);
    expect(result.isTodayCompleted).toBe(false);
  });

  test("reading today gives 1-day streak, freezes remain locked (< 7 days)", () => {
    const result = evaluateUserStreak({
      readingDates: new Set([TODAY]),
      todayStr: TODAY,
    });

    expect(result.currentStreak).toBe(1);
    expect(result.availableFreezes).toBe(0);
    expect(result.isFreezeUnlocked).toBe(false);
    expect(result.isTodayCompleted).toBe(true);
  });

  test("streak < 7 cannot use freezes: missing a day resets streak to 0", () => {
    // 6 consecutive days: Nov 4 to Nov 9. Nov 3 was missed.
    const dates = new Set([
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
    ]);

    // If today is Nov 10 and not read yet, streak is 6 (yesterday Nov 9 was read)
    const resultBeforeToday = evaluateUserStreak({
      readingDates: dates,
      todayStr: TODAY,
    });
    expect(resultBeforeToday.currentStreak).toBe(6);
    expect(resultBeforeToday.isFreezeUnlocked).toBe(false);

    // If user missed Nov 9 (only read Nov 4 to Nov 8), streak breaks on Nov 9 because streak was 5 (< 7)
    const brokenDates = new Set([
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
    ]);
    const brokenResult = evaluateUserStreak({
      readingDates: brokenDates,
      todayStr: TODAY,
    });
    // Nov 9 was missed and streak was < 7 -> broke to 0
    expect(brokenResult.currentStreak).toBe(0);
    expect(brokenResult.availableFreezes).toBe(0);
  });

  test("reaching 7 consecutive days unlocks streak freezes (3 available)", () => {
    // 7 consecutive days: Nov 3 to Nov 9
    const dates = new Set([
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
    ]);

    const result = evaluateUserStreak({
      readingDates: dates,
      todayStr: TODAY,
    });

    expect(result.currentStreak).toBe(7);
    expect(result.isFreezeUnlocked).toBe(true);
    expect(result.availableFreezes).toBe(3);
  });

  test("eligible user (streak >= 7) consumes up to 3 consecutive freezes to preserve streak", () => {
    // User read Days 1-7 (Nov 1 to Nov 7).
    // Days 8, 9, 10 (Nov 8, 9, 10) were missed.
    // Today is Nov 11 (not read yet).
    const dates = new Set([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
    ]);

    // 1 missed day (Nov 8 missed, today is Nov 9)
    const res1 = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-09",
    });
    expect(res1.currentStreak).toBe(7); // Preserved, not counted
    expect(res1.availableFreezes).toBe(2);
    expect(res1.consecutiveFreezesUsed).toBe(1);
    expect(res1.frozenDates).toContain("2026-11-08");

    // 2 missed days (Nov 8, Nov 9 missed, today is Nov 10)
    const res2 = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-10",
    });
    expect(res2.currentStreak).toBe(7);
    expect(res2.availableFreezes).toBe(1);
    expect(res2.consecutiveFreezesUsed).toBe(2);
    expect(res2.frozenDates).toEqual(["2026-11-08", "2026-11-09"]);

    // 3 missed days (Nov 8, 9, 10 missed, today is Nov 11)
    const res3 = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-11",
    });
    expect(res3.currentStreak).toBe(7);
    expect(res3.availableFreezes).toBe(0);
    expect(res3.consecutiveFreezesUsed).toBe(3);
    expect(res3.frozenDates).toEqual([
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
    ]);

    // 4th missed day: Nov 11 was also missed, today is Nov 12
    const res4 = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-12",
    });
    expect(res4.currentStreak).toBe(0); // Broke!
    expect(res4.availableFreezes).toBe(0);
    expect(res4.isFreezeUnlocked).toBe(false);
  });

  test("freezes do NOT count as streak days: streak only advances on active reading days", () => {
    // User read Nov 1..7 (streak = 7).
    // Nov 8 missed (frozen).
    // Nov 9 read!
    const dates = new Set([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-09", // Nov 8 missed, Nov 9 read
    ]);

    const res = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-09",
    });

    // 7 active days + 1 active day = 8 (Nov 8 was NOT counted as day 8)
    expect(res.currentStreak).toBe(8);
    expect(res.availableFreezes).toBe(2);
    expect(res.frozenDates).toContain("2026-11-08");
  });

  test("every 3 consecutive active reading days restores 1 freeze shield (capped at 3)", () => {
    // User read Nov 1..7 (streak = 7, 3 freezes unlocked)
    // Nov 8 missed (1 freeze consumed -> 2 freezes left)
    // Nov 9 read (consecutive reading day 1 -> 2 freezes)
    // Nov 10 read (consecutive reading day 2 -> 2 freezes)
    // Nov 11 read (consecutive reading day 3 -> restores +1 freeze! -> 3 freezes!)
    const dates = new Set([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-09",
      "2026-11-10",
    ]);

    const res2Days = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-10",
    });
    expect(res2Days.currentStreak).toBe(9);
    expect(res2Days.availableFreezes).toBe(2);
    expect(res2Days.freezeRestorationDaysCount).toBe(2);

    dates.add("2026-11-11");
    const res3Days = evaluateUserStreak({
      readingDates: dates,
      todayStr: "2026-11-11",
    });
    expect(res3Days.currentStreak).toBe(10);
    expect(res3Days.availableFreezes).toBe(3); // Restored!
    expect(res3Days.freezeRestorationDaysCount).toBe(0);
  });
});

test.describe("Streak UI & Modal E2E", () => {
  test("authenticated user can view streak button in navbar and open streak modal", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Streak Tester ${testId}`,
      email: `streak_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    // 2. Complete onboarding
    await page.waitForURL("/onboarding", { timeout: 10000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 10000 });

    // Navbar streak button is visible
    const streakBtn = page.getByTestId("streak-navbar-button");
    await expect(streakBtn).toBeVisible();

    // Click streak button to open modal
    await streakBtn.click();

    // Modal opens
    const modalTitle = page.locator("#streak-dialog-title");
    await expect(modalTitle).toBeVisible();
    await expect(modalTitle).toHaveText("Reading Habit Streak");

    // Modal displays Freeze Shields info (Locked because streak is 0 < 7)
    await expect(page.getByText("Unlocks at 7-day streak")).toBeVisible();

    // Activity history section is visible
    await expect(page.getByText("Reading Activity History")).toBeVisible();

    // Close modal via Done button
    await page.getByRole("button", { name: "Done" }).click();
    await expect(modalTitle).not.toBeVisible();

    // 4. Navigate to /books, mark a chapter, verify streak updates
    await page.goto("/books");
    await page
      .getByRole("button", { name: /Genesis/i })
      .first()
      .click();
    await expect(page.locator("#chapter-dialog-title")).toHaveText("Genesis");

    // Toggle Chapter 1
    const ch1 = page
      .getByRole("dialog")
      .getByRole("button", { name: "1", exact: true });
    await ch1.click();
    await expect(ch1).toHaveAttribute("aria-pressed", "true");

    // Close chapters modal
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Done" })
      .click();

    // Top navbar streak button now shows 1
    await expect(streakBtn).toContainText("1");

    // Reopen streak modal
    await streakBtn.click();
    await expect(page.getByText("Read completed today")).toBeVisible();
  });
});
