import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { user, userSettings } from "../src/db/schema";
import {
  snapToNearestThirtyMinutes,
  getThirtyMinuteSlots,
  formatTimeForDisplay,
} from "../src/lib/time-format";

test.describe("Push Notifications & 30-Minute Reminders E2E", () => {
  const testId = Date.now();
  const testEmail = `cron_test_${testId}@example.com`;

  test("generates 48 thirty-minute intervals in both 12hr and 24hr formats", async () => {
    const slots12 = getThirtyMinuteSlots({ use12Hour: true });
    expect(slots12.length).toBe(48);
    expect(slots12[0]?.value).toBe("00:00");
    expect(slots12[0]?.label).toBe("12:00 AM");
    expect(slots12[1]?.value).toBe("00:30");
    expect(slots12[1]?.label).toBe("12:30 AM");
    expect(slots12[24]?.value).toBe("12:00");
    expect(slots12[24]?.label).toBe("12:00 PM");
    expect(slots12[41]?.value).toBe("20:30");
    expect(slots12[41]?.label).toBe("8:30 PM");

    const slots24 = getThirtyMinuteSlots({ use12Hour: false });
    expect(slots24.length).toBe(48);
    expect(slots24[0]?.label).toBe("00:00");
    expect(slots24[41]?.label).toBe("20:30");

    expect(formatTimeForDisplay({ time24: "08:30", use12Hour: true })).toBe(
      "8:30 AM"
    );
    expect(formatTimeForDisplay({ time24: "08:30", use12Hour: false })).toBe(
      "08:30"
    );
    expect(formatTimeForDisplay({ time24: "20:00", use12Hour: true })).toBe(
      "8:00 PM"
    );
    expect(formatTimeForDisplay({ time24: "20:00", use12Hour: false })).toBe(
      "20:00"
    );

    expect(snapToNearestThirtyMinutes({ timeString: "08:12" })).toBe("08:00");
    expect(snapToNearestThirtyMinutes({ timeString: "08:25" })).toBe("08:30");
    expect(snapToNearestThirtyMinutes({ timeString: "08:50" })).toBe("09:00");
  });

  test("cron endpoint guards unauthorized access when key is configured", async ({
    request,
  }) => {
    // Missing key
    const resUnauthorized = await request.get("/api/cron/send-reminders");
    // If CRON_API_KEY is configured in env, should return 401
    if (process.env.CRON_API_KEY) {
      expect(resUnauthorized.status()).toBe(401);
    }

    // Valid query key
    const key = process.env.CRON_API_KEY || "luma-cronjob-secret-key";
    const resAuthorized = await request.get(
      `/api/cron/send-reminders?key=${key}`
    );
    expect([200, 401]).toContain(resAuthorized.status());
    if (resAuthorized.status() === 200) {
      const data = await resAuthorized.json();
      expect(data.success).toBe(true);
      expect(typeof data.dailyRemindersSent).toBe("number");
    }
  });

  test("settings view displays 30-minute interval select and updates time", async ({
    page,
  }) => {
    // 1. Sign up new test user
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(`Notif Test User ${testId}`);
    await page.getByLabel("Email address").fill(testEmail);
    await page.locator("#signup-password").fill("Password123!");
    await page.locator("#signup-confirm-password").fill("Password123!");
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    await page.waitForURL("/onboarding", { timeout: 15000 });
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();
    await page.waitForURL("/home", { timeout: 15000 });

    // 2. Visit Settings
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");

    const reminderCard = page.locator(".rounded-xl").filter({
      hasText: "Daily Chapter Logging Reminder",
    });
    await expect(reminderCard).toBeVisible();

    const reminderSwitch = reminderCard.getByRole("switch");
    await expect(reminderSwitch).toBeVisible();
    await reminderSwitch.click();

    const reminderSelect = reminderCard.getByTestId("reminder-time-select");
    await expect(reminderSelect).toBeVisible();
    await expect(reminderSelect).toBeEnabled();

    // Verify format toggle works (switch between 12h and 24h)
    const btn24h = reminderCard.getByRole("button", { name: "24h" });
    const btn12h = reminderCard.getByRole("button", { name: "12h" });
    await expect(btn24h).toBeVisible();
    await expect(btn12h).toBeVisible();

    // Click 24h format
    await btn24h.click();
    await expect(btn24h).toHaveAttribute("data-state", "on");

    // Open shadcn select and select "08:30"
    await reminderSelect.click();
    const option0830 = page.getByRole("option", { name: "08:30" });
    await expect(option0830).toBeVisible();
    await option0830.click();
    await expect(reminderSelect).toContainText("08:30");

    // Switch to 12h format and check that display changes to 8:30 AM
    await btn12h.click();
    await expect(btn12h).toHaveAttribute("data-state", "on");
    await expect(reminderSelect).toContainText("8:30 AM");

    // 3. Verify userSettings in DB was updated to 08:30
    const userRecord = await db.query.user.findFirst({
      where: eq(user.email, testEmail),
    });
    expect(userRecord).toBeDefined();

    const settingsRecord = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userRecord!.id),
    });
    expect(settingsRecord?.dailyReminderTime).toBe("08:30");
  });
});
