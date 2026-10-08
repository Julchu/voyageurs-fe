import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Place, Trip, TripStop } from "@/utils/interfaces";
import {
  type CollectionLoadState,
  fetchCollection,
} from "@/stores/collection-load";

export type TripMode = "account" | "local";

export type TripState = {
  mode: TripMode;
  trips: Trip[];
  tripsLoadState: CollectionLoadState;
  orderDrawerOpen: boolean;
  visitDrawerOpen: boolean;
  error: string | null;
  currentTrip: Trip | null;
  tripVersion: number;
};

export type TripActions = {
  setMode: (mode: TripMode) => void;
  markLocalReady: () => void;
  fetchTrips: () => Promise<void>;
  createTrip: (name: string) => Promise<void>;
  renameTrip: (publicId: string, name: string) => Promise<void>;
  setTripStatus: (publicId: string, status: Trip["status"]) => Promise<void>;
  addStop: (place: Place) => Promise<void>;
  addStopToTrip: (stop: Place) => void;
  reorderStops: (
    tripPublicId: string,
    publicIds: string[],
    commit: boolean,
  ) => Promise<void>;
  commitStopOrder: (tripPublicId: string) => Promise<void>;
  setVisited: (
    tripPublicId: string,
    stopPublicId: string,
    visited: boolean,
  ) => Promise<void>;
  removeStop: (tripPublicId: string, stopPublicId: string) => Promise<void>;
  openOrderDrawer: () => void;
  closeOrderDrawer: () => void;
  openVisitDrawer: () => void;
  closeVisitDrawer: () => void;
};

export type TripStorePrev = TripState & TripActions;

const asRemote = (trip: Trip): Trip => ({ ...trip, remote: true });

const readTrips = async (response: Response) => {
  const body = (await response.json()) as {
    trips?: Trip[];
    error?: string;
  };
  if (!response.ok || !Array.isArray(body.trips)) {
    throw new Error(body.error ?? "Trip request failed");
  }
  return body.trips.map(asRemote);
};

const messageFrom = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const newStop = (place: Place, position: number): TripStop => ({
  publicId: crypto.randomUUID(),
  tripPublicId: "",
  name: place.name,
  address: place.address,
  coordinates: place.coordinates,
  position,
  visited: false,
  visitedAt: null,
});

const withCurrentStop = (trips: Trip[], place: Place): Trip[] => {
  const current = trips.find((trip) => trip.status === "current");
  if (!current) {
    return [
      {
        publicId: crypto.randomUUID(),
        name: "Current trip",
        status: "current",
        remote: false,
        stops: [newStop(place, 0)],
      },
      ...trips,
    ];
  }

  const stops = [...current.stops, newStop(place, current.stops.length)];
  return trips.map((trip) =>
    trip.publicId === current.publicId
      ? { ...trip, remote: false, stops }
      : trip,
  );
};

const orderStops = (stops: TripStop[], publicIds: string[]) => {
  const byId = new Map(stops.map((stop) => [stop.publicId, stop]));
  return publicIds.flatMap((publicId, position) => {
    const stop = byId.get(publicId);
    return stop ? [{ ...stop, position }] : [];
  });
};

export const initTripStore = (trips: Trip[] | null): TripState => ({
  mode: trips ? "account" : "local",
  trips: (trips ?? []).map(asRemote),
  tripsLoadState: trips ? "loaded" : "idle",
  orderDrawerOpen: false,
  visitDrawerOpen: false,
  error: null,
  currentTrip: null,
  tripVersion: 1,
});

