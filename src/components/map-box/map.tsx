import "mapbox-gl/dist/mapbox-gl.css";
import "./map.css";
import mapBoxGL, { type Map as MapboxMap, type Marker } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import { Controls } from "@/components/map-box/controls";
import { googleRouteForStops } from "@/components/map-box/utils/google-directions";
import { placeFromFeature } from "@/components/map-box/utils/place-geocoding";
import { useMapHook } from "@/hooks/use-map-hook";
import { useUserStore } from "@/providers/user-store-provider";
import { Coordinates, TripStop } from "@/utils/interfaces";
import { mapTimeFromDate } from "@/utils/map-time";
import {
  applyStandardOverrides,
  buildStandardStyle,
} from "@/components/map-box/utils/standard-overrides";
import { drawRoute } from "@/components/map-box/utils/route-layer";
import { TripDrawer } from "@/components/trips/trip-drawer";
import { useShallow } from "zustand/react/shallow";
import { openPlacePopup } from "@/components/map-box/map-components";

const stopMarker = (index: number, visited: boolean) => {
  const element = document.createElement("div");
  element.className =
    "w-7 h-7 rounded-full flex items-center justify-center bg-blue-500 text-xs font-medium border-white border-2";
  element.textContent = String(index + 1);
  element.style.background = visited ? "#15803d" : "#1d4ed8";
  element.style.boxShadow = "0 1px 4px rgba(0,0,0,0.35)";
  return element;
};

export type MapFocus = {
  token: number;
  coordinates: Coordinates;
};

