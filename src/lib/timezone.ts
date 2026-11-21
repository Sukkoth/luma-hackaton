export type GetLocalDateStringParams = {
  date?: Date | string | number;
  timeZone?: string;
};

export function getLocalDateString({
  date = new Date(),
  timeZone = "UTC",
}: GetLocalDateStringParams = {}): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(date));
  }
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
