import { type RefObject, useEffect, useRef } from "react";
import { type Map as MapboxMap, Marker } from "mapbox-gl";
import { useTripStore } from "@/providers/trip-store-provider";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { routeForStops } from "@/components/map-box/utils/directions";
import { drawRoute } from "@/components/map-box/utils/route-layer";
import type { Coordinates } from "@/utils/interfaces";

export const useTripMap = (
  map: RefObject<MapboxMap | null>,
  mapLoading: boolean,
) => {
  const stops = useTripStore(({ currentTrip }) => currentTrip?.stops);
  const markers = useRef(new Map<string, Marker>());

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const seen = new Set<string>();
    stops?.forEach((stop, index) => {
      const key = stop.clientId;
      seen.add(key);
      let marker = markers.current.get(key);

      if (!marker) {
        const element = document.createElement("button");
        element.type = "button";
        element.className =
          "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-medium";
        element.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
        marker = new Marker({ element })
          .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
          .addTo(mapInstance);
        markers.current.set(key, marker);
      }

      marker.setLngLat([stop.coordinates.lng, stop.coordinates.lat]);
      const element = marker.getElement();
      element.setAttribute(
        "aria-label",
        `Open stop ${index + 1}: ${stop.name}`,
      );
      element.textContent = String(index + 1);
      element.style.background = stop.visited ? "#15803d" : "#1d4ed8";
      // Re-bind so the popup always receives the latest stop metadata.
      element.onclick = (event) => {
        event.stopPropagation();
        openPlacePopup.openWithPayload(stop);
      };
    });

    for (const [key, marker] of markers.current) {
      if (seen.has(key)) continue;
      marker.remove();
      markers.current.delete(key);
    }
  }, [map, mapLoading, stops]);

  useEffect(() => {
    const currentMarkers = markers.current;
    return () => {
      for (const marker of currentMarkers.values()) marker.remove();
      currentMarkers.clear();
    };
  }, []);

  // Metadata enrichment must not trigger another billed directions request.
  const routeKey = JSON.stringify(
    stops?.map(({ coordinates: { lat, lng } }) => ({ lat, lng })) ?? [],
  );

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const coordinates = JSON.parse(routeKey) as Coordinates[];
    drawRoute(mapInstance, []);
    if (coordinates.length < 2) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void routeForStops(coordinates).then((route) => {
        if (!cancelled) drawRoute(mapInstance, route.line);
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [map, mapLoading, routeKey]);
};
