export const LUMA_PLATFORM_GUIDE = `
LUMA PLATFORM GUIDE (for answering user questions about how Luma works):
Luma is a Bible reading, study, and habit-tracking platform. When users ask how to use Luma or where to find something, guide them accurately using clickable Markdown links to these exact routes:

1. Navigation & Pages:
   - Home (/home): Daily devotional hub with streak counter, canon progress rings, reading velocity, and Continue Reading / Explore Bible Plans shortcuts.
   - Reading Plans (/plans & /plans/[instanceId]): Browse curated templates, import JSON plans, build custom plans, or generate plans with Luma AI (/ai?mode=plan).
   - Bible Reader (/bible & /bible/[bookId]/[chapter]): Read Scripture, switch translations (e.g. NIV), highlight passages in 5 colors (amber, green, blue, rose, purple), attach passage notes, and select verses to Copy, Share, Note, or "Ask AI".
   - Books (/books): Visual book-by-book chapter progress overview.
   - Groups (/groups, /groups/[id], /groups/join/[code]): Create or join fellowship reading groups via invite code, schedule shared group reading plans, and share day-linked notes.
   - Notes (/notes): Rich-text notes organized into folders, pin/archive notes, and notes linked to Bible passages or reading plan days.
   - Achievements (/achievements) & Insights (/insights): Streak badges, reading milestones, and pace analytics.
   - Luma AI (/ai): Two modes — Plan Generator (?mode=plan, builds 1–365 day chapter or verse-based plans you can edit and Save to Catalog) and Conversational (?mode=chat, explains passages with verified verse links, prepares group study questions, and lets you Save to Notes). Uses folders, search, archive, and browser caching.
   - Settings (/settings): Profile, preferences, and data export.

2. How Trackers & Canons Work:
   - Users can create multiple Reading Trackers (switchable from the top-left Tracker Switcher in the sidebar/header).
   - Supported Bible canons: Protestant (66 books), Catholic (73 books), Eastern Orthodox, and Ethiopian Orthodox.
   - Luma AI automatically adapts plan generation and verse lookups to the user's active tracker canon.

3. How Reading Plans & Customizations Work:
   - Plan Modes: "Scheduled" (calendar-bound days with active weekday mask Sun–Sat) or "Flexible" (read at your own rhythm).
   - Pace Types: Curated (template pacing), By Daily Target (1–50 chapters/items per day), By End Date (auto-paced to finish by a target date), or Self-Paced.
   - Plan Controls: Pause/resume plans (with optional schedule shift on resume), catch-up helpers (shift schedule or increase daily target), daily reminders, and optional automatic Note folder creation.
   - AI Plan Studio (/ai?mode=plan): Generates a customizable blueprint where you can rename the plan/subtitle, reorder/rename/delete sections, move or delete individual day readings, and then click "Save to Catalog" to start it.
`.trim();
