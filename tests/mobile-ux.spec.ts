import fs from "node:fs";
import { test, expect } from "@playwright/test";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("Mobile Navigation & Filter UX", () => {
  test.use({ viewport: { width: 375, height: 667 } }); // Mobile phone viewport

  test("on smaller devices, top nav switches to bottom nav bar with icons and 'Books' label", async ({
    page,
  }) => {
    const testId = Date.now();
    const testUser = {
      fullName: `Mobile Reader ${testId}`,
      email: `mobile_${testId}@example.com`,
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

    // 2. Desktop top nav center links should be hidden on mobile
    const desktopNav = page.getByRole("navigation", {
      name: "Main Navigation",
    });
    await expect(desktopNav).toBeHidden();

    // 3. Mobile bottom nav bar should be visible
    const mobileNav = page.getByRole("navigation", {
      name: "Mobile Navigation",
    });
    await expect(mobileNav).toBeVisible();

    // Verify links inside mobile bottom nav
    await expect(
      mobileNav.getByRole("link", { name: "Overview" })
    ).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Books" })).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Plans" })).toBeVisible();
    await expect(
      mobileNav.getByRole("link", { name: "Insights" })
    ).toBeVisible();
    await expect(mobileNav.getByRole("link", { name: "Notes" })).toBeVisible();

    // Verify "Bible Books" is NOT used as label, only "Books"
    await expect(
      mobileNav.getByRole("link", { name: "Bible Books" })
    ).not.toBeVisible();

    // 4. Test navigation to Books via bottom nav
    await mobileNav.getByRole("link", { name: "Books" }).click();
    await page.waitForURL("/books", { timeout: 10000 });

    // Verify category filter pills on Books page are horizontally scrollable (do not wrap)
    const booksCategoryFilter = page.getByTestId("books-category-filter");
    await expect(booksCategoryFilter).toBeVisible();
    const hasHorizontalScroll = await booksCategoryFilter.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowX === "auto" || style.overflowX === "scroll";
    });
    expect(hasHorizontalScroll).toBe(true);

    // 5. Test navigation to Plans via bottom nav
    await mobileNav.getByRole("link", { name: "Plans" }).click();
    await page.waitForURL("/plans", { timeout: 10000 });

    // Verify Plan Catalog tabs are horizontally scrollable
    const planCatalogTabs = page.getByTestId("plan-catalog-tabs");
    await expect(planCatalogTabs).toBeVisible();
    const hasTabsScroll = await planCatalogTabs.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowX === "auto" || style.overflowX === "scroll";
    });
    expect(hasTabsScroll).toBe(true);

    // Verify Plan category filter pills are horizontally scrollable
    const planCategoryFilter = page.getByTestId("plan-filter-pills");
    await expect(planCategoryFilter).toBeVisible();
    const hasPillsScroll = await planCategoryFilter.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowX === "auto" || style.overflowX === "scroll";
    });
    expect(hasPillsScroll).toBe(true);
  });
});
