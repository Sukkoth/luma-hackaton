import { test, expect } from "@playwright/test";

test.describe("Bible Tracker Luma Authentication & Access Control E2E", () => {
  // Generate unique test user credentials for isolation
  const testId = Date.now();
  const testUser = {
    fullName: `Marcus Aurelius ${testId}`,
    givenName: "Marcus",
    familyName: `Aurelius ${testId}`,
    email: `marcus_${testId}@example.com`,
    password: "Password123!",
  };

  test("unauthenticated users are redirected from protected routes to login", async ({
    page,
  }) => {
    // 1. Dashboard / Overview at /home is protected
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login\?redirect=\/home/);
    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();

    // 2. Insights
    await page.goto("/insights");
    await expect(page).toHaveURL(/\/login\?redirect=\/insights/);

    // 3. Notes
    await page.goto("/notes");
    await expect(page).toHaveURL(/\/login\?redirect=\/notes/);

    // 4. Settings
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/login\?redirect=\/settings/);

    // 5. Active Plan Instance
    await page.goto("/plans/sample-instance");
    await expect(page).toHaveURL(/\/login\?redirect=\/plans\/sample-instance/);
  });

  test("public routes and landing page are accessible without logging in", async ({
    page,
  }) => {
    // 1. Landing Page is public at root /
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(
      page.getByRole("heading", { name: /Read Deeply\. Track Faithfully\./i })
    ).toBeVisible();
    await expect(page.getByText("Start Reading for Free")).toBeVisible();

    // Verify unauthenticated top nav does NOT show Overview, Insights, Notes, or Settings
    const guestNav = page.getByRole("navigation", { name: "Main Navigation" });
    await expect(
      guestNav.getByRole("link", { name: "Overview" })
    ).not.toBeVisible();
    await expect(
      guestNav.getByRole("link", { name: "Insights" })
    ).not.toBeVisible();
    await expect(
      guestNav.getByRole("link", { name: "Notes" })
    ).not.toBeVisible();
    await expect(
      page.getByRole("link", { name: /Settings/i })
    ).not.toBeVisible();

    // But DOES show Bible Books and Plans
    await expect(
      guestNav.getByRole("link", { name: "Bible Books" })
    ).toBeVisible();
    await expect(guestNav.getByRole("link", { name: "Plans" })).toBeVisible();
    await expect(
      page.locator("header").getByRole("link", { name: "Sign In" })
    ).toBeVisible();

    // 2. Plans Catalog is public
    await page.goto("/plans");
    await expect(
      page.getByText("Bible Plans Catalog • Curated Journeys")
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Explore Structured Scripture Plans" })
    ).toBeVisible();
    await expect(page.getByText("Resume Reading")).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "The Four Gospels", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign In to Start Plan" })
    ).toBeVisible();

    // 3. Plan Blueprint Template is public
    await page.goto("/plans/templates/the_four_gospels_30");
    await expect(
      page.getByRole("heading", { name: "The Four Gospels" })
    ).toBeVisible();

    // 4. Books page is public to browse
    await page.goto("/books");
    await expect(page.getByText("Verse of the Day")).toBeVisible();
    await expect(page.getByText("All Books")).toBeVisible();
    await expect(page.getByText("Genesis")).toBeVisible();
    await expect(page.getByText("Matthew")).toBeVisible();
  });

  test("unauthenticated users are guarded when attempting protected actions", async ({
    page,
  }) => {
    // 1. On Plan Blueprint, clicking 'Create & Start Plan' prompts to sign in
    await page.goto("/plans/templates/the_four_gospels_30");
    await page.getByRole("button", { name: "Create & Start Plan" }).click();
    await expect(
      page.getByRole("dialog", { name: "Sign In to Start Plan" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("dialog", { name: "Sign In to Start Plan" })
    ).not.toBeVisible();

    // 2. On Books page, clicking a chapter to mark as read prompts to sign in
    await page.goto("/books");
    await page
      .getByRole("button", { name: /Romans Pauline Epistles/i })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();

    // Clicking chapter 9 prompts auth modal
    const ch9Button = page.getByRole("button", { name: "9", exact: true });
    await ch9Button.click();
    await expect(
      page.getByRole("dialog", { name: "Sign In to Log Progress" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("dialog", { name: "Sign In to Log Progress" })
    ).not.toBeVisible();
  });

  test("social OAuth buttons initiate OAuth redirect flow for Google and GitHub", async ({
    page,
  }) => {
    // Login page: Google OAuth button initiates navigation to Google accounts
    await page.goto("/login");
    const [googleRequest] = await Promise.all([
      page.waitForRequest((req) =>
        req.url().includes("/api/auth/sign-in/social")
      ),
      page.getByRole("button", { name: "Google" }).click(),
    ]);
    expect(googleRequest.method()).toBe("POST");
    await page.waitForURL((url) => url.hostname.includes("google.com"));

    // Signup page: GitHub OAuth button initiates navigation to GitHub OAuth
    await page.goto("/signup");
    const [githubRequest] = await Promise.all([
      page.waitForRequest((req) =>
        req.url().includes("/api/auth/sign-in/social")
      ),
      page.getByRole("button", { name: "GitHub" }).click(),
    ]);
    expect(githubRequest.method()).toBe("POST");
    await page.waitForURL((url) => url.hostname.includes("github.com"));
  });

  test("full user registration, onboarding flow with canon selection, and authenticated dashboard access", async ({
    page,
  }) => {
    // 1. Register new user
    await page.goto("/signup");
    await page.getByLabel("Full Name").fill(testUser.fullName);
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#signup-password").fill(testUser.password);
    await page.getByRole("checkbox", { name: /agree/i }).check();
    await page.getByRole("button", { name: "Create Account" }).click();

    // 2. Verify redirect to /onboarding for new users
    await page.waitForURL("/onboarding", { timeout: 10000 });
    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByText("Onboarding")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Read Scripture With Peace Daily" })
    ).toBeVisible();

    // Test carousel pagination
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Walk With Guided Reading Plans" })
    ).toBeVisible();

    // Skip to setup
    await page.getByRole("button", { name: "Skip to Setup" }).click();
    await expect(
      page.getByRole("heading", { name: "Set Up Your Reading Tracker" })
    ).toBeVisible();

    // Verify Default Canon is Standard 66 books and other canons are hidden
    await expect(page.getByText("Standard 66 Books")).toBeVisible();
    await expect(page.getByText("Catholic Canon (73 Books)")).not.toBeVisible();

    // Click "Change" to expand canon list
    await page.getByRole("button", { name: "Change" }).click();
    await expect(page.getByText("Catholic Canon (73 Books)")).toBeVisible();
    await expect(
      page.getByText("Eastern Orthodox Canon (78 Books)")
    ).toBeVisible();
    await expect(
      page.getByText("Ethiopian Orthodox Tewahedo (81 Books)")
    ).toBeVisible();

    // Select Catholic Canon
    await page
      .getByRole("button", { name: /Catholic Canon \(73 Books\)/i })
      .click();
    await expect(page.getByText("Catholic Canon (73 Books)")).toBeVisible();

    // Submit uncontrolled tracker form
    await page
      .getByRole("button", { name: "Complete Onboarding & Begin" })
      .click();

    // 3. Verified redirect to Overview/Dashboard at /home
    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");
    await expect(page.getByText(`Hello, ${testUser.givenName}!`)).toBeVisible();
    await expect(page.getByText("Bible Progress")).toBeVisible();

    // Verify visiting /onboarding now redirects back to /home since onboarding is complete
    await page.goto("/onboarding");
    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");

    // Verify authenticated user visiting root / is automatically navigated to /home
    await page.goto("/");
    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");

    // Verify authenticated user can see Overview, Insights, Notes, and Settings in top nav
    const authNav = page.getByRole("navigation", { name: "Main Navigation" });
    await expect(authNav.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(authNav.getByRole("link", { name: "Insights" })).toBeVisible();
    await expect(authNav.getByRole("link", { name: "Notes" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Settings/i })).toBeVisible();

    // 3. Verify user can access Settings and view their profile
    await page.goto("/settings");
    await expect(page).toHaveURL("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByText(testUser.fullName)).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
    await expect(page.getByText("Active Member")).toBeVisible();

    // 4. Verify user can now mark chapters on Books page
    await page.goto("/books");
    await page
      .getByRole("button", { name: /Romans Pauline Epistles/i })
      .click();
    const ch9Button = page.getByRole("button", { name: "9", exact: true });
    await expect(ch9Button).toHaveAttribute("aria-pressed", "false");
    await ch9Button.click();
    await expect(ch9Button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1 of 16 chapters read")).toBeVisible();
    await page.getByRole("button", { name: "Done" }).click();

    // 5. Verify Sign Out
    await page.goto("/settings");
    await page.getByRole("button", { name: "Sign Out" }).click();
    await page.waitForURL("/login", { timeout: 10000 });
    await expect(page).toHaveURL("/login");

    // 6. Verify logging back in with email and password
    await page.getByLabel("Email address").fill(testUser.email);
    await page.locator("#login-password").fill(testUser.password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL("/home", { timeout: 10000 });
    await expect(page).toHaveURL("/home");
    await expect(page.getByText(`Hello, ${testUser.givenName}!`)).toBeVisible();
  });

  test("dark theme toggle switches classes and persists in storage", async ({
    page,
  }) => {
    // Public books page
    await page.goto("/books");

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
