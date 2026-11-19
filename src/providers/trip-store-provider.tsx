"use client";

import { type PropsWithChildren, useState } from "react";
import type { TripDto } from "@/types/trip-api";
import {
  createTripStore,
  initTripStore,
  type TripStore,
} from "@/stores/trip-store";
import { createStoreContext } from "./create-store-context";

const { Provider, useSelector } = createStoreContext<TripStore>("useTripStore");

export const useTripStore = useSelector;

export const TripStoreProvider = ({
  children,
  trips,
  tripsServerLoaded,
}: PropsWithChildren<{ trips: TripDto[]; tripsServerLoaded: boolean }>) => {
  const [store] = useState(() =>
    createTripStore(initTripStore(trips, tripsServerLoaded)),
  );
  return <Provider value={store}>{children}</Provider>;
};
