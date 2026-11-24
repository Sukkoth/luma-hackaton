/**
 * Time formatting and 30-minute interval utilities for notifications
 */

export function is12HourFormat(): boolean {
  if (typeof Intl === "undefined" || !Intl.DateTimeFormat) {
    return true;
  }
  try {
    const options = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
    }).resolvedOptions();
    if (options.hour12 !== undefined) {
      return Boolean(options.hour12);
    }
    if (options.hourCycle) {
      return options.hourCycle === "h11" || options.hourCycle === "h12";
    }
    // Fallback: format a sample PM hour and check for AM/PM
    const formatted = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
    }).format(new Date(2026, 0, 1, 16, 0));
    return /AM|PM|am|pm/i.test(formatted);
  } catch {
    return true;
  }
}

export type FormatTimeParams = {
  time24: string; // "HH:MM" e.g. "08:30" or "20:00"
  use12Hour?: boolean;
};

export function formatTimeForDisplay({
  time24,
  use12Hour,
}: FormatTimeParams): string {
  const [hourStr, minStr] = time24.split(":");
  const hour = parseInt(hourStr || "0", 10);
  const min = parseInt(minStr || "0", 10);
  const padMin = String(min).padStart(2, "0");

  const prefers12 = use12Hour !== undefined ? use12Hour : is12HourFormat();

  if (!prefers12) {
    return `${String(hour).padStart(2, "0")}:${padMin}`;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${padMin} ${period}`;
}

export type ThirtyMinuteSlot = {
  value: string; // "HH:MM" 24-hour storage format
  label: string; // Localized display format (e.g. "8:30 AM" or "08:30")
};

export function getThirtyMinuteSlots({
  use12Hour,
}: { use12Hour?: boolean } = {}): ReadonlyArray<ThirtyMinuteSlot> {
  const slots: ThirtyMinuteSlot[] = [];
  const prefers12 = use12Hour !== undefined ? use12Hour : is12HourFormat();

  for (let hour = 0; hour < 24; hour++) {
    for (const min of [0, 30]) {
      const value = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
      const label = formatTimeForDisplay({
        time24: value,
        use12Hour: prefers12,
      });
      slots.push({ value, label });
    }
  }

  return slots;
}

export type SnapTimeParams = {
  timeString: string;
};

/**
 * Snaps any arbitrary time string "HH:MM" to the nearest 30-minute interval
 */
export function snapToNearestThirtyMinutes({
  timeString,
}: SnapTimeParams): string {
  const [hStr, mStr] = timeString.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);

  let snappedMin = 0;
  let snappedHour = h;

  if (m < 15) {
    snappedMin = 0;
  } else if (m < 45) {
    snappedMin = 30;
  } else {
    snappedMin = 0;
    snappedHour = (h + 1) % 24;
  }

  return `${String(snappedHour).padStart(2, "0")}:${String(snappedMin).padStart(2, "0")}`;
}
