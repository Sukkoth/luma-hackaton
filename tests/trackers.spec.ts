import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { and, eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { readingTrackers, user } from "../src/db/schema";

test.describe("Multi-Tracker Engine & Navigation E2E", () => {
  test("user can create multiple trackers, switch between them in navbar, filter /books by canon, and edit tracker while canon remains immutable", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Tracker Scholar ${testId}`,
      email: `tracker_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up and complete initial onboarding (creates default 66-book tracker)
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

    // 2. Overview reflects default tracker (Personal Reading, 66 books, 1189 chapters)
    const switcherBtn = page.getByRole("button", { name: /Current tracker:/ });
    await expect(switcherBtn).toBeVisible();
    await expect(switcherBtn).toContainText("Personal Reading");
    await expect(page.getByText("0 of 1189")).toBeVisible();

    // 3. Open tracker switcher dropdown from navbar
    await switcherBtn.click();
    await expect(page.getByText("Reading Trackers")).toBeVisible();
    await expect(
      page.getByRole("menu").getByText("Personal Reading")
    ).toBeVisible();

    // 4. Click "+ Create New Tracker"
    await page.getByRole("button", { name: "Create New Tracker" }).click();

    // Creation modal appears
    const createModalTitle = page.locator("#create-tracker-dialog-title");
    await expect(createModalTitle).toBeVisible();
    await expect(createModalTitle).toHaveText("New Reading Tracker");

    // Fill form: Name and select Ethiopian Orthodox Canon (81 Books)
    await page
      .locator("#tracker-create-name")
      .fill("Ancient Ethiopian Scrolls");
    await page
      .locator("#tracker-create-desc")
      .fill("Historical Ge'ez biblical study");
    await page
      .getByRole("button", { name: /Ethiopian Orthodox Tewahedo/i })
      .click();

    // Submit form
    await page.getByRole("button", { name: "Create Tracker" }).click();

    // 5. Verify new tracker becomes active immediately in header and overview
    await expect(createModalTitle).not.toBeVisible();
    await expect(switcherBtn).toContainText("Ancient Ethiopian Scrolls");
    await expect(page.getByText("0 of 1927")).toBeVisible();

    // 6. Navigate to /books and verify active canon filtering (81 books)
    await page.goto("/bible");
    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("0/1927 (0%)")).toBeVisible();

    // Search for a book unique to Ethiopian canon (e.g. Enoch)
    const searchInput = sheet.getByPlaceholder("Search books...");
    await searchInput.fill("Enoch");
    await expect(
      sheet.getByRole("button", { name: /Enoch/i }).first()
    ).toBeVisible();

    // Close picker and mark Chapter 1 in Genesis for this Ethiopian tracker
    await sheet.getByRole("button", { name: "Close" }).click();
    await expect(sheet).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: "Mark Read" })
    ).toBeVisible({ timeout: 15000 });
    await page.getByRole("button", { name: "Mark Read" }).click();
    await expect(
      page.getByRole("button", { name: "Mark Read" })
    ).toHaveCount(0);

    // 7. Switch back to Tracker 1 ("Personal Reading" - 66 books) from top navbar
    await switcherBtn.click();
    await page
      .getByRole("menu")
      .getByRole("button", { name: "Personal Reading (66B)" })
      .click();

    // Verify /books immediately filters to 66 books and has isolated progress
    await expect(switcherBtn).toContainText("Personal Reading");
    await expect(page.getByRole("button", { name: "Mark Read" })).toBeVisible();

    await page.getByRole("button", { name: "Choose book and chapter" }).click();
    const sheet2 = page.getByRole("dialog");
    await expect(sheet2.getByText("0/1189 (0%)")).toBeVisible();
    await sheet2.getByPlaceholder("Search books...").fill("Enoch");
    await expect(sheet2.getByText("No matching books")).toBeVisible();
    await sheet2.getByRole("button", { name: "Close" }).click();

    // 8. Edit Tracker: User can update details, but canon is locked & immutable
    await switcherBtn.click();
    // Click edit icon on Personal Reading tracker
    await page.getByRole("button", { name: "Edit Personal Reading" }).click();

    const editModalTitle = page.locator("#edit-tracker-dialog-title");
    await expect(editModalTitle).toBeVisible();
    await expect(editModalTitle).toHaveText("Edit Reading Tracker");

    // Canon locked indicator is clearly visible
    await expect(page.getByText("Bible Canon (Locked)")).toBeVisible();
    await expect(
      page.getByText(/Canon cannot be changed after creation/)
    ).toBeVisible();

    // Update name to "Daily Grace Devotions"
    const nameInput = page.locator("#tracker-edit-name");
    await nameInput.fill("Daily Grace Devotions");
    await page.getByRole("button", { name: "Save Changes" }).click();

    // Verify modal closes and tracker name updates in navbar and view
    await expect(editModalTitle).not.toBeVisible();
    await expect(switcherBtn).toContainText("Daily Grace Devotions");
    await expect(page.getByText("Daily Grace Devotions").first()).toBeVisible();

    // 9. Invariant Check: Verify canon in database remained "protestant"
    const dbUser = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(dbUser).toBeDefined();

    const dbTracker = await db.query.readingTrackers.findFirst({
      where: and(
        eq(readingTrackers.userId, dbUser!.id),
        eq(readingTrackers.name, "Daily Grace Devotions")
      ),
    });
    expect(dbTracker).toBeDefined();
    expect(dbTracker!.canon).toBe("protestant"); // Canon unchanged!
  });

  test("tracker canon is tamper-proof and cannot be modified via update payload", async () => {
    // Insert a test user and tracker directly
    const testId = Date.now();
    const testUserId = `test-user-${testId}`;
    const testTrackerId = `test-tracker-${testId}`;

    await db.insert(user).values({
      id: testUserId,
      name: `Integrity User ${testId}`,
      email: `integrity_${testId}@example.com`,
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(readingTrackers).values({
      id: testTrackerId,
      userId: testUserId,
      name: "Original Protestant Tracker",
      canon: "protestant",
      icon: "book-open",
      description: "Initial description",
    });

    // Verify initial canon is protestant
    const before = await db.query.readingTrackers.findFirst({
      where: eq(readingTrackers.id, testTrackerId),
    });
    expect(before?.canon).toBe("protestant");

    // Import schema and verify UpdateTrackerSchema disallows canon property
    const { UpdateTrackerSchema } = await import("../src/lib/schemas/trackers");
    const parsed = (await import("valibot")).safeParse(UpdateTrackerSchema, {
      trackerId: testTrackerId,
      name: "Attempted Canon Tampering",
      description: "Hacked description",
      color: "#10B981",
      icon: "flame",
      canon: "ethiopian_orthodox", // Tampering attempt
    });

    expect(parsed.success).toBe(true);
    // @ts-expect-error Canon is strictly omitted from output type
    expect(parsed.output.canon).toBeUndefined();
  });
});
