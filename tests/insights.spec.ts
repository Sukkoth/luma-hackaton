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

  test("displays scripture coverage KPIs, theological divisions, and updates dynamically after reading a chapter", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `insights_reader_${testId}@example.com`;
    const fullName = `Scholar Ezra ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    // 1. Navigate to /insights
    await page.goto("/insights");
    await expect(page).toHaveURL(/\/insights/);

    // 2. Verify segmented tabs in InsightsContainer
    await expect(
      page.getByRole("button", { name: "Scripture Coverage" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Badges & Milestones/i })
    ).toBeVisible();

    // 3. Verify KPI Overview Cards
    await expect(
      page.getByText("Reading Streak", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Bible Complete", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Streak Freezes", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Active Tracker", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Personal Reading").first()).toBeVisible();

    // 4. Verify Canon Coverage Section & Theological Divisions
    const canonSection = page.locator("section").filter({
      hasText: "Canon Coverage & Scripture Divisions",
    });
    await expect(canonSection).toBeVisible();
    await expect(canonSection.getByText(/Protestant Standard/i)).toBeVisible();

    // Initial state: 0 / 187 chapters for Pentateuch
    const pentateuchCard = canonSection
      .locator("div")
      .filter({ hasText: "Law & Pentateuch" })
      .first();
    await expect(pentateuchCard.getByText("0 / 187")).toBeVisible();

    // 5. Navigate to /books and mark Genesis Chapter 1 as read
    await page.goto("/books");
    await expect(
      page.getByRole("heading", { name: "All Books" })
    ).toBeVisible();

    const genesisCard = page.getByText("Genesis").first();
    await genesisCard.click();

    const chaptersDialog = page.getByRole("dialog");
    await expect(chaptersDialog).toBeVisible();
    await expect(
      chaptersDialog.getByRole("heading", { name: "Genesis" })
    ).toBeVisible();

    // Click chapter 1 button to mark as read
    const ch1Btn = chaptersDialog.getByRole("button", {
      name: "1",
      exact: true,
    });
    await expect(ch1Btn).toBeVisible();
    await ch1Btn.click();
    await expect(ch1Btn).toHaveAttribute("aria-pressed", "true");

    // Close chapters modal
    await chaptersDialog
      .getByRole("button", { name: "Close chapter sheet" })
      .click();
    await expect(chaptersDialog).not.toBeVisible();

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

    // 6. Return to /insights and verify updated counts
    await page.goto("/insights");
    await expect(page).toHaveURL(/\/insights/);

    const freshCanonSection = page.locator("section").filter({
      hasText: "Canon Coverage & Scripture Divisions",
    });
    const freshPentateuchCard = freshCanonSection
      .locator("div")
      .filter({ hasText: "Law & Pentateuch" })
      .first();

    // Law / Pentateuch division now reflects 1 / 187
    await expect(freshPentateuchCard.getByText("1 / 187")).toBeVisible();

    // Reading streak now indicates active reading
    await expect(page.getByText("1 Day").first()).toBeVisible();

    // Bible complete indicates 1 chapter read
    await expect(page.getByText(/1 of 1,?189 chapters/i).first()).toBeVisible();
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
