"use client";

import { MapAndControls } from "@/components/map-box/map";
import { type Coordinates } from "@/utils/interfaces";
import { VisitDrawer } from "@/components/visits-drawer/visit-drawer";
import { SelectedAddressPopup } from "@/components/place-info-card/selected-address-popup";

export const DEFAULT_COORDS = { lng: -79.387054, lat: 43.642567 };

// TODO: check if initialCoords are even being sent
export const MapComponents = ({
  initialCoords,
}: {
  initialCoords?: Coordinates;
}) => {
  return (
    <div className="relative h-full w-full">
      <MapAndControls initialCoords={initialCoords ?? DEFAULT_COORDS} />

      <SelectedAddressPopup provider="mapbox" />
      {/*<GooglePlacePopup />*/}

      {/*Visit checklist stays closed until openVisitDrawer() is called.*/}
      {/* Drawer to show visited places? Calendar view */}
      <VisitDrawer />
    </div>
  );
};