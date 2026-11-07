import fs from "node:fs";
import { test, expect } from "@playwright/test";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("Plan Detail Real Notes Feature E2E", () => {
  test("creates, edits, views reflections directly on plan detail page and connects to notes studio", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Note Pilgrim ${testId}`,
      email: `plan_notes_${testId}@example.com`,
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

    // Redirected to Plan Detail page
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    const planUrl = page.url();
    await expect(page.getByTestId("plan-session-notes-section")).toBeVisible();

    // 3. Verify real reflections section on Day 1 (no "All Plan" toggle)
    const notesSection = page.getByTestId("plan-session-notes-section");
    await expect(
      notesSection.getByText("Study Journal & Reflections")
    ).toBeVisible();
    await expect(notesSection.getByText("0 reflections")).toBeVisible();
    await expect(
      notesSection.getByRole("button", { name: /all plan/i })
    ).toHaveCount(0);

    // 4. Create a reflection directly from plan detail page with Tiptap formatting tools
    await page.getByTestId("add-plan-note-button").click();
    const noteModal = page.getByRole("dialog");
    await expect(noteModal).toBeVisible();
    await expect(page.locator("#plan-note-modal-title")).toHaveText(
      "New Study Reflection"
    );

    // Verify rich content modifiers (H1, H2, Bold, lists) are present
    const toolbar = noteModal.getByTestId("tiptap-toolbar");
    await expect(toolbar).toBeVisible();
    await expect(
      toolbar.getByRole("button", { name: "Heading 1" })
    ).toBeVisible();
    await expect(
      toolbar.getByRole("button", { name: "Heading 2" })
    ).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "Bold" })).toBeVisible();
    await expect(
      toolbar.getByRole("button", { name: "Bullet List" })
    ).toBeVisible();

    // Fill in reflection details
    await noteModal
      .locator("input[name='title']")
      .fill("Day 1 - Genesis 1 Creation Insights");

    // Click Bold and write content in Tiptap rich editor
    await toolbar.getByRole("button", { name: "Bold" }).click();
    await noteModal
      .locator(".tiptap-notes-editor")
      .fill(
        "In the beginning, God created the heavens and the earth. Everything was formed by His word and was very good."
      );

    await noteModal.getByRole("button", { name: "Save Note" }).click();

    // Modal closes and note card appears
    await expect(noteModal).not.toBeVisible();
    await expect(
      notesSection.getByText("Day 1 - Genesis 1 Creation Insights")
    ).toBeVisible();
    await expect(notesSection.getByText("1 reflection")).toBeVisible();
    await expect(
      notesSection.getByText("In the beginning, God created")
    ).toBeVisible();

    // 5. Edit the reflection and test "Open in Studio" directly from modal
    await notesSection
      .getByRole("button", { name: "Edit reflection" })
      .first()
      .click();
    await expect(noteModal).toBeVisible();
    await expect(page.locator("#plan-note-modal-title")).toHaveText(
      "Edit Reflection"
    );

    await noteModal
      .locator("input[name='title']")
      .fill("Day 1 - Genesis 1 Creation Studio Ready");

    // Click "Open in Studio" from inside the modal (should save and navigate)
    await noteModal.getByTestId("modal-open-in-studio-button").click();

    // 6. Verify modal saved note and navigated to notes studio with note loaded
    await page.waitForURL(/\/notes\?noteId=/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Study Journal & Notes" })
    ).toBeVisible();
    await expect(page.getByTestId("note-title-input")).toHaveValue(
      "Day 1 - Genesis 1 Creation Studio Ready"
    );

    // 7. Test user scenario: navigate back to plan, create brand new reflection, type without saving, hit "Open in Studio"
    await page.goto(planUrl);
    await expect(page.getByTestId("plan-session-notes-section")).toBeVisible();
    await page.getByTestId("add-plan-note-button").click();
    await expect(noteModal).toBeVisible();

    await noteModal
      .locator("input[name='title']")
      .fill("Day 1 - Unsaved Reflection Straight To Studio");

    await noteModal
      .locator(".tiptap-notes-editor")
      .fill(
        "Directly drafted in session modal without hitting save note first, opened in studio!"
      );

    // Hit "Open in Studio" directly without clicking "Save Note"
    await noteModal.getByTestId("modal-open-in-studio-button").click();

    // Verify it navigates to notes studio and loads THIS EXACT newly drafted reflection
    await page.waitForURL(/\/notes\?noteId=/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Study Journal & Notes" })
    ).toBeVisible();
    await expect(page.getByTestId("note-title-input")).toHaveValue(
      "Day 1 - Unsaved Reflection Straight To Studio"
    );
    await expect(page.locator(".tiptap-notes-editor")).toContainText(
      "Directly drafted in session modal without hitting save note first, opened in studio!"
    );
  });
});
