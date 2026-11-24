import type { TripDto } from "@/types/trip-api";
import type { TripDraft, TripStopDraft } from "@/types/trip-draft";
import type { Place } from "@/types/place";
import type { TripActionCreator, TripState, TripStore } from "./trip-store";
import type { StoreApi } from "zustand";
import { toTripDraft } from "@/utils/trip-sync";
import { placeKey, stopId } from "@/utils/trip-stop";
import { placeMove, scheduledNeighbours } from "@/utils/trip-scheduler";

const newTrip = (
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

/** A new, unscheduled stop. It shares open hours with other stops at the same place. */
const newStop = (trip: TripDraft, place: Place): TripStopDraft => ({
  clientId: crypto.randomUUID(),
  id: place.id,
  ...(place.mapboxId ? { mapboxId: place.mapboxId } : {}),
  name: place.name,
  streetAddress: place.streetAddress,
  areaAddress: place.areaAddress,
  coordinates: place.coordinates,
  category: place.category,
  availability:
    trip.stops.find((stop) => placeKey(stop) === placeKey(place))
      ?.availability ?? [],
  visited: false,
  visitedAt: null,
});

export const initTripStore = (
  trips: TripDto[],
  tripsServerLoaded = false,
): TripState => ({
  currentTrip: trips[0] ? toTripDraft(trips[0]) : newTrip(),
  trips,
  tripsLoadState: tripsServerLoaded ? "loaded" : "idle",
  tripSaveStatus: "idle",
});

/** Every draft edit goes through here. Editing is paused while saving. */
export const draftEditor =
  (
    set: StoreApi<TripStore>["setState"],
    get: StoreApi<TripStore>["getState"],
  ) =>
  (update: (trip: TripDraft) => TripDraft) => {
    const { currentTrip, tripSaveStatus } = get();
    if (!currentTrip || tripSaveStatus === "saving") return;
    set({
      currentTrip: update(currentTrip),
      tripSaveStatus: "idle",
      tripSaveError: undefined,
    });
  };

export const createTripDraftActions: TripActionCreator<
  | "addStop"
  | "removeStop"
  | "moveStop"
  | "renameTrip"
  | "selectTrip"
  | "createTrip"
  | "resetDraft"
> = (set, get) => {
  const edit = draftEditor(set, get);

  return {
    addStop: (place) => {
      if (get().tripSaveStatus === "saving") return;
      const trip = get().currentTrip ?? newTrip();
      const stop = newStop(trip, place);
      set({
        currentTrip: { ...trip, stops: [...trip.stops, stop] },
        tripSaveStatus: "idle",
        tripSaveError: undefined,
      });
      return stop.clientId;
    },
    removeStop: (id) =>
      edit((trip) => ({
        ...trip,
        stops: trip.stops.filter((stop) => stopId(stop) !== id),
        timeSlots: trip.timeSlots.filter((slot) => slot.stopId !== id),
      })),
    moveStop: (from, to, targetDate) => {
      const { currentTrip: trip, tripSaveStatus } = get();
      if (!trip || tripSaveStatus === "saving" || (!targetDate && from === to))
        return;
      const stops = trip.stops.slice();
      const [stop] = stops.splice(from, 1);
      if (!stop) return;
      // A day move lands at the end of that day: before the first later slot.
      const later = stops.findIndex((item) => {
        const slot = trip.timeSlots.find((v) => v.stopId === stopId(item));
        return !!targetDate && !!slot && slot.date > targetDate;
      });
      const index = !targetDate ? to : later < 0 ? stops.length : later;
      stops.splice(index, 0, stop);
      try {
        const slots = placeMove(
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
        edit(() => ({ ...trip, stops, timeSlots: slots }));
      } catch (error) {
        set({
          tripSaveStatus: "error",
          tripSaveError:
            error instanceof Error ? error.message : "Unable to move the stop.",
        });
      }
    },
    renameTrip: (name) => edit((trip) => ({ ...trip, name })),
    selectTrip: (publicId) => {
      const trip = get().trips.find((item) => item.publicId === publicId);
      if (trip && get().tripSaveStatus !== "saving")
        set({ currentTrip: toTripDraft(trip), tripSaveError: undefined });
    },
    createTrip: (name) => {
      if (name.trim() && get().tripSaveStatus !== "saving")
        set({ currentTrip: newTrip(name.trim()), tripSaveError: undefined });
    },
    resetDraft: () =>
      edit((trip) => {
        const saved = get().trips.find(
          (item) => item.publicId === trip.publicId,
        );
        return saved
          ? toTripDraft(saved, trip)
          : newTrip("New Trip", trip.clientId);
      }),
  };
};
