import "mapbox-gl/dist/mapbox-gl.css";
import "./map.css";
import mapBoxGL, { type Map as MapboxMap } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { Controls } from "@/components/map-controls/controls";
import type { Coordinates } from "@/utils/interfaces";
import {
  applyStandardOverrides,
  buildStandardStyle,
} from "@/components/map-box/utils/mapbox-standard-styling";
import { addPoiInteractions } from "@/components/map-box/utils/poi-interactions";
import { AddressSearch } from "@/components/location-search-box/address-search";
import { TripDrawer } from "@/components/trips-drawer/trip-drawer";
import { useMapLocation } from "@/hooks/use-map-location";
import { useTripMap } from "@/hooks/use-trip-map";
import { darkMode } from "@/utils/map-time";

export const MapAndControls = ({
  initialCoords,
}: {
  initialCoords: Coordinates;
}) => {
  const map = useRef<MapboxMap | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  // The starting center is only used when mounting the map.
  const initialCenter = useRef(initialCoords);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapFocus, setMapFocus] = useState<Coordinates | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    let removeInteractions: (() => void) | undefined;
    let cancelOverrides: (() => void) | undefined;

    try {
      mapBoxGL.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const { lng, lat } = initialCenter.current;
      const mapInstance = new mapBoxGL.Map({
        attributionControl: false,
        container: mapContainer.current,
        center: [lng, lat],
        zoom: 15.5,
        antialias: true,
        crossSourceCollisions: true,
        performanceMetricsCollection: false,
        style: buildStandardStyle(),
      });
      map.current = mapInstance;

      mapInstance.on("style.load", () => {
        cancelOverrides?.();
        cancelOverrides = applyStandardOverrides(mapInstance);
        mapInstance.resize();
      });
      mapInstance.on("load", () => {
        removeInteractions = addPoiInteractions(mapInstance);
      });
      mapInstance.on("idle", () => {
        const { lat, lng } = mapInstance.getCenter();
        setMapFocus((previous) =>
          previous?.lat === lat && previous.lng === lng
            ? previous
            : { lat, lng },
        );
        setMapLoading(false);
      });
    } catch (error) {
      console.error("Map failed to start", error);
      queueMicrotask(() => setMapLoading(false));
    }

    return () => {
      cancelOverrides?.();
      removeInteractions?.();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const { locationLoading, triggerGeolocator } = useMapLocation(
    map,
    mapLoading,
  );
  useTripMap(map, mapLoading);

  return (
    <div
      className={`relative h-full w-full overflow-hidden drop-shadow-lg ${
        darkMode() ? "bg-slate-800" : "bg-gray-100"
      }`}
    >
      <div
        className={`h-full w-full ${locationLoading ? "animate-pulse" : ""}`}
        ref={mapContainer}
      />
      <Controls
        map={map}
        mapLoading={mapLoading}
        locationLoading={locationLoading}
        triggerGeolocator={triggerGeolocator}
      />
      <AddressSearch proximity={mapFocus ?? initialCoords} />
      <TripDrawer map={map} />
    </div>
  );
};
