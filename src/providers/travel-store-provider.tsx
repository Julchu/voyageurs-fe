"use client";

import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { useStore } from "zustand";
import type { PlaceSearch, ServerTrip } from "@/utils/interfaces";
import {
  createTravelStore,
  initTravelStore,
  type TravelStore,
  type TravelStoreApi,
} from "@/stores/travel-store";

export const TravelStoreContext = createContext<TravelStoreApi | undefined>(undefined);

export const TravelStoreProvider = ({
  children,
  trips,
  searches,
}: PropsWithChildren<{
  trips: ServerTrip[] | null;
  searches: PlaceSearch[] | null;
}>) => {
  const [store] = useState(() => createTravelStore(initTravelStore(trips, searches)));
  return <TravelStoreContext.Provider value={store}>{children}</TravelStoreContext.Provider>;
};

export const useTravelStore = <T,>(selector: (store: TravelStore) => T): T => {
  const store = useContext(TravelStoreContext);
  if (!store) throw new Error("useTravelStore must be used within TravelStoreProvider");
  return useStore(store, selector);
};
