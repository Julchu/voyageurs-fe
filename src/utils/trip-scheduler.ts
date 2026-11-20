import type { AvailabilityWindow, ScheduledVisit } from "@/types/trip-api";
import { canSchedule, compareVisits, visitEnd, visitStart } from "./trip-time";

// Keep `placeMove` identical to the backend's trip.calendar.ts.
type AvailableStop = { publicId: string; availability: AvailabilityWindow[] };

/** A list move. Neighbours are the nearest scheduled stops; `targetDate` marks a day move. */
export type StopMove = {
  stopId: string;
  previousStopId: string | null;
  nextStopId: string | null;
  targetDate?: string;
};

/** Shortest free time an unscheduled stop needs between its scheduled neighbours. */
export const MIN_GAP_MINUTES = 30;

/** Minutes between two visits; a missing neighbour leaves unlimited room. */
export const gapMinutes = (previous?: ScheduledVisit, next?: ScheduledVisit) =>
  previous && next
    ? visitStart(next) - visitEnd(previous)
    : Number.POSITIVE_INFINITY;

/** Nearest scheduled stops before and after `index` in a list of stop IDs. */
export const scheduledNeighbours = (
  order: string[],
  index: number,
  visits: ScheduledVisit[],
) => {
  const scheduled = new Set(visits.map((visit) => visit.stopId));
  return {
    previousStopId:
      order
        .slice(0, index)
        .reverse()
        .find((id) => scheduled.has(id)) ?? null,
    nextStopId: order.slice(index + 1).find((id) => scheduled.has(id)) ?? null,
  };
};

/**
 * Apply one list move without pushing, shrinking or creating visits.
 *
 * A scheduled stop keeps its clock time on its own date, the previous stop's
 * date or the next stop's date (only `targetDate` for a day move). If none
 * fits, it becomes unscheduled. An unscheduled result needs a free half hour
 * between the neighbours.
 */
export const placeMove = (
  stops: AvailableStop[],
  visits: ScheduledVisit[],
  move: StopMove,
): ScheduledVisit[] => {
  const hours = new Map(
    stops.map((stop) => [stop.publicId, stop.availability]),
  );
  const ids = [move.stopId, move.previousStopId, move.nextStopId].filter(
    (id) => id !== null,
  );
  if (new Set(ids).size !== ids.length || ids.some((id) => !hours.has(id)))
    throw new Error("Choose distinct stops from this trip to reorder.");
  const byStop = new Map(visits.map((visit) => [visit.stopId, visit]));
  const moved = byStop.get(move.stopId);
  if (moved?.locked)
    throw new Error("Remove the reservation before rearranging this visit.");
  const previous = move.previousStopId
    ? byStop.get(move.previousStopId)
    : undefined;
  const next = move.nextStopId ? byStop.get(move.nextStopId) : undefined;
  if ((move.previousStopId && !previous) || (move.nextStopId && !next))
    throw new Error("The neighbouring stops changed. Reset and try again.");
  if (gapMinutes(previous, next) < 0)
    throw new Error("The neighbouring visits are in reverse time order.");

  if (moved) {
    const dates = move.targetDate
      ? [move.targetDate]
      : [moved.date, previous?.date, next?.date].filter(
          (date) => date !== undefined,
        );
    for (const date of new Set(dates)) {
      const candidate = { ...moved, date };
      if (
        gapMinutes(previous, candidate) < 0 ||
        gapMinutes(candidate, next) < 0
      )
        continue;
      if (!canSchedule(visits, candidate, hours.get(move.stopId)!)) continue;
      if (date === moved.date) return visits;
      return [...visits.filter((visit) => visit !== moved), candidate].sort(
        compareVisits,
      );
    }
  }
  if (gapMinutes(previous, next) < MIN_GAP_MINUTES)
    throw new Error(
      moved
        ? "This visit's time doesn't fit there, and there is no free half hour between the neighbouring visits."
        : "There is no free half hour between the neighbouring visits.",
    );
  return moved ? visits.filter((visit) => visit !== moved) : visits;
};
