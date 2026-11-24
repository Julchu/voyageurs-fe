"use client";

import type { PlaceSearch } from "@/types/place";
import { createSearchStore, initSearchStore } from "@/stores/search-store";
import { createStoreContext } from "./create-store-context";

const store = createStoreContext(
  "useSearchStore",
  (props: { searches: PlaceSearch[]; searchesServerLoaded: boolean }) =>
    createSearchStore(
      initSearchStore(props.searches, props.searchesServerLoaded),
    ),
);

export const SearchStoreProvider = store.Provider;
export const useSearchStore = store.useSelector;
