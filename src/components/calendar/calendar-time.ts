import type { AvailabilityWindow, ScheduledVisit } from "@/types/trip-api";
import { timeLabel } from "@/utils/trip-calendar";

export const halfHours = Array.from({ length: 48 }, (_, i) => i * 30);
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
export const dayOf = (date: Date) => date.toISOString().slice(0, 10);
export const minuteOf = (date: Date) =>
  date.getUTCHours() * 60 + date.getUTCMinutes();
export const atMinute = (date: string, minute: number) =>
  new Date(Date.parse(date + "T00:00:00Z") + minute * 60_000);

export function calendarSlot(start: Date, end: Date) {
  const date = dayOf(start);
  const startMinute = minuteOf(start);
  const endMinute = startMinute + (end.getTime() - start.getTime()) / 60_000;
  return { date, startMinute, endMinute };
}

export const timeOptions = (end = false) =>
  halfHours.map((minute) => {
    const value = minute + (end ? 30 : 0);
    return { value, label: timeLabel(value) };
  });

export const visitDuration = (visit: ScheduledVisit) =>
  visit.endMinute - visit.startMinute;

/** Sorted open hours, with overlapping windows on the same day joined. */
export const mergeHours = (windows: AvailabilityWindow[]) => {
  const result: AvailabilityWindow[] = [];
  const sorted = [...windows].sort(
    (a, b) => a.day - b.day || a.startMinute - b.startMinute,
  );
  for (const next of sorted) {
    const last = result.at(-1);
    if (last && last.day === next.day && next.startMinute <= last.endMinute)
      last.endMinute = Math.max(last.endMinute, next.endMinute);
    else result.push({ ...next });
  }
  return result;
};
