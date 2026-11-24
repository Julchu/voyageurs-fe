import type { Map as MapboxMap } from "mapbox-gl";
import { createStore } from "zustand";
import { createStoreContext } from "@/providers/create-store-context";

type MapStore = {
  /** Null until the map has loaded, and again after it is torn down. */
  map: MapboxMap | null;
  setMap: (map: MapboxMap | null) => void;
};

const store = createStoreContext("useMapStore", () =>
  createStore<MapStore>()((set) => ({
    map: null,
    setMap: (map) => set({ map }),
  })),
);

export const MapStoreProvider = store.Provider;
export const useMapStore = store.useSelector;
