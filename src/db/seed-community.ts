import { db } from "@/db";
import { generateRandomInviteCode } from "@/lib/tokens";
import {
  user,
  account,
  readingTrackers,
  trackerChapterProgress,
  groups,
  groupMembers,
  groupPlans,
  groupMemberEnrollments,
  planInstances,
  planInstanceReadings,
  notes,
} from "@/db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { ensurePlanTemplateInDb } from "@/actions/plans";
import { getReadingPlanById } from "@/data/readingPlans";

// Shared password hash for "Password123!" from Better-Auth credential provider
const PASSWORD_HASH =
  "4dd2ac5ee131eb3738ec554d46bb6921:8f097cc20a7dc2b32838025e3aab16062795291b4b87d5cf86a08b052bc8c4456fc4702630d427ef3e3e598ea5b1e7879e070d021af85c043b406af1c2c503d4";

type SeedUserData = {
  email: string;
  name: string;
  roleType: "owner" | "admin" | "member";
};

const SEED_USERS: ReadonlyArray<SeedUserData> = [
  // Owners (5)
  { email: "owner1@example.com", name: "Pastor John", roleType: "owner" },
  { email: "owner2@example.com", name: "Elder Thomas", roleType: "owner" },
  { email: "owner3@example.com", name: "Sarah Leader", roleType: "owner" },
  { email: "owner4@example.com", name: "David Shepherd", roleType: "owner" },
  { email: "owner5@example.com", name: "Ruth Director", roleType: "owner" },

  // Admins (5)
  { email: "admin1@example.com", name: "Michael Admin", roleType: "admin" },
  { email: "admin2@example.com", name: "Grace Facilitator", roleType: "admin" },
  {
    email: "admin3@example.com",
    name: "Joshua Coordinator",
    roleType: "admin",
  },
  { email: "admin4@example.com", name: "Hannah Organizer", roleType: "admin" },
  { email: "admin5@example.com", name: "Caleb Moderator", roleType: "admin" },

  // Members (25)
  { email: "member1@example.com", name: "Aaron Reader", roleType: "member" },
  { email: "member2@example.com", name: "Abigail Smith", roleType: "member" },
  { email: "member3@example.com", name: "Benjamin Cole", roleType: "member" },
  { email: "member4@example.com", name: "Chloe Davis", roleType: "member" },
  { email: "member5@example.com", name: "Daniel Evans", roleType: "member" },
  { email: "member6@example.com", name: "Esther Foster", roleType: "member" },
  { email: "member7@example.com", name: "Gideon Green", roleType: "member" },
  { email: "member8@example.com", name: "Hope Harris", roleType: "member" },
  { email: "member9@example.com", name: "Isaac Jones", roleType: "member" },
  { email: "member10@example.com", name: "Jonathan King", roleType: "member" },
  { email: "member11@example.com", name: "Keziah Lee", roleType: "member" },
  { email: "member12@example.com", name: "Luke Miller", roleType: "member" },
  { email: "member13@example.com", name: "Mary Nelson", roleType: "member" },
  { email: "member14@example.com", name: "Nathan Owens", roleType: "member" },
  {
    email: "member15@example.com",
    name: "Priscilla Price",
    roleType: "member",
  },
  { email: "member16@example.com", name: "Rachel Quinn", roleType: "member" },
  { email: "member17@example.com", name: "Samuel Reed", roleType: "member" },
  { email: "member18@example.com", name: "Tabitha Scott", roleType: "member" },
  { email: "member19@example.com", name: "Timothy Taylor", roleType: "member" },
  { email: "member20@example.com", name: "Uriah Vance", roleType: "member" },
  { email: "member21@example.com", name: "Victoria Ward", roleType: "member" },
  { email: "member22@example.com", name: "Zadok Young", roleType: "member" },
  { email: "member23@example.com", name: "Anna Baker", roleType: "member" },
  { email: "member24@example.com", name: "Eli Clark", roleType: "member" },
  { email: "member25@example.com", name: "Lydia Wright", roleType: "member" },
];

