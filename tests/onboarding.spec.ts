import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { readingTrackers, userSettings, user } from "../src/db/schema";

test.describe("Onboarding Experience via New User E2E", () => {
  const testId = Date.now();
  const newUser = {
    fullName: `Theophilus Reader ${testId}`,
    givenName: "Theophilus",
    email: `theophilus_${testId}@example.com`,
    password: "SecureDevPassword123!",
  };

  test("unauthenticated user trying to access /onboarding is redirected to login", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/\/login\?redirect=\/onboarding/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
  });

  test("new user registers, is guided through onboarding showcase & canon setup, and completes onboarding", async ({
    page,
  }) => {
    // 1. Sign up as a new user
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(newUser.fullName);
    await page.getByLabel("Email address").fill(newUser.email);
    await page.locator("#signup-password").fill(newUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    // 2. Verified redirect to /onboarding for newly registered user
    await page.waitForURL("/onboarding", { timeout: 10000 });
    await expect(page).toHaveURL("/onboarding");

    // Attempting to bypass onboarding to /home redirects back to /onboarding
    await page.goto("/home");
    await page.waitForURL("/onboarding", { timeout: 10000 });
    await expect(page).toHaveURL("/onboarding");

    // 3. Step 1: Showcase Carousel Verification
    await expect(page.getByText("Onboarding")).toBeVisible();
    await expect(page.getByText("Skip to Setup")).toBeVisible();

    // Slide 1: Daily Meditation
    await expect(
      page.getByRole("heading", { name: "Read Scripture With Peace Daily" })
    ).toBeVisible();
    await expect(page.getByText("DAILY MEDITATION")).toBeVisible();

    // Advance to Slide 2
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Walk With Guided Reading Plans" })
    ).toBeVisible();
    await expect(page.getByText("GUIDED PLANS")).toBeVisible();

    // Advance to Slide 3
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Track All Books & Spiritual Milestones",
      })
    ).toBeVisible();
    await expect(page.getByText("MULTI-CANON & MILESTONES")).toBeVisible();

    // Test Back button navigation
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Walk With Guided Reading Plans" })
    ).toBeVisible();

    // Advance forward again to Slide 4
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Grow Faith With Daily Habits" })
    ).toBeVisible();
    await expect(page.getByText("CONSISTENCY & STREAKS")).toBeVisible();

    // Final slide action button displays "Continue to Setup"
    const continueBtn = page.getByRole("button", {
      name: "Continue to Setup",
      exact: true,
    });
    await expect(continueBtn).toBeVisible();
    await continueBtn.click();

    // 4. Step 2: Canon Selection & Tracker Setup
    await expect(
      page.getByRole("heading", { name: "Set Up Your Reading Tracker" })
    ).toBeVisible();
    await expect(page.getByText(`Welcome, ${newUser.givenName}`)).toBeVisible();

    // Check default canon is Standard 66 books and other canons are collapsed
    await expect(page.getByText("SELECTED BIBLE CANON")).toBeVisible();
    await expect(page.getByText("Standard 66 Books")).toBeVisible();
    await expect(page.getByText("Catholic Canon (73 Books)")).not.toBeVisible();
    await expect(
      page.getByText("Ethiopian Orthodox Tewahedo (81 Books)")
    ).not.toBeVisible();

    // Click "Change" to expand canon options
    const changeBtn = page.getByRole("button", { name: "Change" });
    await changeBtn.click();

    // Verify all 4 canons are displayed
    await expect(page.getByText("Catholic Canon (73 Books)")).toBeVisible();
    await expect(
      page.getByText("Eastern Orthodox Canon (78 Books)")
    ).toBeVisible();
    await expect(
      page.getByText("Ethiopian Orthodox Tewahedo (81 Books)")
    ).toBeVisible();

    // Select Ethiopian Orthodox Canon (81 Books)
    await page
      .getByRole("button", {
        name: /Ethiopian Orthodox Tewahedo \(81 Books\)/i,
      })
      .click();

    // Picker collapses and displays the selected Ethiopian canon
    await expect(
      page.getByText("Ethiopian Orthodox Tewahedo (81 Books)")
    ).toBeVisible();
    await expect(page.getByText("Catholic Canon (73 Books)")).not.toBeVisible();

    // 5. Uncontrolled Form: Tracker Name, Color, and Icon customization
    const trackerNameInput = page.getByLabel("Tracker Name");
    await expect(trackerNameInput).toHaveValue("Personal Reading");
    await trackerNameInput.fill("My Ethiopian Canon Devotional");

    // Select Emerald color swatch (#10B981)
    const emeraldRadio = page.locator('input[name="color"][value="#10B981"]');
    await emeraldRadio.check({ force: true });
    await expect(emeraldRadio).toBeChecked();

    // Select Flame icon badge
    const flameRadio = page.locator('input[name="icon"][value="flame"]');
    await flameRadio.check({ force: true });
    await expect(flameRadio).toBeChecked();

    // Submit form
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();

    // 6. Navigation to Dashboard
    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");
    await expect(page.getByText(`Hello, ${newUser.givenName}!`)).toBeVisible();
    await expect(page.getByText("Bible Progress")).toBeVisible();
    await expect(page.getByText("0%").first()).toBeVisible();
    await expect(page.getByText(/0 of \d+/)).toBeVisible();
    await expect(page.getByText("No Active Reading Plans")).toBeVisible();
    await expect(page.getByText("Freeze Shields")).toBeVisible();

    // 7. Verification that visiting /onboarding now redirects back to /home
    await page.goto("/onboarding");
    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");

    // 8. Database Verification: Check created tracker and user settings
    const createdUser = await db.query.user.findFirst({
      where: eq(user.email, newUser.email),
    });
    expect(createdUser).toBeDefined();

    if (createdUser) {
      const settings = await db.query.userSettings.findFirst({
        where: eq(userSettings.userId, createdUser.id),
      });
      expect(settings).toBeDefined();
      expect(settings?.hasCompletedOnboarding).toBe(true);
      expect(settings?.streakFreezesAvailable).toBe(0);

      const tracker = await db.query.readingTrackers.findFirst({
        where: eq(readingTrackers.userId, createdUser.id),
      });
      expect(tracker).toBeDefined();
      expect(tracker?.name).toBe("My Ethiopian Canon Devotional");
      expect(tracker?.canon).toBe("ethiopian_orthodox");
      expect(tracker?.color).toBe("#10B981");
      expect(tracker?.icon).toBe("flame");
    }
  });

  test("new user can skip showcase directly to tracker setup", async ({
    page,
  }) => {
    const fastId = Date.now() + 10;
    const fastUser = {
      fullName: `Fast Reader ${fastId}`,
      email: `fast_${fastId}@example.com`,
      password: "Password123!",
    };

    // Sign up
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(fastUser.fullName);
    await page.getByLabel("Email address").fill(fastUser.email);
    await page.locator("#signup-password").fill(fastUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 10000 });

    // Directly click "Skip to Setup"
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await expect(
      page.getByRole("heading", { name: "Set Up Your Reading Tracker" })
    ).toBeVisible();

    // Keep Standard 66 books default and submit
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();

    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");
  });
});
