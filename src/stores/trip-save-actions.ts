import type { TripDto } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import { messageOf } from "@/utils/data";
import { sameTrip, toTripDraft } from "@/utils/trip-draft";
import {
  isTripDirty,
  sendTrip,
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
import { pageDraftOf, pageView, settlePageDrafts } from "./page-drafts";

/** Remote trips win, unless this tab saved a newer version while the request was in flight. */
const mergeTrips = (remote: TripDto[], savedDuringFetch: TripDto[]) => {
  const local = new Map(savedDuringFetch.map((trip) => [trip.publicId, trip]));
  const merged = remote.map((trip) => {
    const mine = local.get(trip.publicId);
    local.delete(trip.publicId);
    return mine && mine.version >= trip.version ? mine : trip;
  });
  return [...local.values(), ...merged];
};

const upsert = (trips: TripDto[], trip: TripDto) =>
  trips.some(({ publicId }) => publicId === trip.publicId)
    ? trips.map((item) => (item.publicId === trip.publicId ? trip : item))
    : [trip, ...trips];

/** Applies the canonical trip a save returned. */
const applySaved = (
  state: TripState,
  submitted: TripDraft,
  trip: TripDto,
  scope?: string,
): Partial<TripState> => ({
  trips: upsert(state.trips, trip),
  currentTrip: sameTrip(state.currentTrip, submitted)
    ? toTripDraft(trip, state.currentTrip)
    : state.currentTrip,
  pageDrafts: settlePageDrafts(state.pageDrafts, submitted, trip, scope),
  saveStatus: "saved",
});

export const createTripSaveActions: TripSlice<
  "fetchTrips" | "clearTrips" | "saveTrip" | "savePage"
> = (set, get) => {
  // Bumped on logout so late responses can't refill a cleared store.
  let epoch = 0;

  const fail = (error: string) => {
    set({ saveStatus: "error", error });
    return false;
  };

  const commit = async (
    submitted: TripDraft,
    request: () => Promise<TripDto>,
    scope?: string,
  ) => {
    const run = epoch;
    set({ saveStatus: "saving", error: undefined });
    try {
      const trip = await request();
      if (run !== epoch) return false;
      set((state) => applySaved(state, submitted, trip, scope));
      return true;
    } catch (error) {
      if (run !== epoch) return false;
      return fail(messageOf(error, "Unable to save trip. Please try again."));
    }
  };

  return {
    fetchTrips: async () => {
      if (!shouldFetchCollection(get().tripsLoadState)) return;
      const run = epoch;
      const before = new Set(get().trips);
      set({ tripsLoadState: "loading" });
      try {
        const remote = await fetchCollection<TripDto>("/api/trips", "Trip");
        if (run !== epoch) return;
        set(({ trips }) => ({
          trips: mergeTrips(
            remote,
            trips.filter((trip) => !before.has(trip)),
          ),
          tripsLoadState: "loaded",
        }));
      } catch (error) {
        if (run !== epoch) return;
        console.error("Unable to retrieve trips", error);
        set({ tripsLoadState: "error" });
      }
    },

    clearTrips: () => {
      epoch += 1;
      set(initTripStore([]));
    },

    saveTrip: async () => {
      const { currentTrip: draft, trips, saveStatus } = get();
      if (saveStatus === "saving") return false;

      const name = draft.name.trim();
      if (!name || name.length > 255)
        return fail("Trip name must be between 1 and 255 characters.");

      const saved = savedTripOf(trips, draft);
      if (draft.publicId && draft.version !== saved?.version)
        return fail(
          "This draft is out of date. Restore the latest saved trip before editing.",
        );

      const changes = tripChanges(draft, saved);
      if (!Object.keys(changes).length) return true;

      return commit(draft, () =>
        saved
          ? sendTrip(saved.publicId, { ...changes, version: saved.version })
          : sendTrip(undefined, tripSaveBody(draft)),
      );
    },

    savePage: async (page) => {
      const { currentTrip, trips, saveStatus } = get();
      if (saveStatus === "saving") return false;
      if (
        isTripDirty(currentTrip, savedTripOf(trips, currentTrip)) &&
        !(await get().saveTrip())
      )
        return false;

      // Re-read: a drawer save above may have assigned new IDs.
      const state = get();
      const trip = state.currentTrip;
      const saved = savedTripOf(state.trips, trip);
      const draft = pageDraftOf(state.pageDrafts, trip, page.scope);
      if (!saved || !draft) return false;
      if (draft.version !== saved.version)
        return fail(
          "This page changed elsewhere. Reset it to load the latest saved values.",
        );

      const context = { trip, saved };
      const patch = page.toPatch(pageView(page, draft, context), context);
      return commit(
        trip,
        () => sendTrip(saved.publicId, { ...patch, version: saved.version }),
        page.scope,
      );
    },
  };
};
