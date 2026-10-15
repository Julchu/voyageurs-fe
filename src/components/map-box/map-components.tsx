"use client";

import { useState } from "react";
import { AddressSearch } from "@/components/map-box/address-search";
import { MapAndControls, type MapFocus } from "@/components/map-box/map";
import { useTripStore } from "@/providers/trip-store-provider";
import { type Coordinates, type Place } from "@/utils/interfaces";
import { useShallow } from "zustand/react/shallow";
import { SelectedAddressPopup } from "@/components/map-box/selected-address-popup";
import { useSearchStore } from "@/providers/search-store-provider";
import { VisitDrawer } from "@/components/trips/visit-drawer";
import { Dialog } from "@base-ui/react/dialog";

const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

export const openPlacePopup = Dialog.createHandle<
  Place & { clientId?: string; publicId?: string }
>();

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
  const [mapFocus, setMapFocus] = useState<MapFocus | null>(null);

  const choosePlace = (place: Place, query: string, log: boolean) => {
    openPlacePopup.openWithPayload(place);
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
      />

      <AddressSearch
        onSelect={choosePlace}
        proximity={mapFocus?.coordinates ?? initialCoords ?? DEFAULT_COORDS}
      />

      <SelectedAddressPopup />

      {/*Visit checklist stays closed until openVisitDrawer() is called.*/}
      {/* Drawer to show visited places? Calendar view */}
      <VisitDrawer />
    </div>
  );
};
