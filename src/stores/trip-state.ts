import type { StoreApi } from "zustand";
import type { TripDto } from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import type { Place } from "@/utils/interfaces";
import { isTripDirty } from "@/utils/trip-sync";
import { newTrip, toTripDraft } from "@/utils/trip-draft";
import type { CollectionLoadState } from "./utils/collection-load";
import type { PageConfig, PageDrafts } from "./page-drafts";

export type TripState = {
  /** Saved trips, as the server returned them. */
  trips: TripDto[];
  tripsLoadState: CollectionLoadState;
  /** The drawer's draft: the trip's name and ordered stops. */
  currentTrip: TripDraft;
  /** Unsaved page edits (stop details, calendar), kept apart from the drawer. */
  pageDrafts: PageDrafts;
  saveStatus: "idle" | "saving" | "saved" | "error";
  /** Last failed save or edit. TODO: show it in the drawer and page footers. */
  error?: string;
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
  /** Edits a page draft, starting from what the page shows. */
  updatePage: <V>(page: PageConfig<V>, edit: (view: V) => V) => void;
  resetPage: (scope: string) => void;
  /** Saves pending drawer changes, then one page's draft. */
  savePage: <V>(page: PageConfig<V>) => Promise<boolean>;
};

export type TripStore = TripState & TripActions;

/** A file of actions: given zustand's set/get, returns the actions named in K. */
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

/** The saved version of a draft. Undefined for a trip that was never saved. */
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
