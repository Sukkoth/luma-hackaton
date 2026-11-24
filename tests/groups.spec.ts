import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

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

test.describe("Groups & Community Fellowship E2E", () => {
  test("unauthenticated users are guarded from /groups and invite routes", async ({
    page,
  }) => {
    // 1. Direct navigation to /groups redirects to /login
    await page.goto("/groups");
    await expect(page).toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();

    // 2. Direct navigation to join route redirects to /login with callbackUrl
    await page.goto("/groups/join/luma-dummy-invite-code");
    await expect(page).toHaveURL(/\/login/);
  });

  test("authenticated user can create private fellowship and manage pinned bulletin", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Leader Nehemiah ${testId}`,
      email: `nehemiah_${testId}@example.com`,
    };

    // 1. Sign up and onboard
    await createAndOnboardUser({
      page,
      fullName: testUser.fullName,
      email: testUser.email,
    });

    // 2. Navigate to Fellowships Hub
    await page.goto("/groups");
    await expect(
      page.getByRole("heading", { name: "Walk through Scripture, together." })
    ).toBeVisible();

    // 3. Open Create Fellowship modal
    await page
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();
    const createModal = page.getByRole("dialog");
    await expect(createModal).toBeVisible();
    await expect(
      createModal.getByRole("heading", { name: "Create Fellowship" })
    ).toBeVisible();

    // 4. Fill form (Private Fellowship by default)
    const groupName = `Berean Fellowship ${testId}`;
    await createModal.locator("#group-name").fill(groupName);
    await createModal
      .locator("#group-desc")
      .fill("Daily Berean study group dedicated to verse-by-verse reading.");
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    // 5. User is redirected to Fellowship Workspace
    await page.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await expect(page.getByRole("heading", { name: groupName })).toBeVisible();
    await expect(page.getByText("Private Fellowship")).toBeVisible();
    await expect(page.getByText("1 member")).toBeVisible();
    await expect(page.getByText("0 active plans")).toBeVisible();

    // Verify Owner badge is visible
    await expect(page.getByText("Owner", { exact: true })).toBeVisible();

    // 6. Pin a Bulletin Announcement
    await page.getByRole("button", { name: "Pin Bulletin" }).click();
    await expect(
      page.getByRole("heading", { name: "Pin Bulletin Announcement" })
    ).toBeVisible();

    await page
      .locator("#notice-title")
      .fill("Wednesday Prayer & Chapter Review");
    await page
      .locator("#notice-content")
      .fill(
        "Join our weekly community review on Zoom: https://zoom.us/j/999123456"
      );

    // Select 7 days duration
    await page.getByRole("button", { name: "7 Days" }).click();
    await page.getByRole("button", { name: "Post Bulletin" }).click();

    // 7. Verify bulletin appears on page
    await expect(
      page.getByText("Wednesday Prayer & Chapter Review")
    ).toBeVisible();
    const bulletinLink = page.locator('a[href="https://zoom.us/j/999123456"]');
    await expect(bulletinLink).toBeVisible();

    // 8. Edit & Clear Bulletin
    await page.getByRole("button", { name: "Edit Bulletin" }).click();
    await expect(
      page.getByRole("heading", { name: "Edit Pinned Bulletin" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Unpin Notice" }).click();

    // Verify bulletin is removed
    await expect(
      page.getByText("Wednesday Prayer & Chapter Review")
    ).not.toBeVisible();
  });

  test("admin can schedule a group reading plan and enroll with personal tracker", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Shepherd David ${testId}`,
      email: `shepherd_${testId}@example.com`,
    };

    // 1. Sign up and onboard
    await createAndOnboardUser({
      page,
      fullName: testUser.fullName,
      email: testUser.email,
    });

    // 2. Create fellowship
    await page.goto("/groups");
    await page
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();
    const createModal = page.getByRole("dialog");
    const groupName = `Shepherd Cohort ${testId}`;
    await createModal.locator("#group-name").fill(groupName);
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    await page.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, { timeout: 15000 });

    // 3. Open Schedule Plan Wizard
    await page.getByRole("button", { name: "Schedule Plan" }).first().click();
    const wizardModal = page.getByRole("dialog");
    await expect(wizardModal).toBeVisible();
    await expect(
      wizardModal.getByRole("heading", {
        name: "Schedule Fellowship Reading Plan",
      })
    ).toBeVisible();

    // Step 1: Template Selection (first plan is pre-selected)
    await wizardModal.getByRole("button", { name: "Next Step" }).click();

    // Step 2: Schedule & Pacing
    await wizardModal.getByRole("button", { name: "Next Step" }).click();

    // Step 3: Cohort Policy
    await wizardModal.getByRole("button", { name: "Next Step" }).click();

    // Step 4: Review & Confirm
    await wizardModal
      .getByRole("button", { name: "Publish Fellowship Plan" })
      .click();

    // 4. Group Plans tab updates to show active plan
    await expect(wizardModal).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Active Reading Plans \(1\)/i })
    ).toBeVisible();
    await expect(page.getByText("Synchronized Cohort Pace")).toBeVisible();

    // 5. Enroll in the group plan with personal tracker
    await page
      .getByRole("button", { name: "Enroll & Read With Fellowship" })
      .click();
    const enrollModal = page.getByRole("dialog");
    await expect(enrollModal).toBeVisible();
    await expect(
      enrollModal.getByRole("heading", { name: "Enroll in Reading Plan" })
    ).toBeVisible();

    // Confirm default Personal Reading tracker
    await enrollModal
      .getByRole("button", { name: /Confirm & Start Reading/i })
      .click();

    // Redirected to /plans/[instanceId]
    await page.waitForURL(/\/plans\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    await expect(page.getByText(`Fellowship: ${groupName}`)).toBeVisible();
  });

  test("multi-user cohort join flow with leader approval queue and member promotion", async ({
    browser,
  }) => {
    const testId = Date.now();
    const ownerUser = {
      fullName: `Elder Paul ${testId}`,
      email: `paul_${testId}@example.com`,
    };
    const applicantUser = {
      fullName: `Timothy Disciple ${testId}`,
      email: `timothy_${testId}@example.com`,
    };

    // ── STEP 1: Owner Context - Create fellowship requiring approval ──
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    await createAndOnboardUser({
      page: ownerPage,
      fullName: ownerUser.fullName,
      email: ownerUser.email,
    });

    await ownerPage.goto("/groups");
    await ownerPage
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();
    const createModal = ownerPage.getByRole("dialog");
    const groupName = `Ephesus Reading Circle ${testId}`;
    await createModal.locator("#group-name").fill(groupName);

    // Enable "Require Leader Approval"
    await createModal.locator("#requiresApproval").check();
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    await ownerPage.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    const groupUrl = ownerPage.url();

    // Open Invite Modal and get invitation link
    await ownerPage.getByRole("button", { name: "Invite" }).click();
    const inviteModal = ownerPage.getByRole("dialog");
    await expect(inviteModal).toBeVisible();

    const inviteLinkText = await inviteModal
      .locator(".font-mono")
      .first()
      .innerText();
    expect(inviteLinkText).toContain("/groups/join/");

    await inviteModal.getByRole("button", { name: "Close" }).click();

    // ── STEP 2: Applicant Context - Join via invite link ──
    const applicantContext = await browser.newContext();
    const applicantPage = await applicantContext.newPage();

    await createAndOnboardUser({
      page: applicantPage,
      fullName: applicantUser.fullName,
      email: applicantUser.email,
    });

    // Navigate to invite landing page
    await applicantPage.goto(inviteLinkText);
    await expect(
      applicantPage.getByRole("heading", { name: groupName })
    ).toBeVisible();
    await expect(
      applicantPage.getByText("This fellowship requires admin approval.")
    ).toBeVisible();

    // Submit join request
    await applicantPage
      .getByRole("button", { name: "Request to Join Fellowship" })
      .click();
    await expect(applicantPage.getByText("Request Submitted")).toBeVisible();
    await expect(
      applicantPage.getByText(
        "Your request is pending review by the fellowship admins."
      )
    ).toBeVisible();

    // ── STEP 3: Owner Context - Approve applicant in Members tab ──
    await ownerPage.goto(`${groupUrl}?tab=members`);
    await expect(
      ownerPage.getByRole("heading", {
        name: /Pending Join Requests \(1\)/i,
      })
    ).toBeVisible();
    await expect(ownerPage.getByText(applicantUser.fullName)).toBeVisible();

    // Approve applicant
    await ownerPage.getByRole("button", { name: "Approve" }).click();

    // Verify applicant is now listed in active members directory
    await expect(
      ownerPage.getByRole("heading", { name: "Fellowship Directory" })
    ).toBeVisible();
    await expect(
      ownerPage.getByText(/2 readers enrolled in this cohort/i)
    ).toBeVisible();
    await expect(
      ownerPage.getByText(applicantUser.fullName).first()
    ).toBeVisible();

    // ── STEP 4: Applicant Context - Verify active membership ──
    await applicantPage.goto(groupUrl);
    await expect(
      applicantPage.getByText("Member", { exact: true })
    ).toBeVisible();
    await expect(applicantPage.getByText("2 members")).toBeVisible();

    // ── STEP 5: Owner Context - Promote applicant to Admin ──
    await ownerPage.goto(`${groupUrl}?tab=admin`);
    await expect(
      ownerPage.getByRole("heading", { name: "Member Roles & Permissions" })
    ).toBeVisible();

    // Open role dropdown for applicant with hydration-safe retry
    const rolesSection = ownerPage
      .locator("section")
      .filter({ hasText: "Member Roles & Permissions" });
    const roleSelect = rolesSection.getByRole("combobox");
    await expect(roleSelect).toBeVisible();

    const adminOption = ownerPage.getByRole("option", { name: "Admin" });
    await expect(async () => {
      if (!(await adminOption.isVisible())) {
        await roleSelect.click();
      }
      await expect(adminOption).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    await adminOption.click();

    // ── STEP 6: Applicant Context - Verify Admin status ──
    await expect(async () => {
      await applicantPage.reload();
      await expect(
        applicantPage.getByText("Admin", { exact: true })
      ).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });

    await expect(
      applicantPage.getByRole("button", { name: /Settings/i })
    ).toBeVisible();

    await applicantContext.close();
    await ownerContext.close();
  });

  test("enrolled member can view leaderboard vitals and toggle reciprocal privacy", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Pilgrim Hannah ${testId}`,
      email: `hannah_${testId}@example.com`,
    };

    // 1. Sign up and onboard
    await createAndOnboardUser({
      page,
      fullName: testUser.fullName,
      email: testUser.email,
    });

    // 2. Create fellowship & schedule plan
    await page.goto("/groups");
    await page
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();
    const createModal = page.getByRole("dialog");
    await createModal
      .locator("#group-name")
      .fill(`Hannah Fellowship ${testId}`);
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    await page.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    const groupUrl = page.url();

    // Schedule plan
    await page.getByRole("button", { name: "Schedule Plan" }).first().click();
    const wizardModal = page.getByRole("dialog");
    await wizardModal.getByRole("button", { name: "Next Step" }).click();
    await wizardModal.getByRole("button", { name: "Next Step" }).click();
    await wizardModal.getByRole("button", { name: "Next Step" }).click();
    await wizardModal
      .getByRole("button", { name: "Publish Fellowship Plan" })
      .click();
    await expect(wizardModal).not.toBeVisible();

    // Enroll in the plan
    await page
      .getByRole("button", { name: "Enroll & Read With Fellowship" })
      .click();
    const enrollModal = page.getByRole("dialog");
    await enrollModal
      .getByRole("button", { name: /Confirm & Start Reading/i })
      .click();

    // Redirects to personal plan instance
    await page.waitForURL(/\/plans\/[a-zA-Z0-9_-]+/, { timeout: 15000 });

    // 3. Navigate back to Fellowship Leaderboard tab
    await page.goto(`${groupUrl}?tab=leaderboard`);
    await expect(
      page.getByRole("heading", { name: "Fellowship Leaderboard" })
    ).toBeVisible();
    await expect(page.getByText("1 reader", { exact: true })).toBeVisible();

    // 4. Toggle Leaderboard Privacy
    const hideBtn = page.getByRole("button", {
      name: "Hide My Progress",
    });
    await expect(hideBtn).toBeVisible();
    await hideBtn.click();

    const visibilityModal = page.getByRole("dialog");
    await expect(visibilityModal).toBeVisible();
    await expect(
      visibilityModal.getByRole("heading", {
        name: "Hide Your Reading Progress?",
      })
    ).toBeVisible();
    await expect(
      visibilityModal.getByText("Reciprocal Anonymity")
    ).toBeVisible();

    await visibilityModal
      .getByRole("button", { name: "Confirm & Hide Progress" })
      .click();

    // 5. Button toggles to "Make Visible" with cooldown indication
    await expect(
      page.getByRole("button", { name: "Make Visible" })
    ).toBeVisible();
  });

  test("open public fellowship is discoverable via explore tab search", async ({
    browser,
  }) => {
    const testId = Date.now();
    const creatorUser = {
      fullName: `Scribe Ezra ${testId}`,
      email: `ezra_${testId}@example.com`,
    };
    const seekerUser = {
      fullName: `Seeker Apollos ${testId}`,
      email: `apollos_${testId}@example.com`,
    };

    // ── STEP 1: Creator context creates open public fellowship ──
    const creatorContext = await browser.newContext();
    const creatorPage = await creatorContext.newPage();

    await createAndOnboardUser({
      page: creatorPage,
      fullName: creatorUser.fullName,
      email: creatorUser.email,
    });

    await creatorPage.goto("/groups");
    await creatorPage
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();
    const createModal = creatorPage.getByRole("dialog");
    const publicGroupName = `Public Berean Circle ${testId}`;

    await createModal.locator("#group-name").fill(publicGroupName);
    await createModal
      .locator("#group-desc")
      .fill("An open community circle for daily public fellowship.");

    // Select "Open Public"
    await createModal.getByRole("button", { name: /Open Public/i }).click();
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    await creatorPage.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, {
      timeout: 15000,
    });
    await expect(creatorPage.getByText("Open Access")).toBeVisible();

    // ── STEP 2: Seeker (second user) explores public catalog ──
    const seekerContext = await browser.newContext();
    const seekerPage = await seekerContext.newPage();

    await createAndOnboardUser({
      page: seekerPage,
      fullName: seekerUser.fullName,
      email: seekerUser.email,
    });

    await seekerPage.goto("/groups");

    // Switch to Explore Public tab via segmented control
    await seekerPage
      .getByTestId("groups-hub-tabs")
      .getByRole("button", { name: /Explore Public/i })
      .click();

    // Search for the newly created public group
    const searchInput = seekerPage.getByPlaceholder(
      /Search public fellowships/i
    );
    await searchInput.fill(publicGroupName);
    await searchInput.press("Enter");

    // Verify public fellowship card is rendered in search results
    await expect(
      seekerPage.getByRole("heading", { name: publicGroupName })
    ).toBeVisible();
    await expect(seekerPage.getByText("Open Access").first()).toBeVisible();

    await seekerContext.close();
    await creatorContext.close();
  });

  test("fellowship ownership transfer requires exact group name confirmation and updates privileges", async ({
    browser,
  }) => {
    const testId = Date.now();
    const ownerUser = {
      fullName: `Founder Aquila ${testId}`,
      email: `aquila_${testId}@example.com`,
    };
    const successorUser = {
      fullName: `Successor Apollos ${testId}`,
      email: `apollos_${testId}@example.com`,
    };

    // ── STEP 1: Owner creates fellowship ──
    const ownerContext = await browser.newContext();
    const ownerPage = await ownerContext.newPage();

    await createAndOnboardUser({
      page: ownerPage,
      fullName: ownerUser.fullName,
      email: ownerUser.email,
    });

    await ownerPage.goto("/groups");
    await ownerPage
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();

    const createModal = ownerPage.getByRole("dialog");
    const groupName = `Corinthian Community ${testId}`;
    await createModal.locator("#group-name").fill(groupName);
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    await ownerPage.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    const groupUrl = ownerPage.url();

    // Get invite link
    await ownerPage.getByRole("button", { name: "Invite" }).click();
    const inviteModal = ownerPage.getByRole("dialog");
    const inviteLinkText = await inviteModal
      .locator(".font-mono")
      .first()
      .innerText();
    await inviteModal.getByRole("button", { name: "Close" }).click();

    // ── STEP 2: Successor joins the fellowship ──
    const successorContext = await browser.newContext();
    const successorPage = await successorContext.newPage();

    await createAndOnboardUser({
      page: successorPage,
      fullName: successorUser.fullName,
      email: successorUser.email,
    });

    await successorPage.goto(inviteLinkText);
    await successorPage
      .getByRole("button", { name: "Join Fellowship" })
      .click();
    await successorPage.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, {
      timeout: 15000,
    });
    await expect(
      successorPage.getByRole("button", { name: "Leave" })
    ).toBeVisible();

    // ── STEP 3: Owner navigates to Admin tab to transfer ownership ──
    await ownerPage.goto(`${groupUrl}?tab=admin`);
    await expect(
      ownerPage.getByRole("heading", { name: "Danger Zone" })
    ).toBeVisible();

    // Open Transfer Ownership Modal (retry click until React hydration attaches handler)
    const transferModal = ownerPage.getByRole("dialog");
    await expect(async () => {
      await ownerPage
        .getByRole("button", { name: "Transfer Ownership" })
        .click();
      await expect(transferModal).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10000 });
    await expect(
      transferModal.getByRole("heading", {
        name: "Transfer Fellowship Ownership",
      })
    ).toBeVisible();

    // Confirmation input must not appear until successor is selected
    const confirmInput = transferModal.locator("#confirm-transfer-group-name");
    await expect(confirmInput).not.toBeVisible();

    // Select successor
    const memberSelect = transferModal.locator("#new-owner-select");
    await memberSelect.click();
    const successorOption = ownerPage.getByRole("option", {
      name: new RegExp(successorUser.fullName, "i"),
    });
    await expect(successorOption).toBeVisible();
    await successorOption.click();

    // Confirmation input is now visible
    await expect(confirmInput).toBeVisible();
    const confirmTransferBtn = transferModal.getByRole("button", {
      name: "Confirm Transfer",
    });

    // Submitting with wrong group name is disallowed (button disabled)
    await confirmInput.fill("Mismatched Fellowship Name");
    await expect(confirmTransferBtn).toBeDisabled();
    await expect(
      transferModal.getByText(
        "Please type the fellowship name to enable transfer"
      )
    ).toBeVisible();

    // Submitting with exact matching group name enables the button
    await confirmInput.fill(groupName);
    await expect(confirmTransferBtn).toBeEnabled();
    await expect(
      transferModal.getByText("Fellowship name matches")
    ).toBeVisible();

    // Complete transfer
    await confirmTransferBtn.click();
    await expect(transferModal).not.toBeVisible();

    // ── STEP 4: Verify privileges updated ──
    // Original owner is now an admin, so Danger Zone (Owner-only) is hidden
    await ownerPage.reload();
    await expect(
      ownerPage.getByRole("heading", { name: "Danger Zone" })
    ).not.toBeVisible();

    // Successor is now the Owner and has access to Danger Zone
    await successorPage.goto(`${groupUrl}?tab=admin`);
    await expect(
      successorPage.getByRole("heading", { name: "Danger Zone" })
    ).toBeVisible();

    await successorContext.close();
    await ownerContext.close();
  });

  test("fellowship deletion requires exact group name confirmation and deletes the cohort", async ({
    page,
  }) => {
    const testId = Date.now();
    const ownerUser = {
      fullName: `Leader Nehemiah ${testId}`,
      email: `nehemiah_${testId}@example.com`,
    };

    await createAndOnboardUser({
      page,
      fullName: ownerUser.fullName,
      email: ownerUser.email,
    });

    // 1. Create a fellowship to be deleted
    await page.goto("/groups");
    await page
      .getByRole("button", { name: "Create Fellowship" })
      .first()
      .click();

    const createModal = page.getByRole("dialog");
    const groupName = `Temporary Fellowship ${testId}`;
    await createModal.locator("#group-name").fill(groupName);
    await createModal
      .getByRole("button", { name: "Create Fellowship" })
      .click();

    await page.waitForURL(/\/groups\/[a-zA-Z0-9_-]+/, { timeout: 15000 });
    const groupUrl = page.url();

    // 2. Navigate to Admin tab
    await page.goto(`${groupUrl}?tab=admin`);
    await expect(
      page.getByRole("heading", { name: "Danger Zone" })
    ).toBeVisible();

    // 3. Open Delete Modal (retry click until React hydration attaches handler)
    const deleteModal = page.getByRole("dialog");
    await expect(async () => {
      await page.getByRole("button", { name: "Delete Fellowship" }).click();
      await expect(deleteModal).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10000 });
    await expect(
      deleteModal.getByRole("heading", { name: "Delete Fellowship" })
    ).toBeVisible();

    const deleteInput = deleteModal.locator("#confirm-delete-input");
    const confirmDeleteBtn = deleteModal.getByRole("button", {
      name: "Confirm Delete",
    });

    // 4. Test validation: typing incorrect name leaves button disabled
    await deleteInput.fill("Wrong Group Name");
    await expect(confirmDeleteBtn).toBeDisabled();
    await expect(
      deleteModal.getByText(
        "Please type the fellowship name to enable deletion"
      )
    ).toBeVisible();

    // 5. Typing exact name enables button
    await deleteInput.fill(groupName);
    await expect(confirmDeleteBtn).toBeEnabled();
    await expect(
      deleteModal.getByText("Fellowship name matches")
    ).toBeVisible();

    // 6. Confirm deletion
    await confirmDeleteBtn.click();
    await page.waitForURL("**/groups", { timeout: 15000 });

    // 7. Verify fellowship is no longer present on /groups
    await expect(
      page.getByRole("heading", { name: groupName })
    ).not.toBeVisible();
  });
});
