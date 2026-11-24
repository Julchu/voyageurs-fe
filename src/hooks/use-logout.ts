import { useSearchStore } from "@/providers/search-store-provider";
import { useStopDetailsStore } from "@/providers/stop-details-store-provider";
import { useTripStore } from "@/providers/trip-store-provider";
import { useUserStore } from "@/providers/user-store-provider";

/** Ends the session and clears every store that holds the user's data. */
export const useLogout = () => {
  const logout = useUserStore((state) => state.logout);
  const clearTrips = useTripStore((state) => state.clearTrips);
  const clearDetails = useStopDetailsStore((state) => state.clearAll);
  const clearSearches = useSearchStore((state) => state.clear);

  return async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Unable to logout", error);
    } finally {
      clearTrips();
      clearDetails();
      clearSearches();
    }
  };
};
