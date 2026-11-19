import type { PersistOptions } from "zustand/middleware";
import type { TripDraft } from "@/types/trip-draft";
import type { TripState, TripStore } from "./trip-state";

type Persisted = Pick<TripState, "currentTrip" | "pageDrafts">;

/** Keep a stored draft unless its trip has since been deleted on the server. */
const restoreDraft = (
  { trips, tripsLoadState, currentTrip }: TripState,
  stored?: TripDraft,
) => {
  if (!stored) return currentTrip;
  if (!stored.publicId || tripsLoadState !== "loaded") return stored;
  return trips.some(({ publicId }) => publicId === stored.publicId)
    ? stored
    : currentTrip;
};

export const tripPersistence: PersistOptions<TripStore, Persisted> = {
  name: "voyageurs-trips",
  version: 6,
  // Older page drafts used other shapes; keep only the drawer draft.
  migrate: (persisted) =>
    ({
      currentTrip: (persisted as Partial<Persisted> | undefined)?.currentTrip,
      pageDrafts: {},
    }) as Persisted,
  partialize: ({ currentTrip, pageDrafts }) => ({ currentTrip, pageDrafts }),
  // Saved trips always come from the server, never from storage.
  merge: (persisted, current) => {
    const { currentTrip, pageDrafts = {} } = (persisted ??
      {}) as Partial<Persisted>;
    return {
      ...current,
      pageDrafts,
      currentTrip: restoreDraft(current, currentTrip),
    };
  },
};
