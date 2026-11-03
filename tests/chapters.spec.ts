import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import {
  readingTrackers,
  trackerChapterProgress,
  readingLogs,
  user,
  planInstances,
  planInstanceReadings,
  planReadingItems,
} from "../src/db/schema";

test.describe("Chapter Progress & Reading Logs E2E", () => {
  test("unauthenticated guest sees auth guard modal when attempting to mark a chapter", async ({
    page,
  }) => {
    await page.goto("/books");
    await expect(
      page.getByRole("heading", { name: "All Books" })
    ).toBeVisible();

    // Click on Genesis card
    await page
      .getByRole("button", { name: /Genesis/i })
      .first()
      .click();

    // Modal opens
    await expect(page.locator("#chapter-dialog-title")).toHaveText("Genesis");

    // Attempt to toggle Chapter 1
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "1", exact: true })
      .click();

    // Auth modal appears
    await expect(page.getByText("Sign In to Log Progress")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign In", exact: true })
    ).toBeVisible();
  });

  test("authenticated user can toggle chapters, persist across reload, and log to database", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Berean Scholar ${testId}`,
      email: `berean_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up and complete quick onboarding
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 10000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 10000 });

    // 2. Navigate to /books
    await page.goto("/books");
    await expect(
      page.getByRole("heading", { name: "All Books" })
    ).toBeVisible();

    // 3. Open Genesis chapters modal
    await page
      .getByRole("button", { name: /Genesis/i })
      .first()
      .click();
    await expect(page.locator("#chapter-dialog-title")).toHaveText("Genesis");
    await expect(page.getByText("0 of 50 chapters read")).toBeVisible();

    // 4. Mark Chapters 1, 2, and 3
    const dialog = page.getByRole("dialog");
    const ch1 = dialog.getByRole("button", { name: "1", exact: true });
    const ch2 = dialog.getByRole("button", { name: "2", exact: true });
    const ch3 = dialog.getByRole("button", { name: "3", exact: true });

    await expect(ch1).toHaveAttribute("aria-pressed", "false");
    await ch1.click();
    await expect(ch1).toHaveAttribute("aria-pressed", "true");

    await expect(ch2).toHaveAttribute("aria-pressed", "false");
    await ch2.click();
    await expect(ch2).toHaveAttribute("aria-pressed", "true");

    await expect(ch3).toHaveAttribute("aria-pressed", "false");
    await ch3.click();
    await expect(ch3).toHaveAttribute("aria-pressed", "true");

    await expect(page.getByText("3 of 50 chapters read")).toBeVisible();

    // 5. Close modal and reload page to test persistence
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
    await page.waitForTimeout(600);
    await page.reload();

    // 6. Verify Genesis card displays 3 read chapters
    const genesisCard = page.getByRole("button", { name: /Genesis/i }).first();
    await expect(genesisCard).toBeVisible();

    // Reopen modal and verify state persisted
    await genesisCard.click();
    await expect(page.locator("#chapter-dialog-title")).toHaveText("Genesis");
    await expect(page.getByText("3 of 50 chapters read")).toBeVisible();

    const reloadedDialog = page.getByRole("dialog");
    const reloadedCh1 = reloadedDialog.getByRole("button", {
      name: "1",
      exact: true,
    });
    const reloadedCh2 = reloadedDialog.getByRole("button", {
      name: "2",
      exact: true,
    });
    const reloadedCh3 = reloadedDialog.getByRole("button", {
      name: "3",
      exact: true,
    });

    await expect(reloadedCh1).toHaveAttribute("aria-pressed", "true");
    await expect(reloadedCh2).toHaveAttribute("aria-pressed", "true");
    await expect(reloadedCh3).toHaveAttribute("aria-pressed", "true");

    // 7. Verify database records
    const dbUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(dbUser).toBeDefined();

    const tracker = await db.query.readingTrackers.findFirst({
      where: eq(readingTrackers.userId, dbUser!.id),
    });
    expect(tracker).toBeDefined();

    const progressRows = await db.query.trackerChapterProgress.findMany({
      where: and(
        eq(trackerChapterProgress.trackerId, tracker!.id),
        eq(trackerChapterProgress.bookId, "gen")
      ),
    });
    expect(progressRows).toHaveLength(3);
    const readChNumbers = progressRows.map((r) => r.chapter).sort();
    expect(readChNumbers).toEqual([1, 2, 3]);

    const logEntries = await db.query.readingLogs.findMany({
      where: and(
        eq(readingLogs.trackerId, tracker!.id),
        eq(readingLogs.bookId, "gen")
      ),
    });
    expect(logEntries.length).toBeGreaterThanOrEqual(3);

    // 8. Uncheck chapter 2 (toggle off)
    await reloadedCh2.click();
    await expect(reloadedCh2).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByText("2 of 50 chapters read")).toBeVisible();

    // Reload again to verify unchecking persisted
    await page.getByRole("button", { name: "Done" }).click();
    await page.reload();

    await page
      .getByRole("button", { name: /Genesis/i })
      .first()
      .click();
    const finalDialog = page.getByRole("dialog");
    await expect(finalDialog.getByText("2 of 50 chapters read")).toBeVisible();
    await expect(
      finalDialog.getByRole("button", { name: "2", exact: true })
    ).toHaveAttribute("aria-pressed", "false");
    await expect(
      finalDialog.getByRole("button", { name: "1", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      finalDialog.getByRole("button", { name: "3", exact: true })
    ).toHaveAttribute("aria-pressed", "true");

    // 9. Navigate to /home and verify the dashboard metrics reflect the read chapters
    await page.goto("/home");
    await expect(page.getByText("2 of 1189")).toBeVisible();
    await expect(page.getByText("Bible Progress")).toBeVisible();
  });

  test("authenticated user can mark all chapters read and reset for a book", async ({
    page,
  }) => {
    const testId = Date.now() + 50;
    const testUser = {
      fullName: `Bulk Reader ${testId}`,
      email: `bulk_${testId}@example.com`,
      password: "Password123!",
    };

    // Sign up & onboard
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 10000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 10000 });

    // Navigate to /books and open Ruth (4 chapters)
    await page.goto("/books");
    await page.getByPlaceholder("Search books...").fill("Ruth");
    await page.getByRole("button", { name: /Ruth/i }).first().click();

    await expect(page.locator("#chapter-dialog-title")).toHaveText("Ruth");
    const ruthDialog = page.getByRole("dialog");
    await expect(ruthDialog.getByText("0 of 4 chapters read")).toBeVisible();

    // Click "Mark All Read"
    await ruthDialog.getByRole("button", { name: "Mark All Read" }).click();
    await expect(ruthDialog.getByText("4 of 4 chapters read")).toBeVisible();

    // Close and reload to confirm persistence
    await ruthDialog.getByRole("button", { name: "Done" }).click();
    await page.reload();

    await page.getByPlaceholder("Search books...").fill("Ruth");
    await page.getByRole("button", { name: /Ruth/i }).first().click();
    const ruthDialog2 = page.getByRole("dialog");
    await expect(ruthDialog2.getByText("4 of 4 chapters read")).toBeVisible();

    // Click "Reset"
    await ruthDialog2.getByRole("button", { name: "Reset" }).click();
    await expect(ruthDialog2.getByText("0 of 4 chapters read")).toBeVisible();

    // Close and reload to confirm reset persistence
    await ruthDialog2.getByRole("button", { name: "Done" }).click();
    await page.reload();

    await page.getByPlaceholder("Search books...").fill("Ruth");
    await page.getByRole("button", { name: /Ruth/i }).first().click();
    const ruthDialog3 = page.getByRole("dialog");
    await expect(ruthDialog3.getByText("0 of 4 chapters read")).toBeVisible();
  });

  test("renders live Verse of the Day from YouVersion API with artwork modal", async ({
    page,
    request,
  }) => {
    // 1. Verify API route returns 200 with valid structure
    const apiRes = await request.get("/api/verse-of-the-day");
    expect(apiRes.ok()).toBe(true);
    const votdData = await apiRes.json();
    expect(votdData).toHaveProperty("reference");
    expect(votdData).toHaveProperty("text");
    expect(typeof votdData.day).toBe("number");

    // 2. Verify /books UI displays Verse of the Day banner
    await page.goto("/books");
    await expect(page.getByText("Verse of the Day")).toBeVisible();
    await expect(page.getByText("YouVersion")).toBeVisible();
    await expect(page.getByText(votdData.reference)).toBeVisible();

    // 3. Verify separate button is removed, and verse text itself is pressable for artwork
    await expect(
      page.getByRole("button", { name: "Verse Art", exact: true })
    ).not.toBeVisible();
    const verseTextButton = page.getByRole("button", {
      name: "View verse artwork",
    });
    if (await verseTextButton.isVisible()) {
      await verseTextButton.click();
      const artDialog = page.getByRole("dialog", {
        name: "Verse of the Day Artwork",
      });
      await expect(artDialog).toBeVisible();
      await expect(
        artDialog.getByRole("img", {
          name: new RegExp(
            `${votdData.reference} Verse of the Day Artwork`,
            "i"
          ),
        })
      ).toBeVisible();
      await artDialog.getByRole("button", { name: "Close" }).click();
      await expect(artDialog).not.toBeVisible();
    }
  });

  test("authenticated user starts a plan, sees 0% gauge on detail page, and toggles readings in reading flow", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Plan Scholar ${testId}`,
      email: `plan_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up and complete quick onboarding
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 10000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 10000 });

    // 2. Navigate to /plans
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    // 3. Start first plan
    const startButton = page
      .getByRole("button", { name: "Start", exact: true })
      .first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    // 4. Wizard opens: step through to review
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "Continue" }).click();
    await modal.getByRole("button", { name: "Continue" }).click();
    await modal.getByRole("button", { name: "Continue" }).click();

    // 5. On review step, click 'Confirm & Start Plan'
    const confirmBtn = modal.getByRole("button", {
      name: "Confirm & Start Plan",
    });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 6. User is redirected to plan detail page /plans/[instanceId]
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/plans\/[a-f0-9-]+/);

    // 7. Verify redesigned mobile-matching UI:
    // Speedometer Gauge displays 0% for newly started plan (NOT 25%!)
    await expect(page.getByText("JOURNEY", { exact: true })).toBeVisible();
    await expect(page.getByText("0%", { exact: true })).toBeVisible();

    // Reading flow
    await expect(page.getByText("Reading Flow")).toBeVisible();
    await expect(
      page.getByText("Swipe horizontally to browse each session")
    ).toBeVisible();
    await expect(page.getByText("Part 1", { exact: true })).toBeVisible();

    // Session 2 is initially locked with [L] lock icons
    await expect(page.getByText("Session 2").first()).toBeVisible();
    await expect(
      page.locator("[data-testid='locked-reading-item']").first()
    ).toBeVisible();

    // Toggle all reading items in Session 1 to complete it
    const session1Items = page
      .locator("[role='button']")
      .filter({ hasText: /Hebrews 1|Hebrews 2|Matthew 1|Genesis 1/i });
    const count = await session1Items.count();
    for (let i = 0; i < count; i++) {
      await session1Items.nth(i).click();
    }

    // Gauge updates from 0%
    await expect(page.getByText("0%", { exact: true })).not.toBeVisible();

    // Session 2 items (e.g. Hebrews 3) are now unlocked together!
    const session2UnlockedItem = page
      .locator("[role='button']")
      .filter({ hasText: /Hebrews 3/i });
    await expect(session2UnlockedItem).toBeVisible();

    // Switch to Pacing & Settings tab
    await page.getByRole("button", { name: "Pacing & Settings" }).click();
    await expect(page.getByText("Pacing Schedule")).toBeVisible();
    await expect(page.getByText("Daily Target")).toBeVisible();

    // Navigate to /plans and check 'Active Plans' tab
    await page.goto("/plans");
    await page.getByRole("button", { name: /Active Plans/i }).click();
    await expect(page.getByRole("link", { name: "View Plan" })).toBeVisible();
    await expect(page.getByText("Checkoff Sections")).not.toBeVisible();

    // Check Paused Plans and Finished Plans tabs are visible
    await expect(
      page.getByRole("button", { name: /Paused Plans/i })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Finished Plans/i })
    ).toBeVisible();

    // Verify empty state of Paused Plans tab
    await page.getByRole("button", { name: /Paused Plans/i }).click();
    await expect(
      page.getByRole("heading", { name: "No paused plans" })
    ).toBeVisible();

    // Verify empty state of Finished Plans tab
    await page.getByRole("button", { name: /Finished Plans/i }).click();
    await expect(
      page.getByRole("heading", { name: "No finished plans yet" })
    ).toBeVisible();

    // Return to Active Plans tab and open the plan
    await page.getByRole("button", { name: /Active Plans/i }).click();
    await page.getByRole("link", { name: "View Plan" }).click();
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });

    const currentUrl = page.url();
    const planInstanceId = currentUrl.split("/plans/")[1]!.split("?")[0]!;

    // Test Updating settings via explicit 'Update Settings' button
    await page.getByRole("button", { name: "Pacing & Settings" }).click();
    await expect(
      page.getByRole("button", { name: "Update Settings" })
    ).toBeVisible();
    // Toggle Sunday to rest day
    const sundayBtn = page
      .getByRole("button", { name: "S", exact: true })
      .first();
    await sundayBtn.click();
    await page.getByRole("button", { name: "Update Settings" }).click();
    await expect(page.getByText("Settings updated successfully")).toBeVisible();

    // Verify DB updated to activeDaysMask = "0111111"
    const updatedInstance = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, planInstanceId),
    });
    expect(updatedInstance?.activeDaysMask).toBe("0111111");

    // Test Pausing the plan
    await page.getByRole("button", { name: "Pause Plan" }).click();

    // Return to /plans: Verify plan is now in Paused Plans tab
    await page.goto("/plans");
    await page.getByRole("button", { name: /Paused Plans/i }).click();
    await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Resume Plan" })
    ).toBeVisible();

    // Resume the plan directly from the Paused tab
    await page.getByRole("button", { name: "Resume Plan" }).click();
    await page.getByRole("button", { name: /Active Plans/i }).click();
    await expect(page.getByRole("link", { name: "View Plan" })).toBeVisible();

    // Complete all readings to test 100% completion celebration & confetti
    const instanceRecord = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, planInstanceId),
    });
    expect(instanceRecord).toBeDefined();

    const items = await db.query.planReadingItems.findMany({
      where: eq(planReadingItems.templateId, instanceRecord!.templateId),
    });

    for (const item of items) {
      await db
        .insert(planInstanceReadings)
        .values({
          instanceId: planInstanceId,
          readingItemId: item.id,
        })
        .onConflictDoNothing();
    }

    await db
      .update(planInstances)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(planInstances.id, planInstanceId));

    // Reload plan detail page: 100% celebration banner is shown!
    await page.goto(`/plans/${planInstanceId}`);
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    await expect(page.getByText("Journey Finished! 🎉")).toBeVisible();
    await expect(page.getByText("Milestone Reached")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Celebrate Again" })
    ).toBeVisible();

    // Verify finished plan renames tab to 'Plan details' and hides pacing actions
    await expect(
      page.getByRole("button", { name: "Plan details" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Pacing & Settings" })
    ).not.toBeVisible();

    // Open 'Plan details' tab
    await page.getByRole("button", { name: "Plan details" }).click();
    await expect(page.getByText("Plan Overview & Statistics")).toBeVisible();
    await expect(
      page.getByText("Completed Curriculum Structure")
    ).toBeVisible();
    await expect(page.getByText("Pause Plan")).not.toBeVisible();
    await expect(page.getByText("Daily Target")).not.toBeVisible();

    // Click Celebrate Again to trigger confetti canvas
    await page.getByRole("button", { name: "Celebrate 🎉" }).click();

    // Navigate to /plans and check 'Finished Plans' tab
    await page.goto("/plans");
    await page.getByRole("button", { name: /Finished Plans/i }).click();
    await expect(page.getByText("Finished", { exact: true })).toBeVisible();
    await expect(page.getByText("Journey Complete")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Celebrate/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Review Plan" })).toBeVisible();
  });

  test("updating plan dailyTarget from pacing & settings reflects on Plan Chapters tab immediately without reload", async ({
    page,
  }) => {
    // 1. Authenticate user via signup and quick onboarding
    const testId = Date.now();
    const testUser = {
      fullName: `Plan Updater ${testId}`,
      email: `plan_updater_${testId}@example.com`,
      password: "Password123!",
    };

    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 10000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 10000 });

    // 2. Start a plan with custom pacing allowed: 'romans_grace_16' (default target: 1)
    await page.goto("/plans/templates/romans_grace_16");
    await page.getByRole("button", { name: /Configure & Start Plan/i }).click();

    // Step through enrollment modal
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await modal.getByRole("button", { name: "Continue" }).click();
    await modal.getByRole("button", { name: "Continue" }).click();
    await modal.getByRole("button", { name: "Continue" }).click();

    // On review step, click 'Confirm & Start Plan'
    const confirmBtn = modal.getByRole("button", {
      name: "Confirm & Start Plan",
    });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 3. Wait for redirect to plan detail page
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });

    // Verify initially session 1 has 0/1 completed count and only Romans 1
    await expect(page.getByText("0/1").first()).toBeVisible();
    await expect(
      page.getByText("Romans 1", { exact: true }).first()
    ).toBeVisible();

    // 4. Switch to Pacing & Settings tab
    await page.getByRole("button", { name: "Pacing & Settings" }).click();
    await expect(
      page.getByRole("button", { name: "Update Settings" })
    ).toBeVisible();

    // Increment daily target from 1 to 2
    await page.getByRole("button", { name: "+", exact: true }).click();
    await page.getByRole("button", { name: "Update Settings" }).click();
    await expect(page.getByText("Settings updated successfully")).toBeVisible();

    // 5. Switch back to Plan Chapters tab WITHOUT page reload
    await page.getByRole("button", { name: "Plan Chapters" }).click();

    // 6. Verify session 1 now has 0/2 completed count and both Romans 1 and Romans 2 immediately
    await expect(page.getByText("0/2").first()).toBeVisible();
    await expect(
      page.getByText("Romans 2", { exact: true }).first()
    ).toBeVisible();
  });
});
