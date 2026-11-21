# Request for Architectural Review: Streak Engine & Anti-Timezone Tampering

## 1. Context & Objective

We are building a Bible reading and habit-tracking application on **Next.js 16 (App Router)**, **PostgreSQL (via Drizzle ORM)**, and **Bun**, deployed to **Vercel**.

We need an architectural review of our current habit streak system, specifically to eliminate a **"Timezone Hopping / Time-Travel Exploit"** where users change their timezone to resurrect broken streaks.

---

## 2. Current Architecture

### A. Database Schema (`src/db/schema.ts`)

#### 1. `reading_logs`

Every time a user finishes a chapter, a row is inserted:

```ts
export const readingLogs = pgTable("reading_logs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  trackerId: text("tracker_id").notNull(),
  bookId: text("book_id").notNull(),
  bookName: text("book_name").notNull(),
  chapter: integer("chapter").notNull(),
  loggedAt: timestamp("logged_at", { withTimezone: true })
    .defaultNow()
    .notNull(), // UTC instant
});
```

#### 2. `user_settings`

Tracks the user's active streak status, freeze shields, and preferred timezone:

```ts
export const userSettings = pgTable("user_settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastReadDate: text("last_read_date"), // e.g. "2026-11-20"
  timezone: varchar("timezone", { length: 100 }).default("UTC").notNull(),
  streakFreezesAvailable: integer("streak_freezes_available")
    .default(0)
    .notNull(),
  frozenDatesJson: text("frozen_dates_json"), // JSON array of string dates e.g. ["2026-11-19"]
  freezeRestorationDaysCount: integer("freeze_restoration_days_count")
    .default(0)
    .notNull(),
});
```

---

### B. Current Streak Calculation Engine

In `src/lib/streak-service.ts`, streaks are synchronized as follows:

1. Fetch all `loggedAt` UTC timestamps for the user from `reading_logs`.
2. Map each UTC `loggedAt` timestamp to a local calendar date string (`YYYY-MM-DD`) using the user's saved timezone:
   ```ts
   const readingDates = new Set<string>();
   for (const log of logs) {
     const localDate = getLocalDateString({
       date: log.loggedAt,
       timeZone: userSettings.timezone,
     });
     readingDates.add(localDate);
   }
   ```
3. Pass `readingDates`, `todayStr = getLocalDateString({ timeZone })`, and `existingFrozenDates` into `evaluateUserStreak` (`src/lib/streak.ts`).
4. `evaluateUserStreak` iterates chronologically from the earliest reading date to `todayStr`.
   - If consecutive days have entries $\rightarrow$ `currentStreak++`.
   - If a gap is detected and streak $\ge 7$ with available freezes $\rightarrow$ auto-consumes a freeze shield (`frozenDates.push(date)`).
   - If a gap is detected with 0 freezes available $\rightarrow$ `currentStreak` resets to `0`.
   - "Today" has a grace period until midnight local time.
5. The updated `currentStreak`, `longestStreak`, and `streakFreezesAvailable` are written back to `user_settings`.

---

## 3. The Vulnerability: Timezone Hopping Exploit

Suppose a user is in **Ethiopia (UTC+03:00)**:

1. **Friday, Nov 20:** User fails to read any chapter. All streak freezes are exhausted.
2. **Saturday, Nov 21 at 01:30 AM (UTC+3):** User opens the app.
   - The server computes `todayStr = "2026-11-21"`.
   - It checks Friday (`2026-11-20`): no reading log found, no freezes left.
   - `currentStreak` drops to `0`. The streak is officially broken.
3. **The Exploit:**
   - User goes to Settings and switches their timezone to **Honolulu (UTC-10:00)** or **Los Angeles (UTC-08:00)**, where it is still Friday afternoon/evening.
   - User reads a chapter right now (at 01:35 AM UTC+3 / 22:35 UTC).
   - A new `reading_logs` row is created with `loggedAt = 2026-11-20 22:35:00Z`.
   - `syncUserStreak` re-runs with the new timezone `Pacific/Honolulu`.
   - `2026-11-20 22:35:00Z` in Honolulu is `2026-11-20 12:35:00` (Friday noon).
   - `localDate` resolves to `"2026-11-20"`.
   - The engine sees Friday Nov 20 now has a reading, and today in Honolulu is still Nov 20.
   - **Result:** The broken streak is resurrected, completely bypassing the cutoff.

---

## 4. Our Proposed Solutions & Tradeoffs

We are considering a combination of the following mechanisms:

### Approach A: The "Monotonic Witnessed Date" Invariant

- Add a column `lastWitnessedDate: text` to `user_settings`.
- Whenever `syncUserStreak` runs, `lastWitnessedDate = max(lastWitnessedDate, todayStr)`.
- If an account was in UTC+3 and witnessed `2026-11-21`, switching timezone to UTC-10 (where it is `2026-11-20`) is blocked from backfilling:
  - Any new reading must satisfy: `readingLocalDate >= lastWitnessedDate`.
  - Alternatively: If a user changes their timezone, `timezoneChangedAt` is recorded, and readings after that point can never count toward any calendar date prior to the change timestamp.

### Approach B: Timezone Rate-Limiting & Forward-Only Transition

- Restrict timezone changes in `user_settings` to once every 72 hours.
- When changing timezones, the new timezone only takes effect starting from `now()`. Past dates are locked and evaluated using a snapshot or an immutable daily check-in ledger (`daily_checkins` table).

### Approach C: Server-Derived IP Timezone

- Use Vercel's edge header `x-vercel-ip-timezone` on the server instead of trusting purely client-submitted timezones.
- _Downside:_ Doesn't protect against VPN usage.

### Approach D: Physical UTC Elapsed Time Invariant

- Calculate streak eligibility based on real elapsed hours between readings:
  $$\Delta t = \text{now}() - \text{last\_streak\_read\_at}$$
- A streak day can only be earned if $16\text{ hours} \le \Delta t \le 36\text{ hours}$ (or similar rolling window), regardless of what timezone is chosen.

---

## 5. Questions for Claude Code

1. **Which pattern is considered best practice in production habit/fitness apps (e.g. Duolingo, Strava, GitHub)?**
2. **How should we handle legitimate travelers?** (e.g. a user who genuinely flies from Tokyo to New York and gains 14 hours, or flies from New York to Tokyo and loses a calendar day)?
3. **Sparse Ledger vs. Lazy Evaluation:**
   Currently, we calculate streaks dynamically by scanning `reading_logs` on demand. Is storing an explicit `daily_checkin` record (`{ userId, date, status: 'completed' | 'frozen' | 'missed' }`) better than dynamic re-parsing?
4. **Edge Cases:** What subtle edge cases (DST transitions, Leap Years, International Date Line crossing) should we be careful not to introduce?
