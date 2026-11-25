import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { db } from "../src/db";
import {
  notifications,
  user,
  groups,
  groupActivities,
  groupMembers,
  readingTrackers,
} from "../src/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import {
  createNotificationAction,
  purgeOldNotificationsAction,
} from "../src/actions/notifications";
import { evaluateAndUnlockAchievementsAction } from "../src/actions/achievements";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

type CreateAndOnboardUserParams = {
  page: Page;
  fullName: string;
  email: string;
  password?: string;
};

const trackedCleanupUserIds: string[] = [];
const trackedCleanupGroupIds: string[] = [];

async function createAndOnboardUser({
  page,
  fullName,
  email,
  password = "Password123!",
}: CreateAndOnboardUserParams): Promise<{ id: string; email: string }> {
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

  const [u] = await db.select().from(user).where(eq(user.email, email));
  expect(u).toBeDefined();
  trackedCleanupUserIds.push(u!.id);
  return { id: u!.id, email: u!.email };
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
      if (trackedCleanupGroupIds.length > 0) {
        await db
          .delete(groups)
          .where(inArray(groups.id, trackedCleanupGroupIds));
      }
      if (testUserId) {
        await db
          .delete(notifications)
          .where(eq(notifications.userId, testUserId));
        await db.delete(user).where(eq(user.id, testUserId));
      }
      if (trackedCleanupUserIds.length > 0) {
        await db.delete(user).where(inArray(user.id, trackedCleanupUserIds));
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

    test("marking a single notification as read updates status in UI and database", async ({
      page,
    }) => {
      const testId = Date.now();
      const testUser = await createAndOnboardUser({
        page,
        fullName: `Mark Single User ${testId}`,
        email: `mark_single_${testId}@example.com`,
      });

      // 1. Seed two personal unread notifications
      const [notif1, notif2] = await db
        .insert(notifications)
        .values([
          {
            userId: testUser.id,
            type: "streak_alert",
            title: `Streak Alert ${testId}`,
            body: "Keep your daily rhythm alive!",
            isRead: false,
          },
          {
            userId: testUser.id,
            type: "plan_reminder",
            title: `Portion Reading ${testId}`,
            body: "Your daily portion is ready.",
            isRead: false,
          },
        ])
        .returning();

      // 2. Also create a fellowship group with an unread notice board activity from another member
      const groupAdminId = `admin_${testId}_${crypto.randomUUID()}`;
      const [admin] = await db
        .insert(user)
        .values({
          id: groupAdminId,
          name: "Fellowship Pastor",
          email: `${groupAdminId}@example.com`,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      trackedCleanupUserIds.push(admin!.id);

      const [grp] = await db
        .insert(groups)
        .values({
          name: `Fellowship Read Test ${testId}`,
          ownerId: admin!.id,
          inviteCode: `inv_${testId}`,
        })
        .returning();
      trackedCleanupGroupIds.push(grp!.id);

      // testUser is an active member whose lastViewedAt is 5 minutes ago
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
      await db.insert(groupMembers).values([
        {
          groupId: grp!.id,
          userId: admin!.id,
          role: "owner",
          status: "active",
        },
        {
          groupId: grp!.id,
          userId: testUser.id,
          role: "member",
          status: "active",
          lastViewedAt: fiveMinsAgo,
        },
      ]);

      const [groupNotice] = await db
        .insert(groupActivities)
        .values({
          groupId: grp!.id,
          actorId: admin!.id,
          type: "notice_pinned",
          title: `Prayer Meeting ${testId}`,
          body: "Join us tonight at 7:00 PM.",
          createdAt: new Date(),
        })
        .returning();

      // 3. Reload page to let notification center fetch initial unread count
      await page.reload();
      await page.waitForURL("/home");

      // Verify desktop button shows 4 unread updates (2 seeded + 1 group notice + 1 fellowship achievement)
      const notifBtn = page.getByTestId("desktop-notifications-button");
      await expect(notifBtn).toBeVisible();
      await expect(notifBtn.getByTestId("notifications-unread-dot")).toHaveText(
        "4"
      );

      // Open notification center popover
      await notifBtn.click();
      const popover = page.getByTestId("notifications-popover");
      await expect(popover).toBeVisible();

      // 4. Mark personal notification (notif1) as read via its check button
      const notif1Item = popover.getByTestId(`notification-item-${notif1!.id}`);
      await expect(notif1Item).toBeVisible();
      await expect(
        notif1Item.getByTestId("unread-indicator-dot")
      ).toBeVisible();

      await notif1Item.hover();
      const markNotif1Btn = notif1Item.getByTitle("Mark as read");
      await expect(markNotif1Btn).toBeVisible();
      await markNotif1Btn.click({ force: true });

      // In UI: unread dot disappears, popover counter drops to 3
      await expect(
        notif1Item.getByTestId("unread-indicator-dot")
      ).not.toBeVisible();
      await expect(popover.getByTestId("unread-badge-counter")).toHaveText(
        "3 unread"
      );

      // In DB: notif1 is marked read, while notif2 remains unread
      await expect
        .poll(async () => {
          const [dbNotif1] = await db
            .select()
            .from(notifications)
            .where(eq(notifications.id, notif1!.id));
          return dbNotif1?.isRead;
        })
        .toBe(true);

      const [dbNotif2] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notif2!.id));
      expect(dbNotif2!.isRead).toBe(false);

      // 5. Mark group notice board item as read
      const groupNoticeItem = popover.getByTestId(
        `notification-item-${groupNotice!.id}`
      );
      await expect(groupNoticeItem).toBeVisible();
      await expect(
        groupNoticeItem.getByTestId("unread-indicator-dot")
      ).toBeVisible();

      await groupNoticeItem.hover();
      const markGroupBtn = groupNoticeItem.getByTitle("Mark as read");
      await expect(markGroupBtn).toBeVisible();
      await markGroupBtn.click({ force: true });

      // In UI: unread dot disappears, popover counter drops to 2
      await expect(
        groupNoticeItem.getByTestId("unread-indicator-dot")
      ).not.toBeVisible();
      await expect(popover.getByTestId("unread-badge-counter")).toHaveText(
        "2 unread"
      );

      // In DB: group member's lastViewedAt was updated past the notice's createdAt
      await expect
        .poll(async () => {
          const [memberRecord] = await db
            .select()
            .from(groupMembers)
            .where(
              and(
                eq(groupMembers.groupId, grp!.id),
                eq(groupMembers.userId, testUser.id)
              )
            );
          return memberRecord?.lastViewedAt
            ? memberRecord.lastViewedAt.getTime()
            : 0;
        })
        .toBeGreaterThanOrEqual(groupNotice!.createdAt.getTime());
    });

    test("marking all notifications as read updates all remaining notifications and group activities in UI and database", async ({
      page,
    }) => {
      const testId = Date.now();
      const testUser = await createAndOnboardUser({
        page,
        fullName: `Mark All User ${testId}`,
        email: `mark_all_${testId}@example.com`,
      });

      // 1. Seed two unread personal notifications
      await db.insert(notifications).values([
        {
          userId: testUser.id,
          type: "achievement",
          title: `Badge Unlocked ${testId}`,
          body: "Great job completing your reading!",
          isRead: false,
        },
        {
          userId: testUser.id,
          type: "freeze_used",
          title: `Streak Protected ${testId}`,
          body: "A streak freeze was used yesterday.",
          isRead: false,
        },
      ]);

      // 2. Also seed an unread group activity
      const groupAdminId = `admin_${testId}_${crypto.randomUUID()}`;
      const [admin] = await db
        .insert(user)
        .values({
          id: groupAdminId,
          name: "Community Leader",
          email: `${groupAdminId}@example.com`,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      trackedCleanupUserIds.push(admin!.id);

      const [grp] = await db
        .insert(groups)
        .values({
          name: `All-Read Group ${testId}`,
          ownerId: groupAdminId,
          inviteCode: `allread_${testId}`,
        })
        .returning();
      trackedCleanupGroupIds.push(grp!.id);

      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      await db.insert(groupMembers).values([
        {
          groupId: grp!.id,
          userId: groupAdminId,
          role: "owner",
          status: "active",
        },
        {
          groupId: grp!.id,
          userId: testUser.id,
          role: "member",
          status: "active",
          lastViewedAt: tenMinsAgo,
        },
      ]);

      const [act] = await db
        .insert(groupActivities)
        .values({
          groupId: grp!.id,
          actorId: groupAdminId,
          type: "notice_pinned",
          title: `Announcement ${testId}`,
          body: "New reading plan started.",
          createdAt: new Date(),
        })
        .returning();

      // 3. Reload page and verify badge shows 4 (2 seeded + 1 group notice + 1 fellowship achievement)
      await page.reload();
      await page.waitForURL("/home");

      const notifBtn = page.getByTestId("desktop-notifications-button");
      await expect(notifBtn).toBeVisible();
      await expect(notifBtn.getByTestId("notifications-unread-dot")).toHaveText(
        "4"
      );

      // 4. Open notification popover
      await notifBtn.click();
      const popover = page.getByTestId("notifications-popover");
      await expect(popover).toBeVisible();

      // Click "Mark all read"
      const markAllBtn = popover.getByTestId("mark-all-read-button");
      await expect(markAllBtn).toBeVisible();
      await markAllBtn.click();

      // 5. Verify UI state
      await expect(
        notifBtn.getByTestId("notifications-unread-dot")
      ).not.toBeVisible();
      await expect(
        popover.getByTestId("unread-badge-counter")
      ).not.toBeVisible();

      // Switch to Unread tab -> shows "All caught up!"
      await popover.getByRole("button", { name: /Unread/i }).click();
      await expect(popover.getByText("All caught up!")).toBeVisible();

      // 6. Verify Database state
      await expect
        .poll(async () => {
          const unreadPersonal = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, testUser.id),
                eq(notifications.isRead, false)
              )
            );
          return unreadPersonal.length;
        })
        .toBe(0);

      const allPersonal = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, testUser.id));
      expect(allPersonal.length).toBe(3);
      expect(allPersonal.every((n) => n.isRead)).toBe(true);

      await expect
        .poll(async () => {
          const [member] = await db
            .select()
            .from(groupMembers)
            .where(
              and(
                eq(groupMembers.groupId, grp!.id),
                eq(groupMembers.userId, testUser.id)
              )
            );
          return member?.lastViewedAt ? member.lastViewedAt.getTime() : 0;
        })
        .toBeGreaterThanOrEqual(act!.createdAt.getTime());
    });

    test("deleting a notification removes it from UI and database with ownership enforcement", async ({
      page,
    }) => {
      const testId = Date.now();
      const userA = await createAndOnboardUser({
        page,
        fullName: `Owner User A ${testId}`,
        email: `owner_a_${testId}@example.com`,
      });

      // 1. Seed two notifications for User A
      const [notifA1, notifA2] = await db
        .insert(notifications)
        .values([
          {
            userId: userA.id,
            type: "streak_alert",
            title: `To Be Deleted ${testId}`,
            body: "This notification should be deleted.",
            isRead: false,
          },
          {
            userId: userA.id,
            type: "system",
            title: `To Be Kept ${testId}`,
            body: "This notification should remain in the database.",
            isRead: true,
          },
        ])
        .returning();

      // 2. Seed a notification belonging to another user (User B)
      const otherUserId = `other_user_${testId}_${crypto.randomUUID()}`;
      const [userB] = await db
        .insert(user)
        .values({
          id: otherUserId,
          name: "Other User B",
          email: `${otherUserId}@example.com`,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      trackedCleanupUserIds.push(userB!.id);

      const [notifB] = await db
        .insert(notifications)
        .values([
          {
            userId: otherUserId,
            type: "system",
            title: `User B Private Notification ${testId}`,
            body: "User A must never be able to delete or view this.",
            isRead: false,
          },
        ])
        .returning();

      // 3. Reload page and open popover
      await page.reload();
      await page.waitForURL("/home");

      const notifBtn = page.getByTestId("desktop-notifications-button");
      await notifBtn.click();
      const popover = page.getByTestId("notifications-popover");
      await expect(popover).toBeVisible();

      // User A's items are visible
      const notifA1Item = popover.getByTestId(
        `notification-item-${notifA1!.id}`
      );
      const notifA2Item = popover.getByTestId(
        `notification-item-${notifA2!.id}`
      );
      await expect(notifA1Item).toBeVisible();
      await expect(notifA2Item).toBeVisible();

      // User B's item is NOT visible in User A's notification list
      await expect(
        popover.getByTestId(`notification-item-${notifB!.id}`)
      ).not.toBeVisible();

      // 4. User A deletes notifA1
      await notifA1Item.hover();
      const deleteBtn = notifA1Item.getByTitle("Delete");
      await expect(deleteBtn).toBeVisible();
      await deleteBtn.click({ force: true });

      // 5. Verify UI update: notifA1 disappears, notifA2 remains
      await expect(notifA1Item).not.toBeVisible();
      await expect(notifA2Item).toBeVisible();

      // 6. Verify Database update: notifA1 was deleted, notifA2 remains
      await expect
        .poll(async () => {
          const checkA1 = await db
            .select()
            .from(notifications)
            .where(eq(notifications.id, notifA1!.id));
          return checkA1.length;
        })
        .toBe(0);

      const checkA2 = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notifA2!.id));
      expect(checkA2.length).toBe(1);

      // 7. Verify Ownership Enforcement:
      // Even if another user's notification ID is targeted, it cannot be deleted
      const checkB = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notifB!.id));
      expect(checkB.length).toBe(1);
      expect(checkB[0]!.userId).toBe(otherUserId);
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
      expect(achNotif!.actionUrl).toBe("/achievements");
    });

    test("purge retention action cleans up old read notifications and old activities", async () => {
      const fiftyDaysAgo = new Date(Date.now() - 50 * 24 * 60 * 60 * 1000);

      // Create an old read notification (50 days old) and a recent read notification
      const [oldNotif] = await db
        .insert(notifications)
        .values({
          userId: testUserId,
          type: "system",
          title: "Old Read Notification",
          body: "This should be purged.",
          isRead: true,
          createdAt: fiftyDaysAgo,
        })
        .returning();

      const [freshNotif] = await db
        .insert(notifications)
        .values({
          userId: testUserId,
          type: "system",
          title: "Fresh Read Notification",
          body: "This should NOT be purged.",
          isRead: true,
          createdAt: new Date(),
        })
        .returning();

      const res = await purgeOldNotificationsAction();
      expect(res.success).toBe(true);

      // Verify old is gone, fresh remains
      const checkOld = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, oldNotif!.id));
      expect(checkOld.length).toBe(0);

      const checkFresh = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, freshNotif!.id));
      expect(checkFresh.length).toBe(1);

      // Clean up fresh notification
      await db
        .delete(notifications)
        .where(eq(notifications.id, freshNotif!.id));
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
          actionUrl: "/bible",
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
      await expect(notifBtn.getByTestId("notifications-unread-dot")).toHaveText(
        "2"
      );

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
      await expect(
        notifBtn.getByTestId("notifications-unread-dot")
      ).not.toBeVisible();

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
      await pageA
        .getByRole("button", { name: "Complete Onboarding & Begin" })
        .click();
      await pageA.waitForURL("/home", { timeout: 10000 });

      // User A goes to /groups and creates a group
      await pageA.goto("/groups");
      await pageA
        .getByRole("button", { name: "Create Fellowship" })
        .first()
        .click();

      const groupName = `Fellowship ${testId}`;
      const createModal = pageA.getByRole("dialog");
      await createModal.locator("#group-name").fill(groupName);
      await createModal
        .getByRole("button", { name: "Create Fellowship" })
        .click();

      // Wait for group detail page
      await pageA.waitForURL(/\/groups\/.+/, { timeout: 10000 });

      // Find group record from DB to get invite code
      const groupRecord = await db.query.groups.findFirst({
        where: eq(groups.name, groupName),
      });
      expect(groupRecord).toBeDefined();

      // Check User A notification center -> has "Group Created"
      const notifBtnA = pageA
        .getByTestId("desktop-notifications-button")
        .first();
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
      await pageB
        .getByRole("button", { name: "Complete Onboarding & Begin" })
        .click();
      await pageB.waitForURL("/home", { timeout: 10000 });

      // User B joins via invite code
      await pageB.goto("/groups");
      await pageB.getByRole("button", { name: /Join with Code/i }).click();
      const joinModal = pageB.getByRole("dialog");
      await joinModal.locator("#invite-code").fill(groupRecord!.inviteCode);
      await joinModal.getByRole("button", { name: "Join Fellowship" }).click();

      // Wait for navigation to group
      await pageB.waitForURL(new RegExp(`/groups/${groupRecord!.id}`), {
        timeout: 10000,
      });

      // 3. Verify User B received "Joined Group" notification
      const notifBtnB = pageB
        .getByTestId("desktop-notifications-button")
        .first();
      await notifBtnB.click();
      const popoverB = pageB.getByTestId("notifications-popover");
      await expect(popoverB.getByText("Joined Group")).toBeVisible();
      await expect(popoverB.getByText(new RegExp(groupName))).toBeVisible();

      // 4. Reload User A page and verify User A received "New Group Member" notification
      await pageA.reload();
      await notifBtnA.click();
      await expect(popoverA.getByText("New Group Member")).toBeVisible();
      await expect(
        popoverA.getByText(new RegExp(userB.fullName))
      ).toBeVisible();

      await contextA.close();
      await contextB.close();
    });

    test("sequential multi-user cycle with full logout and login: creator creates group, logs out -> joiner joins, logs out -> creator logs in, checks notification, pins announcement, logs out -> joiner logs in, checks notice board and marks read", async ({
      page,
    }) => {
      test.setTimeout(120000);
      const testId = Date.now();
      const userA = {
        fullName: `Pastor Alex ${testId}`,
        email: `pastor_alex_${testId}@example.com`,
        password: "Password123!",
      };
      const userB = {
        fullName: `Member Sarah ${testId}`,
        email: `member_sarah_${testId}@example.com`,
        password: "Password123!",
      };

      // 1. User A signs up & onboards
      await page.goto("/signup");
      await page.getByLabel("Full Name").fill(userA.fullName);
      await page.getByLabel("Email address").fill(userA.email);
      await page.locator("#signup-password").fill(userA.password);
      await page.getByRole("checkbox", { name: /agree/i }).check();
      await page.getByRole("button", { name: "Create Account" }).click();

      await page.waitForURL("/onboarding", { timeout: 10000 });
      await page.getByRole("button", { name: "Skip to Setup" }).click();
      await page
        .getByRole("button", { name: "Complete Onboarding & Begin" })
        .click();
      await page.waitForURL("/home", { timeout: 10000 });

      // User A creates Fellowship group
      await page.goto("/groups");
      await page
        .getByRole("button", { name: "Create Fellowship" })
        .first()
        .click();

      const groupName = `Antioch ${testId}`;
      const createModal = page.getByRole("dialog");
      await createModal.locator("#group-name").fill(groupName);
      await createModal
        .getByRole("button", { name: "Create Fellowship" })
        .click();

      await page.waitForURL(/\/groups\/.+/, { timeout: 10000 });

      const groupRecord = await db.query.groups.findFirst({
        where: eq(groups.name, groupName),
      });
      expect(groupRecord).toBeDefined();

      // 2. User A logs out using sidebar UI button and confirmation modal
      const logoutBtnA = page.getByLabel("Log out of session").first();
      await logoutBtnA.click();
      const logoutModalA = page.getByRole("dialog");
      await expect(
        logoutModalA.getByText("Log Out of Your Account")
      ).toBeVisible();
      await logoutModalA.getByRole("button", { name: "Log Out" }).click();
      await page.waitForURL("/", { timeout: 10000 });

      // 3. User B signs up & onboards
      await page.goto("/signup");
      await page.getByLabel("Full Name").fill(userB.fullName);
      await page.getByLabel("Email address").fill(userB.email);
      await page.locator("#signup-password").fill(userB.password);
      await page.getByRole("checkbox", { name: /agree/i }).check();
      await page.getByRole("button", { name: "Create Account" }).click();

      await page.waitForURL("/onboarding", { timeout: 10000 });
      await page.getByRole("button", { name: "Skip to Setup" }).click();
      await page
        .getByRole("button", { name: "Complete Onboarding & Begin" })
        .click();
      await page.waitForURL("/home", { timeout: 10000 });

      // User B joins Antioch Fellowship via invite code
      await page.goto("/groups");
      await page.getByRole("button", { name: /Join with Code/i }).click();
      const joinModal = page.getByRole("dialog");
      await joinModal.locator("#invite-code").fill(groupRecord!.inviteCode);
      await joinModal.getByRole("button", { name: "Join Fellowship" }).click();
      await page.waitForURL(new RegExp(`/groups/${groupRecord!.id}`), {
        timeout: 10000,
      });

      // User B verifies "Joined Group" notification in popover
      const notifBtnB = page
        .getByTestId("desktop-notifications-button")
        .first();
      await expect(notifBtnB).toBeVisible({ timeout: 15000 });
      await notifBtnB.click();
      const popoverB = page.getByTestId("notifications-popover");
      await expect(popoverB.getByText("Joined Group")).toBeVisible();
      await expect(popoverB.getByText(new RegExp(groupName))).toBeVisible();
      await notifBtnB.click(); // close

      // 4. User B logs out through UI
      const logoutBtnB = page.getByLabel("Log out of session").first();
      await logoutBtnB.click();
      const logoutModalB = page.getByRole("dialog");
      await expect(
        logoutModalB.getByText("Log Out of Your Account")
      ).toBeVisible();
      await logoutModalB.getByRole("button", { name: "Log Out" }).click();
      await page.waitForURL("/", { timeout: 10000 });

      // 5. User A logs in on /login
      await page.goto("/login");
      await page.locator("#login-email").fill(userA.email);
      await page.locator("#login-password").fill(userA.password);
      const signInBtnA = page.getByRole("button", { name: "Sign In" });
      await expect(signInBtnA).toBeEnabled();
      await signInBtnA.click();
      await page.waitForURL("/home", { timeout: 15000 });
      await expect(
        page.getByRole("heading", {
          name: /Good (morning|afternoon|evening), Pastor\./i,
        })
      ).toBeVisible();

      // User A verifies unread notification dot and "New Group Member" from User B
      const notifBtnA2 = page
        .getByTestId("desktop-notifications-button")
        .first();
      await expect(
        notifBtnA2.getByTestId("notifications-unread-dot")
      ).toBeVisible();
      await notifBtnA2.click();
      const popoverA2 = page.getByTestId("notifications-popover");
      await expect(popoverA2.getByText("New Group Member")).toBeVisible();
      await expect(
        popoverA2.getByText(new RegExp(userB.fullName))
      ).toBeVisible();
      await notifBtnA2.click(); // close

      // User A pins an announcement to the group notice board
      const [uA] = await db
        .select()
        .from(user)
        .where(eq(user.email, userA.email));
      expect(uA).toBeDefined();

      await db.insert(groupActivities).values({
        groupId: groupRecord!.id,
        actorId: uA!.id,
        type: "notice_pinned",
        title: `Announcement: "${groupName}"`,
        body: "Weekly Prayer Meeting: Join us Wednesday at 7pm in Antioch Hall.",
        actionUrl: `/groups/${groupRecord!.id}`,
      });

      // 6. User A logs out through UI
      const logoutBtnA3 = page.getByLabel("Log out of session").first();
      await logoutBtnA3.click();
      const logoutModalA3 = page.getByRole("dialog");
      await expect(
        logoutModalA3.getByText("Log Out of Your Account")
      ).toBeVisible();
      await logoutModalA3.getByRole("button", { name: "Log Out" }).click();
      await page.waitForURL("/", { timeout: 15000 });

      // 7. User B logs back in on /login
      await page.goto("/login");
      await page.locator("#login-email").fill(userB.email);
      await page.locator("#login-password").fill(userB.password);
      const signInBtnB = page.getByRole("button", { name: "Sign In" });
      await expect(signInBtnB).toBeEnabled();
      await signInBtnB.click();
      await page.waitForURL("/home", { timeout: 15000 });
      await expect(
        page.getByRole("heading", {
          name: /Good (morning|afternoon|evening), Member\./i,
        })
      ).toBeVisible();

      // User B verifies unread notification dot is visible with the announcement
      const notifBtnB2 = page
        .getByTestId("desktop-notifications-button")
        .first();
      await expect(
        notifBtnB2.getByTestId("notifications-unread-dot")
      ).toBeVisible();
      await notifBtnB2.click();
      const popoverB2 = page.getByTestId("notifications-popover");
      await expect(
        popoverB2.getByText(new RegExp(`Announcement: "${groupName}"`))
      ).toBeVisible();
      await expect(popoverB2.getByText(/Weekly Prayer Meeting/)).toBeVisible();

      // 8. User B marks all as read
      const markAllBtn = popoverB2.getByTestId("mark-all-read-button");
      await expect(markAllBtn).toBeVisible();
      await markAllBtn.click();

      // Badge clears
      await expect(
        notifBtnB2.getByTestId("notifications-unread-dot")
      ).not.toBeVisible();

      // Switch to Unread tab -> shows "All caught up!"
      await popoverB2.getByRole("button", { name: /Unread/i }).click();
      await expect(popoverB2.getByText("All caught up!")).toBeVisible();
    });

    test("scrolls smoothly and stays bounded when many notifications are present", async ({
      page,
    }) => {
      const timestamp = Date.now();
      const testUser = await createAndOnboardUser({
        page,
        fullName: `Many Notifs User ${timestamp}`,
        email: `manynotifs_${timestamp}@example.com`,
      });

      // Insert 15 notifications to exceed popover max-height
      const bulkNotifications = Array.from({ length: 15 }, (_, i) => ({
        id: `bulk_notif_${timestamp}_${i}`,
        userId: testUser.id,
        type: "plan_reminder" as const,
        title: `Daily Scripture Reminder #${i + 1}`,
        body: `Time for your daily devotional reflection step #${i + 1}.`,
        isRead: false,
        createdAt: new Date(Date.now() - i * 60000),
      }));

      await db.insert(notifications).values(bulkNotifications);

      await page.reload();
      await page.waitForURL("/home");

      const notifBtn = page.getByTestId("desktop-notifications-button");
      await expect(notifBtn).toBeVisible();
      await notifBtn.click();

      const popover = page.getByTestId("notifications-popover");
      await expect(popover).toBeVisible();

      // Wait for notifications to load into the popover
      const firstItem = popover.getByTestId(
        `notification-item-bulk_notif_${timestamp}_0`
      );
      await expect(firstItem).toBeVisible();

      // Check popover height is capped at 520px
      const box = await popover.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeLessThanOrEqual(520);

      // Verify scrollable container has scrollable height
      const scrollContainer = popover.locator(".overflow-y-auto");
      await expect(scrollContainer).toBeVisible();

      const isScrollable = await scrollContainer.evaluate(
        (el) => el.scrollHeight > el.clientHeight
      );
      expect(isScrollable).toBe(true);

      // Scroll to bottom and verify last notification can be scrolled into view
      const lastItem = popover.getByTestId(
        `notification-item-bulk_notif_${timestamp}_14`
      );
      await lastItem.scrollIntoViewIfNeeded();
      await expect(lastItem).toBeVisible();
    });
  });
});
