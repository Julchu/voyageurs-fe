import type {
  CalendarInput,
  CreateTripInput,
  TimeSlot,
  TripDto,
  TripStopDto,
  TripStopInput,
} from "@/types/trip-api";
import type { TripDraft, TripStopDraft } from "@/types/trip-draft";
import { stopId } from "./trip-stop";

/** The saved copy of the trip a draft was made from. */
export const serverTrip = (trips: TripDto[], draft?: TripDraft) =>
  draft?.publicId
    ? trips.find((trip) => trip.publicId === draft.publicId)
    : undefined;

/** A fresh draft of a saved trip. Keeps client IDs from `previous` so list keys stay stable. */
export const toTripDraft = (trip: TripDto, previous?: TripDraft): TripDraft => {
  const previousStops = new Map(
    previous?.stops.map((stop) => [
      stop.publicId ?? trip.stopIdMap?.[stop.clientId],
      stop,
    ]),
  );
  return {
    clientId: previous?.clientId ?? trip.publicId,
    publicId: trip.publicId,
    version: trip.version,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
    name: trip.name,
    startDate: trip.startDate,
    endDate: trip.endDate,
    timeSlots: trip.timeSlots,
    stops: trip.stops.map((stop) => {
      const local = previousStops.get(stop.publicId);
      return { ...local, ...stop, clientId: local?.clientId ?? stop.publicId };
    }),
  };
};

/** After the stop list is saved: give new stops their IDs, keep unsaved calendar edits. */
export const rebaseDraft = (draft: TripDraft, trip: TripDto): TripDraft => {
  const ids = trip.stopIdMap ?? {};
  return {
    ...draft,
    publicId: trip.publicId,
    version: trip.version,
    stops: draft.stops.map((stop) =>
      stop.publicId ? stop : { ...stop, publicId: ids[stop.clientId] },
    ),
    timeSlots: draft.timeSlots.map((slot) => ({
      ...slot,
      stopId: ids[slot.stopId] ?? slot.stopId,
    })),
  };
};

const stopInput = (stop: TripStopDto | TripStopDraft): TripStopInput => ({
  publicId: stop.publicId,
  ...(!stop.publicId && "clientId" in stop && { clientId: stop.clientId }),
  mapboxId: stop.mapboxId?.trim() || undefined,
  name: stop.name.trim(),
  streetAddress: stop.streetAddress.trim(),
  areaAddress: stop.areaAddress.trim(),
  category: stop.category.trim(),
  coordinates: stop.coordinates,
});

/**
 * Save part 1: name, added and removed stops. Kept stops stay in their saved
 * order and new stops go last; the calendar part saves the final order.
 */
export const stopListChanges = (
  draft: TripDraft,
  saved?: TripDto,
): CreateTripInput | undefined => {
  const name = draft.name.trim();
  if (!saved) return { name, stops: draft.stops.map(stopInput) };
  const kept = new Set(draft.stops.map((stop) => stop.publicId));
  const added = draft.stops.filter((stop) => !stop.publicId);
  const stops = [
    ...saved.stops.filter((stop) => kept.has(stop.publicId)),
    ...added,
  ];
  const changes = {
    ...(name !== saved.name && { name }),
    ...((added.length > 0 || stops.length !== saved.stops.length) && {
      stops: stops.map(stopInput),
    }),
  };
  return Object.keys(changes).length ? changes : undefined;
};

const slotsKey = (slots: TimeSlot[]) =>
  JSON.stringify(
    [...slots]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(({ id, stopId, date, startMinute, endMinute, locked }) => [
        id,
        stopId,
        date,
        startMinute,
        endMinute,
        locked,
      ]),
  );

/** Save part 2: stop order, dates, slots and open hours. */
export const calendarChanges = (
  draft: TripDraft,
  saved: TripDto,
): CalendarInput | undefined => {
  const order = draft.stops.map(stopId);
  const orderChanged =
    order.join() !== saved.stops.map((stop) => stop.publicId).join();
  const savedHours = new Map(
    saved.stops.map((stop) => [
      stop.publicId,
      JSON.stringify(stop.availability),
    ]),
  );
  const availability = draft.stops
    .filter(
      (stop) =>
        savedHours.get(stopId(stop)) !== JSON.stringify(stop.availability),
    )
    .map((stop) => ({
      publicId: stopId(stop),
      availability: stop.availability,
    }));
  if (
    !orderChanged &&
    !availability.length &&
    draft.startDate === saved.startDate &&
    draft.endDate === saved.endDate &&
    slotsKey(draft.timeSlots) === slotsKey(saved.timeSlots)
  )
    return;
  return {
    startDate: draft.startDate,
    endDate: draft.endDate,
    timeSlots: draft.timeSlots,
    availability,
    ...(orderChanged && { order }),
  };
};

export const isTripDirty = (draft: TripDraft, saved?: TripDto) =>
  !saved || !!stopListChanges(draft, saved) || !!calendarChanges(draft, saved);
