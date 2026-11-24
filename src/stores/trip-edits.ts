import type { AvailabilityWindow, TimeSlot, TripDto } from "@/types/trip-api";
import type { TripDraft, TripStopDraft } from "@/types/trip-draft";
import type { Place } from "@/types/place";
import { placeRecord } from "@/utils/place-record";
import { placeMove, scheduledNeighbours } from "@/utils/trip-scheduler";
import { placeKey, stopId } from "@/utils/trip-stop";
import { toTripDraft } from "@/utils/trip-sync";
import { compareSlots } from "@/utils/trip-time";

// Pure edits to a trip draft. The trip store applies them; nothing here touches state.

export const newTrip = (
  name = "New Trip",
  clientId = crypto.randomUUID(),
): TripDraft => ({
  clientId,
  name,
  stops: [],
  startDate: null,
  endDate: null,
  timeSlots: [],
});

/** The draft to start from: the first saved trip, or a new one. */
export const firstDraft = (trips: TripDto[]) =>
  trips[0] ? toTripDraft(trips[0]) : newTrip();

/** Keeps a restored or refetched draft unless its trip was deleted. */
export const reconcileDraft = (
  draft: TripDraft | undefined,
  trips: TripDto[],
  loaded: boolean,
) =>
  draft &&
  (!draft.publicId ||
    !loaded ||
    trips.some((trip) => trip.publicId === draft.publicId))
    ? draft
    : firstDraft(trips);

/** Back to the saved trip, or an empty trip when it was never saved. */
export const resetDraft = (trip: TripDraft, saved?: TripDto) =>
  saved ? toTripDraft(saved, trip) : newTrip("New Trip", trip.clientId);

/** A new, unscheduled stop. It shares open hours with other stops at the same place. */
export const newStop = (trip: TripDraft, place: Place): TripStopDraft => ({
  ...placeRecord(place),
  clientId: crypto.randomUUID(),
  availability:
    trip.stops.find((stop) => placeKey(stop) === placeKey(place))
      ?.availability ?? [],
  visited: false,
  visitedAt: null,
});

export const addStop = (trip: TripDraft, stop: TripStopDraft): TripDraft => ({
  ...trip,
  stops: [...trip.stops, stop],
});

export const removeStop = (trip: TripDraft, id: string): TripDraft => ({
  ...trip,
  stops: trip.stops.filter((stop) => stopId(stop) !== id),
  timeSlots: trip.timeSlots.filter((slot) => slot.stopId !== id),
});

/** Where a day move lands: the end of that day, before the first stop slotted later. */
const dayEndIndex = (
  stops: TripStopDraft[],
  slots: TimeSlot[],
  date: string,
) => {
  const later = new Set(
    slots.filter((slot) => slot.date > date).map((slot) => slot.stopId),
  );
  const index = stops.findIndex((stop) => later.has(stopId(stop)));
  return index < 0 ? stops.length : index;
};

/** A list move, or a day move when `targetDate` is set. Throws when the schedule can't take it. */
export const moveStop = (
  trip: TripDraft,
  from: number,
  to: number,
  targetDate?: string,
): TripDraft => {
  const stop = trip.stops[from];
  if (!stop || (!targetDate && from === to)) return trip;
  const rest = trip.stops.filter((_, index) => index !== from);
  const index = targetDate ? dayEndIndex(rest, trip.timeSlots, targetDate) : to;
  const stops = [...rest.slice(0, index), stop, ...rest.slice(index)];
  const timeSlots = placeMove(
    stops.map((item) => ({
      publicId: stopId(item),
      availability: item.availability,
    })),
    trip.timeSlots,
    {
      stopId: stopId(stop),
      ...scheduledNeighbours(stops.map(stopId), index, trip.timeSlots),
      targetDate,
    },
  );
  return { ...trip, stops, timeSlots };
};

/** Scheduled stops follow their time slots; unscheduled stops keep their place. */
const orderBySchedule = (stops: TripStopDraft[], slots: TimeSlot[]) => {
  const byStop = new Map(slots.map((slot) => [slot.stopId, slot]));
  const scheduled = stops
    .flatMap((stop) => {
      const slot = byStop.get(stopId(stop));
      return slot ? [{ stop, slot }] : [];
    })
    .sort((a, b) => compareSlots(a.slot, b.slot))
    .map(({ stop }) => stop);
  let index = 0;
  return stops.map((stop) =>
    byStop.has(stopId(stop)) ? scheduled[index++] : stop,
  );
};

export const setTimeSlot = (trip: TripDraft, slot: TimeSlot): TripDraft => {
  const timeSlots = [
    ...trip.timeSlots.filter((item) => item.stopId !== slot.stopId),
    slot,
  ].sort(compareSlots);
  // The backend needs scheduled stops in time order.
  return { ...trip, timeSlots, stops: orderBySchedule(trip.stops, timeSlots) };
};

export const removeTimeSlot = (trip: TripDraft, slotId: string): TripDraft => ({
  ...trip,
  timeSlots: trip.timeSlots.filter((slot) => slot.id !== slotId),
});

export const toggleReserved = (trip: TripDraft, slotId: string): TripDraft => ({
  ...trip,
  timeSlots: trip.timeSlots.map((slot) =>
    slot.id === slotId ? { ...slot, locked: !slot.locked } : slot,
  ),
});

/** Open hours belong to the place, so every stop there gets the same hours. */
export const setOpenHours = (
  trip: TripDraft,
  id: string,
  availability: AvailabilityWindow[],
): TripDraft => {
  const source = trip.stops.find((stop) => stopId(stop) === id);
  if (!source) return trip;
  return {
    ...trip,
    stops: trip.stops.map((stop) =>
      placeKey(stop) === placeKey(source) ? { ...stop, availability } : stop,
    ),
  };
};
