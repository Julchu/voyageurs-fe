import type { TripDraft } from "@/types/trip-draft";
import { arrayMove } from "@/utils/data";
import { draftId, newStop, newTrip, toTripDraft } from "@/utils/trip-draft";
import { withPageDraft } from "./page-drafts";
import { savedTripOf, type TripSlice, type TripStore } from "./trip-state";

export const createTripEditActions: TripSlice<
  | "selectTrip"
  | "createTrip"
  | "renameTrip"
  | "addStop"
  | "removeStop"
  | "moveStop"
  | "resetTrip"
  | "setError"
  | "setPageDraft"
> = (set, get) => {
  /** Drawer edits are paused while a save is in flight. */
  const edit = (update: (trip: TripDraft, state: TripStore) => TripDraft) => {
    if (get().saveStatus === "saving") return;
    set((state) => ({ currentTrip: update(state.currentTrip, state) }));
  };

  return {
    selectTrip: (publicId) =>
      edit((trip, { trips }) => {
        const saved = trips.find((item) => item.publicId === publicId);
        return saved ? toTripDraft(saved) : trip;
      }),

    createTrip: (name = "") => edit(() => newTrip(name.trim() || undefined)),

    renameTrip: (name) => edit((trip) => ({ ...trip, name })),

    addStop: (place) =>
      edit((trip) => ({ ...trip, stops: [...trip.stops, newStop(place)] })),

    removeStop: (id) =>
      edit((trip) => ({
        ...trip,
        stops: trip.stops.filter((stop) => draftId(stop) !== id),
      })),

    moveStop: (from, to) =>
      edit((trip) => ({ ...trip, stops: arrayMove(trip.stops, from, to) })),

    resetTrip: () => {
      if (get().saveStatus === "saving") return;
      set(({ currentTrip, trips }) => {
        const saved = savedTripOf(trips, currentTrip);
        return {
          currentTrip: saved
            ? toTripDraft(saved, currentTrip)
            : newTrip(undefined, currentTrip.clientId),
          saveStatus: "idle",
          error: undefined,
        };
      });
    },

    setError: (error) => set({ error }),

    setPageDraft: (scope, draft) => {
      if (get().saveStatus === "saving") return;
      set(({ pageDrafts, currentTrip }) => ({
        pageDrafts: withPageDraft(pageDrafts, currentTrip, scope, draft),
        error: undefined,
      }));
    },
  };
};
