import { test, expect, type Page } from "@playwright/test";
import { db } from "../src/db";
import {
  user,
  readingTrackers,
  trackerChapterProgress,
} from "../src/db/schema";
import { and, eq } from "drizzle-orm";

type CreateAndOnboardUserParams = {
  page: Page;
  fullName: string;
  email: string;
  password?: string;
};

async function createAndOnboardUser({
  page,
  fullName,
  email,
  password = "Password123!",
}: CreateAndOnboardUserParams): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Full Name").fill(fullName);
  await page.getByLabel("Email address").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.getByRole("checkbox", { name: /agree/i }).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await page.waitForURL("/onboarding", { timeout: 15000 });
  await page.getByRole("button", { name: "Skip to Setup" }).click();
  await page
    .getByRole("button", { name: "Complete Onboarding & Begin" })
    .click();
  await page.waitForURL("/home", { timeout: 15000 });
}

test.describe("Insights & Visualisations E2E", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/insights");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects /insights to dedicated /achievements page and displays milestones", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `insights_reader_${testId}@example.com`;
    const fullName = `Scholar Ezra ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    // 1. Navigate to /insights and verify redirect to /achievements
    await page.goto("/insights");
    await expect(page).toHaveURL(/\/achievements/);

    // 2. Verify dedicated Achievements & Milestones heading
    await expect(
      page.getByRole("heading", { name: "Scripture Achievements & Milestones" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Milestone Gallery" })
    ).toBeVisible();

    // 3. Verify KPI Overview Cards
    await expect(page.getByText("Total Badges")).toBeVisible();
    await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();
    await expect(page.getByText("In Progress", { exact: true })).toBeVisible();
    await expect(page.getByText("Completion Rate")).toBeVisible();

    // 5. Navigate to /books and mark Genesis Chapter 1 as read
    await page.goto("/bible");
    const markReadBtn = page.getByRole("button", { name: "Mark Read" });
    await expect(markReadBtn).toBeVisible({ timeout: 15000 });
    await expect(markReadBtn).toHaveAttribute("aria-pressed", "false");
    await markReadBtn.click();
    await expect(
      page.getByRole("button", { name: "Mark Read" })
    ).toHaveCount(0);

    const [uRecord] = await db.select().from(user).where(eq(user.email, email));
    const [userTracker] = await db
      .select()
      .from(readingTrackers)
      .where(eq(readingTrackers.userId, uRecord!.id));

    // Verify chapter was recorded in DB for this tracker before navigating
    await expect
      .poll(async () => {
        const rows = await db
          .select()
          .from(trackerChapterProgress)
          .where(
            and(
              eq(trackerChapterProgress.trackerId, userTracker!.id),
              eq(trackerChapterProgress.bookId, "gen"),
              eq(trackerChapterProgress.chapter, 1)
            )
          );
        return rows.length;
      })
      .toBe(1);

    // 6. Return to /achievements and verify First Step milestone unlocked
    await page.goto("/achievements");
    await expect(page).toHaveURL(/\/achievements/);
    await expect(
      page.getByRole("heading", { name: "Milestone Gallery" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "First Step", level: 3 })
    ).toBeVisible();
  });

  test("renders all five interactive visualisations on overview dashboard with mode toggles", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `visuals_user_${testId}@example.com`;
    const fullName = `Visuals Piper ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    await page.goto("/home");
    await expect(page).toHaveURL(/\/home/);

    // 1. Canon Progress Rings (ActivityRingsCard)
    const ringsCard = page
      .locator(".ui-card")
      .filter({ hasText: "Canon Progress Rings" });
    await expect(ringsCard).toBeVisible();
    await expect(ringsCard.locator("svg").first()).toBeVisible();

    // 2. Reading Velocity & Progress (ProgressOverTimeCard)
    const velocityCard = page
      .locator(".ui-card")
      .filter({ hasText: "Reading Velocity & Progress" });
    await expect(velocityCard).toBeVisible();

    // Test range toggles: 14d, 30d, 90d
    const btn14d = velocityCard.getByRole("button", { name: "14d" });
    const btn30d = velocityCard.getByRole("button", { name: "30d" });
    const btn90d = velocityCard.getByRole("button", { name: "90d" });

    await expect(btn14d).toBeVisible();
    await expect(btn30d).toBeVisible();
    await expect(btn90d).toBeVisible();

    await btn14d.click();
    await expect(btn14d).toHaveClass(/bg-card/);

    await btn90d.click();
    await expect(btn90d).toHaveClass(/bg-card/);

    await btn30d.click();
    await expect(btn30d).toHaveClass(/bg-card/);

    // 3. Reading Streak Heatmap (StreakHeatmapCard)
    const streakCard = page
      .locator(".ui-card")
      .filter({ hasText: "Reading Streak" });
    await expect(streakCard).toBeVisible();

    // 4. Canon Depth (SunburstCard)
    const depthCard = page
      .locator(".ui-card")
      .filter({ hasText: "Canon Depth" });
    await expect(depthCard).toBeVisible();

    // Test mode toggles: radar, sunburst, treemap
    const btnRadar = depthCard.getByRole("button", { name: "radar" });
    const btnSunburst = depthCard.getByRole("button", { name: "sunburst" });
    const btnTreemap = depthCard.getByRole("button", { name: "treemap" });

    await expect(btnRadar).toBeVisible();
    await expect(btnSunburst).toBeVisible();
    await expect(btnTreemap).toBeVisible();

    // Toggle to sunburst
    await btnSunburst.click();
    await expect(btnSunburst).toHaveClass(/bg-card/);
    await expect(depthCard.locator("svg").first()).toBeVisible();

    // Toggle to treemap
    await btnTreemap.click();
    await expect(btnTreemap).toHaveClass(/bg-card/);

    // Toggle back to radar
    await btnRadar.click();
    await expect(btnRadar).toHaveClass(/bg-card/);

    // 5. Reading Rhythm (RadialClockCard)
    const rhythmCard = page
      .locator(".ui-card")
      .filter({ hasText: "Reading Rhythm" });
    await expect(rhythmCard).toBeVisible();

    const btn24h = rhythmCard.getByRole("button", { name: "24h Clock" });
    const btn7d = rhythmCard.getByRole("button", { name: "7-Day Radar" });

    await expect(btn24h).toBeVisible();
    await expect(btn7d).toBeVisible();

    // Switch to 24h Clock
    await btn24h.click();
    await expect(btn24h).toHaveClass(/bg-card/);

    // Switch back to 7-Day Radar
    await btn7d.click();
    await expect(btn7d).toHaveClass(/bg-card/);
  });
});
