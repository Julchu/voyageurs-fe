import { create, type StoreApi } from "zustand";
import { persist } from "zustand/middleware";
import type { Place } from "@/utils/interfaces";
import type {
  AvailabilityWindow,
  ScheduledVisit,
  StopDetails,
  TripDto,
} from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import type { CollectionLoadState } from "./utils/collection-load";
import { createTripDraftActions } from "./trip-draft-actions";
import { createTripSaveActions } from "./trip-save-actions";
import { tripPersistenceOptions } from "./trip-persistence";

export { initTripStore } from "./trip-draft-actions";

export type TripState = {
  /** Saved trips, as the server returned them. */
  trips: TripDto[];
  tripsLoadState: CollectionLoadState;
  /** The trip being edited. The drawer and calendar both edit this draft. */
  currentTrip?: TripDraft;
  tripSaveStatus: "idle" | "saving" | "saved" | "error";
  tripSaveError?: string;
};

export type TripActions = {
  // Drawer
  addStop: (place: Place) => string | undefined;
  removeStop: (stopId: string) => void;
  moveStop: (from: number, to: number, targetDate?: string) => void;
  renameTrip: (name: string) => void;
  selectTrip: (publicId: string) => void;
  createTrip: (name: string) => void;
  resetDraft: () => void;
  // Calendar
  setTripDates: (startDate: string | null, endDate: string | null) => void;
  setVisit: (visit: ScheduledVisit) => void;
  removeVisit: (visitId: string) => void;
  toggleReserved: (visitId: string) => void;
  setOpenHours: (stopId: string, windows: AvailabilityWindow[]) => void;
  // Server
  clearTrips: () => void;
  fetchTrips: () => Promise<void>;
  saveTrip: () => Promise<void>;
  saveDetails: (
    placeDetails: (StopDetails & { publicId: string })[],
  ) => Promise<boolean>;
};

export type TripStore = TripState & TripActions;

export type TripActionCreator<Keys extends keyof TripActions> = (
  set: StoreApi<TripStore>["setState"],
  get: StoreApi<TripStore>["getState"],
) => Pick<TripActions, Keys>;

export const createTripStore = (initialState: TripState) =>
  create<TripStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        ...createTripDraftActions(set, get),
        ...createTripSaveActions(set, get),
      }),
      tripPersistenceOptions,
    ),
  );

export type TripStoreApi = ReturnType<typeof createTripStore>;
