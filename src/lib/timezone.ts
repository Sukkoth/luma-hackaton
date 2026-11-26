export type GetLocalDateStringParams = {
  date?: Date | string | number;
  timeZone?: string;
};

const localDateFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getLocalDateFormatter({
  timeZone,
}: {
  timeZone: string;
}): Intl.DateTimeFormat {
  const key = timeZone || "UTC";
  const cached = localDateFormatterCache.get(key);
  if (cached) {
    return cached;
  }

  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: key,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    localDateFormatterCache.set(key, formatter);
    return formatter;
  } catch {
    const fallbackKey = "UTC";
    const fallbackCached = localDateFormatterCache.get(fallbackKey);
    if (fallbackCached) {
      return fallbackCached;
    }
    const fallback = new Intl.DateTimeFormat("en-CA", {
      timeZone: fallbackKey,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    localDateFormatterCache.set(fallbackKey, fallback);
    return fallback;
  }
}

export function getLocalDateString({
  date = new Date(),
  timeZone = "UTC",
}: GetLocalDateStringParams = {}): string {
  return getLocalDateFormatter({ timeZone }).format(new Date(date));
}

export type ShiftDateParams = {
  dateStr: string;
  daysOffset: number;
};

export function shiftDateString({
  dateStr,
  daysOffset,
}: ShiftDateParams): string {
  const parts = dateStr.split("-").map(Number);
  const year = parts[0] ?? 2026;
  const month = (parts[1] ?? 1) - 1;
  const day = parts[2] ?? 1;

  // Use UTC midday to avoid DST transition boundaries
  const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
  d.setUTCDate(d.getUTCDate() + daysOffset);

  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dayStr = String(d.getUTCDate()).padStart(2, "0");

  return `${y}-${m}-${dayStr}`;
}

export type DaysDifferenceParams = {
  startDateStr: string;
  endDateStr: string;
};

export function getDaysDifference({
  startDateStr,
  endDateStr,
}: DaysDifferenceParams): number {
  const startParts = startDateStr.split("-").map(Number);
  const endParts = endDateStr.split("-").map(Number);

  const startUtc = Date.UTC(
    startParts[0] ?? 2026,
    (startParts[1] ?? 1) - 1,
    startParts[2] ?? 1
  );
  const endUtc = Date.UTC(
    endParts[0] ?? 2026,
    (endParts[1] ?? 1) - 1,
    endParts[2] ?? 1
  );

  return Math.round((endUtc - startUtc) / (1000 * 60 * 60 * 24));
}

export type ParseLocalDateParams = {
  date: string | Date;
};

export function parseLocalDate({ date }: ParseLocalDateParams): Date {
  if (date instanceof Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  const dateOnly = date.split("T")[0] ?? "";
  const parts = dateOnly.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];
  if (
    typeof year === "number" &&
    !isNaN(year) &&
    typeof month === "number" &&
    !isNaN(month) &&
    typeof day === "number" &&
    !isNaN(day)
  ) {
    return new Date(year, month - 1, day);
  }
  return new Date(date);
}

export const COMMON_TIMEZONES = [
  "Africa/Addis_Ababa",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Africa/Nairobi",
  "America/Anchorage",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jerusalem",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "Pacific/Auckland",
  "Pacific/Honolulu",
  "UTC",
] as const;

export type GetTimezoneLabelParams = {
  timeZone: string;
};

export function getTimezoneLabel({ timeZone }: GetTimezoneLabelParams): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
    const cleanName = timeZone.replace(/_/g, " ");
    return offset ? `${cleanName} (${offset})` : cleanName;
  } catch {
    return timeZone;
  }
}

export type TimezoneOption = {
  value: string;
  label: string;
};

export type TimezoneGroup = {
  region: string;
  timezones: ReadonlyArray<TimezoneOption>;
};

const REGION_DISPLAY_NAMES: Record<string, string> = {
  Africa: "Africa",
  America: "Americas",
  Asia: "Asia",
  Atlantic: "Atlantic",
  Australia: "Australia & Pacific",
  Europe: "Europe",
  Indian: "Indian Ocean",
  Pacific: "Pacific",
};

export function getAllTimezoneGroups(): ReadonlyArray<TimezoneGroup> {
  const timezones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? Intl.supportedValuesOf("timeZone")
      : COMMON_TIMEZONES;

  const groupMap = new Map<string, TimezoneOption[]>();

  for (const tz of timezones) {
    const [region] = tz.split("/");
    if (!region) continue;
    const regionName =
      REGION_DISPLAY_NAMES[region] || (tz === "UTC" ? "Universal" : null);
    if (!regionName) continue;

    if (!groupMap.has(regionName)) {
      groupMap.set(regionName, []);
    }
    groupMap.get(regionName)!.push({
      value: tz,
      label: getTimezoneLabel({ timeZone: tz }),
    });
  }

  if (!groupMap.has("Universal")) {
    groupMap.set("Universal", [
      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
    ]);
  }

  return Array.from(groupMap.entries()).map(([region, tzList]) => ({
    region,
    timezones: tzList,
  }));
}
