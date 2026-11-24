import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaceSearch, PlaceSearchInput } from "@/types/place";
import { errorMessage } from "@/utils/errors";
import { listSearches, postSearch } from "@/api/searches";
import {
  type CollectionLoadState,
  shouldFetchCollection,
} from "@/stores/utils/collection-load";

const MAX_SEARCHES = 100;

export type SearchState = {
  searches: PlaceSearch[];
  searchesLoadState: CollectionLoadState;
  error: string | null;
};

export type SearchActions = {
  fetchSearches: () => Promise<void>;
  logSearch: (entry: PlaceSearchInput) => Promise<void>;
};

export type SearchStore = SearchState & SearchActions;

export const initSearchStore = (
  searches: PlaceSearch[],
  searchesServerLoaded = false,
): SearchState => ({
  searches,
  searchesLoadState: searchesServerLoaded ? "loaded" : "idle",
  error: null,
});

/** Signed-out searches are only kept in this browser. */
const localSearch = (entry: PlaceSearchInput): PlaceSearch => ({
  // TODO: clean up (remove clientId)
  id: entry.id,
  mapboxId: entry.mapboxId,
  clientId: crypto.randomUUID(),
  query: entry.query,
  name: entry.name,
  category: entry.category,
  streetAddress: entry.streetAddress,
  areaAddress: entry.areaAddress,
  coordinates: entry.coordinates,
  searchedAt: new Date().toISOString(),
  createdAt: null,
  updatedAt: null,
});

export const createSearchStore = (initialState: SearchState) =>
  createStore<SearchStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        fetchSearches: async () => {
          if (!shouldFetchCollection(get().searchesLoadState)) return;
          set({ searchesLoadState: "loading" });
          try {
            const searches = await listSearches();
            set({ searches, searchesLoadState: "loaded", error: null });
          } catch (error) {
            console.error("Unable to retrieve searches", error);
            set({ searchesLoadState: "error" });
          }
        },

        logSearch: async (entry) => {
          try {
            const search = (await postSearch(entry)) ?? localSearch(entry);
            set(({ searches }) => ({
              searches: [search, ...searches].slice(0, MAX_SEARCHES),
            }));
          } catch (error) {
            set({ error: errorMessage(error, "Unable to log search") });
          }
        },
      }),
      {
        name: "voyageurs-searches",
        partialize: ({ searches }) => ({ searches }),
        // Only the list is stored; load state always starts fresh.
        merge: (persisted, current) => ({
          ...current,
          searches:
            (persisted as Partial<SearchState> | undefined)?.searches ??
            current.searches,
        }),
      },
    ),
  );
