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

test.describe("Progressive Web App (PWA) E2E", () => {
  test("serves valid Web App Manifest at /manifest.json", async ({
    request,
  }) => {
    const response = await request.get("/manifest.json");
    expect(response.status()).toBe(200);

    const contentType = response.headers()["content-type"];
    expect(contentType).toMatch(/application\/(manifest\+)?json|text\/plain/);

    const manifest = await response.json();
    expect(manifest.name).toBe("Luma • Scripture Sanctuary & Bible Tracker");
    expect(manifest.short_name).toBe("Luma");
    expect(manifest.start_url).toBe("/home");
    expect(manifest.display).toBe("standalone");
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(Array.isArray(manifest.shortcuts)).toBe(true);
    expect(manifest.shortcuts.length).toBeGreaterThan(0);
  });

  test("serves production-grade Service Worker script at /sw.js", async ({
    request,
  }) => {
    const response = await request.get("/sw.js");
    expect(response.status()).toBe(200);

    const text = await response.text();
    expect(text).toContain("luma-pwa-v1");
    expect(text).toContain("PRECACHE_ASSETS");
    expect(text).toContain("self.addEventListener(\"install\"");
    expect(text).toContain("self.addEventListener(\"fetch\"");
    expect(text).toContain("self.addEventListener(\"activate\"");
  });

  test("renders branded offline fallback page at /offline", async ({
    page,
  }) => {
    await page.goto("/offline");
    await expect(
      page.getByRole("heading", { name: "You are currently offline" })
    ).toBeVisible();

    // Verify presence of quick links to cached reading hubs
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Books" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Notes" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Check Connection & Reload/i })
    ).toBeVisible();
  });

  test("includes PWA and mobile viewport meta tags in document head", async ({
    page,
  }) => {
    await page.goto("/login");

    // Check link rel=manifest
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute("href", "/manifest.json");

    // Check mobile web app capable
    const mobileCapableMeta = page.locator(
      'meta[name="mobile-web-app-capable"]'
    );
    await expect(mobileCapableMeta).toHaveAttribute("content", "yes");

    // Check apple mobile web app title
    const appleTitleMeta = page.locator(
      'meta[name="apple-mobile-web-app-title"]'
    );
    await expect(appleTitleMeta).toHaveAttribute("content", "Luma");

    // Check theme-color meta
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    await expect(themeColorMeta).toHaveCount(2); // dark and light themes
  });

  test("displays PWA installation & offline management section in Settings", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `pwa_user_${testId}@example.com`;
    await createAndOnboardUser({
      page,
      fullName: `PWA Explorer ${testId}`,
      email,
    });

    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /Mobile & Offline Installation/i })
    ).toBeVisible();
    await expect(page.getByText("Offline Cache Status")).toBeVisible();
    await expect(page.getByText("Full-Screen Experience")).toBeVisible();
  });
});