type SeedGroupDef = {
  name: string;
  description: string;
  isPrivate: boolean;
  requiresApproval: boolean;
  ownerEmail: string;
  adminEmails: ReadonlyArray<string>;
  activePlanTemplateId?: string;
  scheduledPlanTemplateId?: string;
};

const SEED_GROUPS: ReadonlyArray<SeedGroupDef> = [
  // 10 Public Groups
  {
    name: "Berean Scripture Seekers",
    description:
      "Acts 17:11 daily Scripture study examining the Word together with diligence and prayer.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner1@example.com",
    adminEmails: ["admin1@example.com", "admin2@example.com"],
    activePlanTemplateId: "hebrews_short_7",
  },
  {
    name: "Addis Youth Fellowship",
    description:
      "High school and college youth gathering weekly to read through the New Testament with shared pacing.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner1@example.com",
    adminEmails: ["admin3@example.com"],
    activePlanTemplateId: "pauline_epistles_30",
  },
  {
    name: "Gospel & Grace Cohort",
    description:
      "Walking step by step through the four Gospels to understand the life, sacrifice, and teachings of Jesus.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner2@example.com",
    adminEmails: ["admin1@example.com"],
    activePlanTemplateId: "the_four_gospels_30",
  },
  {
    name: "Early Morning Proverbs Walk",
    description:
      "31 days of biblical wisdom. One chapter of Proverbs every morning for personal and work guidance.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner2@example.com",
    adminEmails: ["admin4@example.com"],
    activePlanTemplateId: "proverbs_31",
  },
  {
    name: "Romans Theology Circle",
    description:
      "Exploring Paul's magnificent letter on justification by faith, grace, and Christian ethics.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner3@example.com",
    adminEmails: ["admin2@example.com"],
    activePlanTemplateId: "romans_grace_16",
  },
  {
    name: "New Testament Scholars",
    description:
      "Rigorous exegetical reading of the epistles and historical narratives of the early apostolic church.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner3@example.com",
    adminEmails: ["admin5@example.com"],
    activePlanTemplateId: "hebrews_short_7",
  },
  {
    name: "Psalms of Ascent Prayer Group",
    description:
      "Daily liturgical prayer and meditation on the songs and praises of ancient Israel.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner4@example.com",
    adminEmails: ["admin3@example.com"],
    activePlanTemplateId: "psalms_peace_14",
  },
  {
    name: "Young Adults Bible Study",
    description:
      "Community fellowship for young professionals seeking kingdom purpose in modern everyday life.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner4@example.com",
    adminEmails: ["admin4@example.com"],
    activePlanTemplateId: "pauline_epistles_30",
  },
  {
    name: "Genesis Foundations Community",
    description:
      "Tracing God's covenant from the dawn of creation to the patriarchs Abraham, Isaac, and Jacob.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner5@example.com",
    adminEmails: ["admin5@example.com"],
    activePlanTemplateId: "psalms_peace_14",
  },
  {
    name: "Faith & Deeds Discipleship",
    description:
      "Living out active faith through Scripture meditation, prayer, and mutual community support.",
    isPrivate: false,
    requiresApproval: false,
    ownerEmail: "owner5@example.com",
    adminEmails: ["admin1@example.com"],
    activePlanTemplateId: "pauline_epistles_30",
  },

  // 5 Private Groups
  {
    name: "Pastoral Leadership Council",
    description:
      "Confidential pastoral leadership reading circle for elder and minister spiritual formation.",
    isPrivate: true,
    requiresApproval: true,
    ownerEmail: "owner1@example.com",
    adminEmails: ["admin1@example.com"],
    activePlanTemplateId: "romans_grace_16",
  },
  {
    name: "Mekane Yesus Elders Circle",
    description:
      "Senior leaders and elders cohort dedicated to prayerful oversight and scriptural grounding.",
    isPrivate: true,
    requiresApproval: true,
    ownerEmail: "owner2@example.com",
    adminEmails: ["admin2@example.com"],
    activePlanTemplateId: "hebrews_short_7",
  },
  {
    name: "Home Fellowship Cell 4",
    description:
      "Weekly neighborhood house church meeting for dinner, worship, and Scripture discussion.",
    isPrivate: true,
    requiresApproval: false,
    ownerEmail: "owner3@example.com",
    adminEmails: ["admin3@example.com"],
    activePlanTemplateId: "the_four_gospels_30",
  },
  {
    name: "Mentorship & Accountability Band",
    description:
      "Close-knit brotherhood for honest spiritual accountability and daily Bible habits.",
    isPrivate: true,
    requiresApproval: true,
    ownerEmail: "owner4@example.com",
    adminEmails: ["admin4@example.com"],
    activePlanTemplateId: "proverbs_31",
  },
  {
    name: "Family Bible Reading Circle",
    description:
      "Multi-generational family reading group walking through biblical books together.",
    isPrivate: true,
    requiresApproval: false,
    ownerEmail: "owner5@example.com",
    adminEmails: ["admin5@example.com"],
    activePlanTemplateId: "hebrews_short_7",
  },
];

