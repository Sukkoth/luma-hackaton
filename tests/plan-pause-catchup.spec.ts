import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { planInstances, planInstanceReadings } from "../src/db/schema";

test.describe("Plan Pause & Catch Up Flow E2E", () => {
  test("pausing locks reading checkmarks, shows banner, and resuming shifts schedule to today", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Plan Pilgrim ${testId}`,
      email: `pilgrim_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up and onboard
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

    // 2. Start a reading plan
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    const startButton = page
      .getByRole("button", { name: "Start", exact: true })
      .first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    const wizardDialog = page.getByRole("dialog");
    await expect(wizardDialog).toBeVisible();

    // Step through wizard
    await wizardDialog.getByRole("button", { name: "Continue" }).click();
    await wizardDialog.getByRole("button", { name: "Continue" }).click();
    await wizardDialog.getByRole("button", { name: "Continue" }).click();
    await wizardDialog
      .getByRole("button", { name: "Confirm & Start Plan" })
      .click();

    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    const planUrl = page.url();
    const instanceId = planUrl.split("/plans/")[1]!.split("?")[0]!;

    // 3. Complete reading item 1 in Session 1
    const firstReadingItem = page
      .getByRole("button", { name: /Toggle reading/i })
      .first();
    await expect(firstReadingItem).toBeVisible();
    await expect(firstReadingItem).toHaveAttribute("aria-pressed", "false");
    await firstReadingItem.click();
    await expect(firstReadingItem).toHaveAttribute("aria-pressed", "true");

    // Wait for reading to be persisted to DB
    await expect
      .poll(async () => {
        const readings = await db.query.planInstanceReadings.findMany({
          where: eq(planInstanceReadings.instanceId, instanceId),
        });
        return readings.length;
      })
      .toBe(1);

    // 4. Pause the plan via Pacing & Settings tab
    await page.getByRole("button", { name: "Pacing & Settings" }).click();
    const pauseBtn = page.getByRole("button", { name: "Pause Plan" });
    await expect(pauseBtn).toBeVisible();
    await pauseBtn.click();

    // Button should toggle to Resume Reading Plan
    await expect(
      page.getByRole("button", { name: /Resume Reading Plan|Resume Plan/i })
    ).toBeVisible();

    // Check DB status is 'paused'
    const pausedRecord = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, instanceId),
    });
    expect(pausedRecord?.status).toBe("paused");

    // 5. Switch back to Plan Chapters tab
    await page.getByRole("button", { name: "Plan Chapters" }).click();

    // Verify PLAN PAUSED banner is visible
    await expect(page.getByText("PLAN PAUSED")).toBeVisible();
    await expect(
      page.getByText(
        "Check marks are locked while your plan is paused. When you are ready to continue, tap Resume to shift your schedule to today."
      )
    ).toBeVisible();

    // 6. Attempt to click an incomplete reading item while paused
    const secondReadingItem = page
      .getByRole("button", { name: /Toggle reading/i })
      .nth(1);
    await expect(secondReadingItem).toBeVisible();
    await secondReadingItem.click();

    // Plan Paused lock modal should pop up!
    const pausedModal = page.getByRole("dialog", { name: "Plan Paused" });
    await expect(pausedModal).toBeVisible();
    await expect(
      page.getByText(
        "This reading plan is paused. Check marks are locked. Resume the plan to start logging your readings again."
      )
    ).toBeVisible();

    // Dismiss modal
    await page.getByRole("button", { name: "Dismiss" }).click();
    await expect(pausedModal).not.toBeVisible();

    // Item should remain uncompleted (locked while paused)
    await expect(secondReadingItem).toHaveAttribute("aria-pressed", "false");

    // Verify readings count in DB did NOT increase
    const readingsStillOne = await db.query.planInstanceReadings.findMany({
      where: eq(planInstanceReadings.instanceId, instanceId),
    });
    expect(readingsStillOne.length).toBe(1);

    // Click again and use Resume Plan button from modal
    await secondReadingItem.click();
    await expect(pausedModal).toBeVisible();
    await pausedModal.getByRole("button", { name: "Resume Plan" }).click();
    await expect(pausedModal).not.toBeVisible();

    // 7. Verify plan is resumed
    await expect(page.getByText("PLAN PAUSED")).not.toBeVisible();
    const resumedRecord = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, instanceId),
    });
    expect(resumedRecord?.status).toBe("active");

    // Previous marked reading is still intact!
    const readingsAfterResume = await db.query.planInstanceReadings.findMany({
      where: eq(planInstanceReadings.instanceId, instanceId),
    });
    expect(readingsAfterResume.length).toBe(1);

    // 8. Test Catch-Up Flow: simulate overdue schedule by backdating startDate by 5 days
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    fiveDaysAgo.setHours(0, 0, 0, 0);

    await db
      .update(planInstances)
      .set({ startDate: fiveDaysAgo })
      .where(eq(planInstances.id, instanceId));

    // Reload page to recompute schedule
    await page.reload();

    // Verify Behind Schedule Banner appears
    await expect(page.getByText(/BEHIND SCHEDULE/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Catch Up to Today" })
    ).toBeVisible();

    // Open Catch-Up Modal
    await page.getByRole("button", { name: "Catch Up to Today" }).click();
    const catchUpModal = page.getByRole("dialog", {
      name: "Catch Up & Adjust Schedule",
    });
    await expect(catchUpModal).toBeVisible();
    await expect(page.getByText("Shift Days to Today")).toBeVisible();
    await expect(page.getByText("RECOMMENDED")).toBeVisible();
    await expect(page.getByText("Increase Daily Pace")).toBeVisible();

    // Click "Apply Shift to Today"
    await page.getByRole("button", { name: "Apply Shift to Today" }).click();
    await expect(catchUpModal).not.toBeVisible();

    // Verify Behind Schedule Banner is gone!
    await expect(page.getByText(/BEHIND SCHEDULE/i)).not.toBeVisible();

    // In DB, completed reading is STILL intact (not touched)!
    const readingsAfterCatchUp = await db.query.planInstanceReadings.findMany({
      where: eq(planInstanceReadings.instanceId, instanceId),
    });
    expect(readingsAfterCatchUp.length).toBe(1);

    // 9. Test Catch-Up Option 2: Increase Daily Pace
    await db
      .update(planInstances)
      .set({ startDate: fiveDaysAgo })
      .where(eq(planInstances.id, instanceId));

    await page.reload();
    await expect(page.getByText(/BEHIND SCHEDULE/i)).toBeVisible();

    await page.getByRole("button", { name: "Catch Up to Today" }).click();
    await expect(catchUpModal).toBeVisible();

    // Click "Increase Pace to ... / day"
    const increasePaceBtn = catchUpModal
      .getByRole("button", { name: /Increase Pace to \d+ \/ day/i })
      .first();
    await expect(increasePaceBtn).toBeVisible();
    await increasePaceBtn.click();
    await expect(catchUpModal).not.toBeVisible();

    // Verify DB updated with higher daily target
    const paceUpdatedRecord = await db.query.planInstances.findFirst({
      where: eq(planInstances.id, instanceId),
    });
    expect(paceUpdatedRecord?.dailyTarget).toBeGreaterThanOrEqual(2);

    // Completed reading remains untouched!
    const readingsAfterPaceIncrease =
      await db.query.planInstanceReadings.findMany({
        where: eq(planInstanceReadings.instanceId, instanceId),
      });
    expect(readingsAfterPaceIncrease.length).toBe(1);
  });
});
