"use client";

import { createStopDetailsStore } from "@/stores/stop-details-store";
import { createStoreContext } from "./create-store-context";

const store = createStoreContext("useStopDetailsStore", createStopDetailsStore);

export const StopDetailsStoreProvider = store.Provider;
export const useStopDetailsStore = store.useSelector;
