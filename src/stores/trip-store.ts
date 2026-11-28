import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AvailabilityWindow,
  PlaceDetailsInput,
  TimeSlot,
  TripDto,
} from "@/types/trip-api";
import type { TripDraft } from "@/types/trip-draft";
import type { Place } from "@/types/place";
import { errorMessage } from "@/utils/errors";
import { serverTrip, toTripDraft } from "@/utils/trip-sync";
import type { CollectionLoadState } from "./utils/collection-load";
import * as edits from "./trip-edits";
import { createTripSaveActions, initTripStore } from "./trip-save";

type SaveState =
  | { status: "idle" | "saving" | "saved" }
  | { status: "error"; message: string };

export type TripState = {
  /** Saved trips, as the server returned them. */
  trips: TripDto[];
  tripsLoadState: CollectionLoadState;
  /** The trip being edited. The drawer and calendar both edit this draft. */
  currentTrip: TripDraft;
  save: SaveState;
  /** Why the last move was rejected. Separate from save errors. */
  notice: string | null;
};

type TripActions = {
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
  setTimeSlot: (slot: TimeSlot) => void;
  removeTimeSlot: (slotId: string) => void;
  toggleReserved: (slotId: string) => void;
  setOpenHours: (stopId: string, windows: AvailabilityWindow[]) => void;
  // Server
  clearTrips: () => void;
  fetchTrips: () => Promise<void>;
  saveTrip: () => Promise<boolean>;
  deleteTrip: () => Promise<boolean>;
  saveDetails: (placeDetails: PlaceDetailsInput[]) => Promise<boolean>;
};

export type TripStore = TripState & TripActions;

export const createTripStore = (trips: TripDto[], tripsServerLoaded: boolean) =>
  createStore<TripStore>()(
    persist(
      (set, get) => {
        /** Every draft edit goes through here. Editing is paused while saving. */
        const edit = (update: (trip: TripDraft) => TripDraft) => {
          if (get().save.status === "saving") return false;
          set({
            currentTrip: update(get().currentTrip),
            save: { status: "idle" },
            notice: null,
          });
          return true;
        };

        return {
          ...initTripStore(trips, tripsServerLoaded),

          addStop: (place) => {
            const stop = edits.newStop(get().currentTrip, place);
            return edit((trip) => edits.addStop(trip, stop))
              ? stop.clientId
              : undefined;
          },
          removeStop: (id) => edit((trip) => edits.removeStop(trip, id)),
          moveStop: (from, to, targetDate) => {
            try {
              edit((trip) => edits.moveStop(trip, from, to, targetDate));
            } catch (error) {
              set({ notice: errorMessage(error, "Unable to move the stop.") });
            }
          },
          renameTrip: (name) => edit((trip) => ({ ...trip, name })),
          selectTrip: (publicId) => {
            const saved = get().trips.find(
              (trip) => trip.publicId === publicId,
            );
            if (saved) edit(() => toTripDraft(saved));
          },
          createTrip: (name) => {
            if (name.trim()) edit(() => edits.newTrip(name.trim()));
          },
          resetDraft: () =>
            edit((trip) =>
              edits.resetDraft(trip, serverTrip(get().trips, trip)),
            ),

          setTripDates: (startDate, endDate) =>
            edit((trip) => ({ ...trip, startDate, endDate })),
          setTimeSlot: (slot) => edit((trip) => edits.setTimeSlot(trip, slot)),
          removeTimeSlot: (slotId) =>
            edit((trip) => edits.removeTimeSlot(trip, slotId)),
          toggleReserved: (slotId) =>
            edit((trip) => edits.toggleReserved(trip, slotId)),
          setOpenHours: (id, availability) =>
            edit((trip) => edits.setOpenHours(trip, id, availability)),

          ...createTripSaveActions(set, get),
        };
      },
      {
        name: "voyageurs-trips",
        // Only the unsaved draft is kept. Saved trips always come from the server.
        partialize: ({ currentTrip }) => ({ currentTrip }),
        merge: (persisted, current) => ({
          ...current,
          currentTrip: edits.reconcileDraft(
            (persisted as Partial<Pick<TripState, "currentTrip">> | undefined)
              ?.currentTrip,
            current.trips,
            current.tripsLoadState === "loaded",
          ),
        }),
      },
    ),
  );
