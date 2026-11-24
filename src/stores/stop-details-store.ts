import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { StopDetails } from "@/types/trip-api";

type StopDetailsState = {
  /** Unsaved place details: trip public ID → place key → details. */
  drafts: Record<string, Record<string, StopDetails>>;
};

type StopDetailsActions = {
  editDetails: (tripId: string, placeKey: string, details: StopDetails) => void;
  clearTrip: (tripId: string) => void;
  clearAll: () => void;
};

type StopDetailsStore = StopDetailsState & StopDetailsActions;

export const createStopDetailsStore = () =>
  createStore<StopDetailsStore>()(
    persist(
      (set) => ({
        drafts: {},
        editDetails: (tripId, placeKey, details) =>
          set(({ drafts }) => ({
            drafts: {
              ...drafts,
              [tripId]: { ...drafts[tripId], [placeKey]: details },
            },
          })),
        clearTrip: (tripId) =>
          set(({ drafts }) => ({
            drafts: Object.fromEntries(
              Object.entries(drafts).filter(([id]) => id !== tripId),
            ),
          })),
        clearAll: () => set({ drafts: {} }),
      }),
      { name: "voyageurs-stop-details", version: 1 },
    ),
  );