// TODO: switch loading state to loaded state and move up 1
export const MapAndControls = ({
  shouldUseDarkMode,
  initialCoords,
  focus,
  stops,
}: {
  shouldUseDarkMode: boolean;
  initialCoords: Coordinates;
  focus: MapFocus | null;
  stops: TripStop[];
}) => {
  const { lastLocation, setLastLocation } = useUserStore(
    useShallow(({ lastLocation, setLastLocation }) => ({
      lastLocation,
      setLastLocation,
    })),
  );
  const map = useRef<MapboxMap | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<Marker>();
  const stopMarkers = useRef<globalThis.Map<string, Marker>>(
    new globalThis.Map(),
  );

  const [currentMapTimeMode, setCurrentMapTimeMode] = useState(() =>
    mapTimeFromDate(),
  );

  const [{ markers, addMarker, flyTo }] = useMapHook({
    map,
    mapLoading,
    setMapLoading,
    shouldUseDarkMode,
  });

  useEffect(() => {
    if (!map.current && mapContainer.current !== null) {
      try {
        mapBoxGL.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        map.current = new mapBoxGL.Map({
          attributionControl: false,
          container: mapContainer.current,
          center: [initialCoords.lng, initialCoords.lat],
          zoom: 15.5,
          antialias: true,
          crossSourceCollisions: true,
          performanceMetricsCollection: false,
          style: buildStandardStyle,
        })
          .on("style.load", () => {
            if (!map.current) return;
            applyStandardOverrides(map.current);
            map.current.resize();
          })
          .on("idle", () => setMapLoading(false))
          .on("moveend", () => {
            setLocationLoading(false);
          });
      } catch (error) {
        console.error("Map failed to start", error);
        queueMicrotask(() => setMapLoading(false));
      }
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [initialCoords.lat, initialCoords.lng]);

  // TODO: test streetAddress search flies map
  useEffect(() => {
    if (!focus || mapLoading) return;
    flyTo(focus.coordinates, 15);
  }, [focus, flyTo, mapLoading]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const ids: string[] = [];
    const featuresets = ["poi", "landmark-icons"] as const;
    let openedKey = "";

    for (const featuresetId of featuresets) {
      const target = { featuresetId, importId: "basemap" };

      const clickId = `${featuresetId}-click`;
      mapInstance.addInteraction(clickId, {
        type: "click",
        target,
        handler: (e) => {
          const place = e.feature ? placeFromFeature(e.feature) : null;
          if (!place) return;
          const key = `${place.name}:${place.coordinates.lat}:${place.coordinates.lng}`;
          // poi and landmark-icons can both report one click. Ignore the
          // duplicate in this turn, then allow the place to be opened again.
          if (openedKey === key) return true;
          openedKey = key;
          queueMicrotask(() => {
            if (openedKey === key) openedKey = "";
          });
          // The popup looks up address, photos, and category when the click
          // doesn't already carry a saved place id.
          openPlacePopup.openWithPayload(place);
          return true; // stop lower-priority interactions
        },
      });
      ids.push(clickId);

      const enterId = `${featuresetId}-enter`;
      mapInstance.addInteraction(enterId, {
        type: "mouseenter",
        target,
        handler: () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        },
      });
      ids.push(enterId);

      const leaveId = `${featuresetId}-leave`;
      mapInstance.addInteraction(leaveId, {
        type: "mouseleave",
        target,
        handler: () => {
          mapInstance.getCanvas().style.cursor = "";
        },
      });
      ids.push(leaveId);
    }

    return () => {
      for (const id of ids) mapInstance.removeInteraction(id);
    };
  }, [mapLoading]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const seen = new Set<string>();
    stops.forEach((stop, index) => {
      const key =
        stop.clientId ??
        stop.publicId ??
        `${stop.name}:${stop.coordinates.lat}:${stop.coordinates.lng}:${index}`;
      seen.add(key);
      const existing = stopMarkers.current.get(key);
      if (existing) {
        existing.setLngLat([stop.coordinates.lng, stop.coordinates.lat]);
        const element = existing.getElement();
        element.textContent = String(index + 1);
        element.style.background = stop.visited ? "#15803d" : "#1d4ed8";
        // Re-bind so the handler always references the current stop data.
        element.onclick = (event) => {
          event.stopPropagation();
          openPlacePopup.openWithPayload(stop);
        };
        return;
      }

      const element = stopMarker(index, stop.visited);
      // The popup reuses saved metadata and fetches anything missing.
      element.style.cursor = "pointer";
      element.onclick = (event) => {
        event.stopPropagation();
        openPlacePopup.openWithPayload(stop);
      };

      const marker = new mapBoxGL.Marker({ element })
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .addTo(mapInstance);
      stopMarkers.current.set(key, marker);
    });

    for (const [publicId, marker] of stopMarkers.current) {
      if (seen.has(publicId)) continue;
      marker.remove();
      stopMarkers.current.delete(publicId);
    }
  }, [mapLoading, stops]);

  useEffect(() => {
    const markersOnMap = stopMarkers.current;
    return () => {
      for (const marker of markersOnMap.values()) marker.remove();
      markersOnMap.clear();
    };
  }, []);

  // Metadata enrichment mustn't trigger another billed directions request.
  const stopKey = JSON.stringify(stops.map((stop) => stop.coordinates));

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;
    let cancelled = false;
    const coordinates = JSON.parse(stopKey) as Coordinates[];
    const straight = coordinates.map(
      (point) => [point.lng, point.lat] as [number, number],
    );
    drawRoute(mapInstance, straight);
    if (straight.length < 2) {
      return;
    }

    const timer = window.setTimeout(() => {
      void googleRouteForStops(coordinates).then((route) => {
        if (cancelled || !map.current) return;
        drawRoute(map.current, route.line);
      });
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mapLoading, stopKey]);

  const flyAndUpdateUser = () => {
    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: Coordinates = {
          lng: pos.coords.longitude,
          lat: pos.coords.latitude,
        };
        flyTo(coords);
        setLastLocation(coords);

        if (map.current)
          addMarker(
            markers["location"],
            currentMarker,
            setCurrentMarker,
            coords,
            true,
          );

        map.current?.once("movestart", () => {
          setLocationLoading(true);
        });
      },
      (error) => {
        console.error("Error geolocating", error);
        setLocationLoading(false);
      },
      { enableHighAccuracy: false },
    );
  };

  useEffect(() => {
    if (map.current && lastLocation)
      addMarker(
        markers["home"],
        currentMarker,
        setCurrentMarker,
        lastLocation,
        true,
      );
    else {
      currentMarker?.remove();
      setCurrentMarker(undefined);
    }
  }, [addMarker, currentMarker, lastLocation, markers]);

  return (
    <div
      className={`relative h-full w-full overflow-hidden drop-shadow-lg ${
        shouldUseDarkMode ? "bg-slate-800" : "bg-gray-100"
      }`}
    >
      <div
        className={`h-full w-full ${locationLoading ? "animate-pulse" : ""}`}
        ref={mapContainer}
      />
      <Controls
        map={map}
        mapLoading={mapLoading}
        setMapLoading={setMapLoading}
        locationLoading={locationLoading}
        triggerGeolocator={flyAndUpdateUser}
        shouldUseDarkMode={shouldUseDarkMode}
        currentMapTimeMode={currentMapTimeMode}
        setCurrentMapTimeMode={setCurrentMapTimeMode}
      />

      <TripDrawer map={map} />
    </div>
  );
};
