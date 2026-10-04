"use client";

import { useState } from "react";
import { AddressSearch } from "@/components/map-box/address-search";
import type { RouteKind } from "@/components/map-box/directions";
import { MapAndControls, type MapFocus } from "@/components/map-box/map";
import { TripDrawer } from "@/components/trips/trip-drawer";
import { useTravelStore } from "@/providers/travel-store-provider";
import { currentTripFrom } from "@/stores/travel-store";
import { type Coordinates, type PlaceDraft } from "@/utils/interfaces";
import { useShallow } from "zustand/react/shallow";
import { VisitDrawer } from "@/components/trips/visit-drawer";
import { SelectedAddressPopup } from "@/components/map-box/selected-address-popup";

const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

export const MapComponents = ({
  initialCoords,
}: {
  initialCoords?: Coordinates;
}) => {
  const { trips, logSearch, openOrderDrawer } = useTravelStore(
    useShallow(({ trips, logSearch, openOrderDrawer }) => ({
      trips,
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
      <MapAndControls
        shouldUseDarkMode={true}
        initialCoords={initialCoords ?? DEFAULT_COORDS}
        focus={mapFocus}
        stops={current?.stops ?? []}
        onPlace={(place) => setSelected(place)}
        onRouteKind={setRouteKind}
      />

      <AddressSearch
        onSelect={choosePlace}
        proximity={mapFocus?.coordinates ?? initialCoords ?? DEFAULT_COORDS}
      />

      <SelectedAddressPopup selected={selected} setSelected={setSelected} />

      <TripDrawer routeKind={routeKind} />
      {/*Visit checklist stays closed until openVisitDrawer() is called.*/}
      <VisitDrawer />
    </div>
  );
};