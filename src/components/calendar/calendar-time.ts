import type { TimeSlot } from "@/types/trip-api";
import { dayOf } from "@/utils/trip-time";

// FullCalendar adapters: its Date instants carry the planner's UTC wall-clock times.

/** When a time slot is: its trip day, start and end minute. */
export type SlotTime = Pick<TimeSlot, "date" | "startMinute" | "endMinute">;

const minuteOf = (date: Date) => date.getUTCHours() * 60 + date.getUTCMinutes();

export const slotAt = (start: Date, length: number): SlotTime => {
  const startMinute = minuteOf(start);
  return { date: dayOf(start), startMinute, endMinute: startMinute + length };
};
export const slotBetween = (start: Date, end: Date) =>
  slotAt(start, (end.getTime() - start.getTime()) / 60_000);
