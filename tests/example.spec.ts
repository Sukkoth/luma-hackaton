import { test, expect } from "@playwright/test";

test.describe("App smoke tests", () => {
  test("homepage (Books page) loads with title", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Books");
  });

  test("main navigation routes load properly", async ({ page }) => {
    const routes = [
      { path: "/plans", heading: "Bible Plans" },
      { path: "/plans/templates/sample-plan", heading: "Plan Template:" },
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

  test("Better Auth healthcheck returns ok", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
