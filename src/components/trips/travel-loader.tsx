"use client";

import { useEffect } from "react";
import { useUserStore } from "@/providers/user-store-provider";
import { useSearchStore } from "@/providers/search-store-provider";
import { useShallow } from "zustand/react/shallow";
import { useTripStore } from "@/providers/trip-store-provider";

export const TravelLoader = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const { tripsLoadState, fetchTrips } = useTripStore(
    useShallow(({ tripsLoadState, fetchTrips }) => ({
      tripsLoadState,
      fetchTrips,
    })),
  );
  const { searchesLoadState, fetchSearches } = useSearchStore(
    useShallow(({ searchesLoadState, fetchSearches }) => ({
      searchesLoadState,
      fetchSearches,
    })),
  );

  useEffect(() => {
    if (tripsLoadState === "idle") void fetchTrips();
    if (searchesLoadState === "idle") void fetchSearches();
  }, [fetchSearches, fetchTrips, searchesLoadState, tripsLoadState, userInfo]);

  return null;
};