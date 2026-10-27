import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  reconcileSavedTrip,
  requestTripSave,
  sameTrip,
} from "@/utils/trip-sync";
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
  // Fill in a stop that was saved before its place lookup finished.
  rememberPlace: (place: Place) => void;
  getRememberedPlace: (place: Place) => Place;
  removeStop: (clientOrPublicId?: string) => void;
  reorderStops: (from: number, to: number) => void;
  renameTrip: (name: string) => void;
  selectTrip: (publicId: string) => void;
  createTrip: (name: string) => void;
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
  streetAddress: place.streetAddress,
  areaAddress: place.areaAddress,
  coordinates: place.coordinates,
  category: place.category,
  id: place.id,
  ...(place.mapboxId ? { mapboxId: place.mapboxId } : {}),
  ...(place.photos ? { photos: place.photos } : {}),
  ...(place.placeInfoLoaded ? { placeInfoLoaded: true } : {}),
  ...(place.details ? { details: place.details } : {}),
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
      clientId: crypto.randomUUID(),
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

const samePoint = (a: Place["coordinates"], b: Place["coordinates"]) =>
  Math.abs(a.lat - b.lat) < 1e-5 && Math.abs(a.lng - b.lng) < 1e-5;

const samePlace = (a: Place, b: Place) =>
  (a.mapboxId && a.mapboxId === b.mapboxId) ||
  (a.name === b.name && samePoint(a.coordinates, b.coordinates));

const withPlaceInfo = <T extends Place>(original: T, place: Place): T => ({
  ...original,
  mapboxId: place.mapboxId ?? original.mapboxId,
  streetAddress: place.streetAddress || original.streetAddress,
  areaAddress: place.areaAddress || original.areaAddress,
  category: place.category || original.category,
  photos: place.photos ?? original.photos,
  placeInfoLoaded: place.placeInfoLoaded ?? original.placeInfoLoaded,
  details: place.details ?? original.details,
});

// Save both basic and expanded details, including on stops that already have
// an id. Retain each stop's identity, position, and visited state.
const applyRememberedPlace = ({
  currentTrip,
  place,
}: {
  currentTrip: TripFormData;
  place: Place;
}): TripFormData => {
  if (!place.mapboxId) return currentTrip;
  let changed = false;
  const stops = currentTrip.stops.map((stop) => {
    if (!samePlace(stop, place)) return stop;
    const next = withPlaceInfo(stop, place);
    if (
      Object.keys(next).every(
        (key) =>
          next[key as keyof typeof next] === stop[key as keyof typeof stop],
      )
    )
      return stop;
    changed = true;
    return next;
  });
  return changed ? { ...currentTrip, stops } : currentTrip;
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
      clientId: crypto.randomUUID(),
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

const resolveCurrentTrip = (
  serverTrips: Trip[],
  draft?: Trip,
): Trip | undefined => {
  // Nothing persisted → use the server default
  if (!draft) return serverTrips[0];
  // Brand-new, never-synced trip → keep it
  if (!draft.publicId) return draft;
  // Existing trip that was deleted on the server → drop the draft
  const existsOnServer = serverTrips.some((t) => t.publicId === draft.publicId);
  if (!existsOnServer) return serverTrips[0];
  // Existing trip still on the server → keep the draft, ignore server's version
  return draft;
};

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
        // TODO: rework remember Place for temp stop info
        rememberPlace: (place) => {
          set(({ currentTrip, trips, tripVersion }) => {
            if (!currentTrip) return {};
            const next = applyRememberedPlace({ currentTrip, place });
            const nextTrips = trips.map((trip) =>
              applyRememberedPlace({ currentTrip: trip, place }),
            );
            if (
              next === currentTrip &&
              nextTrips.every((trip, i) => trip === trips[i])
            )
              return {};
            return {
              currentTrip: next,
              trips: nextTrips,
              tripVersion: tripVersion + 1,
            };
          });
        },
        getRememberedPlace: (place) => {
          const state = get();
          const stop =
            state.currentTrip?.stops.find((stop) => samePlace(stop, place)) ??
            state.trips
              .flatMap((trip) => trip.stops)
              .find((stop) => samePlace(stop, place));
          return stop ? withPlaceInfo(place, stop) : place;
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
        // Switch the draft to an existing, saved trip.
        selectTrip: (publicId) => {
          set(({ trips, tripVersion }) => {
            const trip = trips.find((t) => t.publicId === publicId);
            return trip
              ? { currentTrip: trip, tripVersion: tripVersion + 1 }
              : {};
          });
        },
        // Start a brand-new, unsaved draft. Saving is handled by syncTrips.
        createTrip: (name) => {
          const trimmed = name.trim();
          if (!trimmed) return;
          set(({ tripVersion }) => ({
            currentTrip: {
              clientId: crypto.randomUUID(),
              name: trimmed,
              stops: [],
            },
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
        partialize: ({ currentTrip, tripVersion }) => ({
          currentTrip,
          tripVersion,
        }),
        merge: (persisted, current) => {
          const { currentTrip: draft, tripVersion } =
            (persisted as Partial<TripState>) ?? {};
          const serverTrips = current.trips; // authoritative, never from storage
          const resolved = resolveCurrentTrip(serverTrips, draft);
          return {
            ...current,
            trips: serverTrips,
            currentTrip: resolved,
            tripVersion:
              resolved === draft
                ? (tripVersion ?? current.tripVersion)
                : current.tripVersion,
          };
        },
      },
    ),
  );
};

export type TripStoreApi = ReturnType<typeof createTripStore>;