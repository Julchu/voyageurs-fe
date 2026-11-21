import type { TimeSlot } from "@/types/trip-api";

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
// neutral clock so a change in the browser's time zone cannot shift a slot.
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

/** When a time slot is: its trip day, start and end minute. */
export type SlotTime = Pick<TimeSlot, "date" | "startMinute" | "endMinute">;

export const slotAt = (start: Date, length: number): SlotTime => {
  const startMinute = minuteOf(start);
  return { date: dayOf(start), startMinute, endMinute: startMinute + length };
};
export const slotBetween = (start: Date, end: Date) =>
  slotAt(start, (end.getTime() - start.getTime()) / 60_000);

export const slotDuration = (slot: TimeSlot) =>
  slot.endMinute - slot.startMinute;
