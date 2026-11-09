import fs from "node:fs";
import { test, expect } from "@playwright/test";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("Notes & Tiptap Rich Text Editor E2E", () => {
  test("creates, edits with limited tiptap tools (h1, h2, bold, lists), and organizes notes", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Note Pilgrim ${testId}`,
      email: `notes_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up and complete onboarding
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

    // 2. Navigate to /notes
    await page.goto("/notes");
    await expect(
      page.getByRole("heading", { name: "Notes", exact: true })
    ).toBeVisible();

    // 3. Create a new note
    const newNoteBtn = page.getByTestId("create-new-note-button");
    await expect(newNoteBtn).toBeVisible();
    await newNoteBtn.click();

    // 4. Verify Tiptap Toolbar has Undo, Redo, H1, H2, Bold, Italics, Underline, Bullet list, Numbered list
    const toolbar = page.getByTestId("tiptap-toolbar");
    await expect(toolbar).toBeVisible();

    const undoBtn = toolbar.getByRole("button", { name: "Undo" });
    const redoBtn = toolbar.getByRole("button", { name: "Redo" });
    const h1Btn = toolbar.getByRole("button", { name: "Heading 1" });
    const h2Btn = toolbar.getByRole("button", { name: "Heading 2" });
    const boldBtn = toolbar.getByRole("button", { name: "Bold" });
    const italicBtn = toolbar.getByRole("button", { name: "Italics" });
    const underlineBtn = toolbar.getByRole("button", { name: "Underline" });
    const bulletBtn = toolbar.getByRole("button", { name: "Bullet List" });
    const orderedBtn = toolbar.getByRole("button", { name: "Numbered List" });

    await expect(undoBtn).toBeVisible();
    await expect(redoBtn).toBeVisible();
    await expect(h1Btn).toBeVisible();
    await expect(h2Btn).toBeVisible();
    await expect(boldBtn).toBeVisible();
    await expect(italicBtn).toBeVisible();
    await expect(underlineBtn).toBeVisible();
    await expect(bulletBtn).toBeVisible();
    await expect(orderedBtn).toBeVisible();

    const toolbarButtons = toolbar.getByRole("button");
    await expect(toolbarButtons).toHaveCount(9);

    // 5. Fill Note Title
    const titleInput = page.getByTestId("note-title-input");
    await titleInput.fill("Hebrews 11 Faith Reflections");

    // 6. Focus Tiptap editor and type content with H1, Bold, Italic, Underline, and Lists
    const editor = page.locator(".tiptap-notes-editor");
    await editor.click();

    // Toggle H1
    await h1Btn.click();
    await editor.focus();
    await page.keyboard.type("Hall of Faith");
    await page.keyboard.press("Enter");

    // Regular text with bold
    await boldBtn.click();
    await page.keyboard.type("Faith is confidence in what we hope for.");
    await boldBtn.click();
    await page.keyboard.press("Enter");

    // Italic text
    await italicBtn.click();
    await page.keyboard.type("Now faith is the substance of things hoped for.");
    await italicBtn.click();
    await page.keyboard.press("Enter");

    // Underline text
    await underlineBtn.click();
    await page.keyboard.type("Without faith it is impossible to please God.");
    await underlineBtn.click();
    await page.keyboard.press("Enter");

    // Write a subsequent sentence
    await page.keyboard.type("He rewards those who earnestly seek Him.");

    // Verify both sentences are present
    await expect(editor).toContainText(
      "Without faith it is impossible to please God."
    );
    await expect(editor).toContainText(
      "He rewards those who earnestly seek Him."
    );

    // Granular Undo: undoes the second sentence, leaving the first sentence intact!
    await undoBtn.click();
    await expect(editor).not.toContainText("seek Him.");
    await expect(editor).toContainText(
      "Without faith it is impossible to please God."
    );

    // Granular Redo: restores the undone sentence
    await redoBtn.click();
    await expect(editor).toContainText("seek Him.");

    // Bullet list
    await bulletBtn.click();
    await page.keyboard.type("By faith Abel offered a better sacrifice");
    await page.keyboard.press("Enter");
    await page.keyboard.type("By faith Enoch walked with God");
    await page.keyboard.press("Enter");
    await page.keyboard.press("Backspace"); // Exit list

    // Verify dirty note activates the Save button showing "Save"
    const saveBtn = page.getByTestId("save-note-button");
    await expect(saveBtn).toBeEnabled();
    await expect(saveBtn).toHaveText(/Save/);

    // Explicitly click Save button: disables and switches to "Saved"
    await saveBtn.click();
    await expect(saveBtn).toBeDisabled();
    await expect(saveBtn).toHaveText(/Saved/);

    // 7. Verify the note card in the left list is updated and H1 is rendered in editor
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Hall of Faith", level: 1 })
    ).toBeVisible();

    // 8. Create a new folder
    await page.getByRole("button", { name: "New Folder" }).click();
    const folderInput = page.getByPlaceholder(/Pauline Epistles/i);
    await expect(folderInput).toBeVisible();
    await folderInput.fill("Theology & Devotions");
    await page.getByRole("button", { name: "Create Folder" }).click();

    // Folder pill should appear in filter track
    await expect(
      page.getByTestId("notes-folders-filter").getByText("Theology & Devotions")
    ).toBeVisible();

    // 9. Assign note to folder
    const folderSelect = page.getByTestId("note-folder-select");
    await folderSelect.selectOption({ label: "Theology & Devotions" });
    await expect(saveBtn).toHaveText(/Saved/);

    // 10. Test Folder View
    await page.getByTestId("tab-folders-view").click();
    await expect(page.getByTestId("folders-view-grid")).toBeVisible();
    await expect(
      page.getByTestId("folders-view-grid").getByText("Theology & Devotions")
    ).toBeVisible();

    // Click on the folder card to drill into it
    await page
      .getByTestId("folders-view-grid")
      .getByText("Theology & Devotions")
      .click();
    await expect(page.getByText("View All")).toBeVisible();
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toBeVisible();
    await page.getByText("View All").click();

    // 11. Create a second note to test Note Sorting (created date vs modified date)
    await page.getByTestId("create-new-note-button").click();
    const secondTitleInput = page.getByTestId("note-title-input");
    await expect(secondTitleInput).toHaveValue("Untitled Note");
    await secondTitleInput.fill("Genesis 1 Creation Notes");
    const secondEditor = page.locator(".tiptap-notes-editor");
    await secondEditor.click();
    await page.keyboard.type(
      "In the beginning God created the heavens and the earth."
    );
    await page.getByTestId("save-note-button").click();
    await expect(page.getByTestId("save-note-button")).toBeDisabled();

    // Test sort selector
    const sortSelect = page.getByTestId("notes-sort-select");
    await expect(sortSelect).toBeVisible();
    // Sort created oldest first
    await sortSelect.selectOption("created_asc");
    const cardsAsc = page.locator("[data-testid^='note-card-']");
    await expect(cardsAsc.first()).toContainText(
      "Hebrews 11 Faith Reflections"
    );

    // Sort created newest first
    await sortSelect.selectOption("created_desc");
    const cardsDesc = page.locator("[data-testid^='note-card-']");
    await expect(cardsDesc.first()).toContainText("Genesis 1 Creation Notes");

    // 12. Verify changing note folder automatically displays the first note in that folder on editor content
    await page
      .getByTestId("notes-folders-filter")
      .getByText("Theology & Devotions")
      .click();
    await expect(page.getByTestId("note-title-input")).toHaveValue(
      "Hebrews 11 Faith Reflections"
    );
    await expect(page.locator(".tiptap-notes-editor")).toContainText(
      "Hall of Faith"
    );

    // Switch back to All Notes
    await page.getByTestId("tab-all-notes").click();

    // 13. Test Archived Notes (Archive & Restore)
    // Select the Hebrews note
    await page
      .locator("[data-testid^='note-card-']")
      .getByText("Hebrews 11 Faith Reflections")
      .click();
    // Click Archive button
    const archiveBtn = page.getByTestId("archive-toggle-button");
    await expect(archiveBtn).toBeVisible();
    await archiveBtn.click();

    // In active notes, the note is removed
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toHaveCount(0);

    // Switch to Archived tab
    await page.getByTestId("tab-archived-notes").click();
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toBeVisible();
    await expect(page.getByTestId("archived-note-banner")).toBeVisible();

    // Restore note from archive
    await page.getByTestId("restore-note-button").click();
    // After restore, archived list is empty for that note
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toHaveCount(0);

    // Switch back to All Notes tab
    await page.getByTestId("tab-all-notes").click();
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toBeVisible();

    // 13. Reload page to confirm persistence across reloads
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Notes", exact: true })
    ).toBeVisible();
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toBeVisible();

    // 14. Pin the note
    const pinBtn = page.getByRole("button", { name: "Pin to top of list" });
    await pinBtn.click();
    await expect(
      page.getByRole("button", { name: "Unpin note" })
    ).toBeVisible();

    // 15. Delete the note
    await page.getByRole("button", { name: "Delete note" }).click();
    const confirmDeleteBtn = page.getByTestId("confirm-delete-button");
    if (
      await confirmDeleteBtn.isVisible({ timeout: 1500 }).catch(() => false)
    ) {
      await confirmDeleteBtn.click();
    }
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Hebrews 11 Faith Reflections")
    ).toHaveCount(0);

    // 16. Test Delete Folder with option to keep notes vs delete folder
    await page.getByTestId("tab-folders-view").click();
    await expect(page.getByTestId("folders-view-grid")).toBeVisible();
    await expect(
      page.getByTestId("folders-view-grid").getByText("Theology & Devotions")
    ).toBeVisible();

    // Click delete on folder "Theology & Devotions"
    const folderCard = page.locator("[data-testid^='folder-card-']", {
      hasText: "Theology & Devotions",
    });
    await folderCard.getByTitle("Delete folder").click();

    // Delete folder modal opens with options
    await expect(page.getByTestId("delete-folder-only-button")).toBeVisible();
    await page.getByTestId("delete-folder-only-button").click();

    // Folder is removed from Folders Grid
    await expect(
      page.getByTestId("folders-view-grid").getByText("Theology & Devotions")
    ).toHaveCount(0);

    // Switch to All Notes: the remaining note still exists!
    await page.getByTestId("tab-all-notes").click();
    await expect(
      page
        .locator("[data-testid^='note-card-']")
        .getByText("Genesis 1 Creation Notes")
    ).toBeVisible();

    // 17. Test Delete Folder AND Notes option
    // Create new folder
    await page.getByTestId("create-new-folder-button").click();
    await page.locator("input[name='name']").fill("Temporary Studies");
    await page.getByRole("button", { name: "Create Folder" }).click();
    await expect(page.locator("input[name='name']")).toHaveCount(0);

    // Assign active note to Temporary Studies folder
    await page
      .getByTestId("note-folder-select")
      .selectOption({ label: "Temporary Studies" });

    // Switch to Folders view
    await page.getByTestId("tab-folders-view").click();
    const tempFolderCard = page.locator("[data-testid^='folder-card-']", {
      hasText: "Temporary Studies",
    });
    await expect(tempFolderCard).toBeVisible();
    await expect(tempFolderCard.getByText("1 note")).toBeVisible();
    await tempFolderCard.getByTitle("Delete folder").click();

    // In modal, click "Delete Folder & Notes"
    await expect(
      page.getByTestId("delete-folder-and-notes-button")
    ).toBeVisible();
    await page.getByTestId("delete-folder-and-notes-button").click();

    // Verify folder is deleted
    await expect(
      page.getByTestId("folders-view-grid").getByText("Temporary Studies")
    ).toHaveCount(0);
  });
});
