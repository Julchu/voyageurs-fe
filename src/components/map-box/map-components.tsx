"use client";

import { MapAndControls } from "@/components/map-box/map";
import { MapStoreProvider } from "@/components/map-box/map-store";
import { VisitDrawer } from "@/components/visits-drawer/visit-drawer";
import { SelectedAddressPopup } from "@/components/place-info-card/selected-address-popup";

export const MapComponents = () => {
  return (
    <MapStoreProvider>
      <div className="relative h-full w-full">
        <MapAndControls />

        <SelectedAddressPopup />
        {/*<GooglePlacePopup />*/}

        {/* Drawer to show visited places? Calendar view */}
        <VisitDrawer />
      </div>
    </MapStoreProvider>
  );
};
