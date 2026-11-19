import type { StoreApi } from "zustand";
import type { TripDto } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import type { Place } from "@/utils/interfaces";
import { isTripDirty } from "@/utils/trip-sync";
import { newTrip, toTripDraft } from "@/utils/trip-draft";
import type { CollectionLoadState } from "./utils/collection-load";
import type { PageConfig, PageDraft, PageDrafts } from "./page-drafts";

export type TripState = {
  trips: TripDto[];
  tripsLoadState: CollectionLoadState;
  currentTrip: TripDraft;
  saveStatus: "idle" | "saving" | "saved" | "error";
  /** Last failed save or edit. TODO: show it in the drawer and page footers. */
  error?: string;
  pageDrafts: PageDrafts;
};

export type TripActions = {
  fetchTrips: () => Promise<void>;
  clearTrips: () => void;
  selectTrip: (publicId: string) => void;
  createTrip: (name?: string) => void;
  renameTrip: (name: string) => void;
  addStop: (place: Place) => void;
  removeStop: (id: string) => void;
  moveStop: (from: number, to: number) => void;
  resetTrip: () => void;
  setError: (error?: string) => void;
  /** Saves the drawer (name and stops). Resolves false when nothing was saved. */
  saveTrip: () => Promise<boolean>;
  setPageDraft: (scope: string, draft?: PageDraft) => void;
  /** Saves pending drawer changes, then one page's draft. */
  savePage: <V>(page: PageConfig<V>) => Promise<boolean>;
};

export type TripStore = TripState & TripActions;

export type TripSlice<K extends keyof TripActions> = (
  set: StoreApi<TripStore>["setState"],
  get: StoreApi<TripStore>["getState"],
) => Pick<TripActions, K>;

export const initTripStore = (
  trips: TripDto[],
  serverLoaded = false,
): TripState => ({
  trips,
  tripsLoadState: serverLoaded ? "loaded" : "idle",
  currentTrip: trips[0] ? toTripDraft(trips[0]) : newTrip(),
  saveStatus: "idle",
  pageDrafts: {},
});

export const savedTripOf = (trips: TripDto[], trip: TripDraft) =>
  trip.publicId
    ? trips.find(({ publicId }) => publicId === trip.publicId)
    : undefined;

export const selectSavedTrip = ({ trips, currentTrip }: TripState) =>
  savedTripOf(trips, currentTrip);

export const selectTripDirty = (state: TripState) =>
  isTripDirty(state.currentTrip, selectSavedTrip(state));

export const selectIsSaving = ({ saveStatus }: TripState) =>
  saveStatus === "saving";
