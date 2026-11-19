import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { TripState, TripStore } from "./trip-state";
import { createTripEditActions } from "./trip-edit-actions";
import { createTripSaveActions } from "./trip-save-actions";
import { tripPersistence } from "./trip-persistence";

export * from "./trip-state";

/*
 * The trip store. State and selectors are in trip-state.ts.
 * - trip-edit-actions: local edits to the drawer and page drafts
 * - trip-save-actions: loading trips and saving to the server
 * - page-drafts: how a page's unsaved edits are kept and saved
 * - trip-persistence: what survives a reload (drafts, not saved trips)
 */

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
