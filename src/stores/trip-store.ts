import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { TripState, TripStore } from "./trip-state";
import { createTripEditActions } from "./trip-edit-actions";
import { createTripSaveActions } from "./trip-save-actions";
import { tripPersistence } from "./trip-persistence";

export * from "./trip-state";

export const createTripStore = (initialState: TripState) =>
  createStore<TripStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        ...createTripEditActions(set, get),
        ...createTripSaveActions(set, get),
      }),
      tripPersistence,
    ),
  );

export type TripStoreApi = ReturnType<typeof createTripStore>;
