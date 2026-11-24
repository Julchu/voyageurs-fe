import { createStore } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaceSearch, PlaceSearchInput } from "@/types/place";
import { errorMessage } from "@/utils/errors";
import {
  type CollectionLoadState,
  fetchCollection,
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

/** The saved search, or null when signed out. */
const postSearch = async (
  entry: PlaceSearchInput,
): Promise<PlaceSearch | null> => {
  const response = await fetch("/api/searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (response.status === 401) return null;

  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Unable to log search");
  if (!body?.publicId) throw new Error("Invalid search response");
  return body as PlaceSearch;
};

export const createSearchStore = (initialState: SearchState) =>
  createStore<SearchStore>()(
    persist(
      (set, get) => ({
        ...initialState,

        fetchSearches: async () => {
          if (!shouldFetchCollection(get().searchesLoadState)) return;
          set({ searchesLoadState: "loading" });
          try {
            const searches = await fetchCollection<PlaceSearch>(
              "/api/searches",
              "Search",
            );
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
