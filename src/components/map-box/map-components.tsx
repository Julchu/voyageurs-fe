"use client";

import { useState } from "react";
import { AddressSearch } from "@/components/map-box/address-search";
import type { RouteKind } from "@/components/map-box/utils/directions";
import { MapAndControls, type MapFocus } from "@/components/map-box/map";
import { TripDrawer } from "@/components/trips/trip-drawer";
import { useTripStore } from "@/providers/trip-store-provider";
import { type Coordinates, type Place } from "@/utils/interfaces";
import { useShallow } from "zustand/react/shallow";
import { SelectedAddressPopup } from "@/components/map-box/selected-address-popup";
import { useSearchStore } from "@/providers/search-store-provider";

const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

export const MapComponents = ({
  initialCoords,
}: {
  initialCoords?: Coordinates;
}) => {
  const { currentTrip } = useTripStore(
    useShallow(({ currentTrip }) => ({
      currentTrip,
    })),
  );

  const logSearch = useSearchStore(({ logSearch }) => logSearch);

  const [selected, setSelected] = useState<Place | null>(null);
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);
  const [routeKind, setRouteKind] = useState<RouteKind>("empty");

  const choosePlace = (place: Place, query: string, log: boolean) => {
    setSelected(place);
    setMapFocus({ token: Date.now(), coordinates: place.coordinates });
    if (log) void logSearch({ ...place, query });
  };

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return <div className="p-6">Missing NEXT_PUBLIC_MAPBOX_TOKEN</div>;
  }

  return (
    <div className="relative h-full w-full">
      <MapAndControls
        shouldUseDarkMode={true} // TODO: calc dark mode from time and user preferences: light/dark/auto (unset)
        initialCoords={initialCoords ?? DEFAULT_COORDS}
        focus={mapFocus}
        stops={currentTrip?.stops ?? []}
        onPlace={(place) => setSelected(place)}
        onRouteKind={setRouteKind}
      />

      <AddressSearch
        onSelect={choosePlace}
        proximity={mapFocus?.coordinates ?? initialCoords ?? DEFAULT_COORDS}
      />

      <SelectedAddressPopup selected={selected} setSelected={setSelected} />

      <TripDrawer />
      {/*Visit checklist stays closed until openVisitDrawer() is called.*/}

      {/* Drawer to show visited places? */}
      {/*<VisitDrawer />*/}
    </div>
  );
};