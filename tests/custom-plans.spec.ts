import fs from "node:fs";
import { test, expect } from "@playwright/test";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("Custom Plan Creation & File Import Feature", () => {
  test("creates custom plan via 3-step wizard, saves to catalog, and starts it", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Custom Pilgrim ${testId}`,
      email: `custom_plan_${testId}@example.com`,
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

    // 2. Navigate to Plans Catalog
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    // 3. Open Custom Plan Wizard Modal
    const createCustomBtn = page.getByTestId("open-custom-plan-wizard-btn");
    await expect(createCustomBtn).toBeVisible();
    await createCustomBtn.click();

    // Wizard modal opens
    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();
    await expect(
      wizardModal.getByText("Step 1 of 3: Select Books & Scope")
    ).toBeVisible();

    // Step 1: Scope selection
    // Select Matthew, Mark, Luke, John (button name includes chapter count e.g. "John 21")
    const matthewBtn = wizardModal.getByRole("button", {
      name: /^Matthew\b/i,
    });
    const markBtn = wizardModal.getByRole("button", {
      name: /^Mark\b/i,
    });
    const lukeBtn = wizardModal.getByRole("button", {
      name: /^Luke\b/i,
    });
    const johnBtn = wizardModal.getByRole("button", {
      name: /^John 21/i,
    });

    await matthewBtn.click();
    await markBtn.click();
    await lukeBtn.click();
    await johnBtn.click();

    // Verify footer summary shows 4 books selected
    await expect(wizardModal.getByText("4 books selected")).toBeVisible();

    // Advance to Step 2: Set Order
    const nextStepOrderBtn = wizardModal.getByTestId(
      "wizard-next-step-order-btn"
    );
    await expect(nextStepOrderBtn).toBeEnabled();
    await nextStepOrderBtn.click();

    // Step 2: Reading Order
    await expect(
      wizardModal.getByText("Step 2 of 3: Reading Sequence")
    ).toBeVisible();
    await wizardModal.getByTestId("order-mode-book-btn").click();

    // Verify daily reading target and pacing settings are asked in Order by Book
    await expect(wizardModal.getByText("2. Daily Reading Target")).toBeVisible();
    await wizardModal.getByTestId("daily-target-preset-2").click();
    await expect(wizardModal.getByTestId("pacing-style-locked-btn")).toBeVisible();
    await wizardModal.getByTestId("pacing-style-locked-btn").click();

    // Verify Preview button in Step 2 for Order by Book
    const previewBookBtn = wizardModal.getByTestId("preview-book-schedule-btn");
    await expect(previewBookBtn).toBeVisible();
    await previewBookBtn.click();

    const bookPreviewDialog = page.getByRole("dialog", {
      name: "Curriculum & Schedule Preview",
    });
    await expect(bookPreviewDialog).toBeVisible();
    await expect(bookPreviewDialog.getByText("Day 1", { exact: true })).toBeVisible();
    await bookPreviewDialog
      .getByRole("button", { name: "Close Preview", exact: true })
      .click();
    await expect(bookPreviewDialog).not.toBeVisible();

    // Advance to Step 3: Review & Pacing
    const nextStepReviewBtn = wizardModal.getByTestId(
      "wizard-next-step-review-btn"
    );
    await expect(nextStepReviewBtn).toBeVisible();
    await nextStepReviewBtn.click();

    // Step 3: Review & Pacing
    await expect(
      wizardModal.getByText("Step 3 of 3: Plan Details & Pacing")
    ).toBeVisible();
    await expect(wizardModal.getByText("Plan Pacing Summary")).toBeVisible();
    await expect(wizardModal.getByText("Daily Reading Target")).toBeVisible();
    await expect(wizardModal.getByText("Fixed Daily Pace (2 ch/day)")).toBeVisible();
    // Verify no redundant interactive inputs in Step 3 for Order by Book
    await expect(wizardModal.getByTestId("review-daily-target-input")).not.toBeVisible();

    // Verify embedded Curriculum Preview in Step 3
    await expect(
      wizardModal.getByText("Curriculum & Reading Schedule Preview")
    ).toBeVisible();

    const customTitleInput = wizardModal.getByTestId("custom-plan-title-input");
    const customDescInput = wizardModal.getByTestId("custom-plan-desc-input");
    await customTitleInput.fill("Holy Gospels Custom Journey");
    await customDescInput.fill(
      "Personalized journey walking through the four Gospel accounts."
    );

    // Save to Catalog (without starting yet)
    const saveCatalogBtn = wizardModal.getByTestId(
      "save-custom-plan-catalog-btn"
    );
    await expect(saveCatalogBtn).toBeVisible();
    await saveCatalogBtn.click();

    // Wizard modal should close
    await expect(wizardModal).not.toBeVisible({ timeout: 15000 });

    // 4. Verify in Catalog: card appears with title and "Custom" badge
    const customCard = page.locator(".group", {
      hasText: "Holy Gospels Custom Journey",
    });
    await expect(customCard).toBeVisible();
    await expect(customCard.getByText("Custom", { exact: true })).toBeVisible();
    await expect(customCard.getByText("89 ch", { exact: true })).toBeVisible();

    // Verify opening Create Custom a second time starts completely fresh
    await createCustomBtn.click();
    const reopenedWizard = page.getByRole("dialog");
    await expect(reopenedWizard).toBeVisible();
    await expect(
      reopenedWizard.getByText("Step 1 of 3: Select Books & Scope")
    ).toBeVisible();
    await expect(reopenedWizard.getByText("0 books selected")).toBeVisible();
    await reopenedWizard.getByRole("button", { name: "Close modal" }).click();
    await expect(reopenedWizard).not.toBeVisible();

    // 5. Start the custom plan from its card
    const startCustomPlanBtn = customCard.getByRole("button", {
      name: "Start",
      exact: false,
    });
    await startCustomPlanBtn.click();

    // Plan Enrollment Modal opens
    const enrollmentDialog = page.getByRole("dialog");
    await expect(enrollmentDialog).toBeVisible();

    // Step through enrollment wizard
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog
      .getByRole("button", { name: "Confirm & Start Plan" })
      .click();

    // 6. Verify redirection to Plan Detail page
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(
      page.getByText("Holy Gospels Custom Journey").first()
    ).toBeVisible();

    // Verify Session 1 readings are loaded
    await expect(page.getByText(/Session 1/i).first()).toBeVisible();
    await expect(page.getByText(/Matthew/i).first()).toBeVisible();

    // 7. Toggle reading Matthew 1
    const toggleReadingBtn = page.getByRole("button", {
      name: "Toggle reading Matthew 1",
    });
    await expect(toggleReadingBtn).toBeVisible();
    await toggleReadingBtn.click();
  });

  test("validates file import errors and imports valid CSV & JSON plans", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Importer Pilgrim ${testId}`,
      email: `import_plan_${testId}@example.com`,
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

    // 2. Navigate to Plans
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    // 3. Open Import Modal
    const openImportBtn = page.getByTestId("open-import-plan-modal-btn");
    await expect(openImportBtn).toBeVisible();
    await openImportBtn.click();

    const importModal = page.getByRole("dialog");
    await expect(importModal).toBeVisible();
    await expect(importModal.getByText("Import Reading Plan")).toBeVisible();

    const textarea = importModal.getByTestId("import-plan-raw-textarea");
    await expect(textarea).toBeVisible();

    // 4. Test Step A: Real-time Error Detection on Invalid Bible Reference
    await textarea.fill(
      "Day,Book,Chapter,Verses,Track\n1,Genesis,99,,Law\n1,FakeBook,1,,Prophets"
    );

    // Expect invalid badge and error messages
    const invalidStatus = importModal.getByTestId(
      "import-validation-status-invalid"
    );
    await expect(invalidStatus).toBeVisible();
    await expect(
      importModal.getByText(/Chapter 99 exceeds book maximum of 50 chapters/i)
    ).toBeVisible();
    await expect(
      importModal.getByText(/Unable to identify Bible book "FakeBook"/i)
    ).toBeVisible();

    // Verify save button is disabled
    const saveCatalogBtn = importModal.getByTestId(
      "save-imported-plan-catalog-btn"
    );
    await expect(saveCatalogBtn).toBeDisabled();

    // 5. Test Step B: Load Sample CSV Template
    const sampleCsvBtn = importModal.getByTestId(
      "import-load-sample-csv-btn"
    );
    await expect(sampleCsvBtn).toBeVisible();
    await sampleCsvBtn.click();

    // Expect valid status card
    const validStatus = importModal.getByTestId(
      "import-validation-status-valid"
    );
    await expect(validStatus).toBeVisible();
    await expect(
      importModal.getByTestId("import-summary-total-days")
    ).toHaveText("3");
    await expect(
      importModal.getByTestId("import-summary-total-readings")
    ).toHaveText("9");
    await expect(saveCatalogBtn).toBeEnabled();

    // 6. Test Step C: Load Sample JSON Template and Start Plan
    const sampleJsonBtn = importModal.getByTestId(
      "import-load-sample-json-btn"
    );
    await expect(sampleJsonBtn).toBeVisible();
    await sampleJsonBtn.click();

    await expect(validStatus).toBeVisible();
    await expect(
      importModal.getByTestId("import-summary-total-readings")
    ).toHaveText("6");

    // Start plan directly
    const importAndStartBtn = importModal.getByTestId(
      "save-imported-plan-start-btn"
    );
    await expect(importAndStartBtn).toBeVisible();
    await importAndStartBtn.click();

    // Import modal should close and enrollment wizard opens
    const enrollmentDialog = page.getByRole("dialog");
    await expect(enrollmentDialog).toBeVisible();

    // Step through enrollment wizard
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog
      .getByRole("button", { name: "Confirm & Start Plan" })
      .click();

    // 7. Verify redirection to Plan Detail page for the imported plan
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", {
        name: "Gospels & Wisdom 3-Day Journey",
        level: 1,
      })
    ).toBeVisible();
    await expect(page.getByText(/John/i).first()).toBeVisible();
    await expect(page.getByText(/Proverbs/i).first()).toBeVisible();
  });

  test("creates custom plan using Order by Chapter 3-column builder (Genesis 5 then Exodus 20)", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Chapter Orderer ${testId}`,
      email: `chapter_order_${testId}@example.com`,
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

    // 2. Open Custom Plan Wizard
    await page.goto("/plans");
    await page.getByTestId("open-custom-plan-wizard-btn").click();

    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();

    // Select Genesis and Exodus
    const genesisBtn = wizardModal.getByRole("button", { name: /^Genesis 50/i });
    const exodusBtn = wizardModal.getByRole("button", { name: /^Exodus 40/i });
    await genesisBtn.click();
    await exodusBtn.click();

    // Advance to Step 2: Sequence
    await wizardModal.getByTestId("wizard-next-step-order-btn").click();

    // 3. Select "Build Sessions"
    const orderModeChapterBtn = wizardModal.getByTestId(
      "order-mode-chapter-btn"
    );
    await expect(orderModeChapterBtn).toBeVisible();
    await expect(wizardModal.getByText("Build Sessions")).toBeVisible();
    await orderModeChapterBtn.click();

    // Verify compact single-line header
    await expect(
      wizardModal.getByText("3. Sessions", { exact: true })
    ).toBeVisible();

    // In Column 1, select Genesis
    await wizardModal.getByTestId("select-book-for-chapters-gen").click();

    // In Column 2, click Chapter 5
    const genCh5Btn = wizardModal.getByTestId("add-chapter-gen-5");
    await expect(genCh5Btn).toBeVisible();
    await genCh5Btn.click();

    // In Column 1, select Exodus
    await wizardModal.getByTestId("select-book-for-chapters-exo").click();

    // In Column 2, click Chapter 20
    const exoCh20Btn = wizardModal.getByTestId("add-chapter-exo-20");
    await expect(exoCh20Btn).toBeVisible();
    await exoCh20Btn.click();

    // Verify Column 3 contains Genesis 5 and Exodus 20 in Session 1
    await expect(wizardModal.getByText("Genesis 5")).toBeVisible();
    await expect(wizardModal.getByText("Exodus 20")).toBeVisible();
    await expect(wizardModal.getByText("1s · 2ch")).toBeVisible();

    // Test immediate feedback for "+ New Session" button
    const newSessionBtn = wizardModal.getByRole("button", {
      name: "New Session",
    });
    await expect(newSessionBtn).toBeVisible();
    await newSessionBtn.click();

    // Verify empty session card is immediately rendered with instructions
    await expect(wizardModal.getByText("Empty Session")).toBeVisible();
    await expect(wizardModal.getByText("2s · 2ch")).toBeVisible();

    // In Column 2, add Chapter 21 into the new active Session 2
    const exoCh21Btn = wizardModal.getByTestId("add-chapter-exo-21");
    await expect(exoCh21Btn).toBeVisible();
    await exoCh21Btn.click();

    // Verify Session 2 now contains Exodus 21
    await expect(wizardModal.getByText("Exodus 21")).toBeVisible();
    await expect(wizardModal.getByText("2s · 3ch")).toBeVisible();

    // Verify Preview button opens uneditable list
    const previewBtn = wizardModal.getByTestId("preview-sessions-btn");
    await expect(previewBtn).toBeVisible();
    await previewBtn.click();

    // Verify preview dialog opens with read-only layout
    const previewDialog = page.getByRole("dialog", {
      name: "Curriculum & Schedule Preview",
    });
    await expect(previewDialog).toBeVisible();
    await expect(previewDialog.getByText("Session 1")).toBeVisible();
    await expect(previewDialog.getByText("Session 2")).toBeVisible();
    await previewDialog
      .getByRole("button", { name: "Close Preview", exact: true })
      .click();
    await expect(previewDialog).not.toBeVisible();

    // Advance to Step 3: Review & Pacing
    await wizardModal.getByTestId("wizard-next-step-review-btn").click();

    // Step 3: Verify Fixed Sessions (Locked) is pre-selected
    await expect(
      wizardModal.getByText("Fixed Sessions (2 Sessions Built)")
    ).toBeVisible();

    // Test switching to Flexible Pace triggers the Session Distribution Warning
    await wizardModal.getByTestId("review-pacing-flexible-btn").click();
    await expect(
      wizardModal.getByTestId("flexible-session-warning")
    ).toBeVisible();
    await expect(
      wizardModal.getByText("Session Distribution Warning")
    ).toBeVisible();

    // Switch back to Fixed Sessions
    await wizardModal.getByTestId("review-pacing-locked-btn").click();
    await expect(
      wizardModal.getByTestId("flexible-session-warning")
    ).not.toBeVisible();

    // Verify uneditable Curriculum Preview section is visible in Step 3
    await expect(
      wizardModal.getByText("Curriculum & Reading Schedule Preview")
    ).toBeVisible();

    // Fill Title
    await wizardModal
      .getByTestId("custom-plan-title-input")
      .fill("Genesis & Exodus Highlights E2E");

    // Save & Start Plan
    const saveAndStartBtn = wizardModal.getByTestId(
      "save-custom-plan-start-btn"
    );
    await expect(saveAndStartBtn).toBeVisible();
    await saveAndStartBtn.click();

    // Step through enrollment dialog
    const enrollmentDialog = page.getByRole("dialog");
    await expect(enrollmentDialog).toBeVisible();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog
      .getByRole("button", { name: "Confirm & Start Plan" })
      .click();

    // Verify detail page has Genesis 5 and Exodus 20
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", {
        name: "Genesis & Exodus Highlights E2E",
        level: 1,
      })
    ).toBeVisible();
    await expect(page.getByText("Genesis 5")).toBeVisible();
  });

  test("supports mobile viewport responsiveness and tabbed column switching in wizard", async ({
    page,
  }) => {
    // Set viewport to mobile phone size (iPhone SE / small mobile screen)
    await page.setViewportSize({ width: 375, height: 667 });

    const testId = Date.now();
    const testUser = {
      fullName: `Mobile User ${testId}`,
      email: `mobile_plan_${testId}@example.com`,
      password: "Password123!",
    };

    // Sign up & onboarding
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

    // Open plans and wizard
    await page.goto("/plans");
    const createCustomBtn = page.getByTestId("open-custom-plan-wizard-btn");
    await createCustomBtn.click();

    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();

    // Select Matthew & Mark
    await wizardModal.getByRole("button", { name: /^Matthew\b/i }).click();
    await wizardModal.getByRole("button", { name: /^Mark\b/i }).click();

    // Next: Set Order
    await wizardModal.getByTestId("wizard-next-step-order-btn").click();

    // Switch to Chapter sequencing
    await wizardModal.getByTestId("order-mode-chapter-btn").click();

    // Verify mobile tab bar is visible on mobile viewport
    const mobileBooksTab = wizardModal.getByTestId("mobile-tab-books");
    const mobileChaptersTab = wizardModal.getByTestId("mobile-tab-chapters");
    const mobileOrderTab = wizardModal.getByTestId("mobile-tab-order");

    await expect(mobileBooksTab).toBeVisible();
    await expect(mobileChaptersTab).toBeVisible();
    await expect(mobileOrderTab).toBeVisible();

    // Select Matthew from Books tab -> auto-switches to Chapters tab
    await wizardModal.getByTestId("select-book-for-chapters-mat").click();
    await expect(mobileChaptersTab).toHaveClass(/bg-white/);

    // Click Matthew chapter 1
    const matCh1Btn = wizardModal.getByTestId("add-chapter-mat-1");
    await expect(matCh1Btn).toBeVisible();
    await matCh1Btn.click();

    // Switch to Books tab to pick Mark
    await mobileBooksTab.click();
    await wizardModal.getByTestId("select-book-for-chapters-mrk").click();

    // Click Mark chapter 1
    const mrkCh1Btn = wizardModal.getByTestId("add-chapter-mrk-1");
    await expect(mrkCh1Btn).toBeVisible();
    await mrkCh1Btn.click();

    // Switch to Order tab to verify selected chapters
    await mobileOrderTab.click();
    await expect(wizardModal.getByText("Matthew 1")).toBeVisible();
    await expect(wizardModal.getByText("Mark 1")).toBeVisible();
    await expect(wizardModal.getByText("2 chapters scheduled")).toBeVisible();

    // Next: Review & Pacing
    const nextBtn = wizardModal.getByTestId("wizard-next-step-review-btn");
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Step 3: verify title input and footer buttons are fully accessible on 375px
    await wizardModal
      .getByTestId("custom-plan-title-input")
      .fill("Mobile Friendly Plan");
    const saveCatalogBtn = wizardModal.getByTestId(
      "save-custom-plan-catalog-btn"
    );
    await expect(saveCatalogBtn).toBeVisible();
    await saveCatalogBtn.click();

    await expect(wizardModal).not.toBeVisible({ timeout: 15000 });
  });

  test("creates locked custom plan with curated variable-length sessions (3 ch then 4 ch then 2 ch)", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Curated Curator ${testId}`,
      email: `curated_plan_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up & Onboard
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

    // 2. Open Custom Wizard on Plans page
    await page.goto("/plans");
    await page.getByTestId("open-custom-plan-wizard-btn").click();

    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();

    // Select Genesis
    await wizardModal.getByRole("button", { name: /^Genesis\b/i }).click();

    // Advance to Step 2
    await wizardModal.getByTestId("wizard-next-step-order-btn").click();
    await wizardModal.getByTestId("order-mode-chapter-btn").click();

    // Add Genesis chapters 1 to 9
    for (let ch = 1; ch <= 9; ch++) {
      await wizardModal.getByTestId(`add-chapter-gen-${ch}`).click();
    }

    // Verify 9 chapters scheduled
    await expect(wizardModal.getByText("9 chapters scheduled")).toBeVisible();

    // Split after chapter 3 (index 2) -> creates Session 1 (3 ch) and Session 2 (6 ch)
    const splitBtns = wizardModal.getByRole("button", {
      name: /\+ Split session here/i,
    });
    // Click split between Gen 3 and Gen 4
    await splitBtns.nth(2).click();

    // Verify Session 1 has 3 ch
    await expect(wizardModal.getByText("Session 1")).toBeVisible();
    await expect(wizardModal.getByText("(3 ch)")).toBeVisible();

    // Click split between Gen 7 and Gen 8 (which is now index 3 in Session 2)
    // Find split buttons again after re-render
    const reloadedSplitBtns = wizardModal.getByRole("button", {
      name: /\+ Split session here/i,
    });
    await reloadedSplitBtns.nth(5).click();

    // Verify:
    // Session 1: 3 ch
    // Session 2: 4 ch
    // Session 3: 2 ch
    await expect(wizardModal.getByText("Session 1")).toBeVisible();
    await expect(wizardModal.getByText("Session 2")).toBeVisible();
    await expect(wizardModal.getByText("Session 3")).toBeVisible();
    await expect(wizardModal.getByText("(4 ch)")).toBeVisible();
    await expect(wizardModal.getByText("(2 ch)")).toBeVisible();

    // 3. Next: Review & Pacing
    await wizardModal.getByTestId("wizard-next-step-review-btn").click();

    await wizardModal
      .getByTestId("custom-plan-title-input")
      .fill("Curated Genesis 3-4-2 Split");

    // Verify Curated Fixed Sessions (Locked) mode is selected and shows 3 Sessions
    await expect(
      wizardModal.getByText("Curated Sessions", { exact: true })
    ).toBeVisible();
    await expect(
      wizardModal.getByText("3 Sessions", { exact: true })
    ).toBeVisible();
    await expect(
      wizardModal.getByText("Fixed Sessions (3 Sessions Built)")
    ).toBeVisible();

    // Verify switching to Flexible shows the Session Distribution Warning
    await wizardModal.getByTestId("review-pacing-flexible-btn").click();
    await expect(wizardModal.getByTestId("flexible-session-warning")).toBeVisible();
    await expect(
      wizardModal.getByText("Session Distribution Warning")
    ).toBeVisible();

    // Switch back to Fixed Sessions
    await wizardModal.getByTestId("review-pacing-locked-btn").click();
    await expect(wizardModal.getByTestId("flexible-session-warning")).not.toBeVisible();

    // 4. Save & Start Plan
    await wizardModal.getByTestId("save-custom-plan-start-btn").click();

    // Complete enrollment modal
    const enrollmentDialog = page.getByRole("dialog");
    await expect(enrollmentDialog).toBeVisible();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog.getByRole("button", { name: "Continue" }).click();
    await enrollmentDialog
      .getByRole("button", { name: "Confirm & Start Plan" })
      .click();

    // 5. Verify on Detail Page: Session 1 has 3 readings, Session 2 has 4, Session 3 has 2
    await page.waitForURL(/\/plans\/[a-f0-9-]+/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Curated Genesis 3-4-2 Split" })
    ).toBeVisible();

    // Session 1: 0/3 with Genesis 1, 2, 3
    await expect(page.getByText("Session 1", { exact: true })).toBeVisible();
    await expect(page.getByText("0/3", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Toggle reading Genesis 1" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Toggle reading Genesis 2" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Toggle reading Genesis 3" })
    ).toBeVisible();

    // Session 2: 0/4 with Genesis 4, 5, 6, 7
    await expect(page.getByText("Session 2", { exact: true })).toBeVisible();
    await expect(page.getByText("0/4", { exact: true })).toBeVisible();
    await expect(page.getByText("Genesis 4")).toBeVisible();
    await expect(page.getByText("Genesis 7")).toBeVisible();

    // Session 3: 0/2 with Genesis 8, 9
    await expect(page.getByText("Session 3", { exact: true })).toBeVisible();
    await expect(page.getByText("0/2", { exact: true })).toBeVisible();
    await expect(page.getByText("Genesis 8")).toBeVisible();
    await expect(page.getByText("Genesis 9")).toBeVisible();
  });

  test("tests canon selection, search filtering, group selection, and book reordering", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Canon Tester ${testId}`,
      email: `canon_tester_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up & Onboard
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

    // 2. Open Custom Wizard on Plans page
    await page.goto("/plans");
    await page.getByTestId("open-custom-plan-wizard-btn").click();

    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();

    // Verify Canon dropdown contains Catholic canon and select it
    const canonSelect = wizardModal.getByRole("combobox");
    await expect(canonSelect).toBeVisible();
    await canonSelect.selectOption("catholic");
    await expect(
      wizardModal.getByText(/0 of 73 books selected/i)
    ).toBeVisible();

    // Test Search input: type "Maccabees"
    const searchInput = wizardModal.getByPlaceholder("Search books...");
    await searchInput.fill("Maccabees");
    await expect(wizardModal.getByRole("button", { name: /1 Maccabees/i })).toBeVisible();
    await expect(wizardModal.getByRole("button", { name: /2 Maccabees/i })).toBeVisible();
    await searchInput.clear();

    // Test Section Select All / Deselect Section
    const gospelsSelectBtn = wizardModal.getByRole("button", {
      name: "Select section",
    }).first();
    await gospelsSelectBtn.click();
    await expect(wizardModal.getByText(/of 73 books selected/i)).toBeVisible();

    // Test Clear All
    await wizardModal.getByRole("button", { name: "Clear All" }).click();
    await expect(wizardModal.getByText("0 of 73 books selected")).toBeVisible();

    // Select 2 specific books (Genesis and Exodus)
    await wizardModal.getByRole("button", { name: /^Genesis 50/i }).click();
    await wizardModal.getByRole("button", { name: /^Exodus 40/i }).click();
    await expect(wizardModal.getByText("2 of 73 books selected")).toBeVisible();

    // Advance to Step 2: Order by Book
    await wizardModal.getByTestId("wizard-next-step-order-btn").click();
    await expect(wizardModal.getByTestId("order-mode-book-btn")).toBeVisible();

    // Test Book Reordering: Move Genesis Down
    const moveDownBtn = wizardModal.getByTitle("Move down").first();
    await expect(moveDownBtn).toBeVisible();
    await moveDownBtn.click();

    // Test Reset Order button
    const resetOrderBtn = wizardModal.getByRole("button", {
      name: "Reset Order",
    });
    await expect(resetOrderBtn).toBeVisible();
    await resetOrderBtn.click();

    // Close modal
    await wizardModal.getByRole("button", { name: "Close modal" }).click();
    await expect(wizardModal).not.toBeVisible();
  });

  test("persists custom plan in catalog, survives page navigation/reload, and allows browsing details", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Catalog Reader ${testId}`,
      email: `catalog_test_${testId}@example.com`,
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

    // 2. Navigate to /plans catalog
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    // 3. Open Custom Plan Wizard Modal
    const createCustomBtn = page.getByTestId("open-custom-plan-wizard-btn");
    await expect(createCustomBtn).toBeVisible();
    await createCustomBtn.click();

    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();

    // 4. Select books: Ruth (4 ch) and Jonah (4 ch) -> total 8 chapters
    await wizardModal.getByRole("button", { name: /^Ruth 4/i }).click();
    await wizardModal.getByRole("button", { name: /^Jonah 4/i }).click();
    await expect(wizardModal.getByText("2 books selected")).toBeVisible();

    // 5. Advance to Step 2: Reading Order
    await wizardModal.getByTestId("wizard-next-step-order-btn").click();
    await wizardModal.getByTestId("order-mode-book-btn").click();
    await wizardModal.getByTestId("daily-target-preset-2").click();

    // 6. Advance to Step 3: Review & Plan Details
    await wizardModal.getByTestId("wizard-next-step-review-btn").click();
    const customTitle = `Ruth & Jonah Wisdom Journey ${testId}`;
    const customDesc =
      "A customized study of Ruth and Jonah saved and browsable in the user catalog.";
    await wizardModal.getByTestId("custom-plan-title-input").fill(customTitle);
    await wizardModal.getByTestId("custom-plan-desc-input").fill(customDesc);

    // 7. Click Save to Catalog (without starting)
    const saveCatalogBtn = wizardModal.getByTestId(
      "save-custom-plan-catalog-btn"
    );
    await expect(saveCatalogBtn).toBeVisible();
    await saveCatalogBtn.click();

    // Wizard closes
    await expect(wizardModal).not.toBeVisible({ timeout: 15000 });

    // 8. Verify the custom plan card appears in the Plan Catalog grid
    const customCard = page.locator(".group", { hasText: customTitle });
    await expect(customCard).toBeVisible();
    await expect(customCard.getByText("Custom", { exact: true })).toBeVisible();
    await expect(customCard.getByText("8 ch", { exact: true })).toBeVisible();
    await expect(customCard.getByText("4 days", { exact: true })).toBeVisible();
    await expect(customCard.getByText("Custom Reading Plan")).toBeVisible();

    // 9. Verify server-side database persistence by navigating away and reloading
    await page.goto("/home");
    await page.waitForURL("/home");
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    const persistedCard = page.locator(".group", { hasText: customTitle });
    await expect(persistedCard).toBeVisible();
    await expect(persistedCard.getByText("Custom", { exact: true })).toBeVisible();
    await expect(persistedCard.getByText("8 ch", { exact: true })).toBeVisible();

    // 10. Verify Catalog search filter finds the custom plan
    const searchInput = page.getByPlaceholder("Search plans...");
    await searchInput.fill(`Ruth & Jonah Wisdom Journey ${testId}`);
    await expect(persistedCard).toBeVisible();
    await searchInput.fill("NonExistentPlanFilterQueryXYZ");
    await expect(persistedCard).not.toBeVisible();
    await page.getByRole("button", { name: "Reset Filters" }).click();
    await expect(persistedCard).toBeVisible();

    // 11. Click "Details" to view the custom plan's catalog blueprint page
    await persistedCard.getByRole("link", { name: "Details" }).click();
    await page.waitForURL(/\/plans\/templates\/.+/, { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: customTitle, level: 1 })
    ).toBeVisible();
    await expect(page.getByText("Blueprint Template")).toBeVisible();
    await expect(page.getByText(customDesc)).toBeVisible();
    await expect(page.getByText("Ruth", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Jonah", { exact: false }).first()).toBeVisible();

    // 12. Return back to catalog
    await page.getByRole("link", { name: "Back to Plan Catalog" }).click();
    await page.waitForURL("/plans", { timeout: 10000 });
    await expect(persistedCard).toBeVisible();
  });
});
