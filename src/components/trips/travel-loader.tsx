"use client";

import { useEffect } from "react";
import { useTravelStore } from "@/providers/travel-store-provider";
import { useUserStore } from "@/providers/user-store-provider";

export const TravelLoader = () => {
  const userInfo = useUserStore((state) => state.userInfo);
  const tripsLoadState = useTravelStore((state) => state.tripsLoadState);
  const searchesLoadState = useTravelStore((state) => state.searchesLoadState);
  const setMode = useTravelStore((state) => state.setMode);
  const markLocalReady = useTravelStore((state) => state.markLocalReady);
  const fetchTrips = useTravelStore((state) => state.fetchTrips);
  const fetchSearches = useTravelStore((state) => state.fetchSearches);

  useEffect(() => {
    if (!userInfo) {
      setMode("local");
      markLocalReady();
      return;
    }

    setMode("account");
    if (tripsLoadState === "idle") void fetchTrips();
    if (searchesLoadState === "idle") void fetchSearches();
  }, [
    userInfo,
    tripsLoadState,
    searchesLoadState,
    setMode,
    markLocalReady,
    fetchTrips,
    fetchSearches,
  ]);

  return null;
};
