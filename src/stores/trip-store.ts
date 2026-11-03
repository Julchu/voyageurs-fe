import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  reconcileSavedTrip,
  requestTripSave,
  sameTrip,
  toTripDraft,
} from "@/utils/trip-sync";
import type { Place } from "@/utils/interfaces";
import type { TripDto } from "@/types/trip-api";
import type { TripDraft, TripStopDraft } from "@/types/trip-draft";
import {
  type CollectionLoadState,
  fetchCollection,
  loadStateFromServer,
  nextLoadStateForFetch,
} from "@/stores/utils/collection-load";

export type TripState = {
  trips: TripDto[];
  tripsLoadState: CollectionLoadState;
  currentTrip?: TripDraft;
  tripVersion: number;
  tripSaveStatus: "idle" | "saving" | "saved" | "error";
  tripSaveError?: string;
  savedTripVersion?: number;
};

export type TripActions = {
  clearTrips: () => void;
  fetchTrips: () => Promise<void>;
  syncTrips: (tripFormData: TripDraft) => Promise<void>;
  addStop: (stop: Place) => void;
  removeStop: (clientOrPublicId?: string) => void;
  reorderStops: (from: number, to: number) => void;
  renameTrip: (name: string) => void;
  selectTrip: (publicId: string) => void;
  createTrip: (name: string) => void;
  resetDraft: () => void;
};

export type TripStore = TripState & TripActions;

const newStop = ({
  place,
  position,
}: {
  place: Place;
  position: number;
}): TripStopDraft => ({
  clientId: crypto.randomUUID(),
  name: place.name,
  streetAddress: place.streetAddress,
  areaAddress: place.areaAddress,
  coordinates: place.coordinates,
  category: place.category,
  id: place.id,
  ...(place.mapboxId ? { mapboxId: place.mapboxId } : {}),
  position,
  visited: false,
  visitedAt: null,
});

const addStop = ({
  currentTrip,
  place,
}: {
  currentTrip?: TripDraft;
  place: Place;
}): TripDraft => {
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
      ...currentTrip.stops,
      newStop({ place, position: currentTrip.stops.length }),
    ],
  };
};

const removeStop = ({
  currentTrip,
  clientOrPublicId,
}: {
  currentTrip: TripDraft;
  clientOrPublicId: string;
}): TripDraft => {
  return {
    ...currentTrip,
    stops: currentTrip.stops
      .filter(
        ({ clientId, publicId }) =>
          clientId !== clientOrPublicId && publicId !== clientOrPublicId,
      )
      .map((stop, position) => ({ ...stop, position })),
  };
};

const reorderStops = ({
  currentTrip,
  from,
  to,
}: {
  currentTrip: TripDraft;
  from: number;
  to: number;
}): TripDraft => {
  const { stops } = currentTrip;
  const n = stops.length;
  // Ignore unchanged or out-of-bounds moves.
  if (n === 0 || from === to || from < 0 || from >= n || to < 0 || to >= n)
    return currentTrip;

  const next = [...stops];
  const [stopToReposition] = next.splice(from, 1);
  if (!stopToReposition) return currentTrip;

  next.splice(to, 0, stopToReposition);
  return {
    ...currentTrip,
    stops: next.map((stop, position) => ({ ...stop, position })),
  };
};

export const initTripStore = (
  trips: TripDto[],
  tripsServerLoaded = false,
): TripState => ({
  currentTrip: trips[0]
    ? toTripDraft(trips[0])
    : { name: "New Trip", stops: [], clientId: crypto.randomUUID() },
  trips,
  tripsLoadState: loadStateFromServer(tripsServerLoaded),
  tripVersion: 1,
  tripSaveStatus: "idle",
});

const resolveCurrentTrip = (
  serverTrips: TripDto[],
  draft?: TripDraft,
  serverLoaded = true,
): TripDraft | undefined => {
  // Nothing persisted → use the server default
  if (!draft) return serverTrips[0] ? toTripDraft(serverTrips[0]) : undefined;
  if (!serverLoaded) return draft;
  // Brand-new, never-synced trip → keep it
  if (!draft.publicId) return draft;
  // Existing trip that was deleted on the server → drop the draft
  const existsOnServer = serverTrips.some((t) => t.publicId === draft.publicId);
  if (!existsOnServer)
    return serverTrips[0] ? toTripDraft(serverTrips[0]) : undefined;
  // Existing trip still on the server → keep the draft, ignore server's version
  return draft;
};

