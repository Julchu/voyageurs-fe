import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaceSearch, PlaceSearchInput } from "@/types/place";
import { listSearches, postSearch } from "@/api/searches";
import { placeRecord } from "@/utils/place-record";
import {
  type CollectionLoadState,
  shouldFetchCollection,
} from "@/stores/utils/collection-load";

const MAX_SEARCHES = 100;

type SearchState = {
  /** The signed-in user's log, from the server. Never persisted. */
  searches: PlaceSearch[];
  /** The signed-out log, kept only in this browser. */
  localSearches: PlaceSearch[];
  searchesLoadState: CollectionLoadState;
};

type SearchActions = {
  fetchSearches: () => Promise<void>;
  logSearch: (entry: PlaceSearchInput, signedIn: boolean) => Promise<void>;
  /** Empties both logs, in memory and in this browser. */
  clear: () => void;
};

type SearchStore = SearchState & SearchActions;

export const initSearchStore = (
  searches: PlaceSearch[],
  searchesServerLoaded = false,
): SearchState => ({
  searches,
  localSearches: [],
  searchesLoadState: searchesServerLoaded ? "loaded" : "idle",
});

/** Only the fields we keep. Display-only data (photos, details) is dropped. */
const searchRecord = (entry: PlaceSearchInput): PlaceSearchInput => ({
  ...placeRecord(entry),
  query: entry.query,
});

const localSearch = (record: PlaceSearchInput): PlaceSearch => ({
  ...record,
  // TODO: clean up (remove clientId)
  clientId: crypto.randomUUID(),
  searchedAt: new Date().toISOString(),
  createdAt: null,
  updatedAt: null,
});

const prepend = (search: PlaceSearch, list: PlaceSearch[]) =>
  [search, ...list].slice(0, MAX_SEARCHES);

export const createSearchStore = (initialState: SearchState) =>
  createStore<SearchStore>()(
    persist(
      (set, get, api) => ({
        ...initialState,

        fetchSearches: async () => {
          if (!shouldFetchCollection(get().searchesLoadState)) return;
          set({ searchesLoadState: "loading" });
          try {
            set({
              searches: await listSearches(),
              searchesLoadState: "loaded",
            });
          } catch (error) {
            console.error("Unable to retrieve searches", error);
            set({ searchesLoadState: "error" });
          }
        },

        logSearch: async (entry, signedIn) => {
          try {
            const record = searchRecord(entry);
            const saved = signedIn ? await postSearch(record) : null;
            set(({ searches, localSearches }) =>
              saved
                ? { searches: prepend(saved, searches) }
                : {
                    localSearches: prepend(localSearch(record), localSearches),
                  },
            );
          } catch (error) {
            console.error("Unable to log search", error);
          }
        },

        clear: () => {
          set(initSearchStore([]));
          api.persist.clearStorage();
        },
      }),
      {
        name: "voyageurs-searches",
        version: 1,
        partialize: ({ localSearches }) => ({ localSearches }),
        // v0 stored server and local searches in one list; keep only the local ones.
        migrate: (persisted) => ({
          localSearches: (
            (persisted as { searches?: PlaceSearch[] } | undefined)?.searches ??
            []
          ).filter((search) => !search.publicId),
        }),
      },
    ),
  );
