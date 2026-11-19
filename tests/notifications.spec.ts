import fs from "node:fs";
import { test, expect } from "@playwright/test";
import { db } from "../src/db";
import { notifications, user, groups, readingTrackers } from "../src/db/schema";
import { eq, desc } from "drizzle-orm";
import { createNotificationAction } from "../src/actions/notifications";
import { evaluateAndUnlockAchievementsAction } from "../src/actions/achievements";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

test.describe("In-App Notification System", () => {
  test.describe("Server Action Operations", () => {
    test.describe.configure({ mode: "serial" });

    let testUserId: string;

    test.beforeAll(async () => {
      const id = `notif_test_${crypto.randomUUID()}`;
      const [u] = await db
        .insert(user)
        .values({
          id,
          name: "Notification Test User",
          email: `${id}@example.com`,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      testUserId = u!.id;
    });

    test.afterAll(async () => {
      if (testUserId) {
        await db.delete(notifications).where(eq(notifications.userId, testUserId));
        await db.delete(user).where(eq(user.id, testUserId));
      }
    });

    test("can create notifications of multiple domain types", async () => {
      const types = [
        {
          type: "streak_alert" as const,
          title: "Streak Warning",
          body: "Keep your habit alive today!",
          actionUrl: "/bible",
        },
        {
          type: "freeze_used" as const,
          title: "Freeze Shield Used",
          body: "A shield protected your 7-day streak.",
        },
        {
          type: "plan_reminder" as const,
          title: "Daily Plan Reading",
          body: "Genesis 1-3 is ready for you today.",
          actionUrl: "/plans",
        },
        {
          type: "achievement" as const,
          title: "Badge Unlocked!",
          body: "You reached a 7-day streak.",
        },
      ];

      for (const item of types) {
        const res = await createNotificationAction({
          userId: testUserId,
          input: item,
        });
        expect(res.success).toBe(true);
        if (res.success) {
          expect(res.notification.userId).toBe(testUserId);
          expect(res.notification.title).toBe(item.title);
          expect(res.notification.isRead).toBe(false);
        }
      }

      // Check DB directly
      const all = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, testUserId))
        .orderBy(desc(notifications.createdAt));

      expect(all.length).toBe(4);
    });

    test("marking a single notification as read updates status", async () => {
      const [notif] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, testUserId))
        .limit(1);

      expect(notif).toBeDefined();

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, notif!.id));

      const [updated] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notif!.id));

      expect(updated!.isRead).toBe(true);
    });

    test("marking all notifications as read updates all remaining", async () => {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, testUserId));

      const unread = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, testUserId));

      expect(unread.every((n) => n.isRead)).toBe(true);
    });

    test("deleting a notification removes it from database", async () => {
      const [notif] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, testUserId))
        .limit(1);

      expect(notif).toBeDefined();

      await db.delete(notifications).where(eq(notifications.id, notif!.id));

      const check = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notif!.id));

      expect(check.length).toBe(0);
    });

    test("unlocking an achievement triggers an in-app achievement notification", async () => {
      // Create 2 reading trackers for testUserId to trigger "two_trackers" achievement
      await db.insert(readingTrackers).values([
        {
          id: `tr_${crypto.randomUUID()}`,
          userId: testUserId,
          name: "Test Tracker 1",
          canon: "protestant",
        },
        {
          id: `tr_${crypto.randomUUID()}`,
          userId: testUserId,
          name: "Test Tracker 2",
          canon: "protestant",
        },
      ]);

      const { newlyUnlocked } = await evaluateAndUnlockAchievementsAction({
        userId: testUserId,
      });

      expect(newlyUnlocked.length).toBeGreaterThan(0);

      // Verify notification was created in database
      const notifs = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, testUserId))
        .orderBy(desc(notifications.createdAt));

      const achNotif = notifs.find((n) => n.type === "achievement");
      expect(achNotif).toBeDefined();
      expect(achNotif!.title).toContain("Milestone Unlocked");
      expect(achNotif!.actionUrl).toBe("/insights?tab=achievements");
    });
  });

  test.describe("UI & Navigation End-to-End", () => {
    test("authenticated user can view notification center and interact with updates", async ({
      page,
    }) => {
      const testId = Date.now();
      const testUser = {
        fullName: `Notif UI ${testId}`,
        email: `notif_${testId}@example.com`,
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

      // Find user from DB to inject mock notifications
      const [u] = await db
        .select()
        .from(user)
        .where(eq(user.email, testUser.email));
      expect(u).toBeDefined();

      // Seed 2 notifications for this user
      await db.insert(notifications).values([
        {
          userId: u!.id,
          type: "streak_alert",
          title: "Streak Reminder",
          body: "Keep your daily rhythm active!",
          actionUrl: "/books",
          isRead: false,
        },
        {
          userId: u!.id,
          type: "plan_reminder",
          title: "Portion Ready",
          body: "Today's chapters are ready.",
          isRead: false,
        },
      ]);

      // Reload page to fetch notifications
      await page.reload();
      await page.waitForURL("/home");

      // Verify desktop notification button exists
      const notifBtn = page.getByTestId("desktop-notifications-button");
      await expect(notifBtn).toBeVisible();

      // Verify unread badge shows 2
      await expect(notifBtn.getByTestId("notifications-unread-dot")).toHaveText("2");

      // Open notification center
      await notifBtn.click();

      // Verify popover opens
      const popover = page.getByTestId("notifications-popover");
      await expect(popover).toBeVisible();
      await expect(popover.getByText("Streak Reminder")).toBeVisible();
      await expect(popover.getByText("Portion Ready")).toBeVisible();

      // Click "Mark all read"
      const markAllBtn = page.getByTestId("mark-all-read-button");
      await expect(markAllBtn).toBeVisible();
      await markAllBtn.click();

      // Badge disappears
      await expect(notifBtn.getByTestId("notifications-unread-dot")).not.toBeVisible();

      // Switch to Unread tab -> shows "All caught up!"
      await popover.getByRole("button", { name: /Unread/i }).click();
      await expect(popover.getByText("All caught up!")).toBeVisible();
    });

    test("mobile viewport opens notification center in bottom sheet", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      const testId = Date.now();
      const testUser = {
        fullName: `Mobile Notif ${testId}`,
        email: `mob_notif_${testId}@example.com`,
        password: "Password123!",
      };

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

      // Click notification button on mobile
      const notifBtn = page.getByTestId("mobile-notifications-button");
      await expect(notifBtn).toBeVisible();
      await notifBtn.click();

      // Opens inside sheet
      const sheet = page.locator('[role="dialog"]');
      await expect(sheet).toBeVisible();
      await expect(
        sheet.getByRole("heading", { name: "Notifications" }).first()
      ).toBeVisible();

      // Back button dismisses the sheet
      await page.goBack();
      await expect(sheet).not.toBeVisible();
      expect(page.url()).toContain("/home");
    });

    test("group creation and joining generates notifications for creator and joining member", async ({
      browser,
    }) => {
      const testId = Date.now();
      const userA = {
        fullName: `Owner User ${testId}`,
        email: `owner_${testId}@example.com`,
        password: "Password123!",
      };
      const userB = {
        fullName: `Joiner User ${testId}`,
        email: `joiner_${testId}@example.com`,
        password: "Password123!",
      };

      // 1. User A signs up & creates a group
      const contextA = await browser.newContext();
      const pageA = await contextA.newPage();

      await pageA.goto("/signup");
      await pageA.getByLabel("Full Name").fill(userA.fullName);
      await pageA.getByLabel("Email address").fill(userA.email);
      await pageA.locator("#signup-password").fill(userA.password);
      await pageA.getByRole("checkbox", { name: /agree/i }).check();
      await pageA.getByRole("button", { name: "Create Account" }).click();

      await pageA.waitForURL("/onboarding", { timeout: 10000 });
      await pageA.getByRole("button", { name: "Skip to Setup" }).click();
      await pageA.getByRole("button", { name: "Complete Onboarding & Begin" }).click();
      await pageA.waitForURL("/home", { timeout: 10000 });

      // User A goes to /groups and creates a group
      await pageA.goto("/groups");
      await pageA.getByRole("button", { name: "Create Fellowship" }).first().click();

      const groupName = `Fellowship ${testId}`;
      const createModal = pageA.getByRole("dialog");
      await createModal.locator("#group-name").fill(groupName);
      await createModal.getByRole("button", { name: "Create Fellowship" }).click();

      // Wait for group detail page
      await pageA.waitForURL(/\/groups\/.+/, { timeout: 10000 });

      // Find group record from DB to get invite code
      const groupRecord = await db.query.groups.findFirst({
        where: eq(groups.name, groupName),
      });
      expect(groupRecord).toBeDefined();

      // Check User A notification center -> has "Group Created"
      const notifBtnA = pageA.getByTestId("desktop-notifications-button").first();
      await notifBtnA.click();
      const popoverA = pageA.getByTestId("notifications-popover");
      await expect(popoverA.getByText("Group Created")).toBeVisible();
      await expect(popoverA.getByText(new RegExp(groupName))).toBeVisible();
      await notifBtnA.click(); // Close popover

      // 2. User B signs up in context B
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();

      await pageB.goto("/signup");
      await pageB.getByLabel("Full Name").fill(userB.fullName);
      await pageB.getByLabel("Email address").fill(userB.email);
      await pageB.locator("#signup-password").fill(userB.password);
      await pageB.getByRole("checkbox", { name: /agree/i }).check();
      await pageB.getByRole("button", { name: "Create Account" }).click();

      await pageB.waitForURL("/onboarding", { timeout: 10000 });
      await pageB.getByRole("button", { name: "Skip to Setup" }).click();
      await pageB.getByRole("button", { name: "Complete Onboarding & Begin" }).click();
      await pageB.waitForURL("/home", { timeout: 10000 });

      // User B joins via invite code
      await pageB.goto("/groups");
      await pageB.getByRole("button", { name: /Join with Code/i }).click();
      const joinModal = pageB.getByRole("dialog");
      await joinModal.locator("#invite-code").fill(groupRecord!.inviteCode);
      await joinModal.getByRole("button", { name: "Join Fellowship" }).click();

      // Wait for navigation to group
      await pageB.waitForURL(new RegExp(`/groups/${groupRecord!.id}`), { timeout: 10000 });

      // 3. Verify User B received "Joined Group" notification
      const notifBtnB = pageB.getByTestId("desktop-notifications-button").first();
      await notifBtnB.click();
      const popoverB = pageB.getByTestId("notifications-popover");
      await expect(popoverB.getByText("Joined Group")).toBeVisible();
      await expect(popoverB.getByText(new RegExp(groupName))).toBeVisible();

      // 4. Reload User A page and verify User A received "New Group Member" notification
      await pageA.reload();
      await notifBtnA.click();
      await expect(popoverA.getByText("New Group Member")).toBeVisible();
      await expect(popoverA.getByText(new RegExp(userB.fullName))).toBeVisible();

      await contextA.close();
      await contextB.close();
    });
  });
});
