/**
 * Plan PDF Export Utility
 * Generates an ink-friendly, high-density, multi-column A4 printable checklist
 * with chapter-level check boxes for any reading plan.
 */

export type ExportSessionItem = {
  bookName: string;
  chapter: number;
  versesLabel?: string;
  displayText?: string;
};

export type ExportPlanSession = {
  sessionNumber: number;
  dateText?: string;
  items: ReadonlyArray<ExportSessionItem>;
};

export type BuildSessionsParams = {
  readings: ReadonlyArray<{
    bookName?: string;
    bookId?: string;
    chapter: number;
    versesLabel?: string;
    displayText?: string;
    dayNumber?: number;
  }>;
  dailyTarget?: number;
  startDate?: Date;
  activeDays?: ReadonlyArray<number>; // 0=Sun, 1=Mon, ..., 6=Sat
};

/**
 * Groups raw readings into structured daily/session buckets with optional dates.
 */
export function buildPlanSessions({
  readings,
  dailyTarget = 1,
  startDate,
  activeDays = [0, 1, 2, 3, 4, 5, 6],
}: BuildSessionsParams): ReadonlyArray<ExportPlanSession> {
  if (!readings || readings.length === 0) return [];

  const targetPace = Math.max(1, dailyTarget);
  const safeActiveDays =
    activeDays.length > 0 ? activeDays : [0, 1, 2, 3, 4, 5, 6];

  // Check if readings already carry distinct day numbers
  const hasDayNumbers = readings.some(
    (r) => typeof r.dayNumber === "number" && r.dayNumber > 0
  );

  const rawGroups: Map<number, ExportSessionItem[]> = new Map();

  if (hasDayNumbers) {
    for (const r of readings) {
      const day = r.dayNumber && r.dayNumber > 0 ? r.dayNumber : 1;
      const group = rawGroups.get(day) ?? [];
      group.push({
        bookName: r.bookName || r.bookId || "Scripture",
        chapter: r.chapter,
        versesLabel: r.versesLabel,
        displayText:
          r.displayText ||
          `${r.bookName || r.bookId} ${r.chapter}${r.versesLabel ? ` (${r.versesLabel})` : ""}`,
      });
      rawGroups.set(day, group);
    }
  } else {
    let currentSession = 1;
    for (let i = 0; i < readings.length; i += targetPace) {
      const chunk = readings.slice(i, i + targetPace);
      const items: ExportSessionItem[] = chunk.map((r) => ({
        bookName: r.bookName || r.bookId || "Scripture",
        chapter: r.chapter,
        versesLabel: r.versesLabel,
        displayText:
          r.displayText ||
          `${r.bookName || r.bookId} ${r.chapter}${r.versesLabel ? ` (${r.versesLabel})` : ""}`,
      }));
      rawGroups.set(currentSession++, items);
    }
  }

  // Sort sessions by number
  const sortedDayKeys = Array.from(rawGroups.keys()).sort((a, b) => a - b);

  // Calculate schedule dates if start date is provided
  let cursorDate: Date | null = null;
  if (startDate && !Number.isNaN(startDate.getTime())) {
    cursorDate = new Date(startDate.getTime());
    cursorDate.setHours(0, 0, 0, 0);
    while (!safeActiveDays.includes(cursorDate.getDay())) {
      cursorDate.setDate(cursorDate.getDate() + 1);
    }
  }

  const result: ExportPlanSession[] = [];

  for (let idx = 0; idx < sortedDayKeys.length; idx++) {
    const dayNum = sortedDayKeys[idx]!;
    const items = rawGroups.get(dayNum) ?? [];

    let dateText: string | undefined;
    if (cursorDate) {
      if (idx > 0) {
        cursorDate.setDate(cursorDate.getDate() + 1);
        while (!safeActiveDays.includes(cursorDate.getDay())) {
          cursorDate.setDate(cursorDate.getDate() + 1);
        }
      }
      dateText = cursorDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    result.push({
      sessionNumber: dayNum,
      dateText,
      items,
    });
  }

  return result;
}

export type ExportPlanToPdfParams = {
  planTitle: string;
  subtitle?: string;
  category?: string;
  canonCompatibility?: string | null;
  totalChapters: number;
  dailyTarget?: number;
  sessions: ReadonlyArray<ExportPlanSession>;
};

/**
 * Generates an isolated A4 printable document and opens the browser's print / save-to-PDF dialog.
 * Keeps the parent window and modals completely interactive and uninterrupted.
 */
export function exportPlanToPdf({
  planTitle,
  subtitle,
  category,
  canonCompatibility,
  totalChapters,
  dailyTarget,
  sessions,
}: ExportPlanToPdfParams): void {
  if (typeof window === "undefined") return;

  const totalSessions = sessions.length;
  const safeDailyTarget =
    dailyTarget || Math.ceil(totalChapters / Math.max(1, totalSessions));

  // Build sessions HTML
  const sessionsHtml = sessions
    .map((s) => {
      const itemsHtml = s.items
        .map(
          (item) => `
        <div class="item-row">
          <span class="checkbox" aria-hidden="true"></span>
          <span class="item-name">${item.displayText || `${item.bookName} ${item.chapter}`}</span>
        </div>
      `
        )
        .join("");

      return `
        <div class="session-card">
          <div class="session-header">
            <span class="session-title">Day ${s.sessionNumber}</span>
            ${s.dateText ? `<span class="session-date">${s.dateText}</span>` : ""}
          </div>
          <div class="items-list">
            ${itemsHtml}
          </div>
        </div>
      `;
    })
    .join("");

  const canonText =
    canonCompatibility && canonCompatibility !== "protestant"
      ? ` • ${canonCompatibility.replace(/_/g, " ").toUpperCase()}`
      : "";

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${planTitle} — Reading Checklist</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 10mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10px;
      line-height: 1.3;
    }
    .container {
      width: 100%;
      max-width: 100%;
      padding-right: 1mm;
    }
    .header {
      border-bottom: 2px solid #000000;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 2px;
    }
    .plan-title {
      font-size: 16px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin: 0;
      color: #000000;
    }
    .plan-meta {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #222222;
    }
    .stats-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 9.5px;
      font-weight: 600;
      color: #333333;
      margin-top: 2px;
    }
    .stats-bar span {
      display: inline-flex;
      align-items: center;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 3.5px;
      width: 100%;
    }
    .session-card {
      break-inside: avoid;
      page-break-inside: avoid;
      border: 1px solid #000000;
      border-radius: 3px;
      padding: 3px 4px;
      background: #ffffff;
    }
    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px dotted #888888;
      padding-bottom: 1.5px;
      margin-bottom: 2px;
    }
    .session-title {
      font-size: 8.5px;
      font-weight: 800;
      color: #000000;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .session-date {
      font-size: 7.5px;
      font-weight: 600;
      color: #444444;
    }
    .items-list {
      display: flex;
      flex-direction: column;
      gap: 1.5px;
    }
    .item-row {
      display: flex;
      align-items: center;
      gap: 3px;
      font-size: 8.5px;
      font-weight: 600;
      color: #000000;
    }
    .checkbox {
      width: 9px;
      height: 9px;
      border: 1.1px solid #000000;
      border-radius: 2px;
      display: inline-block;
      flex-shrink: 0;
      background: #ffffff;
    }
    .item-name {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <h1 class="plan-title">${planTitle}</h1>
        <span class="plan-meta">${category || "Reading Blueprint"}${canonText}</span>
      </div>
      <div class="stats-bar">
        <span>Total Chapters: <strong>${totalChapters}</strong></span>
        <span>•</span>
        <span>Total Sessions: <strong>${totalSessions} Days</strong></span>
        <span>•</span>
        <span>Target: <strong>~${safeDailyTarget} ch/day</strong></span>
        ${subtitle ? `<span>•</span><span>${subtitle}</span>` : ""}
      </div>
    </div>

    <div class="grid">
      ${sessionsHtml}
    </div>
  </div>
</body>
</html>`;

  // Create isolated invisible iframe to trigger the native browser print / save-to-PDF flow
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-9999px";
  iframe.style.left = "-9999px";
  iframe.style.width = "0px";
  iframe.style.height = "0px";
  iframe.style.border = "none";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // Focus and trigger print after styles are fully parsed
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback: window print
      window.print();
    } finally {
      // Remove iframe from DOM after user interacts with print dialog
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 250);
}
