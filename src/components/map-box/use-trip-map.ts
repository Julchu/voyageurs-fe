import { type RefObject, useEffect, useRef } from "react";
import { type Map as MapboxMap, Marker } from "mapbox-gl";
import { useTripStore } from "@/providers/trip-store-provider";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { routeForStops } from "@/components/map-box/utils/directions";
import { drawRoute } from "@/components/map-box/utils/route-layer";
import type { TripStopDraft } from "@/types/trip-draft";
import type { Coordinates } from "@/types/place";

// TODO: route line disabled; set to true to re-enable
const SHOW_ROUTE_LINE: boolean = false;
const ROUTE_DELAY_MS = 400;

const createStopMarker = (map: MapboxMap, stop: TripStopDraft) => {
  const element = document.createElement("button");
  element.type = "button";
  element.className =
    "flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white text-xs font-medium";
  element.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
  return new Marker({ element })
    .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
    .addTo(map);
};

const updateStopMarker = (
  marker: Marker,
  stop: TripStopDraft,
  index: number,
) => {
  marker.setLngLat([stop.coordinates.lng, stop.coordinates.lat]);
  const element = marker.getElement();
  element.setAttribute("aria-label", `Open stop ${index + 1}: ${stop.name}`);
  element.textContent = String(index + 1);
  element.style.background = stop.visited ? "#15803d" : "#1d4ed8";
  // Re-bind so the popup always gets the latest stop.
  element.onclick = (event) => {
    event.stopPropagation();
    openPlacePopup.openWithPayload(stop);
  };
};

/** Numbered markers for the drawer's stops, plus the driving route between them. */
export const useTripMap = (
  map: RefObject<MapboxMap | null>,
  mapLoading: boolean,
) => {
  const stops = useTripStore(({ currentTrip }) => currentTrip?.stops);
  const markers = useRef(new Map<string, Marker>());

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const current = new Set<string>();
    stops?.forEach((stop, index) => {
      current.add(stop.clientId);
      let marker = markers.current.get(stop.clientId);
      if (!marker) {
        marker = createStopMarker(mapInstance, stop);
        markers.current.set(stop.clientId, marker);
      }
      updateStopMarker(marker, stop, index);
    });

    for (const [id, marker] of markers.current) {
      if (current.has(id)) continue;
      marker.remove();
      markers.current.delete(id);
    }
  }, [map, mapLoading, stops]);

  useEffect(() => {
    const currentMarkers = markers.current;
    return () => {
      for (const marker of currentMarkers.values()) marker.remove();
      currentMarkers.clear();
    };
  }, []);

  // Keyed by coordinates only, so loading a stop's details doesn't trigger
  // another billed directions request.
  const routeKey = JSON.stringify(
    stops?.map(({ coordinates: { lat, lng } }) => ({ lat, lng })) ?? [],
  );

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const coordinates = JSON.parse(routeKey) as Coordinates[];
    drawRoute(mapInstance, []);
    if (!SHOW_ROUTE_LINE || coordinates.length < 2) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      void routeForStops(coordinates).then((line) => {
        if (!cancelled) drawRoute(mapInstance, line);
      });
    }, ROUTE_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [map, mapLoading, routeKey]);
};
