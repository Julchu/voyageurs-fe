"use client";

import { type PropsWithChildren, useState } from "react";
import {
  createStopDetailsStore,
  type StopDetailsStore,
} from "@/stores/stop-details-store";
import { createStoreContext } from "./create-store-context";

const { Provider, useSelector } = createStoreContext<StopDetailsStore>(
  "useStopDetailsStore",
);

export const useStopDetailsStore = useSelector;

export const StopDetailsStoreProvider = ({ children }: PropsWithChildren) => {
  const [store] = useState(createStopDetailsStore);
  return <Provider value={store}>{children}</Provider>;
};
