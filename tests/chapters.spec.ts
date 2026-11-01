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
});
