import type { AvailabilityWindow, TimeSlot } from "@/types/trip-api";

// Dates and minutes are local trip time. UTC is only a neutral clock, never a time zone.

export const DAY_MINUTES = 1440;
/** Slots and open hours start and end on the half hour. */
export const SLOT_MINUTES = 30;
const DAY_MS = DAY_MINUTES * 60_000;
const MAX_TRIP_DAYS = 366;

export const weekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const parseDate = (date: string) => new Date(`${date}T00:00:00Z`);
export const atMinute = (date: string, minute: number) =>
  new Date(parseDate(date).getTime() + minute * 60_000);
export const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const dateMinute = (date: string, minute = 0) =>
  parseDate(date).getTime() / 60_000 + minute;
const weekday = (date: string) => parseDate(date).getUTCDay();

/** Every date from `start` to `end`, or none when the range is invalid or too long. */
export const dateDays = (start: string, end: string): string[] => {
  const first = parseDate(start).getTime();
  const last = parseDate(end).getTime();
  if (!Number.isFinite(first) || !Number.isFinite(last) || last < first)
    return [];
  const count = Math.floor((last - first) / DAY_MS) + 1;
  if (count > MAX_TRIP_DAYS) return [];
  return Array.from({ length: count }, (_, index) =>
    dayOf(new Date(first + index * DAY_MS)),
  );
};

export const timeLabel = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

const dateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const shortDateFormat = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
export const dateLabel = (date: string, withYear = true) =>
  (withYear ? dateFormat : shortDateFormat).format(parseDate(date));

export const slotStart = (slot: TimeSlot) =>
  dateMinute(slot.date, slot.startMinute);
export const slotEnd = (slot: TimeSlot) =>
  dateMinute(slot.date, slot.endMinute);
export const slotDuration = (slot: TimeSlot) =>
  slot.endMinute - slot.startMinute;

export const compareSlots = (a: TimeSlot, b: TimeSlot) =>
  a.date.localeCompare(b.date) ||
  a.startMinute - b.startMinute ||
  a.id.localeCompare(b.id);

/** Weekly open hours, matching the backend: empty means open anytime. */
const isAvailable = (
  availability: AvailabilityWindow[],
  day: number,
  start: number,
  end: number,
) => {
  if (
    start < 0 ||
    end > DAY_MINUTES ||
    start >= end ||
    start % SLOT_MINUTES !== 0 ||
    end % SLOT_MINUTES !== 0
  )
    return false;
  if (!availability.length) return true;
  const halfHours = Array.from(
    { length: (end - start) / SLOT_MINUTES },
    (_, index) => start + index * SLOT_MINUTES,
  );
  return halfHours.every((minute) =>
    availability.some(
      (open) =>
        open.day === day &&
        open.startMinute <= minute &&
        open.endMinute >= minute + SLOT_MINUTES,
    ),
  );
};

/** A valid, open time that doesn't overlap another slot. */
export const canSchedule = (
  slots: TimeSlot[],
  slot: TimeSlot,
  availability: AvailabilityWindow[],
) =>
  isAvailable(
    availability,
    weekday(slot.date),
    slot.startMinute,
    slot.endMinute,
  ) &&
  !slots.some(
    (other) =>
      other.id !== slot.id &&
      slotStart(other) < slotEnd(slot) &&
      slotEnd(other) > slotStart(slot),
  );