export async function seedCommunityData(): Promise<void> {
  console.log("==========================================");
  console.log("       SEEDING COMMUNITY & COHORT DATA    ");
  console.log("==========================================");

  // 1. Ensure all seed users exist with "Password123!"
  console.log("Creating/verifying 35 seed users...");
  const userMap = new Map<
    string,
    { id: string; name: string; email: string; trackerId: string }
  >();

  for (const u of SEED_USERS) {
    let existing = await db.query.user.findFirst({
      where: eq(user.email, u.email),
    });

    if (!existing) {
      const newUserId = crypto.randomUUID();
      await db.insert(user).values({
        id: newUserId,
        name: u.name,
        email: u.email,
      });

      // Insert Better Auth credentials account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: newUserId,
        providerId: "credential",
        userId: newUserId,
        password: PASSWORD_HASH,
      });

      existing = {
        id: newUserId,
        name: u.name,
        email: u.email,
        emailVerifiedAt: null,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Ensure reading tracker exists
    let tracker = await db.query.readingTrackers.findFirst({
      where: eq(readingTrackers.userId, existing.id),
    });

    if (!tracker) {
      const newTrackerId = crypto.randomUUID();
      await db.insert(readingTrackers).values({
        id: newTrackerId,
        userId: existing.id,
        name: "Personal Reading",
        canon: "protestant",
        icon: "book",
        description: "Primary reading tracker",
      });
      tracker = {
        id: newTrackerId,
        userId: existing.id,
        name: "Personal Reading",
        description: "Primary reading tracker",
        icon: "book",
        canon: "protestant",
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    userMap.set(u.email, {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      trackerId: tracker.id,
    });
  }

  // Also include demo user if exists
  const demoUser = await db.query.user.findFirst({
    where: eq(user.email, "demo@example.com"),
  });
  if (demoUser) {
    const demoTracker = await db.query.readingTrackers.findFirst({
      where: eq(readingTrackers.userId, demoUser.id),
    });
    if (demoTracker) {
      userMap.set("demo@example.com", {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        trackerId: demoTracker.id,
      });
    }
  }

  console.log(
    `Verified ${userMap.size} users with active credentials (Password123!).`
  );

  // 2. Ensure plan templates exist in database
  const requiredTemplates = [
    "hebrews_short_7",
    "pauline_epistles_30",
    "romans_grace_16",
    "proverbs_31",
    "the_four_gospels_30",
    "psalms_peace_14",
  ];
  for (const tid of requiredTemplates) {
    await ensurePlanTemplateInDb({ templateId: tid });
  }
  console.log("Verified required reading plan templates in DB.");

  // 3. Clean up previously seeded community groups to ensure clean state
  const ownerIds = Array.from(userMap.values())
    .filter((u) => u.email.startsWith("owner"))
    .map((u) => u.id);

  if (ownerIds.length > 0) {
    const existingSeedGroups = await db.query.groups.findMany({
      where: inArray(groups.ownerId, ownerIds),
      columns: { id: true },
    });
    const groupIds = existingSeedGroups.map((g) => g.id);
    if (groupIds.length > 0) {
      console.log(`Cleaning ${groupIds.length} existing seed groups...`);
      // Delete cascade handles groupMembers, groupPlans, enrollments
      await db.delete(groups).where(inArray(groups.id, groupIds));
    }
  }

  // 4. Create 10 Public Groups and 5 Private Groups
  console.log("Creating 15 groups with ~20 members each...");

  const memberEmails = SEED_USERS.filter((u) => u.roleType === "member").map(
    (u) => u.email
  );

  for (let gIdx = 0; gIdx < SEED_GROUPS.length; gIdx++) {
    const gDef = SEED_GROUPS[gIdx]!;
    const owner = userMap.get(gDef.ownerEmail)!;
    const groupId = crypto.randomUUID();
    const inviteCode = generateRandomInviteCode({ length: 10 });

    await db.insert(groups).values({
      id: groupId,
      name: gDef.name,
      description: gDef.description,
      ownerId: owner.id,
      inviteCode,
      isPrivate: gDef.isPrivate,
      requiresApproval: gDef.requiresApproval,
    });

    // Add Owner
    await db.insert(groupMembers).values({
      groupId,
      userId: owner.id,
      role: "owner",
      status: "active",
      hideProgress: false,
    });

    // Add Admins
    for (const aEmail of gDef.adminEmails) {
      const admin = userMap.get(aEmail);
      if (admin && admin.id !== owner.id) {
        await db.insert(groupMembers).values({
          groupId,
          userId: admin.id,
          role: "admin",
          status: "active",
          hideProgress: false,
        });
      }
    }

    // Pick 17-18 members deterministically rotated from member pool
    const selectedMemberEmails: string[] = [];
    const startIndex = (gIdx * 7) % memberEmails.length;
    for (let i = 0; i < 18; i++) {
      const mEmail = memberEmails[(startIndex + i) % memberEmails.length]!;
      if (!selectedMemberEmails.includes(mEmail)) {
        selectedMemberEmails.push(mEmail);
      }
    }

    // Also include demo user in every other group
    if (gIdx % 2 === 0 && userMap.has("demo@example.com")) {
      selectedMemberEmails.push("demo@example.com");
    }

    for (const mEmail of selectedMemberEmails) {
      const memberUser = userMap.get(mEmail);
      if (!memberUser || memberUser.id === owner.id) continue;

      await db.insert(groupMembers).values({
        groupId,
        userId: memberUser.id,
        role: "member",
        status: "active",
        hideProgress: false,
      });
    }

    // Add 1-2 pending approval members in groups that require approval
    if (gDef.requiresApproval) {
      const pendingCandidates = [
        "member23@example.com",
        "member24@example.com",
      ];
      for (const pEmail of pendingCandidates) {
        const pUser = userMap.get(pEmail);
        if (pUser && !selectedMemberEmails.includes(pEmail)) {
          await db
            .insert(groupMembers)
            .values({
              groupId,
              userId: pUser.id,
              role: "member",
              status: "pending_approval",
              hideProgress: false,
            })
            .onConflictDoNothing();
        }
      }
    }

    // 5. If group has an active plan, schedule and enroll members with realistic reading progress
    if (gDef.activePlanTemplateId) {
      const template = getReadingPlanById(gDef.activePlanTemplateId);
      if (template) {
        const groupPlanId = crypto.randomUUID();
        const startDate = new Date(Date.now() - 7 * 86400000); // started 7 days ago

        await db.insert(groupPlans).values({
          id: groupPlanId,
          groupId,
          planTemplateId: template.id,
          scheduledStartDate: startDate,
          status: "active",
          lateJoinPolicy: "skip_ahead",
          dailyChapterTarget: template.defaultDailyTarget,
          activeWeekdaysMask: "1111111",
          createdBy: owner.id,
          activatedAt: startDate,
        });

        // Get all active members for this group to enroll them
        const allGroupMembers = await db.query.groupMembers.findMany({
          where: eq(groupMembers.groupId, groupId),
          columns: { userId: true },
        });

        const readings = template.readings;
        const totalCh = template.totalChapters;

        for (let mIdx = 0; mIdx < allGroupMembers.length; mIdx++) {
          const gm = allGroupMembers[mIdx]!;
          const uData = Array.from(userMap.values()).find(
            (u) => u.id === gm.userId
          );
          if (!uData) continue;

          // Determine realistic completion percentage based on member index
          // mIdx 0: 100% finished
          // mIdx 1-3: ~75% finished
          // mIdx 4-8: ~50% finished
          // mIdx 9-14: ~25% finished
          // rest: 0% finished
          let percent = 0;
          if (mIdx === 0) percent = 1.0;
          else if (mIdx <= 3) percent = 0.75;
          else if (mIdx <= 8) percent = 0.5;
          else if (mIdx <= 14) percent = 0.25;
          else percent = 0;

          const chaptersToComplete = Math.min(
            totalCh,
            Math.round(totalCh * percent)
          );

          const instanceId = crypto.randomUUID();
          await db.insert(planInstances).values({
            id: instanceId,
            userId: gm.userId,
            trackerId: uData.trackerId,
            templateId: template.id,
            title: template.title,
            status: percent >= 1.0 ? "completed" : "active",
            mode: "scheduled",
            paceType: "by_daily_target",
            startDate,
            dailyTarget: template.defaultDailyTarget,
            totalChapters: totalCh,
            activeDaysMask: "1111111",
            groupPlanId,
          });

          await db.insert(groupMemberEnrollments).values({
            groupPlanId,
            userId: gm.userId,
            planInstanceId: instanceId,
            enrolledAt: startDate,
          });

          // Insert completed chapters
          for (let c = 0; c < chaptersToComplete; c++) {
            const rItem = readings[c];
            if (!rItem) continue;

            // Reading item completion
            await db
              .insert(planInstanceReadings)
              .values({
                instanceId,
                readingItemId: rItem.id,
                completedAt: new Date(
                  Date.now() - (chaptersToComplete - c) * 3600000
                ),
              })
              .onConflictDoNothing();

            // Tracker progress
            await db
              .insert(trackerChapterProgress)
              .values({
                trackerId: uData.trackerId,
                bookId: rItem.bookId,
                chapter: rItem.chapter,
                completedAt: new Date(
                  Date.now() - (chaptersToComplete - c) * 3600000
                ),
              })
              .onConflictDoNothing();
          }

          // Add a community note for a few members
          if (mIdx === 1 || mIdx === 3) {
            await db.insert(notes).values({
              userId: gm.userId,
              trackerId: uData.trackerId,
              planInstanceId: instanceId,
              planSessionId: 1,
              planDayNumber: 1,
              title: `Reflections on ${template.title} Chapter 1`,
              bodyHtml: `<p>Such rich truth found in this opening chapter. Really encouraged reading this together with our fellowship.</p>`,
              plainTextSnippet: `Such rich truth found in this opening chapter. Really encouraged reading this together with our fellowship.`,
              isSharedWithCommunity: true,
            });
          }
        }
      }
    }
  }

  // 5. Enrich any existing demo user groups (e.g. Koye Mekane Yesus) with active cohort members & plan enrollments
  const currentDemoUser = userMap.get("demo@example.com");
  if (currentDemoUser) {
    const demoGroups = await db.query.groups.findMany({
      where: eq(groups.ownerId, currentDemoUser.id),
      with: {
        plans: {
          where: eq(groupPlans.status, "active"),
        },
      },
    });

    for (const dGroup of demoGroups) {
      console.log(
        `Enriching existing user group "${dGroup.name}" with community members...`
      );
      // Add admin1
      const admin1 = userMap.get("admin1@example.com");
      if (admin1) {
        await db
          .insert(groupMembers)
          .values({
            groupId: dGroup.id,
            userId: admin1.id,
            role: "admin",
            status: "active",
            joinedAt: new Date(Date.now() - 5 * 86400000),
          })
          .onConflictDoNothing();
      }

      // Add members 1..19
      const cohortMembers: SeedUserData[] = [];
      for (let i = 1; i <= 19; i++) {
        const u = userMap.get(`member${i}@example.com`);
        if (u) {
          const found = SEED_USERS.find((su) => su.email === u.email);
          if (found) {
            cohortMembers.push(found);
          }
          await db
            .insert(groupMembers)
            .values({
              groupId: dGroup.id,
              userId: u.id,
              role: "member",
              status: "active",
              joinedAt: new Date(Date.now() - (20 - i) * 86400000),
            })
            .onConflictDoNothing();
        }
      }

      // If group has an active plan, enroll members with realistic staggered progress
      const activePlan = dGroup.plans[0];
      if (activePlan) {
        const template = getReadingPlanById(activePlan.planTemplateId);
        if (template) {
          const totalCh = template.totalChapters;
          const readings = template.readings;
          const startDate = activePlan.scheduledStartDate;

          for (let mIdx = 0; mIdx < cohortMembers.length; mIdx++) {
            const cm = cohortMembers[mIdx]!;
            const uData = userMap.get(cm.email);
            if (!uData) continue;

            // Check if already enrolled
            const existingEnrollment =
              await db.query.groupMemberEnrollments.findFirst({
                where: and(
                  eq(groupMemberEnrollments.groupPlanId, activePlan.id),
                  eq(groupMemberEnrollments.userId, uData.id)
                ),
              });
            if (existingEnrollment) continue;

            let percent = 0;
            if (mIdx === 0) percent = 1.0;
            else if (mIdx <= 3) percent = 0.75;
            else if (mIdx <= 8) percent = 0.5;
            else if (mIdx <= 14) percent = 0.25;
            else percent = 0.1;

            const chaptersToComplete = Math.min(
              totalCh,
              Math.max(1, Math.round(totalCh * percent))
            );

            const instanceId = crypto.randomUUID();
            await db.insert(planInstances).values({
              id: instanceId,
              userId: uData.id,
              trackerId: uData.trackerId,
              templateId: template.id,
              title: template.title,
              status: percent >= 1.0 ? "completed" : "active",
              mode: "scheduled",
              paceType: "by_daily_target",
              startDate,
              dailyTarget: activePlan.dailyChapterTarget,
              totalChapters: totalCh,
              activeDaysMask: "1111111",
              groupPlanId: activePlan.id,
            });

            await db.insert(groupMemberEnrollments).values({
              groupPlanId: activePlan.id,
              userId: uData.id,
              planInstanceId: instanceId,
              enrolledAt: startDate,
            });

            for (let c = 0; c < chaptersToComplete; c++) {
              const rItem = readings[c];
              if (!rItem) continue;

              await db
                .insert(planInstanceReadings)
                .values({
                  instanceId,
                  readingItemId: rItem.id,
                  completedAt: new Date(
                    Date.now() - (chaptersToComplete - c) * 3600000
                  ),
                })
                .onConflictDoNothing();

              await db
                .insert(trackerChapterProgress)
                .values({
                  trackerId: uData.trackerId,
                  bookId: rItem.bookId,
                  chapter: rItem.chapter,
                  completedAt: new Date(
                    Date.now() - (chaptersToComplete - c) * 3600000
                  ),
                })
                .onConflictDoNothing();
            }
          }
        }
      }
    }
  }

  console.log("==========================================");
  console.log("   COMMUNITY SEEDING COMPLETED SUCCESS    ");
  console.log("==========================================");
  console.log("You can log in as any of the following users:");
  console.log("Password for all users: Password123!");
  console.log("Owners:  owner1@example.com  through  owner5@example.com");
  console.log("Admins:  admin1@example.com  through  admin5@example.com");
  console.log("Members: member1@example.com through  member25@example.com");
  console.log("Demo:    demo@example.com");
  console.log("==========================================");
}

// Run directly when invoked via CLI
seedCommunityData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
