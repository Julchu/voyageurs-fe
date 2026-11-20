"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useStore } from "zustand";
import {
  createStopDetailsStore,
  type StopDetailsStore,
  type StopDetailsStoreApi,
} from "@/stores/stop-details-store";

export const StopDetailsStoreContext = createContext<
  StopDetailsStoreApi | undefined
>(undefined);

export const StopDetailsStoreProvider = ({ children }: PropsWithChildren) => {
  const [store] = useState(createStopDetailsStore);
  return (
    <StopDetailsStoreContext.Provider value={store}>
      {children}
    </StopDetailsStoreContext.Provider>
  );
};

export const useStopDetailsStore = <T,>(
  selector: (store: StopDetailsStore) => T,
): T => {
  const store = useContext(StopDetailsStoreContext);
  if (!store)
    throw new Error(
      "useStopDetailsStore must be used within StopDetailsStoreProvider",
    );
  return useStore(store, selector);
};
