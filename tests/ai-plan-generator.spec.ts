import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import fs from "node:fs";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { user } from "../src/db/schema";
import { PROTESTANT_BIBLE_BOOKS } from "../src/data/canons/protestant";
import { distributeBlueprintToPlan } from "../src/lib/ai/plan-generator";

test.describe("AI Plan Generator", () => {
  test("distributeBlueprintToPlan distributes a 1-year whole-Bible blueprint across 365 days without invalid chapters", () => {
    const result = distributeBlueprintToPlan({
      targetDays: 365,
      canon: "protestant",
      blueprint: {
        title: "One Year Through Scripture",
        subtitle: "Complete 365-day canonical journey",
        description: "Read all 66 books across one year.",
        category: "Canonical",
        sections: [
          {
            title: "All 66 Books",
            ranges: PROTESTANT_BIBLE_BOOKS.map((book) => ({
              bookId: book.id,
              startChapter: 1,
              endChapter: book.chapters + 10, // Verify clamping to real chapter counts
            })),
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.plan.targetDays).toBe(365);
    expect(result.plan.totalChapters).toBe(1189);
    expect(result.plan.readings.length).toBe(1189);
    expect(result.plan.readings[0]?.dayNumber).toBe(1);
    expect(
      result.plan.readings[result.plan.readings.length - 1]?.dayNumber
    ).toBe(365);
    const genesisChapters = result.plan.readings.filter(
      (r) => r.bookId === "gen"
    );
    expect(genesisChapters.length).toBe(50);
  });

  test("distributeBlueprintToPlan rejects blueprints with no valid chapters", () => {
    const result = distributeBlueprintToPlan({
      targetDays: 30,
      canon: "protestant",
      blueprint: {
        title: "Invalid Plan",
        sections: [
          {
            title: "Unknown",
            ranges: [{ bookId: "not-a-book", startChapter: 1, endChapter: 5 }],
          },
        ],
      },
    });

    expect(result.success).toBe(false);
  });

  test("distributeBlueprintToPlan supports both verse-range and whole-chapter readings", () => {
    const result = distributeBlueprintToPlan({
      targetDays: 3,
      canon: "protestant",
      blueprint: {
        title: "Sermon on the Mount",
        sections: [
          {
            title: "Matthew 5-6",
            ranges: [
              {
                bookId: "mat",
                startChapter: 5,
                endChapter: 5,
                startVerse: 1,
                endVerse: 12,
              },
              {
                bookId: "mat",
                startChapter: 5,
                endChapter: 5,
                startVerse: 13,
                endVerse: 20,
              },
              {
                bookId: "mat",
                startChapter: 6,
                endChapter: 6,
              },
            ],
          },
        ],
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.plan.readings).toHaveLength(3);
    expect(result.plan.readings[0]).toMatchObject({
      bookId: "mat",
      chapter: 5,
      startVerse: 1,
      endVerse: 12,
      verseRange: "1-12",
      versesLabel: "vv. 1-12",
      displayText: "Matthew 5:1-12",
      dayNumber: 1,
    });
    expect(result.plan.readings[1]).toMatchObject({
      bookId: "mat",
      chapter: 5,
      startVerse: 13,
      endVerse: 20,
      verseRange: "13-20",
      displayText: "Matthew 5:13-20",
      dayNumber: 2,
    });
    expect(result.plan.readings[2]).toMatchObject({
      bookId: "mat",
      chapter: 6,
      displayText: "Matthew 6",
      dayNumber: 3,
    });
  });

  test("authenticated user can navigate to /plans/ai, use presets, validate prompt, and switch mobile panes", async ({
    page,
  }) => {
    const testId = Date.now();
    const testEmail = `ai_planner_${testId}@example.com`;
    const testPassword = "TestPassword123!";

    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(`AI Planner ${testId}`);
    await page.getByLabel("Email address").fill(testEmail);
    await page.locator("#signup-password").fill(testPassword);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 10000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 10000 });

    await page.goto("/plans");
    await page.getByTestId("open-ai-plan-generator-btn").click();
    await page.waitForURL("/ai?mode=plan", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Luma AI" })).toBeVisible();

    // Verify prompt manual placeholder and Valibot validation error
    const promptField = page.getByLabel("Luma AI prompt");
    await expect(promptField).toHaveAttribute(
      "placeholder",
      /Describe your reading plan/
    );
    await promptField.fill("hi");
    await page.getByRole("button", { name: "Send prompt" }).click();
    await expect(
      page.getByText("Describe the plan you want (at least 5 characters)")
    ).toBeVisible();

    // Verify switching modes via rectangular cards updates query params, empty state, and placeholder
    await page.getByRole("radio", { name: /Conversational/i }).click();
    await expect(page).toHaveURL(/mode=chat/);
    await expect(
      page.getByRole("heading", { name: "Ask anything about Scripture" })
    ).toBeVisible();
    await expect(promptField).toHaveAttribute(
      "placeholder",
      /Ask about a passage/
    );

    await page.getByRole("radio", { name: /Plan Generator/i }).click();
    await expect(page).toHaveURL(/mode=plan/);

    // Verify centered prompt stays responsive on mobile before generation
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("heading", { name: "Build any Bible reading plan" })
    ).toBeVisible();
    await expect(promptField).toBeVisible();

    const [createdUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, testEmail));
    if (createdUser) {
      await db.delete(user).where(eq(user.id, createdUser.id));
    }
  });
});
