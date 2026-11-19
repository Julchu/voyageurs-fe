import type { TripDto } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { errorMessage } from "@/utils/data";
import { sameTrip, toTripDraft } from "@/utils/trip-draft";
import {
  isTripDirty,
  patchTrip,
  postTrip,
  tripChanges,
  tripSaveBody,
} from "@/utils/trip-sync";
import {
  fetchCollection,
  shouldFetchCollection,
} from "./utils/collection-load";
import {
  initTripStore,
  savedTripOf,
  type TripSlice,
  type TripState,
} from "./trip-state";
import { getPageDraft, rebasePageDrafts, viewPage } from "./page-drafts";

/**
 * Server trips win, except ones this tab saved while the fetch was running:
 * those keep the newer version, and new ones aren't dropped.
 */
const mergeTrips = (remote: TripDto[], savedDuringFetch: TripDto[]) => {
  const local = new Map(savedDuringFetch.map((trip) => [trip.publicId, trip]));
  const merged = remote.map((trip) => {
    const mine = local.get(trip.publicId);
    local.delete(trip.publicId);
    return mine && mine.version >= trip.version ? mine : trip;
  });
  return [...local.values(), ...merged];
};

/** Replaces the trip with the same ID, or adds it first. */
const upsertTrip = (trips: TripDto[], trip: TripDto) =>
  trips.some(({ publicId }) => publicId === trip.publicId)
    ? trips.map((item) => (item.publicId === trip.publicId ? trip : item))
    : [trip, ...trips];

/** State after a save returns the canonical trip. */
const withSavedTrip = (
  state: TripState,
  submitted: TripDraft,
  trip: TripDto,
  scope?: string,
): Partial<TripState> => ({
  trips: upsertTrip(state.trips, trip),
  currentTrip: sameTrip(state.currentTrip, submitted)
    ? toTripDraft(trip, state.currentTrip)
    : state.currentTrip,
  pageDrafts: rebasePageDrafts(state.pageDrafts, submitted, trip, scope),
  saveStatus: "saved",
});

/** Server calls: loading trips and saving the drawer or a page. */
export const createTripSaveActions: TripSlice<
  "fetchTrips" | "clearTrips" | "saveTrip" | "savePage"
> = (set, get) => {
  // Responses that come back after a logout must not refill the cleared store.
  let logouts = 0;
  const staleAfterLogout = () => {
    const startedAt = logouts;
    return () => startedAt !== logouts;
  };

  const failSave = (error: string) => {
    set({ saveStatus: "error", error });
    return false;
  };

  const save = async (
    submitted: TripDraft,
    request: () => Promise<TripDto>,
    scope?: string,
  ) => {
    const isStale = staleAfterLogout();
    set({ saveStatus: "saving", error: undefined });
    try {
      const trip = await request();
      if (isStale()) return false;
      set((state) => withSavedTrip(state, submitted, trip, scope));
      return true;
    } catch (error) {
      if (isStale()) return false;
      return failSave(
        errorMessage(error, "Unable to save trip. Please try again."),
      );
    }
  };

  return {
    fetchTrips: async () => {
      if (!shouldFetchCollection(get().tripsLoadState)) return;
      const isStale = staleAfterLogout();
      const tripsBeforeFetch = new Set(get().trips);
      set({ tripsLoadState: "loading" });
      try {
        const remote = await fetchCollection<TripDto>("/api/trips", "Trip");
        if (isStale()) return;
        set(({ trips }) => ({
          trips: mergeTrips(
            remote,
            trips.filter((trip) => !tripsBeforeFetch.has(trip)),
          ),
          tripsLoadState: "loaded",
        }));
      } catch (error) {
        if (isStale()) return;
        console.error("Unable to retrieve trips", error);
        set({ tripsLoadState: "error" });
      }
    },

    clearTrips: () => {
      logouts += 1;
      set(initTripStore([]));
    },

    saveTrip: async () => {
      const { currentTrip: draft, trips, saveStatus } = get();
      if (saveStatus === "saving") return false;

      const name = draft.name.trim();
      if (!name || name.length > 255)
        return failSave("Trip name must be between 1 and 255 characters.");

      const saved = savedTripOf(trips, draft);
      if (draft.publicId && draft.version !== saved?.version)
        return failSave(
          "This draft is out of date. Restore the latest saved trip before editing.",
        );

      const changes = tripChanges(draft, saved);
      if (!Object.keys(changes).length) return true;

      return save(draft, () =>
        saved
          ? patchTrip(saved.publicId, { ...changes, version: saved.version })
          : postTrip(tripSaveBody(draft)),
      );
    },

    savePage: async (page) => {
      const { currentTrip, trips, saveStatus } = get();
      if (saveStatus === "saving") return false;

      // The page's patch needs saved stop IDs, so unsaved drawer changes go first.
      if (
        isTripDirty(currentTrip, savedTripOf(trips, currentTrip)) &&
        !(await get().saveTrip())
      )
        return false;

      // Re-read: the drawer save may have assigned new IDs.
      const state = get();
      const trip = state.currentTrip;
      const saved = savedTripOf(state.trips, trip);
      const draft = getPageDraft(state.pageDrafts, trip, page.scope);
      if (!saved || !draft) return false;
      if (draft.version !== saved.version)
        return failSave(
          "This page changed elsewhere. Reset it to load the latest saved values.",
        );

      const context = { trip, saved };
      const { view } = viewPage(page, draft, context);
      const patch = page.toPatch(view, context);
      return save(
        trip,
        () => patchTrip(saved.publicId, { ...patch, version: saved.version }),
        page.scope,
      );
    },
  };
};
