"use client";

import { MapAndControls } from "@/components/map-box/map";
import { type Coordinates } from "@/utils/interfaces";
// Restore this import and the popup below to switch back to the Mapbox card.
// import { SelectedAddressPopup } from "@/components/place-info-card/selected-address-popup";
import { VisitDrawer } from "@/components/visits-drawer/visit-drawer";
import { SelectedAddressPopup } from "@/components/place-info-card/selected-address-popup";

export const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

export const MapComponents = ({
  initialCoords,
}: {
  initialCoords?: Coordinates;
}) => {
  return (
    <div className="relative h-full w-full">
      <MapAndControls
        shouldUseDarkMode={true}
        initialCoords={initialCoords ?? DEFAULT_COORDS}
      />

      <SelectedAddressPopup provider="mapbox" />
      {/*<GooglePlacePopup />*/}

      {/*Visit checklist stays closed until openVisitDrawer() is called.*/}
      {/* Drawer to show visited places? Calendar view */}
      <VisitDrawer />
    </div>
  );
};