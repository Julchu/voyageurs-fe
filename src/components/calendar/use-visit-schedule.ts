import { useTripStore } from "@/providers/trip-store-provider";
import type { ScheduledVisit } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { dateDays } from "@/utils/trip-calendar";
import { stopId } from "@/utils/trip-stop";
import { canSchedule } from "@/utils/trip-time";
import { DAY, type Slot, visitDuration } from "./calendar-time";

const MIN_VISIT = 30;

/** Lookups and placement rules for a trip's visits. Visits stay within one trip day. */
export function useVisitSchedule(
  trip: TripDraft | undefined,
  disabled: boolean,
) {
  const setVisit = useTripStore((state) => state.setVisit);
  const stops = trip?.stops ?? [];
  const visits = trip?.visits ?? [];
  const startDate = trip?.startDate ?? null;
  const endDate = trip?.endDate ?? null;
  const dates = startDate && endDate ? dateDays(startDate, endDate) : [];

  const stopsById = new Map(stops.map((stop) => [stopId(stop), stop]));
  const visitsByStop = new Map(visits.map((visit) => [visit.stopId, visit]));
  const nameOf = (id: string) => stopsById.get(id)?.name ?? "Removed stop";
  const isValid = (visit: ScheduledVisit) =>
    canSchedule(visits, visit, stopsById.get(visit.stopId)?.availability ?? []);
  const lengthOf = (id: string) => {
    const visit = visitsByStop.get(id);
    return visit ? visitDuration(visit) : MIN_VISIT;
  };

  /** The visit a slot would make, or null if it doesn't fit. */
  const fit = (id: string, { date, startMinute, length }: Slot) => {
    const previous = visitsByStop.get(id);
    const endMinute = startMinute + length;
    if (
      disabled ||
      previous?.locked ||
      !stopsById.has(id) ||
      !dates.includes(date) ||
      !Number.isFinite(length) ||
      length < MIN_VISIT ||
      endMinute > DAY
    )
      return null;
    const visit: ScheduledVisit = {
      id: previous?.id ?? "",
      locked: false,
      stopId: id,
      date,
      startMinute,
      endMinute,
    };
    return isValid(visit) ? visit : null;
  };

  const place = (id: string, slot: Slot) => {
    const visit = fit(id, slot);
    if (visit) setVisit({ ...visit, id: visit.id || crypto.randomUUID() });
    return !!visit;
  };

  const outsideDates = visits.filter((visit) => !dates.includes(visit.date));
  const hasErrors =
    (!!(startDate || endDate) && !dates.length) ||
    outsideDates.length > 0 ||
    visits.some((visit) => !isValid(visit));

  return {
    stops,
    visits,
    startDate,
    endDate,
    dates,
    stopsById,
    visitsByStop,
    outsideDates,
    hasErrors,
    nameOf,
    isValid,
    lengthOf,
    fit,
    place,
  };
}

export type VisitSchedule = ReturnType<typeof useVisitSchedule>;
