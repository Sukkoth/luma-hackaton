import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import fs from "node:fs";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import * as v from "valibot";
import { db } from "../src/db";
import { aiConversations, aiMessages, user } from "../src/db/schema";
import { PROTESTANT_BIBLE_BOOKS } from "../src/data/canons/protestant";
import { distributeBlueprintToPlan } from "../src/lib/ai/plan-generator";
import { AiBlueprintRangeSchema } from "../src/lib/schemas/ai-plans";
import { parseBibleHref } from "../src/components/ai-elements/bible-verse-link";
import { convertMarkdownToTipTapHtml } from "../src/lib/ai/markdown-to-html";

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

  test("AiBlueprintRangeSchema strictly rejects open-ended or multi-chapter verse ranges", () => {
    const missingEnd = v.safeParse(AiBlueprintRangeSchema, {
      bookId: "luk",
      startChapter: 3,
      endChapter: 3,
      startVerse: 1,
    });
    expect(missingEnd.success).toBe(false);

    const multiChapterWithVerse = v.safeParse(AiBlueprintRangeSchema, {
      bookId: "luk",
      startChapter: 3,
      endChapter: 4,
      startVerse: 1,
      endVerse: 10,
    });
    expect(multiChapterWithVerse.success).toBe(false);
  });

  test("parseBibleHref parses internal Bible verse links and ignores non-Bible links", () => {
    expect(
      parseBibleHref({ href: "/bible/rom/8?startVerse=28&endVerse=30" })
    ).toEqual({
      bookId: "rom",
      chapter: 8,
      startVerse: 28,
      endVerse: 30,
      bibleHref: "/bible/rom/8?startVerse=28&endVerse=30",
    });

    expect(parseBibleHref({ href: "/bible/psa/23" })).toEqual({
      bookId: "psa",
      chapter: 23,
      bibleHref: "/bible/psa/23",
    });

    expect(
      parseBibleHref({ href: "https://example.com/bible/rom/8" })
    ).not.toBeNull(); // In Node (no window), same-origin check is skipped; relative & external paths still require /bible/:book/:ch
    expect(parseBibleHref({ href: "https://example.com/other" })).toBeNull();
  });

  test("convertMarkdownToTipTapHtml converts Markdown headings, lists, and inline marks to TipTap HTML", () => {
    const html = convertMarkdownToTipTapHtml({
      markdown: [
        "## Context",
        "",
        "Paul writes **with confidence** in [Romans 8:28](/bible/rom/8?startVerse=28&endVerse=28).",
        "",
        "- First point",
        "- Second *italic* point",
      ].join("\n"),
    });

    expect(html).toContain("<h2>Context</h2>");
    expect(html).toContain("<strong>with confidence</strong>");
    expect(html).toContain(
      '<a href="/bible/rom/8?startVerse=28&amp;endVerse=28">Romans 8:28</a>'
    );
    expect(html).toContain(
      "<ul><li><p>First point</p></li><li><p>Second <em>italic</em> point</p></li></ul>"
    );
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
    await page.locator("#signup-confirm-password").fill(testPassword);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await expect(page.getByLabel("Email address")).toHaveValue(testEmail);
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 20000 });
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

    // Create a folder in the AI history sidebar and verify persistence across reload
    await page.getByRole("button", { name: "New folder" }).click();
    await page.getByLabel("New folder name").fill("Exodus Study");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Exodus Study")).toBeVisible();

    const [createdUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, testEmail));
    expect(createdUser).toBeTruthy();

    // Seed a conversation + messages and verify URL-based reload & delta sync
    if (createdUser) {
      const [seededConv] = await db
        .insert(aiConversations)
        .values({
          userId: createdUser.id,
          mode: "chat",
          canon: "protestant",
          title: "Romans 8 Study",
          messageCount: 2,
          lastMessageSequence: 2,
        })
        .returning({ id: aiConversations.id });

      if (seededConv) {
        await db.insert(aiMessages).values([
          {
            conversationId: seededConv.id,
            sequence: 1,
            role: "user",
            content: "Explain Romans 8:28",
          },
          {
            conversationId: seededConv.id,
            sequence: 2,
            role: "assistant",
            content:
              "Romans 8:28 assures believers of God's sovereign purpose.",
          },
        ]);

        await page.goto(`/ai?mode=chat&chat=${seededConv.id}`);
        await expect(page.getByText("Explain Romans 8:28")).toBeVisible();
        await expect(
          page.getByText(
            "Romans 8:28 assures believers of God's sovereign purpose."
          )
        ).toBeVisible();

        // Reload on the same URL and verify it lands back on the same conversation
        // while delta sync returns { unchanged: true } from IndexedDB cache
        const syncResponsePromise = page.waitForResponse(
          (res) =>
            res.url().includes(`/api/ai/conversations/${seededConv.id}/sync`) &&
            res.status() === 200
        );
        await page.reload();
        const syncRes = await syncResponsePromise;
        const syncJson = (await syncRes.json()) as { unchanged?: boolean };
        expect(syncJson.unchanged).toBe(true);
        await expect(page.getByText("Exodus Study")).toBeVisible();
        await expect(page.getByText("Explain Romans 8:28")).toBeVisible();
        await expect(
          page.getByRole("button", { name: "Save to Notes" })
        ).toBeVisible();

        // Archive the conversation and verify Archived section appears
        await page
          .getByRole("button", { name: "Actions for Romans 8 Study" })
          .click();
        await page
          .getByRole("button", { name: "Archive", exact: true })
          .click();
        await expect(page.getByText("Archived (1)")).toBeVisible();

        // Verify ?prompt= prefills composer
        await page.goto("/ai?mode=chat&prompt=Explain%20Romans%208%3A28");
        await expect(page.getByLabel("Luma AI prompt")).toHaveValue(
          "Explain Romans 8:28"
        );
      }
    }

    // Verify centered prompt stays responsive on mobile on a fresh chat
    await page.goto("/ai?mode=plan");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("heading", { name: "Build any Bible reading plan" })
    ).toBeVisible();
    await expect(page.getByLabel("Luma AI prompt")).toBeVisible();

    if (createdUser) {
      await db.delete(user).where(eq(user.id, createdUser.id));
    }
  });
});
