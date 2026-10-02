"use client";

import { useState } from "react";
import { AddressSearch } from "@/components/map-box/address-search";
import type { RouteKind } from "@/components/map-box/directions";
import MapBoxMap, { type MapFocus } from "@/components/map-box/map";
import { TripDrawer, tripDrawerHandle } from "@/components/trips/trip-drawer";
import { VisitDrawer } from "@/components/trips/visit-drawer";
import { useTravelStore } from "@/providers/travel-store-provider";
import { currentTripFrom } from "@/stores/travel-store";
import { type Coordinates, MapTime, type PlaceDraft } from "@/utils/interfaces";
import { useShallow } from "zustand/react/shallow";
import { Drawer } from "@base-ui/react/drawer";

const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

export const MapWorkspace = ({ focus }: { focus?: Coordinates }) => {
  const { trips, addStop, logSearch, openOrderDrawer } = useTravelStore(
    useShallow(({ trips, addStop, logSearch, openOrderDrawer }) => ({
      trips,
      addStop,
      logSearch,
      openOrderDrawer,
    })),
  );

  const current = currentTripFrom(trips);
  const [selected, setSelected] = useState<PlaceDraft | null>(null);
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);
  const [routeKind, setRouteKind] = useState<RouteKind>("empty");

  const choosePlace = (place: PlaceDraft, query: string, log: boolean) => {
    setSelected(place);
    setMapFocus({ token: Date.now(), coordinates: place.coordinates });
    if (log) void logSearch({ ...place, query });
  };

  return (
    <div className="relative h-full w-full">
      <MapBoxMap
        shouldUseDarkMode={false}
        mapTimeMode={MapTime.day}
        initialCoords={focus ?? DEFAULT_COORDS}
        focus={mapFocus}
        stops={current?.stops ?? []}
        onPlace={(place) => setSelected(place)}
        onRouteKind={setRouteKind}
      />
      <AddressSearch
        onSelect={choosePlace}
        proximity={mapFocus?.coordinates ?? focus ?? DEFAULT_COORDS}
      />

      <Drawer.Trigger handle={tripDrawerHandle}>
        <div className="absolute bottom-5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/95 px-4 py-2 text-sm font-medium tracking-widest text-zinc-900 shadow">
          Trip
        </div>
      </Drawer.Trigger>

      {selected ? (
        <div className="absolute bottom-20 left-1/2 z-20 w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl bg-white/95 p-3 text-neutral-950 shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{selected.name}</p>
              <p className="truncate text-xs text-neutral-500">
                {selected.address || "No address yet"}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-neutral-500"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>
          <button
            type="button"
            className="mt-3 rounded-full bg-blue-600 px-3 py-1.5 text-sm text-white"
            onClick={() => {
              void addStop(selected);
              setSelected(null);
            }}
          >
            Add to trip
          </button>
        </div>
      ) : null}

      <TripDrawer routeKind={routeKind} />
      {/* Visit checklist stays closed until openVisitDrawer() is called. */}
      <VisitDrawer />
    </div>
  );
};