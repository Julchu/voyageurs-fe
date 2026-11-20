import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StopDetails } from "@/types/trip-api";

export type StopDetailsState = {
  /** Unsaved place details: trip public ID → place key → details. */
  drafts: Record<string, Record<string, StopDetails>>;
};

export type StopDetailsActions = {
  editDetails: (tripId: string, placeKey: string, details: StopDetails) => void;
  /** Drop one trip's unsaved details, or all of them. */
  clearDetails: (tripId?: string) => void;
};

export type StopDetailsStore = StopDetailsState & StopDetailsActions;

export const createStopDetailsStore = () =>
  create<StopDetailsStore>()(
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
        clearDetails: (tripId) =>
          set(({ drafts }) => {
            const next = tripId ? { ...drafts } : {};
            if (tripId) delete next[tripId];
            return { drafts: next };
          }),
      }),
      { name: "voyageurs-stop-details", version: 1 },
    ),
  );

export type StopDetailsStoreApi = ReturnType<typeof createStopDetailsStore>;
