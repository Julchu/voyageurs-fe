"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { isTripDirty, serverTrip } from "@/utils/trip-sync";

/** The trip draft shared by the drawer and calendar, with its Save and Reset. */
export const useTripDraft = () => {
  const user = useUserStore((state) => state.userInfo);
  const { trip, saved, status, error, loadState, save, reset } = useTripStore(
    useShallow((state) => ({
      trip: state.currentTrip,
      saved: serverTrip(state.trips, state.currentTrip),
      status: state.tripSaveStatus,
      error: state.tripSaveError,
      loadState: state.tripsLoadState,
      save: state.saveTrip,
      reset: state.resetDraft,
    })),
  );
  const isDirty = useMemo(
    () => !!trip && isTripDirty(trip, saved),
    [trip, saved],
  );
  // The draft started from an older version, e.g. after a save in another tab.
  const isStale = !!trip?.publicId && trip.version !== saved?.version;

  // TODO: Show error and isStale to the user.
  return {
    trip,
    saved,
    isDirty,
    isSaving: status === "saving",
    canSave: !!user && !!trip && loadState !== "loading" && !isStale,
    error,
    save,
    reset,
  };
};
