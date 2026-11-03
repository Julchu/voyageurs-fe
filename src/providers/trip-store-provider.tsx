"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useStore } from "zustand";
import type { TripDto } from "@/types/trip-api";
import {
  createTripStore,
  initTripStore,
  type TripStore,
  type TripStoreApi,
} from "@/stores/trip-store";

export const TripStoreContext = createContext<TripStoreApi | undefined>(
  undefined,
);

export const TripStoreProvider = ({
  children,
  trips,
  tripsServerLoaded = false,
}: PropsWithChildren<{
  trips: TripDto[];
  tripsServerLoaded: boolean;
}>) => {
  const [store] = useState(() =>
    createTripStore(initTripStore(trips, tripsServerLoaded)),
  );
  return (
    <TripStoreContext.Provider value={store}>
      {children}
    </TripStoreContext.Provider>
  );
};

export const useTripStore = <T,>(selector: (store: TripStore) => T): T => {
  const store = useContext(TripStoreContext);
  if (!store)
    throw new Error("useTripStore must be used within TripStoreProvider");
  return useStore(store, selector);
};
