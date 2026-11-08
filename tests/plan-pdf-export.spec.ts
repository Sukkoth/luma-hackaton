import fs from "node:fs";
import { test, expect } from "@playwright/test";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("Plan PDF Extraction Feature", () => {
  test("custom plan creation wizard review tab displays Extract to PDF option without cancelling creation", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `PDF Exporter ${testId}`,
      email: `pdf_exporter_${testId}@example.com`,
      password: "Password123!",
    };

    // 1. Sign up and complete setup
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

    // 2. Navigate to Plans catalog
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog")).toBeVisible();

    // 3. Open Custom Plan Wizard Modal
    const createCustomBtn = page.getByTestId("open-custom-plan-wizard-btn");
    await expect(createCustomBtn).toBeVisible();
    await createCustomBtn.click();

    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();

    // Step 1: Select Jonah (4 ch)
    await wizardModal.getByRole("button", { name: /^Jonah 4/i }).click();
    await expect(
      wizardModal.getByText(/1 of \d+ books selected/i)
    ).toBeVisible();

    // Step 2: Reading Order
    await wizardModal.getByTestId("wizard-next-step-order-btn").click();
    await wizardModal.getByTestId("order-mode-book-btn").click();

    // Step 3: Review & Plan Details
    await wizardModal.getByTestId("wizard-next-step-review-btn").click();
    const customTitle = `Jonah Printable Mission ${testId}`;
    await wizardModal.getByTestId("custom-plan-title-input").fill(customTitle);

    // Verify "Extract to PDF" button is visible on Review tab
    const extractPdfBtn = wizardModal.getByTestId(
      "wizard-extract-plan-pdf-btn"
    );
    await expect(extractPdfBtn).toBeVisible();
    await expect(extractPdfBtn).toHaveText(/Extract to PDF/i);

    // Click "Extract to PDF"
    await extractPdfBtn.click();

    // Verify wizard modal is still open and creation has NOT been cancelled
    await expect(wizardModal).toBeVisible();
    await expect(
      wizardModal.getByTestId("save-custom-plan-catalog-btn")
    ).toBeVisible();

    // Save plan to catalog to confirm creation continues normally
    await wizardModal.getByTestId("save-custom-plan-catalog-btn").click();
    await expect(wizardModal).not.toBeVisible({ timeout: 15000 });

    // Verify the saved plan appears in the catalog
    await expect(page.getByText(customTitle)).toBeVisible();
  });

  test("plan setup enrollment modal final stage displays Extract to PDF option", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Enroll Exporter ${testId}`,
      email: `enroll_exporter_${testId}@example.com`,
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

    // 2. Open any plan template detail page
    await page.goto("/plans/templates/the_four_gospels_30");
    await expect(
      page.getByRole("heading", { name: "The Four Gospels", level: 1 })
    ).toBeVisible();

    // Verify template direct "Extract to PDF" button is visible
    const templateExtractBtn = page.getByTestId("template-extract-pdf-btn");
    await expect(templateExtractBtn).toBeVisible();

    // Click "Configure & Start Plan" to open enrollment setup wizard
    await page.getByRole("button", { name: "Configure & Start Plan" }).click();

    const enrollmentModal = page.getByRole("dialog");
    await expect(enrollmentModal).toBeVisible();

    // Step through the setup stages to reach the final review stage
    // Stage 1 -> 2
    await enrollmentModal.getByRole("button", { name: "Continue" }).click();
    // Stage 2 -> 3
    await enrollmentModal.getByRole("button", { name: "Continue" }).click();
    // Stage 3 -> 4 (Review & Confirm)
    await enrollmentModal.getByRole("button", { name: "Continue" }).click();

    await expect(enrollmentModal.getByText("ENROLLMENT SUMMARY")).toBeVisible();

    // Verify "Extract to PDF" button is present on the final review stage
    const setupExtractPdfBtn = enrollmentModal.getByTestId(
      "extract-plan-pdf-btn"
    );
    await expect(setupExtractPdfBtn).toBeVisible();
    await expect(setupExtractPdfBtn).toHaveText(/Extract to PDF/i);

    // Click "Extract to PDF"
    await setupExtractPdfBtn.click();

    // Modal remains open and active
    await expect(enrollmentModal).toBeVisible();

    // User can still confirm and start plan
    const confirmBtn = enrollmentModal.getByRole("button", {
      name: "Confirm & Start Plan",
    });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Redirects to plan instance detail
    await page.waitForURL(/\/plans\/.+/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: "The Four Gospels" }).first()
    ).toBeVisible();
  });
});
