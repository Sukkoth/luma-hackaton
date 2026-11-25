import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { bibleHighlights, user } from "../src/db/schema";

const SAMPLE_PASSAGE_HTML = `<div><div class="pi"><span class="yv-v" v="1"></span><span class="yv-vlbl">1</span>In the beginning God created the heavens and the earth. <span class="yv-v" v="2"></span><span class="yv-vlbl">2</span>Now the earth was formless and empty, darkness was over the surface of the deep.</div><div class="li1"><span class="yv-v" v="3"></span><span class="yv-vlbl">3</span>And God said, Let there be light, and there was light.</div></div>`;

test.describe("Bible Passage Highlighting E2E", () => {
  test("supports full verse, partial verse, and multi-verse highlights with persistence", async ({
    page,
  }) => {
    const testId = Date.now();
    const testEmail = `highlighter_${testId}@example.com`;
    const testPassword = "TestPassword123!";

    // Mock bible-proxy so passage HTML is deterministic
    await page.route("**/api/bible-proxy**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          reference: "Genesis 1",
          contentHtml: SAMPLE_PASSAGE_HTML,
          versionLabel: "NIV",
          copyright: "Copyright © Biblica, Inc. Used by Permission.",
        }),
      });
    });

    // Sign up and complete quick onboarding
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(`Highlighter ${testId}`);
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

    await page.goto("/bible");
    await expect(
      page.locator(".luma-bible-passage .yv-vlbl").first()
    ).toBeVisible();
    await expect(
      page.getByText("Copyright © Biblica, Inc. Used by Permission.")
    ).toBeVisible();

    // 1) Full single verse via clicking verse label 1
    await page.locator(".luma-bible-passage .yv-vlbl").first().click();
    const toolbar = page.getByRole("toolbar", {
      name: "Passage highlight actions",
    });
    await expect(toolbar).toContainText("v. 1");
    const v1Selection = await page.evaluate(
      () => window.getSelection()?.toString() ?? ""
    );
    expect(v1Selection).toContain(
      "In the beginning God created the heavens and the earth."
    );
    await toolbar.getByRole("button", { name: "Amber highlight" }).click();

    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="amber"]')
    ).toContainText("In the beginning God created the heavens and the earth.");

    // 2) Part of a single verse (verse 2: "formless and empty")
    await page.evaluate(() => {
      const v2Marker = document.querySelector(".luma-bible-passage span[v='2']");
      const v2Label = v2Marker?.nextElementSibling;
      const textNode = v2Label?.nextSibling as Text | null;
      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        throw new Error("Missing v2 text node");
      }
      const idx = textNode.data.indexOf("formless and empty");
      const range = document.createRange();
      range.setStart(textNode, idx);
      range.setEnd(textNode, idx + "formless and empty".length);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
    await page.locator(".luma-bible-passage").dispatchEvent("mouseup");
    await expect(toolbar).toContainText("v. 2");
    await toolbar.getByRole("button", { name: "Green highlight" }).click();

    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="green"]')
    ).toContainText("formless and empty");

    // 3) Part of multiple verses together (end of v2 into start of v3)
    await page.evaluate(() => {
      const pi = document.querySelector(".luma-bible-passage .pi");
      const v2Last = pi?.lastChild as Text | null;
      const v3Marker = document.querySelector(".luma-bible-passage span[v='3']");
      const v3Label = v3Marker?.nextElementSibling;
      const v3Text = v3Label?.nextSibling as Text | null;
      if (!v2Last || !v3Text) throw new Error("Missing v2/v3 text");
      const startIdx = v2Last.data.indexOf("surface of the deep.");
      const endIdx = "And God said".length;
      const range = document.createRange();
      range.setStart(v2Last, startIdx);
      range.setEnd(v3Text, endIdx);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
    await page.locator(".luma-bible-passage").dispatchEvent("mouseup");
    await expect(toolbar).toContainText("v. 2–3");
    await toolbar.getByRole("button", { name: "Blue highlight" }).click();

    const blueMarks = page.locator(
      '.luma-bible-passage mark[data-highlight-color="blue"]'
    );
    await expect(blueMarks).toHaveCount(2);
    await expect(blueMarks.nth(0)).toContainText("surface of the deep.");
    await expect(blueMarks.nth(1)).toContainText("And God said");

    // Verify distinct computed background colors (not fallback browser yellow)
    const amberBg = await page
      .locator('.luma-bible-passage mark[data-highlight-color="amber"]')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const greenBg = await page
      .locator('.luma-bible-passage mark[data-highlight-color="green"]')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    const blueBg = await blueMarks
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(amberBg).not.toBe(greenBg);
    expect(greenBg).not.toBe(blueBg);
    expect(amberBg).not.toBe(blueBg);

    // 4) Reload and verify persistence from Postgres
    await page.reload();
    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="amber"]')
    ).toContainText("In the beginning God created the heavens and the earth.");
    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="green"]')
    ).toContainText("formless and empty");
    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="blue"]')
    ).toHaveCount(2);

    // 5) Recolor and delete an existing highlight
    await page
      .locator('.luma-bible-passage mark[data-highlight-color="green"]')
      .click();
    await expect(toolbar).toBeVisible();
    await toolbar.getByRole("button", { name: "Rose highlight" }).click();
    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="rose"]')
    ).toContainText("formless and empty");

    await page
      .locator('.luma-bible-passage mark[data-highlight-color="rose"]')
      .click();
    await toolbar.getByRole("button", { name: "Remove highlight" }).click();
    await expect(
      page.locator('.luma-bible-passage mark[data-highlight-color="rose"]')
    ).toHaveCount(0);

    // 6) Clicking directly on verse 3 text selects the whole verse 3,
    // and clicking outside / clearing selection dismisses the toolbar
    await page.locator(".luma-bible-passage .li1").click();
    await expect(toolbar).toContainText("v. 3");
    const v3Selection = await page.evaluate(
      () => window.getSelection()?.toString() ?? ""
    );
    expect(v3Selection).toContain(
      "And God said, Let there be light, and there was light."
    );
    await page.locator("footer").click();
    await expect(toolbar).toHaveCount(0);

    // 7) Open Highlights drawer and verify saved highlights are listed, scoped & searchable
    await page.getByRole("button", { name: "View highlights" }).click();
    await expect(
      page.getByRole("heading", { name: /Highlights/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "All Books" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /This Book \(Genesis\)/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /This Book \(Genesis\)/i }).click();
    await expect(page.getByText("Genesis 1:1")).toBeVisible();
    await expect(page.getByText("Genesis 1:2–3")).toBeVisible();

    await page.getByLabel("Search highlights").fill("heavens");
    await expect(page.getByText("Genesis 1:1")).toBeVisible();
    await expect(page.getByText("Genesis 1:2–3")).toHaveCount(0);

    // Close Highlights drawer and test Zen mode toggle + Escape exit
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Enter Zen mode" }).click();
    await expect(
      page.getByRole("button", { name: "Exit Zen mode" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "View highlights" })
    ).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "View highlights" })
    ).toBeVisible();

    // Cleanup test user and highlights
    const [createdUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, testEmail));
    if (createdUser) {
      await db
        .delete(bibleHighlights)
        .where(eq(bibleHighlights.userId, createdUser.id));
      await db.delete(user).where(eq(user.id, createdUser.id));
    }
  });
});
