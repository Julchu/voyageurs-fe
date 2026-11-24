import "mapbox-gl/dist/mapbox-gl.css";
import mapBoxGL, { type Map as MapboxMap } from "mapbox-gl";
import { useEffect, useRef } from "react";
import { cn } from "cn";
import { Controls } from "@/components/map-controls/controls";
import {
  applyStandardOverrides,
  buildStandardStyle,
} from "@/components/map-box/utils/mapbox-standard-styling";
import { addPoiInteractions } from "@/components/map-box/utils/poi-interactions";
import { AddressSearch } from "@/components/location-search-box/address-search";
import { TripDrawer } from "@/components/trips-drawer/trip-drawer";
import { useMapStore } from "@/components/map-box/map-store";
import { useMapLocation } from "@/components/map-box/use-map-location";
import { useTripMap } from "@/components/map-box/use-trip-map";
import { darkMode } from "@/utils/map-time";
import { useHydrated } from "@/hooks/use-hydrated";

const DEFAULT_CENTER: [lng: number, lat: number] = [-79.387054, 43.642567];

export const MapAndControls = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const setMap = useMapStore((state) => state.setMap);
  // Local time is client-only: the server renders the light background.
  const dark = useHydrated() && darkMode();

  useEffect(() => {
    if (!mapContainer.current) return;
    let removeInteractions: (() => void) | undefined;
    let cancelOverrides: (() => void) | undefined;

    mapBoxGL.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    let map: MapboxMap;
    try {
      map = new mapBoxGL.Map({
        attributionControl: false,
        container: mapContainer.current,
        center: DEFAULT_CENTER,
        zoom: 15.5,
        antialias: true,
        crossSourceCollisions: true,
        performanceMetricsCollection: false,
        style: buildStandardStyle(),
      });
    } catch (error) {
      // TODO: show a map error state instead of the loading spinner.
      console.error("Map failed to start", error);
      return;
    }

    map.on("style.load", () => {
      cancelOverrides?.();
      cancelOverrides = applyStandardOverrides(map);
      map.resize();
    });
    map.on("load", () => {
      removeInteractions = addPoiInteractions(map);
      setMap(map);
    });

    return () => {
      setMap(null);
      cancelOverrides?.();
      removeInteractions?.();
      map.remove();
    };
  }, [setMap]);

  const { locationLoading, triggerGeolocator } = useMapLocation();
  useTripMap();

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden drop-shadow-lg",
        dark ? "bg-slate-800" : "bg-gray-100",
      )}
    >
      <div
        className={cn(
          "h-full w-full [&_.mapboxgl-ctrl-bottom-left]:hidden [&_.mapboxgl-ctrl-top-right]:hidden",
          locationLoading && "animate-pulse",
        )}
        ref={mapContainer}
      />
      <Controls
        locationLoading={locationLoading}
        triggerGeolocator={triggerGeolocator}
      />
      <AddressSearch />
      <TripDrawer />
    </div>
  );
};
