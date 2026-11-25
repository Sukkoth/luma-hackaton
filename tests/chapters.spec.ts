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
    await page.goto("/bible");
    await expect(
      page.getByRole("button", { name: "Choose book and chapter" })
    ).toContainText("Genesis 1");

    // Attempt to mark Genesis 1 as read
    await page.getByRole("button", { name: "Mark Read" }).click();

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
    await page.goto("/bible");
    await expect(
      page.getByRole("button", { name: "Choose book and chapter" })
    ).toContainText("Genesis 1");

    // 3. Mark Chapters 1, 2, and 3 via the reader toolbar & Next button
    const markRead1 = page.getByRole("button", { name: "Mark Read" });
    await expect(markRead1).toHaveAttribute("aria-pressed", "false");
    await markRead1.click();
    await expect(
      page.getByRole("button", { name: "Read", exact: true })
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Next chapter" }).click();
    await expect(
      page.getByRole("button", { name: "Choose book and chapter" })
    ).toContainText("Genesis 2");
    await page.getByRole("button", { name: "Mark Read" }).click();
    await expect(
      page.getByRole("button", { name: "Read", exact: true })
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Next chapter" }).click();
    await expect(
      page.getByRole("button", { name: "Choose book and chapter" })
    ).toContainText("Genesis 3");
    await page.getByRole("button", { name: "Mark Read" }).click();
    await expect(
      page.getByRole("button", { name: "Read", exact: true })
    ).toHaveAttribute("aria-pressed", "true");

    const dbUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(dbUser).toBeDefined();

    const tracker = await db.query.readingTrackers.findFirst({
      where: eq(readingTrackers.userId, dbUser!.id),
    });
    expect(tracker).toBeDefined();

    await expect
      .poll(async () => {
        const rows = await db
          .select()
          .from(trackerChapterProgress)
          .where(
            and(
              eq(trackerChapterProgress.trackerId, tracker!.id),
              eq(trackerChapterProgress.bookId, "gen")
            )
          );
        return rows.length;
      })
      .toBe(3);

    await page.reload();

    // 6. Verify Genesis 3 still shows Read after reload and picker shows 3/50
    await expect(
      page.getByRole("button", { name: "Read", exact: true })
    ).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(
      sheet.getByRole("button", { name: /Genesis/i }).first()
    ).toContainText("3/50");
    await sheet.getByRole("button", { name: "Close" }).click();

    // 7. Verify database records
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
    await page.getByRole("button", { name: "Previous chapter" }).click();
    await expect(
      page.getByRole("button", { name: "Choose book and chapter" })
    ).toContainText("Genesis 2");
    await page.getByRole("button", { name: "Read", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Mark Read" })
    ).toHaveAttribute("aria-pressed", "false");

    // Verify DB reflects 2 chapters before reloading
    await expect
      .poll(async () => {
        const rows = await db
          .select()
          .from(trackerChapterProgress)
          .where(
            and(
              eq(trackerChapterProgress.trackerId, tracker!.id),
              eq(trackerChapterProgress.bookId, "gen")
            )
          );
        return rows.length;
      })
      .toBe(2);

    // Reload again to verify unchecking persisted
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Mark Read" })
    ).toHaveAttribute("aria-pressed", "false");

    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const finalSheet = page.getByRole("dialog");
    await expect(finalSheet).toBeVisible();
    await expect(
      finalSheet.getByRole("button", { name: /Genesis/i }).first()
    ).toContainText("2/50");
    await finalSheet.getByRole("button", { name: "Close" }).click();

    // 9. Navigate to /home and verify the dashboard metrics reflect the read chapters
    await page.goto("/home");
    await expect(page.getByText("2 of 1189")).toBeVisible();
    await expect(page.getByText("Canon Progress Rings")).toBeVisible();
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

    const [uRecord] = await db
      .select()
      .from(user)
      .where(eq(user.email, testUser.email));
    const [userTracker] = await db
      .select()
      .from(readingTrackers)
      .where(eq(readingTrackers.userId, uRecord!.id));

    // Navigate to /books and open Ruth (4 chapters) inside the picker Sheet
    await page.goto("/bible");
    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const sheet1 = page.getByRole("dialog");
    await sheet1.getByPlaceholder("Search books...").fill("Ruth");
    await sheet1.getByRole("button", { name: /Ruth/i }).first().click();

    await expect(sheet1.getByText("Ruth", { exact: true })).toBeVisible();

    // Click "Mark All Read"
    await sheet1.getByRole("button", { name: "Mark All Read" }).click();
    await expect(sheet1.getByRole("button", { name: "Reset" })).toBeVisible();

    // Verify all 4 Ruth chapters saved to DB before reloading
    await expect
      .poll(async () => {
        const rows = await db
          .select()
          .from(trackerChapterProgress)
          .where(
            and(
              eq(trackerChapterProgress.trackerId, userTracker!.id),
              eq(trackerChapterProgress.bookId, "rut")
            )
          );
        return rows.length;
      })
      .toBe(4);

    // Close and reload to confirm persistence
    await sheet1.getByRole("button", { name: "Close" }).click();
    await page.reload();

    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const sheet2 = page.getByRole("dialog");
    await sheet2.getByPlaceholder("Search books...").fill("Ruth");
    await expect(
      sheet2.getByRole("button", { name: /Ruth/i }).first()
    ).toContainText("4/4");
    await sheet2.getByRole("button", { name: /Ruth/i }).first().click();

    // Click "Reset"
    await sheet2.getByRole("button", { name: "Reset" }).click();
    await expect(
      sheet2.getByRole("button", { name: "Reset" })
    ).not.toBeVisible();

    // Verify all Ruth chapters cleared in DB before reloading
    await expect
      .poll(async () => {
        const rows = await db
          .select()
          .from(trackerChapterProgress)
          .where(
            and(
              eq(trackerChapterProgress.trackerId, userTracker!.id),
              eq(trackerChapterProgress.bookId, "rut")
            )
          );
        return rows.length;
      })
      .toBe(0);

    // Close and reload to confirm reset persistence
    await sheet2.getByRole("button", { name: "Close" }).click();
    await page.reload();

    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const sheet3 = page.getByRole("dialog");
    await sheet3.getByPlaceholder("Search books...").fill("Ruth");
    await expect(
      sheet3.getByRole("button", { name: /Ruth/i }).first()
    ).toContainText("4 ch");
  });

  test("renders live Verse of the Day from YouVersion API", async ({
    request,
  }) => {
    const apiRes = await request.get("/api/verse-of-the-day");
    expect(apiRes.ok()).toBe(true);
    const votdData = await apiRes.json();
    expect(votdData).toHaveProperty("reference");
    expect(votdData).toHaveProperty("text");
    expect(typeof votdData.day).toBe("number");
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
    await expect(page.getByText("Journey", { exact: true })).toBeVisible();
    await expect(page.getByText("0%", { exact: true })).toBeVisible();

    // Reading flow
    await expect(page.getByText("Reading Flow")).toBeVisible();
    await expect(
      page.getByText("Swipe horizontally to browse each session")
    ).toBeVisible();
    await expect(page.getByText("Part 1", { exact: true })).toBeVisible();

    // Session 2 is initially locked
    await expect(page.getByText("Session 2").first()).toBeVisible();
    await expect(
      page
        .getByRole("button", {
          name: "Locked: complete previous sessions first",
        })
        .first()
    ).toBeVisible();

    // Toggle all reading items in Session 1 to complete it
    const session1Items = page
      .locator("[role='button']")
      .filter({ hasText: /Hebrews 1|Hebrews 2|Matthew 1|Genesis 1/i });
    const count = await session1Items.count();
    for (let i = 0; i < count; i++) {
      await session1Items.nth(i).click();
      await expect(session1Items.nth(i)).toHaveAttribute(
        "aria-pressed",
        "true"
      );
    }

    // Session 2 remains locked until server processes completion (no optimistic unlock)
    await expect(
      page
        .getByRole("button", {
          name: "Locked: complete previous sessions first",
        })
        .first()
    ).toBeVisible();

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
    const pacingSettingsBtn = page.getByRole("button", {
      name: "Pacing & Settings",
    });
    await expect(pacingSettingsBtn).toBeVisible({ timeout: 15000 });
    await pacingSettingsBtn.click();
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

    // Reload plan detail page: 100% celebration is shown!
    await page.goto(`/plans/${planInstanceId}`);
    await expect(page.getByText("100%", { exact: true })).toBeVisible();
    // Gauge shows "Completed" badge when finished (first occurrence)
    await expect(
      page.getByText("Completed", { exact: true }).first()
    ).toBeVisible();

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
    await expect(
      page.getByRole("button", { name: "Plan Chapters" })
    ).toBeVisible();

    // Verify initially session 1 has 1 reading (Romans 1)
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

    // 6. Verify session 1 now has 2 readings (Romans 1 and Romans 2) immediately
    await expect(
      page.getByText("Romans 2", { exact: true }).first()
    ).toBeVisible();
  });
});
