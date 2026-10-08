import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlaceSearch, PlaceSearchInput } from "@/utils/interfaces";
import {
  type CollectionLoadState,
  fetchCollection,
  loadStateFromServer,
  nextLoadStateForFetch,
} from "@/stores/collection-load";

export type SearchState = {
  searches: PlaceSearch[];
  searchesLoadState: CollectionLoadState;
  error: string | null;
  searchesVersion: number;
};

export type SearchActions = {
  fetchSearches: () => Promise<void>;
  logSearch: (entry: PlaceSearchInput) => Promise<void>;
};

export type SearchStore = SearchState & SearchActions;

const messageFrom = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const initSearchStore = (
  searches: PlaceSearch[],
  searchesServerLoaded = false,
): SearchState => ({
  searches,
  searchesLoadState: loadStateFromServer(searchesServerLoaded),
  error: null,
  searchesVersion: 1,
});

export const createSearchStore = (initialState: SearchState) => {
  return create<SearchStore>()(
    persist(
      (set, get) => ({
        ...initialState,
        fetchSearches: async () => {
          const next = nextLoadStateForFetch(get().searchesLoadState);
          if (!next.shouldFetch) return;
          set({ searchesLoadState: next.loadState });
          try {
            const searches = await fetchCollection<PlaceSearch[]>(
              "/api/searches",
              "searches",
              "Search",
            );
            set({ searches, searchesLoadState: "loaded", error: null });
          } catch (error) {
            console.error("Unable to retrieve searches", error);
            set({ searchesLoadState: "error" });
          }
        },
        logSearch: async (entry) => {
          const localSearch = (): PlaceSearch => ({
            // TODO: clean up (remove publicId)
            id: entry.id,
            publicId: crypto.randomUUID(),
            query: entry.query,
            name: entry.name,
            address: entry.address,
            coordinates: entry.coordinates,
            searchedAt: new Date().toISOString(),
          });

          // if (get().mode === "local") {
          //   set((state) => ({
          //     searches: [localSearch(), ...state.searches].slice(0, 100),
          //   }));
          //   return;
          // }

          try {
            const response = await fetch("/api/searches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(entry),
            });
            if (response.status === 401) {
              set((state) => ({
                mode: "local",
                searches: [localSearch(), ...state.searches].slice(0, 100),
              }));
              return;
            }
            const body = (await response.json()) as {
              search?: PlaceSearch;
              error?: string;
            };
            const search = body.search;
            if (!response.ok || !search) {
              throw new Error(body.error ?? "Unable to log search");
            }
            set((state) => ({
              searches: [search, ...state.searches].slice(0, 100),
            }));
          } catch (error) {
            set({ error: messageFrom(error, "Unable to log search") });
          }
        },
      }),
      {
        name: "voyageurs-searches",
        partialize: ({ searches }) => ({ searches }),
        merge: (persisted, current) => {
          const saved = persisted as Partial<Pick<SearchState, "searches">>;
          return {
            ...current,
            searches: saved.searches ?? current.searches,
          };
        },
      },
    ),
  );
};

export type SearchStoreApi = ReturnType<typeof createSearchStore>;