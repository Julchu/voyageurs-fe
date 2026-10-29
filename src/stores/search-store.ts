import { create } from "zustand";
import { persist } from "zustand/middleware";
import { googlePersistablePlace } from "@/utils/google-place-persistence";
import type { PlaceSearch, PlaceSearchInput } from "@/utils/interfaces";
import {
  type CollectionLoadState,
  fetchCollection,
  loadStateFromServer,
  nextLoadStateForFetch,
} from "@/stores/utils/collection-load";

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
          const localSearch = (): PlaceSearch => ({
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
              body: JSON.stringify(googlePersistablePlace(entry)),
            });
            if (response.status === 401) {
              set((state) => ({
                mode: "local",
                searches: [localSearch(), ...state.searches].slice(0, 100),
              }));
              return;
            }
            const body = await response.json();
            if (!response.ok) {
              throw new Error(body.error ?? "Unable to log search");
            }
            const search = body as PlaceSearch;
            if (!search?.publicId) throw new Error("Invalid search response");
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
        partialize: ({ searches }) => ({
          searches: searches.map(googlePersistablePlace),
        }),
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