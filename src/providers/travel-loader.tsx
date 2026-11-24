"use client";

import { useEffect } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import { useSearchStore } from "@/providers/search-store-provider";
import { useTripStore } from "@/providers/trip-store-provider";

/** Loads trips and searches on the client when SSR couldn't; each fetch skips itself unless idle. */
export const TravelLoader = () => {
  const signedIn = useUserStore(({ userInfo }) => !!userInfo);
  const fetchTrips = useTripStore(({ fetchTrips }) => fetchTrips);
  const fetchSearches = useSearchStore(({ fetchSearches }) => fetchSearches);

  useEffect(() => {
    if (!signedIn) return;
    void fetchTrips();
    void fetchSearches();
  }, [signedIn, fetchTrips, fetchSearches]);

  return null;
};
