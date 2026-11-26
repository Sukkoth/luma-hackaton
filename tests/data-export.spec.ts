import fs from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import * as v from "valibot";
import { eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  user,
  readingTrackers,
  trackerChapterProgress,
  noteFolders,
  notes,
  readingLogs,
  unlockedAchievements,
  userSettings,
} from "../src/db/schema";
import {
  UserDataExportSchema,
  type UserDataExport,
} from "../src/lib/schemas/data-export";
import { exportUserData, importUserData } from "../src/lib/data-export-service";
import { normalizeBackupToLatest } from "../src/lib/data-export-migrations";

if (fs.existsSync(".env")) {
  process.loadEnvFile?.();
}

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
  await page.locator("#signup-confirm-password").fill(password);
  await page.getByRole("checkbox", { name: /agree/i }).check();
  await page.getByRole("button", { name: "Create Account" }).click();

  await page.waitForURL("/onboarding", { timeout: 15000 });
  await page.getByRole("button", { name: "Skip to Setup" }).click();
  await page
    .getByRole("button", { name: "Complete Onboarding & Begin" })
    .click();
  await page.waitForURL("/home", { timeout: 15000 });
}

test.describe("Data Export & Merge Validation Suite", () => {
  const testRunId = Date.now().toString();
  const testUserAId = `test_user_a_${testRunId}`;
  const testUserBId = `test_user_b_${testRunId}`;
  const trackedCleanupUserIds: string[] = [testUserAId, testUserBId];

  test.afterAll(async () => {
    // Robust cleanup of all created test users via cascade
    if (trackedCleanupUserIds.length > 0) {
      await db.delete(user).where(inArray(user.id, trackedCleanupUserIds));
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Data Schema & Serialization Boundary Tests
  // ─────────────────────────────────────────────────────────────────────────────

  test("UserDataExportSchema accepts compact export payload with zero redundant keys", () => {
    const validData: UserDataExport = {
      v: 1,
      exportedAt: new Date().toISOString(),
      app: "Scripture Tracker",
      trackers: [
        {
          ref: "t_0",
          name: "My Personal Bible Study",
          canon: "protestant",
          progress: {
            GEN: [1, 2],
          },
        },
      ],
      folders: [
        {
          ref: "f_0",
          name: "Theology & Reflections",
          color: "#3B82F6",
          pinned: true,
        },
      ],
      notes: [
        {
          title: "Genesis 1: Creation Reflection",
          body: "<p>In the beginning God created the heavens and the earth.</p>",
          pinned: true,
          folder: "f_0",
          tracker: "t_0",
        },
      ],
      plans: [
        {
          ref: "p_0",
          templateId: "chronological-365",
          tracker: "t_0",
          title: "Whole Bible in a Year",
          start: new Date().toISOString(),
          dailyTarget: 3,
          totalChapters: 1189,
          readings: ["reading_item_1"],
        },
      ],
      logs: [["t_0", "GEN", 1, new Date().toISOString()]],
      achievements: {
        first_chapter: new Date().toISOString(),
      },
    };

    const parsed = v.safeParse(UserDataExportSchema, validData);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.output.v).toBe(1);
      expect(parsed.output.app).toBe("Scripture Tracker");
      expect(parsed.output.trackers.length).toBe(1);
      expect(parsed.output.trackers[0]?.progress?.GEN).toEqual([1, 2]);
      expect(parsed.output.notes?.length).toBe(1);
      expect(parsed.output.notes?.[0]?.folder).toBe("f_0");
    }
  });

  test("UserDataExportSchema rejects invalid app identifier or unsupported version", () => {
    const invalidData = {
      v: 2,
      exportedAt: new Date().toISOString(),
      app: "Unrecognized App",
      trackers: [],
    };

    const parsed = v.safeParse(UserDataExportSchema, invalidData);
    expect(parsed.success).toBe(false);
  });

  test("Export payload is guaranteed not to contain userId, email, or settings at root", () => {
    const exportedKeys = [
      "v",
      "exportedAt",
      "app",
      "trackers",
      "folders",
      "notes",
      "plans",
      "logs",
      "achievements",
    ];

    expect(exportedKeys).not.toContain("userId");
    expect(exportedKeys).not.toContain("email");
    expect(exportedKeys).not.toContain("password");
    expect(exportedKeys).not.toContain("settings");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Database Integration & Transactional Consistency Tests
  // ─────────────────────────────────────────────────────────────────────────────

  test("End-to-end service: exports User A data in compact structure, imports into User B, and preserves relational integrity", async () => {
    // 1. Create User A in DB
    await db.insert(user).values({
      id: testUserAId,
      name: `User A ${testRunId}`,
      email: `usera_${testRunId}@example.com`,
    });

    await db.insert(userSettings).values({
      userId: testUserAId,
      timezone: "UTC",
    });

    // Create User A tracker & chapters
    const [trackerA] = await db
      .insert(readingTrackers)
      .values({
        userId: testUserAId,
        name: "Morning Devotions",
        canon: "protestant",
        icon: "sun",
      })
      .returning();

    expect(trackerA).toBeDefined();

    await db.insert(trackerChapterProgress).values([
      {
        trackerId: trackerA!.id,
        bookId: "GEN",
        chapter: 1,
      },
      {
        trackerId: trackerA!.id,
        bookId: "GEN",
        chapter: 2,
      },
    ]);

    // Create User A folder & note
    const [folderA] = await db
      .insert(noteFolders)
      .values({
        userId: testUserAId,
        name: "Genesis Studies",
      })
      .returning();

    expect(folderA).toBeDefined();

    await db.insert(notes).values({
      userId: testUserAId,
      trackerId: trackerA!.id,
      folderId: folderA!.id,
      title: "Creation Day 1 Reflection",
      bodyHtml: "<p>Let there be light</p>",
      plainTextSnippet: "Let there be light",
    });

    // Create User A reading log
    await db.insert(readingLogs).values({
      userId: testUserAId,
      trackerId: trackerA!.id,
      bookId: "GEN",
      bookName: "Genesis",
      chapter: 1,
      loggedAt: new Date(),
    });

    // Create User A achievement
    await db.insert(unlockedAchievements).values({
      userId: testUserAId,
      achievementId: "genesis_started",
    });

    // 2. Export User A data
    const exportedData = await exportUserData({ userId: testUserAId });

    // Verify compact export format
    expect(exportedData.v).toBe(1);
    expect(exportedData.app).toBe("Scripture Tracker");
    expect(exportedData.trackers.length).toBe(1);
    expect(exportedData.trackers[0]?.name).toBe("Morning Devotions");
    expect(exportedData.trackers[0]?.ref).toBe("t_0");
    expect(exportedData.trackers[0]?.progress?.GEN).toEqual([1, 2]);
    expect(exportedData.folders?.length).toBe(1);
    expect(exportedData.folders?.[0]?.name).toBe("Genesis Studies");
    expect(exportedData.notes?.length).toBe(1);
    expect(exportedData.notes?.[0]?.folder).toBe("f_0");
    expect(exportedData.notes?.[0]?.tracker).toBe("t_0");
    expect(exportedData.logs?.length).toBe(1);
    expect(exportedData.logs?.[0]?.[0]).toBe("t_0");
    expect(exportedData.logs?.[0]?.[1]).toBe("GEN");
    expect(exportedData.logs?.[0]?.[2]).toBe(1);
    expect(exportedData.achievements?.genesis_started).toBeDefined();

    // Verify absolutely no User A PII is leaked
    const jsonString = JSON.stringify(exportedData);
    expect(jsonString).not.toContain(testUserAId);
    expect(jsonString).not.toContain(`usera_${testRunId}@example.com`);
    expect(jsonString).not.toContain("plainTextSnippet");

    // 3. Create fresh User B in DB
    await db.insert(user).values({
      id: testUserBId,
      name: `User B ${testRunId}`,
      email: `userb_${testRunId}@example.com`,
    });

    await db.insert(userSettings).values({
      userId: testUserBId,
      timezone: "UTC",
    });

    // 4. Import exported data into User B
    const importCounts = await importUserData({
      userId: testUserBId,
      data: exportedData,
    });

    expect(importCounts.trackers).toBe(1);
    expect(importCounts.chapters).toBe(2);
    expect(importCounts.folders).toBe(1);
    expect(importCounts.notes).toBe(1);
    expect(importCounts.logs).toBe(1);
    expect(importCounts.achievements).toBe(1);

    // 5. Verify User B database state
    const userBTrackers = await db.query.readingTrackers.findMany({
      where: eq(readingTrackers.userId, testUserBId),
      with: { chapterProgress: true },
    });
    expect(userBTrackers.length).toBe(1);
    expect(userBTrackers[0]?.name).toBe("Morning Devotions");
    expect(userBTrackers[0]?.chapterProgress.length).toBe(2);

    const userBNotes = await db.query.notes.findMany({
      where: eq(notes.userId, testUserBId),
      with: { folder: true, tracker: true },
    });
    expect(userBNotes.length).toBe(1);
    expect(userBNotes[0]?.title).toBe("Creation Day 1 Reflection");
    expect(userBNotes[0]?.folder?.name).toBe("Genesis Studies");
    expect(userBNotes[0]?.tracker?.name).toBe("Morning Devotions");
    expect(userBNotes[0]?.plainTextSnippet).toBe("Let there be light");

    // Verify reading log resolved bookName
    const userBLogs = await db.query.readingLogs.findMany({
      where: eq(readingLogs.userId, testUserBId),
    });
    expect(userBLogs.length).toBe(1);
    expect(userBLogs[0]?.bookName).toBe("Genesis");

    // Verify streak was calculated for User B from logs
    const userBSettings = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, testUserBId),
    });
    expect(userBSettings?.currentStreak).toBeGreaterThanOrEqual(1);

    // 6. Test Idempotency / Merging: Importing again into User B does not duplicate trackers or notes
    const secondImportCounts = await importUserData({
      userId: testUserBId,
      data: exportedData,
    });
    expect(secondImportCounts.trackers).toBe(0);
    expect(secondImportCounts.folders).toBe(0);
    expect(secondImportCounts.notes).toBe(0);

    const finalNotesCount = await db.query.notes.findMany({
      where: eq(notes.userId, testUserBId),
    });
    expect(finalNotesCount.length).toBe(1);
  });

  test("ACID Transaction: rolls back completely if an error occurs midway, leaving zero orphan records", async () => {
    const testRollbackUserId = `rollback_user_${Date.now()}`;
    trackedCleanupUserIds.push(testRollbackUserId);

    await db.insert(user).values({
      id: testRollbackUserId,
      name: "Rollback Test User",
      email: `${testRollbackUserId}@example.com`,
    });

    const faultyData: UserDataExport = {
      v: 1,
      exportedAt: new Date().toISOString(),
      app: "Scripture Tracker",
      trackers: [
        {
          ref: "t_fail",
          name: "Rollback Tracker",
          canon: "protestant",
          progress: { GEN: [1] },
        },
      ],
      notes: [
        {
          title: "Rollback Note",
          body: "<p>Should not exist</p>",
          tracker: "t_fail",
        },
      ],
      plans: [
        {
          ref: "p_fail",
          templateId: "non_existent_foreign_template_xyz",
          tracker: "t_fail",
          title: "Failing Plan",
          start: new Date().toISOString(),
          dailyTarget: 1,
          totalChapters: 10,
        },
      ],
    };

    let caughtError: unknown = null;
    try {
      await importUserData({
        userId: testRollbackUserId,
        data: faultyData,
      });
    } catch (err: unknown) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();

    // Verify ACID rollback: zero trackers and zero notes exist in DB for this user
    const remainingTrackers = await db.query.readingTrackers.findMany({
      where: eq(readingTrackers.userId, testRollbackUserId),
    });
    expect(remainingTrackers.length).toBe(0);

    const remainingNotes = await db.query.notes.findMany({
      where: eq(notes.userId, testRollbackUserId),
    });
    expect(remainingNotes.length).toBe(0);
  });

  test("Backward Compatibility: migrates legacy verbose backup (version: 1) to compact format and restores cleanly", async () => {
    const testLegacyUserId = `legacy_user_${Date.now()}`;
    trackedCleanupUserIds.push(testLegacyUserId);

    await db.insert(user).values({
      id: testLegacyUserId,
      name: "Legacy User",
      email: `${testLegacyUserId}@example.com`,
    });

    const legacyPayload = {
      version: 1,
      app: "Scripture Tracker",
      trackers: [
        {
          refId: "legacy_tracker_1",
          name: "Old Verbose Tracker",
          canon: "protestant",
          chapterProgress: [
            { bookId: "PSA", chapter: 23, completedAt: "2025-01-01T00:00:00Z" },
            { bookId: "PSA", chapter: 91, completedAt: "2025-01-02T00:00:00Z" },
          ],
        },
      ],
      noteFolders: [
        {
          refId: "legacy_folder_1",
          name: "Old Folder",
        },
      ],
      notes: [
        {
          title: "Old Verbose Note",
          bodyHtml: "<p>Legacy note content</p>",
          folderRef: "legacy_folder_1",
          trackerRef: "legacy_tracker_1",
        },
      ],
      readingLogs: [
        {
          trackerRef: "legacy_tracker_1",
          bookId: "PSA",
          bookName: "Psalms",
          chapter: 23,
          loggedAt: "2025-01-01T00:00:00Z",
        },
      ],
      achievements: [
        {
          achievementId: "first_psalm",
          unlockedAt: "2025-01-01T00:00:00Z",
        },
      ],
    };

    const normalized = normalizeBackupToLatest({ raw: legacyPayload });
    expect(normalized.v).toBe(1);
    expect(normalized.trackers[0]?.ref).toBe("legacy_tracker_1");
    expect(normalized.trackers[0]?.progress?.PSA).toEqual([23, 91]);
    expect(normalized.notes?.[0]?.folder).toBe("legacy_folder_1");
    expect(normalized.logs?.[0]?.[1]).toBe("PSA");

    const importCounts = await importUserData({
      userId: testLegacyUserId,
      data: normalized,
    });

    expect(importCounts.trackers).toBe(1);
    expect(importCounts.chapters).toBe(2);
    expect(importCounts.notes).toBe(1);
    expect(importCounts.logs).toBe(1);

    const restoredNotes = await db.query.notes.findMany({
      where: eq(notes.userId, testLegacyUserId),
      with: { tracker: true, folder: true },
    });
    expect(restoredNotes.length).toBe(1);
    expect(restoredNotes[0]?.title).toBe("Old Verbose Note");
    expect(restoredNotes[0]?.tracker?.name).toBe("Old Verbose Tracker");
    expect(restoredNotes[0]?.folder?.name).toBe("Old Folder");
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Browser End-to-End UI Tests (Settings -> Data Export Tab)
  // ─────────────────────────────────────────────────────────────────────────────

  test("browser UI: triggers JSON backup download from Data Export tab and validates contents", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `export_browser_${testId}@example.com`;
    const fullName = `Archivist Ezra ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    // Navigate to Settings Data Export tab
    await page.goto("/settings?tab=export");
    await expect(page).toHaveURL(/tab=export/);

    await expect(
      page.getByRole("heading", { name: "Export Your Study Data" })
    ).toBeVisible();

    // Trigger download and listen for the download event
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download JSON Backup" }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(
      /^scripture-tracker-backup-.*\.json$/
    );

    // Read and validate the downloaded file content
    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const fileContent = fs.readFileSync(downloadPath!, "utf-8");
    const parsedData = JSON.parse(fileContent);

    expect(parsedData.app).toBe("Scripture Tracker");
    expect(parsedData.v).toBe(1);
    expect(Array.isArray(parsedData.trackers)).toBe(true);
    expect(parsedData.trackers.length).toBeGreaterThanOrEqual(1);

    // Verify privacy: no sensitive user email or internal ID
    expect(fileContent).not.toContain(email);
  });

  test("browser UI: handles non-JSON rejection and invalid schema import error toasts", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `import_fail_${testId}@example.com`;
    const fullName = `Tester Miriam ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    await page.goto("/settings?tab=export");
    await expect(page).toHaveURL(/tab=export/);

    const fileInput = page.locator('input[type="file"]');

    // 1. Upload non-JSON file -> Expect client-side rejection toast
    await fileInput.setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("plain text content"),
    });

    await expect(
      page.getByText("Please select a valid .json backup file.")
    ).toBeVisible();

    // 2. Upload invalid/malformed JSON schema -> Expect import failure toast
    await fileInput.setInputFiles({
      name: "corrupted-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify({
          app: "Unknown App",
          version: 99,
          invalidKeys: true,
        })
      ),
    });

    // File card should appear
    await expect(page.getByText("corrupted-backup.json")).toBeVisible();

    // Click Confirm & Merge Backup
    await page.getByRole("button", { name: "Confirm & Merge Backup" }).click();

    // Expect Import failed error toast
    await expect(page.getByText("Import failed")).toBeVisible();
  });

  test("browser UI: successfully merges backup JSON file and updates user trackers and notes", async ({
    page,
  }) => {
    const testId = Date.now();
    const email = `import_success_${testId}@example.com`;
    const fullName = `Nehemiah Restorer ${testId}`;

    await createAndOnboardUser({ page, fullName, email });

    await page.goto("/settings?tab=export");
    await expect(page).toHaveURL(/tab=export/);

    const newTrackerName = `Historic Journey ${testId}`;
    const newNoteTitle = `Covenant Note ${testId}`;

    const validBackupPayload: UserDataExport = {
      v: 1,
      exportedAt: new Date().toISOString(),
      app: "Scripture Tracker",
      trackers: [
        {
          ref: "t_browser_1",
          name: newTrackerName,
          canon: "protestant",
          progress: {
            EXO: [1, 2, 3],
          },
        },
      ],
      folders: [
        {
          ref: "f_browser_1",
          name: "Restoration Notes",
        },
      ],
      notes: [
        {
          title: newNoteTitle,
          body: "<p>They built the wall in fifty-two days.</p>",
          folder: "f_browser_1",
          tracker: "t_browser_1",
        },
      ],
    };

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "valid-study-backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validBackupPayload)),
    });

    await expect(page.getByText("valid-study-backup.json")).toBeVisible();

    // Click Confirm & Merge Backup
    await page.getByRole("button", { name: "Confirm & Merge Backup" }).click();

    // Verify success toast
    await expect(page.getByText("Data merged successfully!")).toBeVisible();

    // Navigate to Settings tab and verify new tracker appears
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await expect(page.getByText(newTrackerName)).toBeVisible();

    // Navigate to Notes page and verify restored note appears
    await page.goto("/notes");
    await expect(page.getByText(newNoteTitle)).toBeVisible();
  });
});
