import { type RefObject, useCallback } from "react";
import type { Map } from "mapbox-gl";
import type { Coordinates, MapTimeType } from "@/utils/interfaces";
import { updateRouteAppearance } from "@/components/map-box/utils/route-layer";

export const useMapHook = ({ map }: { map?: RefObject<Map | null> }) => {
  const flyTo = useCallback(
    (coords: Coordinates, zoom = 15) => {
      if (!map?.current) return;
      map.current.flyTo({ center: [coords.lng, coords.lat], zoom });
    },
    [map],
  );

  const triggerNorth = useCallback(() => {
    if (!map?.current) return;
    map.current.resetNorth({ duration: 2000 });
  }, [map]);

  const setLightMode = useCallback(
    (mapTime: MapTimeType) => {
      if (!map?.current) return;
      map.current.setConfigProperty("basemap", "lightPreset", mapTime);
      updateRouteAppearance(map.current);
    },
    [map],
  );

  const setPerformanceMode = useCallback(
    (enabled: boolean) => {
      if (!map?.current) return;
      map.current.setConfigProperty("basemap", "show3dObjects", !enabled);
    },
    [map],
  );

  return { flyTo, triggerNorth, setLightMode, setPerformanceMode };
};
