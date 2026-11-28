import type { StoreApi } from "zustand";
import { deleteTrip, listTrips, sendTrip } from "@/api/trips";
import type { PlaceDetailsInput, TripDto } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { errorMessage } from "@/utils/errors";
import {
  calendarChanges,
  isStale,
  newTripInput,
  rebaseDraft,
  serverTrip,
  stopListChanges,
  toTripDraft,
} from "@/utils/trip-sync";
import { firstDraft, reconcileDraft } from "./trip-edits";
import type { TripState, TripStore } from "./trip-store";
import { shouldFetchCollection } from "./utils/collection-load";

const SAVE_FAILED = "Unable to save. Please try again.";
const DELETE_FAILED = "Unable to delete. Please try again.";

/** The state a server load starts from. Clearing the store returns to it. */
export const initTripStore = (
  trips: TripDto[],
  tripsServerLoaded: boolean,
): TripState => ({
  trips,
  tripsLoadState: tripsServerLoaded ? "loaded" : "idle",
  currentTrip: firstDraft(trips),
  save: { status: "idle" },
  notice: null,
});

const withTrip = (trips: TripDto[], trip: TripDto) =>
  trips.some((item) => item.publicId === trip.publicId)
    ? trips.map((item) => (item.publicId === trip.publicId ? trip : item))
    : [trip, ...trips];

/** Save part 1: create the trip, or send its name and stop list when they changed. */
const saveStopList = async (draft: TripDraft, saved?: TripDto) => {
  if (!saved) return sendTrip(undefined, newTripInput(draft));
  const changes = stopListChanges(draft, saved);
  return changes ? sendTrip(saved, changes) : saved;
};

export const createTripSaveActions = (
  set: StoreApi<TripStore>["setState"],
  get: StoreApi<TripStore>["getState"],
) => {
  // Ignore responses from requests started before the store was cleared.
  let requestVersion = 0;
  const fail = (message: string) => {
    set({ save: { status: "error", message } });
    return false;
  };

  return {
    clearTrips: () => {
      requestVersion += 1;
      set(initTripStore([], false));
    },

    fetchTrips: async () => {
      if (!shouldFetchCollection(get().tripsLoadState)) return;
      const version = requestVersion;
      set({ tripsLoadState: "loading" });
      try {
        const trips = await listTrips();
        if (version !== requestVersion) return;
        set(({ currentTrip }) => ({
          trips,
          tripsLoadState: "loaded",
          currentTrip: reconcileDraft(currentTrip, trips, true),
        }));
      } catch (error) {
        if (version !== requestVersion) return;
        console.error("Unable to retrieve trips", error);
        set({ tripsLoadState: "error" });
      }
    },

    /** Saves the draft in two parts: the stop list, then the calendar. Each part is skipped when unchanged. True when saved. */
    saveTrip: async () => {
      const { currentTrip: draft, trips, save } = get();
      if (save.status === "saving") return false;
      const saved = serverTrip(trips, draft);
      if (isStale(draft, saved))
        return fail(
          "This trip changed elsewhere. Reset to load the latest version.",
        );
      if (!draft.name.trim()) return fail("Give your trip a name.");

      const version = requestVersion;
      set({ save: { status: "saving" } });
      try {
        const listed = await saveStopList(draft, saved);
        if (version !== requestVersion) return false;
        // Keep this result even if the calendar part fails next.
        if (listed !== saved)
          set(({ trips, currentTrip }) => ({
            trips: withTrip(trips, listed),
            currentTrip: rebaseDraft(currentTrip, listed),
          }));

        const calendar = calendarChanges(get().currentTrip, listed);
        const trip = calendar ? await sendTrip(listed, { calendar }) : listed;
        if (version !== requestVersion) return false;
        set(({ trips, currentTrip }) => ({
          trips: withTrip(trips, trip),
          currentTrip: toTripDraft(trip, currentTrip),
          save: { status: "saved" },
        }));
        return true;
      } catch (error) {
        return version === requestVersion
          ? fail(errorMessage(error, SAVE_FAILED))
          : false;
      }
    },

    /** Deletes the saved trip being edited, then opens the next one. True when deleted. */
    deleteTrip: async () => {
      const { currentTrip, trips, save } = get();
      const saved = serverTrip(trips, currentTrip);
      if (!saved || save.status === "saving") return false;
      const version = requestVersion;
      set({ save: { status: "saving" } });
      try {
        await deleteTrip(saved.publicId);
        if (version !== requestVersion) return false;
        set(({ trips }) => {
          const remaining = trips.filter(
            (trip) => trip.publicId !== saved.publicId,
          );
          return {
            trips: remaining,
            currentTrip: firstDraft(remaining),
            save: { status: "idle" },
          };
        });
        return true;
      } catch (error) {
        return version === requestVersion
          ? fail(errorMessage(error, DELETE_FAILED))
          : false;
      }
    },

    /** Place details save on their own; the trip draft only moves to the new version. */
    saveDetails: async (placeDetails: PlaceDetailsInput[]) => {
      const { currentTrip, trips, save } = get();
      const saved = serverTrip(trips, currentTrip);
      if (!saved || save.status === "saving" || !placeDetails.length)
        return false;
      const version = requestVersion;
      set({ save: { status: "saving" } });
      try {
        const trip = await sendTrip(saved, { placeDetails });
        if (version !== requestVersion) return false;
        set(({ trips, currentTrip }) => ({
          trips: withTrip(trips, trip),
          currentTrip:
            currentTrip.version === saved.version
              ? { ...currentTrip, version: trip.version }
              : currentTrip,
          save: { status: "saved" },
        }));
        return true;
      } catch (error) {
        return version === requestVersion
          ? fail(errorMessage(error, SAVE_FAILED))
          : false;
      }
    },
  };
};
