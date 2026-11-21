import type { PersistOptions } from "zustand/middleware";
import type { TripState, TripStore } from "./trip-store";
import { toTripDraft } from "@/utils/trip-sync";

type PersistedTrip = Pick<TripState, "currentTrip">;

/** Keeps the unsaved trip draft across reloads. Saved trips always come from the server. */
export const tripPersistenceOptions: PersistOptions<TripStore, PersistedTrip> =
  {
    name: "voyageurs-trips",
    partialize: ({ currentTrip }) => ({ currentTrip }),
    merge: (persisted, current) => {
      const draft = (persisted as PersistedTrip | undefined)?.currentTrip;
      const { trips } = current;
      const fallback = trips[0] ? toTripDraft(trips[0]) : current.currentTrip;
      // Keep a new trip, or a trip that still exists; drop drafts of deleted trips.
      const keep =
        !!draft &&
        (!draft.publicId ||
          current.tripsLoadState !== "loaded" ||
          trips.some((trip) => trip.publicId === draft.publicId));
      return { ...current, currentTrip: keep ? draft : fallback };
    },
  };