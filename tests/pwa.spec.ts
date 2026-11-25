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

  await page.waitForURL("/onboarding", { timeout: 30000 });
  await page.getByRole("button", { name: "Skip to Setup" }).click();
  await page
    .getByRole("button", { name: "Complete Onboarding & Begin" })
    .click();
  await page.waitForURL("/home", { timeout: 30000 });
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
    expect(manifest.name).toBe("Bible Tracker & Plans");
    expect(manifest.short_name).toBe("Bible Tracker");
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
    expect(text).toContain("luma-pwa-v4");
    expect(text).toContain("PRECACHE_ASSETS");
    expect(text).toContain('self.addEventListener("install"');
    expect(text).toContain('self.addEventListener("fetch"');
    expect(text).toContain('self.addEventListener("activate"');
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
    await expect(appleTitleMeta).toHaveAttribute(
      "content",
      "Bible Tracker & Plans"
    );

    // Check iOS splash screen startup image
    const startupImageLink = page.locator(
      'link[rel="apple-touch-startup-image"]'
    );
    await expect(startupImageLink).toHaveAttribute("href", "/icon-512.png");

    // Check theme-color meta
    const themeColorMeta = page.locator('meta[name="theme-color"]');
    expect(await themeColorMeta.count()).toBeGreaterThanOrEqual(1);
  });

  test("dynamically adapts mobile status bar and theme-color when switching theme and navigating", async ({
    page,
  }) => {
    await page.goto("/login");

    // Default or system dark mode: verify theme-color contains #0c0a09 or adapts
    const initialDark = await page.evaluate(() => {
      return document.documentElement.classList.contains("dark");
    });

    // Toggle theme to dark and verify meta
    await page.evaluate(() => {
      localStorage.setItem("scripture-theme", "dark");
      window.dispatchEvent(new CustomEvent("scripture-theme-change"));
    });

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const meta = document.querySelector('meta[name="theme-color"]');
          return meta?.getAttribute("content");
        });
      })
      .toBe("#0c0a09");

    // Toggle theme to light and verify meta adapts
    await page.evaluate(() => {
      localStorage.setItem("scripture-theme", "light");
      window.dispatchEvent(new CustomEvent("scripture-theme-change"));
    });

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const meta = document.querySelector('meta[name="theme-color"]');
          return meta?.getAttribute("content");
        });
      })
      .toBe("#fbfbf9");

    // Verify status bar style remains light on client-side route navigation
    await page.getByRole("link", { name: /sign up/i }).click();
    await page.waitForURL("**/signup");

    await expect
      .poll(async () => {
        return page.evaluate(() => {
          const meta = document.querySelector('meta[name="theme-color"]');
          return meta?.getAttribute("content");
        });
      })
      .toBe("#fbfbf9");

    const appleMetaContent = await page.evaluate(() => {
      return document
        .querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
        ?.getAttribute("content");
    });
    expect(appleMetaContent).toBe("default");

    // Restore
    if (initialDark) {
      await page.evaluate(() => {
        localStorage.setItem("scripture-theme", "dark");
        window.dispatchEvent(new CustomEvent("scripture-theme-change"));
      });
    }
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
    await expect(page.getByText("Full-Screen Experience")).toBeVisible();
  });
});
