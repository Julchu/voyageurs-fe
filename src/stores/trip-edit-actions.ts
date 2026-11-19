import type { TripDraft } from "@/types/trip-draft";
import { moveItem } from "@/utils/data";
import { draftId, newStop, newTrip, toTripDraft } from "@/utils/trip-draft";
import { editPageDraft, getPageDraft, setPageDraft } from "./page-drafts";
import { savedTripOf, type TripSlice, type TripStore } from "./trip-state";

/** Local edits to the drawer and page drafts. Nothing here talks to the server. */
export const createTripEditActions: TripSlice<
  | "selectTrip"
  | "createTrip"
  | "renameTrip"
  | "addStop"
  | "removeStop"
  | "moveStop"
  | "resetTrip"
  | "setError"
  | "updatePage"
  | "resetPage"
> = (set, get) => {
  // Edits wait while a save is in flight, so they can't be lost or half-sent.
  const isSaving = () => get().saveStatus === "saving";

  const editDrawer = (
    edit: (trip: TripDraft, state: TripStore) => TripDraft,
  ) => {
    if (isSaving()) return;
    set((state) => ({ currentTrip: edit(state.currentTrip, state) }));
  };

  return {
    selectTrip: (publicId) =>
      editDrawer((trip, { trips }) => {
        const saved = trips.find((item) => item.publicId === publicId);
        return saved ? toTripDraft(saved) : trip;
      }),

    createTrip: (name = "") =>
      editDrawer(() => newTrip(name.trim() || undefined)),

    renameTrip: (name) => editDrawer((trip) => ({ ...trip, name })),

    addStop: (place) =>
      editDrawer((trip) => ({
        ...trip,
        stops: [...trip.stops, newStop(place)],
      })),

    removeStop: (id) =>
      editDrawer((trip) => ({
        ...trip,
        stops: trip.stops.filter((stop) => draftId(stop) !== id),
      })),

    moveStop: (from, to) =>
      editDrawer((trip) => ({
        ...trip,
        stops: moveItem(trip.stops, from, to),
      })),

    resetTrip: () => {
      if (isSaving()) return;
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

    updatePage: (page, edit) => {
      if (isSaving()) return;
      set(({ pageDrafts, currentTrip: trip, trips }) => {
        const draft = getPageDraft(pageDrafts, trip, page.scope);
        const context = { trip, saved: savedTripOf(trips, trip) };
        const next = editPageDraft(page, draft, context, edit);
        return {
          pageDrafts: setPageDraft(pageDrafts, trip, page.scope, next),
          error: undefined,
        };
      });
    },

    resetPage: (scope) => {
      if (isSaving()) return;
      set(({ pageDrafts, currentTrip }) => ({
        pageDrafts: setPageDraft(pageDrafts, currentTrip, scope),
      }));
    },
  };
};
