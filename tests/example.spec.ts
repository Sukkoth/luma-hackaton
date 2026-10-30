import { test, expect } from "@playwright/test";

test.describe("App smoke tests", () => {
  test("homepage (Books page) loads with title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Books");
  });

  test("main navigation routes load properly", async ({ page }) => {
    const routes = [
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
      await expect(page.locator("h1")).toContainText(route.heading);
    }
  });

  test("plan catalog displays plans and filters correctly", async ({
    page,
  }) => {
    await page.goto("/plans");
    await expect(page.getByText("Plan Catalog (29)")).toBeVisible();
    await expect(page.getByText("The Four Gospels")).toBeVisible();
    await expect(page.getByText("Bible in One Year")).toBeVisible();

    // Test search filter
    const searchInput = page.getByPlaceholder(
      "Search plans by title or keywords..."
    );
    await searchInput.fill("Hebrews");
    await expect(page.getByText("Book of Hebrews")).toBeVisible();
    await expect(page.getByText("Bible in One Year")).not.toBeVisible();
  });

  test("Better Auth healthcheck returns ok", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
