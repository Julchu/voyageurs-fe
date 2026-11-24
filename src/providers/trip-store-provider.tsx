"use client";

import type { TripDto } from "@/types/trip-api";
import { createTripStore, initTripStore } from "@/stores/trip-store";
import { createStoreContext } from "./create-store-context";

const store = createStoreContext(
  "useTripStore",
  (props: { trips: TripDto[]; tripsServerLoaded: boolean }) =>
    createTripStore(initTripStore(props.trips, props.tripsServerLoaded)),
);

export const TripStoreProvider = store.Provider;
export const useTripStore = store.useSelector;
