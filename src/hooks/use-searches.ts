import { useShallow } from "zustand/react/shallow";
import { useSearchStore } from "@/providers/search-store-provider";
import { useUserStore } from "@/providers/user-store-provider";
import type { PlaceSearchInput } from "@/types/place";

/** The signed-in user's search log from the server, or this browser's signed-out log. */
export const useSearches = () => {
  const signedIn = useUserStore(({ userInfo }) => !!userInfo);
  const { searches, logSearch } = useSearchStore(
    useShallow((state) => ({
      searches: signedIn ? state.searches : state.localSearches,
      logSearch: state.logSearch,
    })),
  );
  return {
    searches,
    logSearch: (entry: PlaceSearchInput) => logSearch(entry, signedIn),
  };
};
