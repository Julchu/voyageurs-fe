"use client";

import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useStore } from "zustand";
import type { PlaceSearch } from "@/utils/interfaces";
import {
  createSearchStore,
  initSearchStore,
  SearchStore,
  type SearchStoreApi,
} from "@/stores/search-store";

export const SearchStoreContext = createContext<SearchStoreApi | undefined>(
  undefined,
);

export const SearchStoreProvider = ({
  children,
  searches,
  searchesServerLoaded = false,
}: PropsWithChildren<{
  searches: PlaceSearch[];
  searchesServerLoaded: boolean;
}>) => {
  const [store] = useState(() =>
    createSearchStore(initSearchStore(searches, searchesServerLoaded)),
  );
  return (
    <SearchStoreContext.Provider value={store}>
      {children}
    </SearchStoreContext.Provider>
  );
};

export const useSearchStore = <T,>(selector: (store: SearchStore) => T): T => {
  const store = useContext(SearchStoreContext);
  if (!store)
    throw new Error("useSearchStore must be used within SearchStoreProvider");
  return useStore(store, selector);
};