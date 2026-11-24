import { test, expect } from "@playwright/test";

test.describe("Legal Pages (Privacy Policy & Terms of Service)", () => {
  test("loads /privacy with proper policy sections and metadata", async ({
    page,
  }) => {
    const res = await page.goto("/privacy");
    expect(res?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: "Privacy Policy", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(/Information We Collect/i)).toBeVisible();
    await expect(page.getByText(/How We Use Your Information/i)).toBeVisible();
    await expect(page.getByText(/Data Storage & Security/i)).toBeVisible();
    await expect(
      page.getByText(/Third-Party Service Providers/i)
    ).toBeVisible();
    await expect(page.getByText(/Data Export & Deletion/i)).toBeVisible();
    await expect(page.getByText(/luma@sukkoth.dev/i)).toBeVisible();
  });

  test("loads /tos with proper terms sections and metadata", async ({
    page,
  }) => {
    const res = await page.goto("/tos");
    expect(res?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { name: "Terms of Service", level: 1 })
    ).toBeVisible();
    await expect(page.getByText(/Acceptance of Terms/i)).toBeVisible();
    await expect(page.getByText(/Description of the Service/i)).toBeVisible();
    await expect(
      page.getByText(/User Accounts & Authentication/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Intellectual Property & Content Ownership/i)
    ).toBeVisible();
    await expect(
      page.getByText(/Disclaimers & Limitation of Liability/i)
    ).toBeVisible();
  });

  test("redirects /terms to /tos", async ({ page }) => {
    await page.goto("/terms");
    await expect(page).toHaveURL(/\/tos/);
    await expect(
      page.getByRole("heading", { name: "Terms of Service", level: 1 })
    ).toBeVisible();
  });

  test("signup page links to terms and privacy policy", async ({ page }) => {
    await page.goto("/signup");
    await expect(page).toHaveURL("/signup");

    const tosLink = page
      .getByRole("link", { name: "Terms of Service" })
      .first();
    const privacyLink = page
      .getByRole("link", { name: "Privacy Policy" })
      .first();

    await expect(tosLink).toBeVisible();
    await expect(privacyLink).toBeVisible();

    await expect(tosLink).toHaveAttribute("href", "/tos");
    await expect(privacyLink).toHaveAttribute("href", "/privacy");
  });
});
