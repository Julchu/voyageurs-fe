import type { AvailabilityWindow, ScheduledVisit } from "@/types/trip-api";

// Dates and minutes are local trip time. UTC is only a neutral clock, never a time zone.
export const dateMinute = (date: string, minute = 0) =>
  Date.parse(`${date}T00:00:00Z`) / 60_000 + minute;
export const weekday = (date: string) =>
  new Date(`${date}T00:00:00Z`).getUTCDay();
export const visitStart = (visit: ScheduledVisit) =>
  dateMinute(visit.date, visit.startMinute);
export const visitEnd = (visit: ScheduledVisit) =>
  dateMinute(visit.date, visit.endMinute);

export const compareVisits = (a: ScheduledVisit, b: ScheduledVisit) =>
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

/** A valid, open time that doesn't overlap another visit. */
export const canSchedule = (
  visits: ScheduledVisit[],
  visit: ScheduledVisit,
  availability: AvailabilityWindow[],
) =>
  isAvailable(
    availability,
    weekday(visit.date),
    visit.startMinute,
    visit.endMinute,
  ) &&
  !visits.some(
    (other) =>
      other.id !== visit.id &&
      visitStart(other) < visitEnd(visit) &&
      visitEnd(other) > visitStart(visit),
  );
