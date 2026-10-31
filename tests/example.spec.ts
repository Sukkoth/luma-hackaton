import { test, expect } from "@playwright/test";

test.describe("Bible Tracker Luma Dashboard E2E", () => {
  test("dashboard loads with top navbar, hero progress card, metric cards, activity chart, and distribution cards", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify Top Navbar Brand and Navigation
    await expect(page.getByText("Scripture.")).toBeVisible();
    const nav = page.getByRole("navigation", { name: "Main Navigation" });
    await expect(nav.getByText("Overview")).toBeVisible();
    await expect(nav.getByText("Bible Books")).toBeVisible();
    await expect(nav.getByText("Plans")).toBeVisible();
    await expect(nav.getByText("Insights")).toBeVisible();
    await expect(nav.getByText("Notes")).toBeVisible();

    // Verify Hero Progress Card (Left Column)
    await expect(page.getByText("Hello, James!")).toBeVisible();
    await expect(page.getByText("Bible Progress")).toBeVisible();
    await expect(page.getByText("443 of 1189")).toBeVisible();
    await expect(page.getByText("Old Test.")).toBeVisible();
    await expect(page.getByText("New Test.")).toBeVisible();
    await expect(page.getByText("Remaining")).toBeVisible();
    await expect(page.getByText("1 108")).toBeVisible();
    await expect(page.getByText("chapters", { exact: true })).toBeVisible();

    // Verify Stat Metric Cards (Right Column Top)
    await expect(page.getByText("Chapters Read")).toBeVisible();
    await expect(page.getByText("10.8k")).toBeVisible();
    await expect(page.getByText("Avg Reading Time")).toBeVisible();
    await expect(page.getByText("30m")).toBeVisible();
    await expect(page.getByText("Verses Meditated")).toBeVisible();
    await expect(page.getByText("10.7k")).toBeVisible();
    await expect(page.getByText("Consistency Rating")).toBeVisible();
    await expect(page.getByText("4.8/5")).toBeVisible();

    // Verify Activity Bar Chart
    await expect(page.getByText("Reading Activity")).toBeVisible();
    await expect(page.getByText("654")).toBeVisible();

    // Verify Scripture Distribution & Active Plans
    await expect(page.getByText("Scripture Distribution")).toBeVisible();
    await expect(page.getByText("Pentateuch & Law")).toBeVisible();
    await expect(page.getByText("Active Plans Status")).toBeVisible();
    await expect(page.getByText("Bible in a Year")).toBeVisible();
  });

  test("books page loads with 66 books, filters, and interactive chapter modal", async ({
    page,
  }) => {
    await page.goto("/books");

    // Verify header and highlights
    await expect(page.getByText("Verse of the Day")).toBeVisible();
    await expect(page.getByText("Psalm 119:105")).toBeVisible();
    await expect(page.getByText("All Books")).toBeVisible();
    await expect(page.getByText("Genesis")).toBeVisible();
    await expect(page.getByText("Matthew")).toBeVisible();

    // Test search filter
    const searchInput = page.getByPlaceholder("Search books...");
    await searchInput.fill("Romans");
    await expect(
      page.getByRole("heading", { name: "Romans", exact: true })
    ).toBeVisible();
    await expect(page.getByText("Genesis")).not.toBeVisible();

    // Open Romans chapter modal
    await page
      .getByRole("button", { name: /Romans Pauline Epistles/i })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("8 of 16 chapters read")).toBeVisible();

    // Toggle chapter 9
    const ch9Button = page.getByRole("button", { name: "9", exact: true });
    await expect(ch9Button).toHaveAttribute("aria-pressed", "false");
    await ch9Button.click();
    await expect(ch9Button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("9 of 16 chapters read")).toBeVisible();

    // Close modal
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("plans page loads with catalog, search, and switches to my plans tab", async ({
    page,
  }) => {
    await page.goto("/plans");

    // Verify top highlights
    await expect(page.getByText("Bible Plans • Active Reading")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Bible in a Year", exact: true })
    ).toBeVisible();

    // Verify Catalog tab
    await expect(page.getByText(/Plan Catalog \(\d+\)/)).toBeVisible();
    await expect(page.getByText(/My Plans \(\d+\)/)).toBeVisible();

    // Switch to My Plans tab
    await page.getByRole("button", { name: /My Plans/i }).click();
    await expect(page.getByText("The Four Gospels (30 Days)")).toBeVisible();
    await expect(page.getByText("Checkoff Sections").first()).toBeVisible();

    // Switch back to Catalog
    await page.getByRole("button", { name: /Plan Catalog/i }).click();
    const searchInput = page.getByPlaceholder("Search plans...");
    await searchInput.fill("Hebrews");
    await expect(page.getByText(/Book of Hebrews/i).first()).toBeVisible();
  });

  test("navigation routes load properly", async ({ page }) => {
    const routes = [
      { path: "/books", heading: "All Books" },
      { path: "/plans", heading: "Bible Plans" },
      {
        path: "/plans/templates/the_four_gospels_30",
        heading: "The Four Gospels",
      },
      { path: "/plans/sample-instance", heading: "Plan Progress:" },
      { path: "/insights", heading: "Insights & Analytics" },
      { path: "/notes", heading: "Notes & Journals" },
      { path: "/settings", heading: "Settings" },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expect(page.locator("body")).toContainText(route.heading);
    }
  });

  test("auth pages (login, signup, forgot-password, reset-password) load and function as dummy UI", async ({
    page,
  }) => {
    // 1. Login page
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();
    await expect(page.getByPlaceholder("james@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();

    // 2. SignUp page
    await page.goto("/signup");
    await expect(
      page.getByRole("heading", { name: "Create an account" })
    ).toBeVisible();
    await expect(page.getByPlaceholder("James Aris")).toBeVisible();
    await expect(page.getByRole("button", { name: "Google" })).toBeVisible();
    await expect(page.getByRole("button", { name: "GitHub" })).toBeVisible();

    // 3. Forgot password page
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: "Forgot password?" })
    ).toBeVisible();
    await page.getByPlaceholder("james@example.com").fill("test@example.com");
    await page.getByRole("button", { name: "Send Reset Link" }).click();
    await expect(page.getByText("Reset link sent")).toBeVisible();
    await expect(page.getByText("Continue to Set New Password")).toBeVisible();

    // 4. Reset password page
    await page.goto("/reset-password");
    await expect(
      page.getByRole("heading", { name: "Set new password" })
    ).toBeVisible();
    await expect(
      page.getByLabel("New Password", { exact: true })
    ).toBeVisible();
    await expect(page.getByLabel("Confirm New Password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Update Password" })
    ).toBeVisible();
  });

  test("dark theme toggle switches classes and persists in storage", async ({
    page,
  }) => {
    await page.goto("/");

    const themeToggle = page.getByRole("button", { name: "Toggle theme" });
    await expect(themeToggle).toBeVisible();

    // Click toggle to switch to dark mode
    await themeToggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    // Verify localStorage persistence
    const themeInStorage = await page.evaluate(() =>
      window.localStorage.getItem("scripture-theme")
    );
    expect(themeInStorage).toBe("dark");

    // Click toggle again to switch to light mode
    await themeToggle.click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    const updatedTheme = await page.evaluate(() =>
      window.localStorage.getItem("scripture-theme")
    );
    expect(updatedTheme).toBe("light");
  });

  test("Better Auth healthcheck returns ok", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
