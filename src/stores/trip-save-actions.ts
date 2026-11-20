import type { TripDto } from "@/types/trip-api";
import type { TripActionCreator } from "./trip-store";
import { initTripStore } from "./trip-draft-actions";
import {
  calendarChanges,
  rebaseDraft,
  sendTrip,
  serverTrip,
  stopListChanges,
  toTripDraft,
} from "@/utils/trip-sync";
import {
  fetchCollection,
  shouldFetchCollection,
} from "./utils/collection-load";

const withTrip = (trips: TripDto[], trip: TripDto) =>
  trips.some((item) => item.publicId === trip.publicId)
    ? trips.map((item) => (item.publicId === trip.publicId ? trip : item))
    : [trip, ...trips];

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to save. Please try again.";

export const createTripSaveActions: TripActionCreator<
  "clearTrips" | "fetchTrips" | "saveTrip" | "saveDetails"
> = (set, get) => {
  // Ignore responses from requests started before this store was cleared.
  let requestVersion = 0;
  const fail = (tripSaveError: string) =>
    set({ tripSaveStatus: "error", tripSaveError });

  return {
    clearTrips: () => {
      requestVersion += 1;
      set({ ...initTripStore([]), tripSaveError: undefined });
    },
    fetchTrips: async () => {
      if (!shouldFetchCollection(get().tripsLoadState)) return;
      const version = requestVersion;
      const beforeFetch = new Set(get().trips);
      set({ tripsLoadState: "loading" });
      try {
        const trips = await fetchCollection<TripDto>("/api/trips", "Trip");
        if (version !== requestVersion) return;
        set(({ currentTrip, trips: localTrips }) => {
          // A list request may finish after a save. Keep those newer results.
          const savedDuringFetch = localTrips.filter(
            (trip) => !beforeFetch.has(trip),
          );
          const merged = savedDuringFetch.reduce((list, saved) => {
            const remote = list.find((t) => t.publicId === saved.publicId);
            return !remote || saved.version >= remote.version
              ? withTrip(list, saved)
              : list;
          }, trips);
          return {
            trips: merged,
            tripsLoadState: "loaded",
            currentTrip:
              currentTrip ?? (merged[0] ? toTripDraft(merged[0]) : undefined),
          };
        });
      } catch (error) {
        if (version !== requestVersion) return;
        console.error("Unable to retrieve trips", error);
        set({ tripsLoadState: "error" });
      }
    },

    /** Saves the draft in two parts: the stop list, then the calendar. Each part is skipped when unchanged. */
    saveTrip: async () => {
      const { currentTrip: draft, trips, tripSaveStatus } = get();
      if (!draft || tripSaveStatus === "saving") return;
      const saved = serverTrip(trips, draft);
      if (draft.publicId && saved?.version !== draft.version)
        return fail(
          "This trip changed elsewhere. Reset to load the latest version.",
        );
      if (!draft.name.trim()) return fail("Give your trip a name.");

      const version = requestVersion;
      set({ tripSaveStatus: "saving", tripSaveError: undefined });
      try {
        // A new trip always has a stop-list part, so `saved` exists when it's skipped.
        const stopList = stopListChanges(draft, saved);
        const listed = stopList ? await sendTrip(saved, stopList) : saved!;
        if (version !== requestVersion) return;
        // Keep this result even if the calendar part fails next.
        if (stopList)
          set(({ trips, currentTrip }) => ({
            trips: withTrip(trips, listed),
            currentTrip: currentTrip && rebaseDraft(currentTrip, listed),
          }));

        const calendar = calendarChanges(get().currentTrip!, listed);
        const trip = calendar ? await sendTrip(listed, { calendar }) : listed;
        if (version !== requestVersion) return;
        set(({ trips, currentTrip }) => ({
          trips: withTrip(trips, trip),
          currentTrip: toTripDraft(trip, currentTrip),
          tripSaveStatus: "saved",
        }));
      } catch (error) {
        if (version === requestVersion) fail(errorMessage(error));
      }
    },

    /** Place details save on their own; the trip draft only moves to the new version. */
    saveDetails: async (placeDetails) => {
      const { currentTrip, trips, tripSaveStatus } = get();
      const saved = serverTrip(trips, currentTrip);
      if (!saved || tripSaveStatus === "saving" || !placeDetails.length)
        return false;
      const version = requestVersion;
      set({ tripSaveStatus: "saving", tripSaveError: undefined });
      try {
        const trip = await sendTrip(saved, { placeDetails });
        if (version !== requestVersion) return false;
        set(({ trips, currentTrip }) => ({
          trips: withTrip(trips, trip),
          currentTrip:
            currentTrip?.version === saved.version
              ? { ...currentTrip, version: trip.version }
              : currentTrip,
          tripSaveStatus: "saved",
        }));
        return true;
      } catch (error) {
        if (version === requestVersion) fail(errorMessage(error));
        return false;
      }
    },
  };
};
