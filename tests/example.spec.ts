import { test, expect } from "@playwright/test";

test.describe("App smoke tests", () => {
  test("homepage loads and displays Next.js content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("To get started");
  });

  test("Better Auth healthcheck returns ok", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toEqual({ ok: true });
  });
});
