import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import { isStale, isTripDirty, serverTrip } from "@/utils/trip-sync";

/** The trip draft shared by the drawer and calendar, with its Save and Reset. */
export const useTripDraft = () => {
  const user = useUserStore((state) => state.userInfo);
  const { trip, saved, save, notice, loadState, saveTrip, reset } =
    useTripStore(
      useShallow((state) => ({
        trip: state.currentTrip,
        saved: serverTrip(state.trips, state.currentTrip),
        save: state.save,
        notice: state.notice,
        loadState: state.tripsLoadState,
        saveTrip: state.saveTrip,
        reset: state.resetDraft,
      })),
    );

  // TODO: Show the save error, move notice and a stale draft to the user.
  return {
    trip,
    isDirty: isTripDirty(trip, saved),
    isSaving: save.status === "saving",
    canSave: !!user && loadState !== "loading" && !isStale(trip, saved),
    error: save.status === "error" ? save.message : undefined,
    notice,
    save: saveTrip,
    reset,
  };
};
