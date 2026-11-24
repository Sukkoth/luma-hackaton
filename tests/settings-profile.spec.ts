import { test, expect, type Page } from "@playwright/test";

type CreateAndOnboardUserParams = {
  page: Page;
  fullName: string;
  email: string;
  password?: string;
};

async function createAndOnboardUser({
  page,
  fullName,
  email,
  password = "Password123!",
}: CreateAndOnboardUserParams): Promise<void> {
  await page.goto("/signup");
  await page.getByLabel("Full Name").fill(fullName);
  await page.getByLabel("Email address").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.getByRole("checkbox", { name: /agree/i }).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await page.waitForURL("/onboarding", { timeout: 15000 });
  await page.getByRole("button", { name: "Skip to Setup" }).click();
  await page
    .getByRole("button", { name: "Complete Onboarding & Begin" })
    .click();
  await page.waitForURL("/home", { timeout: 15000 });
}

test.describe("Settings & Profile E2E", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login/);
  });

  test("updates display name and avatar URL with persistence check", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `profile_user_${testId}@example.com`;
    const initialName = `Pioneer John ${testId}`;
    const updatedName = `Elder John ${testId}`;
    const avatarUrl =
      "https://ui-avatars.com/api/?name=Elder+John&background=0D8ABC&color=fff";

    await createAndOnboardUser({ page, fullName: initialName, email });

    // 1. Navigate to /settings and click Profile tab
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/settings/);
    await page.getByRole("button", { name: "Profile" }).click();
    await expect(
      page.getByRole("heading", { name: "Profile Details" })
    ).toBeVisible();

    // 2. Check initial form values
    const nameInput = page.locator("#profile-name");
    await expect(nameInput).toHaveValue(initialName);

    const emailInput = page.locator("#profile-email-readonly");
    await expect(emailInput).toHaveValue(email);
    await expect(emailInput).toBeDisabled();

    // 3. Edit display name and avatar image
    await nameInput.fill(updatedName);
    const imageInput = page.locator("#profile-image");
    await imageInput.fill(avatarUrl);
    await imageInput.blur();

    // 4. Submit profile changes
    await page.getByRole("button", { name: "Save Profile Changes" }).click();

    // 5. Verify success alert/toast feedback
    await expect(page.getByText("Profile updated successfully")).toBeVisible();

    // 6. Navigate to /home and back to /settings to check persistence
    await page.goto("/home");
    await page.goto("/settings");
    await page.getByRole("button", { name: "Profile" }).click();
    await expect(page.locator("#profile-name")).toHaveValue(updatedName);
    await expect(page.locator("#profile-image")).toHaveValue(avatarUrl);
  });

  test("validates password confirmation and updates password successfully", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `security_user_${testId}@example.com`;
    const initialName = `Security Guard ${testId}`;
    const currentPassword = "Password123!";
    const newPassword = "NewSecretPassword456!";

    await createAndOnboardUser({
      page,
      fullName: initialName,
      email,
      password: currentPassword,
    });

    await page.goto("/settings");
    await page.getByRole("button", { name: "Profile" }).click();
    await expect(
      page.getByRole("heading", { name: "Password & Security" })
    ).toBeVisible();

    // 1. Fill mismatched password to test validation error
    await page.locator("#security-current-password").fill(currentPassword);
    await page.locator("#security-new-password").fill(newPassword);
    await page
      .locator("#security-confirm-password")
      .fill("DifferentPassword999!");
    await page.getByRole("button", { name: "Update Password" }).click();

    // Expect validation error
    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();

    // 2. Fill matching new password
    await page.locator("#security-confirm-password").fill(newPassword);
    await page.getByRole("button", { name: "Update Password" }).click();

    // Expect success message
    await expect(
      page.getByText("Password updated successfully.")
    ).toBeVisible();
  });

  test("creates a new reading tracker and switches active workspace", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `tracker_admin_${testId}@example.com`;
    const fullName = `Tracker Master ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Reading Trackers" })
    ).toBeVisible();

    const trackersSection = page
      .locator("section")
      .filter({ hasText: "Reading Trackers" });
    await expect(trackersSection).toBeVisible();

    // Verify initial tracker inside Reading Trackers section
    const personalTrackerCard = trackersSection
      .locator("div.rounded-xl")
      .filter({ hasText: "Personal Reading" });
    await expect(personalTrackerCard).toBeVisible();
    await expect(
      personalTrackerCard.getByText("Current Default")
    ).toBeVisible();

    // 1. Open Tracker Creation Modal
    await trackersSection
      .getByRole("button", { name: "Create Tracker" })
      .click();
    const trackerModal = page.getByRole("dialog");
    await expect(trackerModal).toBeVisible();
    await expect(
      trackerModal.getByRole("heading", { name: "New Reading Tracker" })
    ).toBeVisible();

    // 2. Fill tracker details
    const newTrackerName = `Catholic Devotional ${testId}`;
    await trackerModal.locator("#tracker-create-name").fill(newTrackerName);
    await trackerModal
      .locator("#tracker-create-desc")
      .fill("Deuterocanonical reading journey");

    // Select Catholic Canon option
    await trackerModal.getByText("Catholic Canon").click();

    // Submit tracker creation
    await trackerModal.getByRole("button", { name: "Create Tracker" }).click();
    await expect(trackerModal).not.toBeVisible();

    // 3. Verify newly created tracker card appears in list and is automatically set as active default
    const catholicTrackerCard = trackersSection
      .locator("div.rounded-xl")
      .filter({ hasText: newTrackerName });
    await expect(catholicTrackerCard).toBeVisible();
    await expect(
      catholicTrackerCard.getByText("Current Default")
    ).toBeVisible();

    // 4. Switch active tracker back to Personal Reading
    const switchBackBtn = personalTrackerCard.getByRole("button", {
      name: "Switch to this",
    });
    await expect(switchBackBtn).toBeVisible();
    await switchBackBtn.click();

    // 5. Verify Personal Reading is restored as Current Default
    await expect(
      personalTrackerCard.getByText("Current Default")
    ).toBeVisible();
    await expect(
      catholicTrackerCard.getByRole("button", { name: "Switch to this" })
    ).toBeVisible();
  });

  test("toggles daily chapter reminder notifications and adjusts time", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `reminder_user_${testId}@example.com`;
    const fullName = `Reminder User ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: "Reminders & Notifications" })
    ).toBeVisible();

    // Locate the daily reminder section and switch
    const reminderCard = page.locator(".rounded-xl").filter({
      hasText: "Daily Chapter Logging Reminder",
    });
    await expect(reminderCard).toBeVisible();

    const reminderSwitch = reminderCard.getByRole("switch");
    await expect(reminderSwitch).toBeVisible();

    const timeCombobox = reminderCard.getByTestId("reminder-time-select");

    // Toggle switch on/off
    const initialChecked = await reminderSwitch.getAttribute("aria-checked");
    await reminderSwitch.click();
    const expectedChecked = initialChecked === "true" ? "false" : "true";
    await expect(reminderSwitch).toHaveAttribute(
      "aria-checked",
      expectedChecked
    );

    // If enabled, test time change
    if (expectedChecked === "false") {
      // Toggle back on to test time input
      await reminderSwitch.click();
      await expect(reminderSwitch).toHaveAttribute("aria-checked", "true");
    }

    await expect(timeCombobox).toBeEnabled();
    await timeCombobox.click();
    await page
      .getByRole("option", { name: /8:30|08:30/ })
      .first()
      .click();
    await expect(timeCombobox).toContainText(/8:30|08:30/);

    // Toggle switch back OFF to verify turning off notifications
    await reminderSwitch.click();
    await expect(reminderSwitch).toHaveAttribute("aria-checked", "false");
    await expect(page.getByText(/Daily reminder disabled/i)).toBeVisible();
  });
});
