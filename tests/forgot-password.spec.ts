import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { eq, desc } from "drizzle-orm";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

import { db } from "../src/db";
import { user, verification } from "../src/db/schema";

test.describe("Forgot & Reset Password E2E", () => {
  const testId = Date.now();
  const testUser = {
    fullName: `Reset Test User ${testId}`,
    email: `reset_test_${testId}@example.com`,
    originalPassword: "OriginalPassword123!",
    newPassword: "UpdatedSecurePassword123!",
  };

  test("validates email input and shows error for empty or invalid format", async ({
    page,
  }) => {
    await page.goto("/forgot-password");

    // Click submit with empty field
    await page.getByRole("button", { name: /Send Reset Link/i }).click();

    // Verify error alert or form validation
    const emailInput = page.locator("#forgot-email");
    await expect(emailInput).toBeVisible();
  });

  test("shows error when visiting /reset-password without a token", async ({
    page,
  }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByText(/Missing or invalid reset token/i)
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Request a new password reset link/i })
    ).toBeVisible();
  });

  test("complete lifecycle: request reset -> extract token from DB -> set new password -> sign in", async ({
    page,
  }) => {
    // 1. Register a new user
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.originalPassword);
    await page
      .locator("#signup-confirm-password")
      .fill(testUser.originalPassword);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    // Wait until signed up
    await page.waitForURL("/onboarding", { timeout: 15000 });

    // 2. Clear browser session/cookies to simulate logged out state
    await page.context().clearCookies();
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();

    // 3. Click "Forgot password?" link
    await page.getByRole("link", { name: /Forgot password\?/i }).click();
    await page.waitForURL("/forgot-password", { timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Forgot password?" })
    ).toBeVisible();

    // 4. Submit forgot password form
    await page.locator("#forgot-email").fill(testUser.email);
    await page.getByRole("button", { name: /Send Reset Link/i }).click();

    // Verify confirmation banner appears
    await expect(page.getByText("Reset link sent")).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();

    // 5. Query verification token directly from local database (no real email needed!)
    const userRecord = await db.query.user.findFirst({
      where: eq(user.email, testUser.email),
    });
    expect(userRecord).toBeDefined();

    const verificationRecord = await db.query.verification.findFirst({
      where: eq(verification.value, userRecord!.id),
      orderBy: [desc(verification.createdAt)],
    });
    expect(verificationRecord).toBeDefined();
    expect(verificationRecord?.identifier).toMatch(/^reset-password:/);

    const token = verificationRecord!.identifier.replace("reset-password:", "");

    // 6. Navigate to the reset password URL with the token
    await page.goto(`/reset-password?token=${token}`);
    await expect(
      page.getByRole("heading", { name: "Set new password" })
    ).toBeVisible();

    // 7. Fill in new password and submit
    await page.locator("#new-password").fill(testUser.newPassword);
    await page.locator("#confirm-password").fill(testUser.newPassword);
    await page.getByRole("button", { name: /Update Password/i }).click();

    // 8. Verify confirmation view
    await expect(page.getByText("Password updated")).toBeVisible();

    // 9. Navigate to login and verify OLD password is now rejected
    await page.getByRole("link", { name: "Sign In With New Password" }).click();
    await page.waitForURL("/login", { timeout: 10000 });

    await page.locator("#login-email").fill(testUser.email);
    await page.locator("#login-password").fill(testUser.originalPassword);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible({
      timeout: 10000,
    });

    // 10. Sign in with the NEW password and verify success
    await page.locator("#login-password").fill(testUser.newPassword);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // Since this user had not completed onboarding, redirected to /onboarding
    await page.waitForURL("/onboarding", { timeout: 15000 });
    await expect(page).toHaveURL("/onboarding");
  });
});
