import type { ScheduledVisit } from "@/types/trip-api";
import type { TripStopDraft } from "@/types/trip-draft";
import type { TripActionCreator } from "./trip-store";
import { draftEditor } from "./trip-draft-actions";
import { placeKey, stopId } from "@/utils/trip-stop";
import { compareVisits } from "@/utils/trip-time";

/** Scheduled stops follow their visit times; unscheduled stops keep their place. */
const orderBySchedule = (
  stops: TripStopDraft[],
  visits: ScheduledVisit[],
): TripStopDraft[] => {
  const byStop = new Map(visits.map((visit) => [visit.stopId, visit]));
  const scheduled = stops
    .filter((stop) => byStop.has(stopId(stop)))
    .sort((a, b) =>
      compareVisits(byStop.get(stopId(a))!, byStop.get(stopId(b))!),
    );
  let index = 0;
  return stops.map((stop) =>
    byStop.has(stopId(stop)) ? scheduled[index++] : stop,
  );
};

export const createTripCalendarActions: TripActionCreator<
  | "setTripDates"
  | "setVisit"
  | "removeVisit"
  | "toggleReserved"
  | "setOpenHours"
> = (set, get) => {
  const edit = draftEditor(set, get);

  return {
    setTripDates: (startDate, endDate) =>
      edit((trip) => ({ ...trip, startDate, endDate })),
    setVisit: (visit) =>
      edit((trip) => {
        const visits = [
          ...trip.visits.filter((item) => item.stopId !== visit.stopId),
          visit,
        ].sort(compareVisits);
        // The backend needs scheduled stops in time order.
        return { ...trip, visits, stops: orderBySchedule(trip.stops, visits) };
      }),
    removeVisit: (visitId) =>
      edit((trip) => ({
        ...trip,
        visits: trip.visits.filter((visit) => visit.id !== visitId),
      })),
    toggleReserved: (visitId) =>
      edit((trip) => ({
        ...trip,
        visits: trip.visits.map((visit) =>
          visit.id === visitId ? { ...visit, locked: !visit.locked } : visit,
        ),
      })),
    // Open hours belong to the place, so every stop there gets the same hours.
    setOpenHours: (id, availability) =>
      edit((trip) => {
        const source = trip.stops.find((stop) => stopId(stop) === id);
        if (!source) return trip;
        return {
          ...trip,
          stops: trip.stops.map((stop) =>
            placeKey(stop) === placeKey(source)
              ? { ...stop, availability }
              : stop,
          ),
        };
      }),
  };
};
