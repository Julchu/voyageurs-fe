import type { ScheduledVisit } from "@/types/trip-api";

export const DAY = 1440;
export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// The planner stores wall-clock times, not instants. Use UTC consistently as a
// neutral clock so a change in the browser's time zone cannot shift a visit.
export const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);
export const atMinute = (date: string, minute: number) =>
  new Date(parseDate(date).getTime() + minute * 60_000);
export const dayOf = (date: Date) => date.toISOString().slice(0, 10);
export const minuteOf = (date: Date) =>
  date.getUTCHours() * 60 + date.getUTCMinutes();

export const dateLabel = (date: string, withYear = true) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  }).format(parseDate(date));

/** Where a visit would go: a trip day, a start minute and a length in minutes. */
export type Slot = { date: string; startMinute: number; length: number };

export const slotAt = (start: Date, length: number): Slot => ({
  date: dayOf(start),
  startMinute: minuteOf(start),
  length,
});
export const slotBetween = (start: Date, end: Date) =>
  slotAt(start, (end.getTime() - start.getTime()) / 60_000);

export const visitDuration = (visit: ScheduledVisit) =>
  visit.endMinute - visit.startMinute;
