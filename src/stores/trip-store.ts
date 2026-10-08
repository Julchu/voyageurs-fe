import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Place,
  Trip,
  TripFormData,
  TripStopFormData,
} from "@/utils/interfaces";
import {
  type CollectionLoadState,
  fetchCollection,
  loadStateFromServer,
  nextLoadStateForFetch,
} from "@/stores/collection-load";

export type TripState = {
  trips: Trip[];
  tripsLoadState: CollectionLoadState;
  currentTrip?: Trip;
  tripVersion: number;
};

export type TripActions = {
  fetchTrips: () => Promise<void>;
  syncTrips: (tripFormData: TripFormData) => Promise<void>;
  addStop: (stop: Place) => void;
  removeStop: (clientOrPublicId?: string) => void;
  reorderStops: (from: number, to: number) => void;
  renameTrip: (name: string) => void;
  resetDraft: () => void;
};

export type TripStore = TripState & TripActions;

const trySyncingTrips = async (tripFormData: TripFormData) => {
  try {
    const fetchTrip = await fetch("/api/trips", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tripFormData),
    });
    return await fetchTrip.json();
  } catch (error) {
    throw new Error("Unable to fetch grocery lists", { cause: error });
  }
};

const newStop = ({
  place,
  position,
  tripPublicId,
}: {
  place: Place;
  position: number;
  tripPublicId?: string;
}): TripStopFormData => ({
  ...(tripPublicId ? { tripPublicId } : {}),
  clientId: crypto.randomUUID(),
  name: place.name,
  address: place.address,
  coordinates: place.coordinates,
  id: place.id,
  position,
  visited: false,
  visitedAt: null,
});

const addStop = ({
  currentTrip,
  place,
}: {
  currentTrip?: TripFormData;
  place: Place;
}): TripFormData => {
  if (!currentTrip) {
    return {
      name: "New Trip",
      stops: [newStop({ place, position: 0 })],
    };
  }

  return {
    ...currentTrip,
    stops: [
      ...currentTrip?.stops,
      newStop({ place, position: currentTrip?.stops.length }),
    ],
  };
};

const removeStop = ({
  currentTrip,
  clientOrPublicId,
}: {
  currentTrip: TripFormData;
  clientOrPublicId: string;
}): TripFormData => {
  return {
    ...currentTrip,
    stops: currentTrip?.stops.filter(({ clientId, publicId }) => {
      return clientId !== clientOrPublicId && publicId !== clientOrPublicId;
    }),
  };
};

const renameTrip = ({
  currentTrip,
  name,
}: {
  currentTrip: TripFormData;
  name: string;
}): TripFormData => {
  return {
    ...currentTrip,
    name,
  };
};

const reorderStops = ({
  currentTrip,
  from,
  to,
}: {
  currentTrip: TripFormData;
  from: number;
  to: number;
}): TripFormData => {
  const { stops } = currentTrip;
  const n = stops.length;
  // Edge cases (no trips, same positions, out of bounds
  if (n === 0 || from === to || from < 0 || from >= n || to < 0 || to >= n)
    return currentTrip;

  const next = [...stops];
  const [stopToReposition] = next.splice(from, 1);
  if (!stopToReposition) return currentTrip;

  next.splice(to, 0, stopToReposition);
  return {
    ...currentTrip,
    stops: next,
  };
};

const resetTripToServerTrip = ({
  originalTrips,
  currentTripPublicId,
}: {
  originalTrips: Trip[];
  currentTripPublicId?: string;
}): TripFormData => {
  if (!currentTripPublicId)
    return {
      name: "New Trip",
      stops: [],
    };
  return originalTrips.filter(
    ({ publicId }) => publicId === currentTripPublicId,
  )[0];
};

export const initTripStore = (
  trips: Trip[],
  tripsServerLoaded = false,
): TripState => ({
  currentTrip: trips.length > 0 ? trips[0] : undefined,
  trips: trips ?? [],
  tripsLoadState: loadStateFromServer(tripsServerLoaded),
  tripVersion: 1,
});

// Store handles actions (per-action) rather than RHF
export const createTripStore = (initialState: TripState) => {
  return create<TripStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        fetchTrips: async () => {
          const next = nextLoadStateForFetch(get().tripsLoadState);
          if (!next.shouldFetch) return;
          set({ tripsLoadState: next.loadState });
          try {
            const trips = await fetchCollection<Trip[]>(
              "/api/trips",
              "trips",
              "Trip",
            );
            set({ trips, tripsLoadState: "loaded" });
          } catch (error) {
            console.error("Unable to retrieve trips", error);
            set({ tripsLoadState: "error" });
          }
        },
        syncTrips: async (tripFormData) => {
          try {
            const trips = await trySyncingTrips(tripFormData);
            set(() => ({ trips }));
          } catch (error) {
            console.error("Failed to sync trip to DB:", error);
          }
        },
        // Necessary for adding stop from outside of form
        addStop: (place) => {
          set(({ currentTrip, tripVersion }) => ({
            currentTrip: addStop({ currentTrip, place }),
            tripVersion: tripVersion + 1,
          }));
        },
        removeStop: (clientOrPublicId) => {
          if (!clientOrPublicId) return;
          set(({ currentTrip, tripVersion }) => ({
            currentTrip: currentTrip
              ? removeStop({ currentTrip, clientOrPublicId })
              : undefined,
            tripVersion: tripVersion + 1,
          }));
        },
        reorderStops: (from, to) => {
          set(({ currentTrip, tripVersion }) => ({
            currentTrip: currentTrip
              ? reorderStops({ currentTrip, from, to })
              : undefined,
            tripVersion: tripVersion + 1,
          }));
        },
        renameTrip: (name) => {
          set(({ currentTrip, tripVersion }) => ({
            currentTrip: currentTrip
              ? renameTrip({ currentTrip, name })
              : undefined,
            tripVersion: tripVersion + 1,
          }));
        },
        resetDraft: () => {
          set(({ currentTrip, tripVersion }) => ({
            currentTrip: resetTripToServerTrip({
              originalTrips: get().trips,
              currentTripPublicId: currentTrip?.publicId,
            }),
            tripVersion: tripVersion + 1,
          }));
        },
      }),
      {
        name: "voyageurs-trips",
        partialize: ({ trips, currentTrip }) => ({ trips, currentTrip }),
      },
    ),
  );
};

export type TripStoreApi = ReturnType<typeof createTripStore>;