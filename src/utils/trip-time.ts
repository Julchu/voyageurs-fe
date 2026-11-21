import type { AvailabilityWindow, TimeSlot } from "@/types/trip-api";

// Dates and minutes are local trip time. UTC is only a neutral clock, never a time zone.
export const dateMinute = (date: string, minute = 0) =>
  Date.parse(`${date}T00:00:00Z`) / 60_000 + minute;
export const weekday = (date: string) =>
  new Date(`${date}T00:00:00Z`).getUTCDay();
export const slotStart = (slot: TimeSlot) =>
  dateMinute(slot.date, slot.startMinute);
export const slotEnd = (slot: TimeSlot) =>
  dateMinute(slot.date, slot.endMinute);

export const compareSlots = (a: TimeSlot, b: TimeSlot) =>
  a.date.localeCompare(b.date) ||
  a.startMinute - b.startMinute ||
  a.id.localeCompare(b.id);

/** Weekly open hours, matching the backend: empty means open anytime. */
export const isAvailable = (
  availability: AvailabilityWindow[],
  day: number,
  start: number,
  end: number,
) => {
  if (
    start < 0 ||
    end > 1440 ||
    start >= end ||
    start % 30 !== 0 ||
    end % 30 !== 0
  )
    return false;
  if (!availability.length) return true;
  for (let minute = start; minute < end; minute += 30) {
    if (
      !availability.some(
        (w) =>
          w.day === day &&
          w.startMinute <= minute &&
          w.endMinute >= minute + 30,
      )
    )
      return false;
  }
  return true;
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