export const createTripStore = (initialState: TripState) => {
  // Ignore responses from requests started before the store was cleared.
  let requestVersion = 0;

  return create<TripStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        clearTrips: () => {
          requestVersion += 1;
          set({
            ...initTripStore([]),
            tripSaveError: undefined,
            savedTripVersion: undefined,
          });
        },
        fetchTrips: async () => {
          const next = nextLoadStateForFetch(get().tripsLoadState);
          if (!next.shouldFetch) return;
          const version = requestVersion;
          const beforeFetch = new Set(get().trips);
          set({ tripsLoadState: next.loadState });
          try {
            const trips = await fetchCollection<TripDto>("/api/trips", "Trip");
            if (version !== requestVersion) return;
            set(({ currentTrip, trips: localTrips }) => {
              // A list request may finish after a save. Keep those newer results.
              const savedDuringFetch = localTrips.filter(
                (trip) => !beforeFetch.has(trip),
              );
              const savedById = new Map(
                savedDuringFetch.map((trip) => [trip.publicId, trip]),
              );
              const remoteIds = new Set(trips.map((trip) => trip.publicId));
              const merged = [
                ...savedDuringFetch.filter(
                  (trip) => !remoteIds.has(trip.publicId),
                ),
                ...trips.map((trip) => {
                  const saved = savedById.get(trip.publicId);
                  return saved && saved.version >= trip.version ? saved : trip;
                }),
              ];
              return {
                trips: merged,
                tripsLoadState: "loaded",
                currentTrip:
                  currentTrip ??
                  (merged[0] ? toTripDraft(merged[0]) : undefined),
              };
            });
          } catch (error) {
            if (version !== requestVersion) return;
            console.error("Unable to retrieve trips", error);
            set({ tripsLoadState: "error" });
          }
        },
        syncTrips: async (tripFormData) => {
          if (get().tripSaveStatus === "saving") return;
          if (
            !tripFormData.name.trim() ||
            tripFormData.name.trim().length > 255
          ) {
            set({
              tripSaveStatus: "error",
              tripSaveError: "Trip name must be between 1 and 255 characters.",
            });
            return;
          }
          const version = requestVersion;
          // Form fields are committed once on Save, before reconciling the response.
          set(({ currentTrip, tripVersion }) => {
            const isCurrent = sameTrip(currentTrip, tripFormData);
            return {
              currentTrip: isCurrent ? tripFormData : currentTrip,
              tripVersion:
                isCurrent && currentTrip !== tripFormData
                  ? tripVersion + 1
                  : tripVersion,
              tripSaveStatus: "saving",
              tripSaveError: undefined,
            };
          });
          try {
            const saved = get().trips.find(
              (trip) => trip.publicId === tripFormData.publicId,
            );
            const trip = await requestTripSave(tripFormData, saved);
            if (version !== requestVersion) return;
            set(({ currentTrip, tripVersion, trips }) => {
              const isCurrent = sameTrip(currentTrip, tripFormData);
              const unchanged = currentTrip === tripFormData;
              const nextVersion = isCurrent ? tripVersion + 1 : tripVersion;
              return {
                trips: trips.some((item) => item.publicId === trip.publicId)
                  ? trips.map((item) =>
                      item.publicId === trip.publicId ? trip : item,
                    )
                  : [trip, ...trips],
                currentTrip:
                  isCurrent && currentTrip
                    ? reconcileSavedTrip(currentTrip, tripFormData, trip)
                    : currentTrip,
                tripVersion: nextVersion,
                tripSaveStatus: "saved",
                savedTripVersion:
                  isCurrent && unchanged ? nextVersion : undefined,
              };
            });
          } catch (error) {
            if (version !== requestVersion) return;
            set({
              tripSaveStatus: "error",
              tripSaveError:
                error instanceof Error
                  ? error.message
                  : "Unable to save trip. Please try again.",
            });
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
            currentTrip: currentTrip ? { ...currentTrip, name } : undefined,
            tripVersion: tripVersion + 1,
          }));
        },
        // Switch the draft to an existing, saved trip.
        selectTrip: (publicId) => {
          set(({ trips, tripVersion }) => {
            const trip = trips.find((t) => t.publicId === publicId);
            return trip
              ? { currentTrip: toTripDraft(trip), tripVersion: tripVersion + 1 }
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
          set(({ currentTrip, trips, tripVersion }) => {
            const saved = trips.find(
              (trip) => trip.publicId === currentTrip?.publicId,
            );
            return {
              currentTrip: saved
                ? toTripDraft(saved, currentTrip)
                : {
                    clientId: currentTrip?.clientId ?? crypto.randomUUID(),
                    name: "New Trip",
                    stops: [],
                  },
              tripVersion: tripVersion + 1,
              tripSaveStatus: "idle",
              tripSaveError: undefined,
              savedTripVersion: undefined,
            };
          });
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
          const resolved = resolveCurrentTrip(
            serverTrips,
            draft,
            current.tripsLoadState === "loaded",
          );
          return {
            ...current,
            trips: serverTrips,
            currentTrip: resolved
              ? {
                  ...resolved,
                  clientId:
                    resolved.clientId ??
                    resolved.publicId ??
                    crypto.randomUUID(),
                  stops: resolved.stops.map((stop) => ({
                    ...stop,
                    clientId:
                      stop.clientId ?? stop.publicId ?? crypto.randomUUID(),
                  })),
                }
              : undefined,
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
