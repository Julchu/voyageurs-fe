"use client";

import { type PropsWithChildren, useState } from "react";
import type { PlaceSearch } from "@/types/place";
import {
  createSearchStore,
  initSearchStore,
  type SearchStore,
} from "@/stores/search-store";
import { createStoreContext } from "./create-store-context";

const { Provider, useSelector } =
  createStoreContext<SearchStore>("useSearchStore");

export const useSearchStore = useSelector;

export const SearchStoreProvider = ({
  children,
  searches,
  searchesServerLoaded,
}: PropsWithChildren<{
  searches: PlaceSearch[];
  searchesServerLoaded: boolean;
}>) => {
  const [store] = useState(() =>
    createSearchStore(initSearchStore(searches, searchesServerLoaded)),
  );
  return <Provider value={store}>{children}</Provider>;
};