export const createTripStore = (initialState: TripState) => {
  return create<TripStorePrev>()(
    persist(
      (set, get) => ({
        ...initialState,
        setMode: (mode) => set({ mode }),
        markLocalReady: () =>
          set((state) => ({
            tripsLoadState:
              state.tripsLoadState === "idle" ? "loaded" : state.tripsLoadState,
          })),
        fetchTrips: async () => {
          set({ tripsLoadState: "loading" });
          try {
            const trips = (
              await fetchCollection<Trip[]>("/api/trips", "trips", "Trip")
            ).map(asRemote);
            set({
              trips,
              tripsLoadState: "loaded",
              mode: "account",
              error: null,
            });
          } catch (error) {
            console.error("Unable to retrieve trips", error);
            set({ tripsLoadState: "error" });
          }
        },
        createTrip: async (name) => {
          if (get().mode === "local") {
            set((state) => ({
              error: null,
              trips: [
                {
                  publicId: crypto.randomUUID(),
                  name,
                  status: "current",
                  remote: false,
                  stops: [],
                },
                ...state.trips.map((trip) =>
                  trip.status === "current"
                    ? { ...trip, status: "previous" as const }
                    : trip,
                ),
              ],
            }));
            return;
          }

          try {
            const response = await fetch("/api/trips", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            const trips = await readTrips(response);
            set({ trips, error: null });
          } catch (error) {
            set({ error: messageFrom(error, "Unable to start a trip") });
          }
        },
        renameTrip: async (publicId, name) => {
          if (get().mode === "local") {
            set((state) => ({
              trips: state.trips.map((trip) =>
                trip.publicId === publicId ? { ...trip, name } : trip,
              ),
            }));
            return;
          }

          try {
            const response = await fetch(`/api/trips/${publicId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            });
            set({ trips: await readTrips(response), error: null });
          } catch (error) {
            set({ error: messageFrom(error, "Unable to rename trip") });
          }
        },
        setTripStatus: async (publicId, status) => {
          if (get().mode === "local") {
            set((state) => ({
              trips: state.trips.map((trip) => {
                if (trip.publicId === publicId) return { ...trip, status };
                if (status === "current" && trip.status === "current") {
                  return { ...trip, status: "previous" };
                }
                return trip;
              }),
            }));
            return;
          }

          try {
            const response = await fetch(`/api/trips/${publicId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status }),
            });
            set({ trips: await readTrips(response), error: null });
          } catch (error) {
            set({ error: messageFrom(error, "Unable to update trip") });
          }
        },
        addStopToTrip: (place) => {
          set(({ currentTrip, tripVersion }) => ({
            currentTrip: {
              ...currentTrip,
              stops: [...(currentTrip?.stops || []), place],
            },
            tripVersion: tripVersion + 1,
          }));
        },
        addStop: async (place) => {
          if (get().mode === "local") {
            set((state) => ({
              trips: withCurrentStop(state.trips, place),
              error: null,
            }));
            return;
          }

          try {
            const response = await fetch("/api/trips/current/stops", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(place),
            });
            if (response.status === 401) {
              set((state) => ({
                mode: "local",
                trips: withCurrentStop(state.trips, place),
                error: null,
              }));
              return;
            }
            set({ trips: await readTrips(response), error: null });
          } catch (error) {
            set({ error: messageFrom(error, "Unable to add stop") });
          }
        },
        reorderStops: async (tripPublicId, publicIds, commit) => {
          const previous = get().trips;
          const next = previous.map((trip) =>
            trip.publicId === tripPublicId
              ? { ...trip, stops: orderStops(trip.stops, publicIds) }
              : trip,
          );
          set({ trips: next });
          if (!commit || get().mode === "local") return;
          await get().commitStopOrder(tripPublicId);
        },
        commitStopOrder: async (tripPublicId) => {
          if (get().mode === "local") return;
          const trip = get().trips.find(
            (item) => item.publicId === tripPublicId,
          );
          if (!trip) return;
          const publicIds = trip.stops.map((stop) => stop.publicId);
          const previous = get().trips;
          try {
            const response = await fetch(
              `/api/trips/${tripPublicId}/stops/order`,
              {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ publicIds }),
              },
            );
            if (response.status === 401) {
              set({ mode: "local" });
              return;
            }
            set({ trips: await readTrips(response), error: null });
          } catch (error) {
            set({
              trips: previous,
              error: messageFrom(error, "Unable to reorder stops"),
            });
          }
        },
        setVisited: async (tripPublicId, stopPublicId, visited) => {
          const previous = get().trips;
          const visitedAt = visited ? new Date().toISOString() : null;
          set({
            trips: previous.map((trip) =>
              trip.publicId === tripPublicId
                ? {
                    ...trip,
                    stops: trip.stops.map((stop) =>
                      stop.publicId === stopPublicId
                        ? { ...stop, visited, visitedAt }
                        : stop,
                    ),
                  }
                : trip,
            ),
          });
          if (get().mode === "local") return;

          try {
            const response = await fetch(
              `/api/trips/${tripPublicId}/stops/${stopPublicId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visited }),
              },
            );
            if (response.status === 401) {
              set({ mode: "local" });
              return;
            }
            set({ trips: await readTrips(response), error: null });
          } catch (error) {
            set({
              trips: previous,
              error: messageFrom(error, "Unable to update stop"),
            });
          }
        },
        removeStop: async (tripPublicId, stopPublicId) => {
          const previous = get().trips;
          set({
            trips: previous.map((trip) => {
              if (trip.publicId !== tripPublicId) return trip;
              const stops = trip.stops
                .filter((stop) => stop.publicId !== stopPublicId)
                .map((stop, position) => ({ ...stop, position }));
              return { ...trip, stops };
            }),
          });
          if (get().mode === "local") return;

          try {
            const response = await fetch(
              `/api/trips/${tripPublicId}/stops/${stopPublicId}`,
              {
                method: "DELETE",
              },
            );
            if (response.status === 401) {
              set({ mode: "local" });
              return;
            }
            set({ trips: await readTrips(response), error: null });
          } catch (error) {
            set({
              trips: previous,
              error: messageFrom(error, "Unable to remove stop"),
            });
          }
        },
        openOrderDrawer: () => set({ orderDrawerOpen: true }),
        closeOrderDrawer: () => set({ orderDrawerOpen: false }),
        openVisitDrawer: () => set({ visitDrawerOpen: true }),
        closeVisitDrawer: () => set({ visitDrawerOpen: false }),
      }),
      {
        name: "voyageurs-trips",
        partialize: ({ trips }) => ({ trips }),
        merge: (persisted, current) => {
          if (current.mode === "account") return current;
          const saved = persisted as Partial<Pick<TripState, "trips">>;
          return {
            ...current,
            trips: saved.trips ?? current.trips,
          };
        },
      },
    ),
  );
};

export const currentTripFrom = (trips: Trip[]) =>
  trips.find((trip) => trip.status === "current") ?? null;

export const previousTripsFrom = (trips: Trip[]) =>
  trips.filter((trip) => trip.status === "previous");

export type TripStoreApi = ReturnType<typeof createTripStore>;