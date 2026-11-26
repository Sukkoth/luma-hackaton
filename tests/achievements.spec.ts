import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { db } from "../src/db";
import {
  user,
  readingTrackers,
  trackerChapterProgress,
} from "../src/db/schema";
import { and, eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

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
  await page.locator("#signup-confirm-password").fill(password);
  await page.getByRole("checkbox", { name: /agree/i }).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await page.waitForURL("/onboarding", { timeout: 15000 });
  await page.getByRole("button", { name: "Skip to Setup" }).click();
  await page
    .getByRole("button", { name: "Complete Onboarding & Begin" })
    .click();
  await page.waitForURL("/home", { timeout: 15000 });
}

test.describe("Achievements & Milestones E2E", () => {
  test("displays achievements KPI tiles, status filters, and category tabs", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Scholar Apollos ${testId}`,
      email: `apollos_ach_${testId}@example.com`,
    };

    // 1. Sign up and onboard
    await createAndOnboardUser({
      page,
      fullName: testUser.fullName,
      email: testUser.email,
    });

    // 2. Navigate to Badges & Milestones on Insights page
    await page.goto("/insights?tab=achievements");
    await expect(
      page.getByRole("heading", { name: "Milestone Gallery" })
    ).toBeVisible();

    // 3. Verify KPI Overview Tiles
    await expect(page.getByText("Total Badges")).toBeVisible();
    await expect(page.getByText("Unlocked", { exact: true })).toBeVisible();
    await expect(page.getByText("In Progress", { exact: true })).toBeVisible();
    await expect(page.getByText("Completion Rate")).toBeVisible();

    // 4. Test Status Segmented Filter (All, Unlocked, Locked)
    const statusTabs = page.getByTestId("achievement-status-filter");
    await expect(statusTabs).toBeVisible();

    // Switch to Locked
    await statusTabs.getByRole("button", { name: /^Locked/i }).click();
    await expect(page).toHaveURL(/status=Locked/);

    // Switch to Unlocked
    await statusTabs.getByRole("button", { name: /^Unlocked/i }).click();
    await expect(page).toHaveURL(/status=Unlocked/);

    // Switch back to All (default value removes status param from query string in nuqs)
    await statusTabs.getByRole("button", { name: /^All/i }).click();
    await expect(page).not.toHaveURL(/status=Locked/);
    await expect(page).not.toHaveURL(/status=Unlocked/);

    // 5. Test Category Filter Pills
    await page
      .getByRole("button", { name: "Wisdom & Poetry", exact: true })
      .click();
    await expect(page).toHaveURL(/category=Wisdom/);
    await expect(
      page.getByText("Poet of Praises").or(page.getByText("Psalm Singer"))
    ).toBeVisible();

    await page.getByRole("button", { name: "Trackers", exact: true }).click();
    await expect(page).toHaveURL(/category=Trackers/);
    await expect(page.getByText("Dual Track Scholar")).toBeVisible();

    await page
      .getByRole("button", { name: "Fellowships", exact: true })
      .click();
    await expect(page).toHaveURL(/category=Fellowships/);
    await expect(page.getByText("Circle of Faith")).toBeVisible();
    await expect(page.getByText("Shared Finish Line")).toBeVisible();

    // Reset category filter
    await page
      .getByRole("button", { name: "All Categories", exact: true })
      .click();
  });

  test("unlocks 'First Step' achievement on chapter read and triggers milestone share modal", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Pioneer Caleb ${testId}`,
      email: `caleb_ach_${testId}@example.com`,
    };

    // 1. Sign up and onboard
    await createAndOnboardUser({
      page,
      fullName: testUser.fullName,
      email: testUser.email,
    });

    // 2. Mark first Bible chapter (Genesis 1) as read
    await page.goto("/bible");
    const markReadBtn = page.getByRole("button", { name: "Mark Read" });
    await expect(markReadBtn).toBeVisible({ timeout: 15000 });
    await expect(markReadBtn).toHaveAttribute("aria-pressed", "false");
    await markReadBtn.click();
    await expect(page.getByRole("button", { name: "Mark Read" })).toHaveCount(
      0
    );

    const [uRecord] = await db
      .select()
      .from(user)
      .where(eq(user.email, testUser.email));
    const [userTracker] = await db
      .select()
      .from(readingTrackers)
      .where(eq(readingTrackers.userId, uRecord!.id));

    // Verify chapter was saved to DB for this tracker before navigating
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

    // 3. Visit Achievements page
    await page.goto("/insights?tab=achievements");
    await expect(
      page.getByRole("heading", { name: "Milestone Gallery" })
    ).toBeVisible();

    // 4. Verify First Step milestone is unlocked
    const firstStepCard = page
      .getByRole("button")
      .filter({ hasText: "First Step" })
      .first();
    await expect(firstStepCard).toBeVisible();

    // 5. Click the milestone card to open ShareMilestoneModal
    await firstStepCard.click();
    const shareModal = page.getByRole("dialog", { name: "First Step" });
    await expect(shareModal).toBeVisible();
    await expect(
      shareModal.getByRole("heading", { name: "First Step", level: 2 })
    ).toBeVisible();
    await expect(
      shareModal.getByText("Read your first chapter of the Bible")
    ).toBeVisible();
    await expect(
      shareModal.getByRole("button", { name: "Share Milestone Image" })
    ).toBeVisible();
    await expect(
      shareModal.getByRole("button", { name: "Download Image" })
    ).toBeVisible();

    // 6. Close share modal via Done button
    const doneBtn = shareModal.getByRole("button", { name: "Done" });
    await doneBtn.click();
    await expect(shareModal).not.toBeVisible();
  });
});
