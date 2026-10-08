import "mapbox-gl/dist/mapbox-gl.css";
import "./map.css";
import mapBoxGL, { type Map as MapboxMap, type Marker } from "mapbox-gl";
import { useEffect, useRef, useState } from "react";
import Controls from "@/components/map-box/controls";
import {
  routeForStops,
  type RouteKind,
} from "@/components/map-box/utils/directions";
import { placeFromFeature } from "@/components/map-box/utils/place";
import { useMapHook } from "@/hooks/use-map-hook";
import { useUserStore } from "@/providers/user-store-provider";
import { Coordinates, Place, TripStop } from "@/utils/interfaces";
import { mapTimeFromDate } from "@/utils/map-time";
import {
  applyStandardOverrides,
  buildStandardStyle,
} from "@/components/map-box/utils/standard-overrides";
import { drawRoute } from "@/components/map-box/utils/route-layer";
import { TripDrawer } from "@/components/trips/trip-drawer";

const stopMarker = (index: number, visited: boolean) => {
  const element = document.createElement("div");
  element.className = "marker";
  element.textContent = String(index + 1);
  element.style.width = "28px";
  element.style.height = "28px";
  element.style.borderRadius = "9999px";
  element.style.display = "flex";
  element.style.alignItems = "center";
  element.style.justifyContent = "center";
  element.style.background = visited ? "#15803d" : "#1d4ed8";
  element.style.color = "#ffffff";
  element.style.fontSize = "12px";
  element.style.fontWeight = "600";
  element.style.border = "2px solid #ffffff";
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
  onPlace,
  onRouteKind,
}: {
  shouldUseDarkMode: boolean;
  initialCoords: Coordinates;
  focus: MapFocus | null;
  stops: TripStop[];
  onPlace: (place: Place) => void;
  onRouteKind: (kind: RouteKind) => void;
}) => {
  const lastLocation = useUserStore((state) => state.lastLocation);
  const setLastLocation = useUserStore((state) => state.setLastLocation);
  const map = useRef<MapboxMap | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<Marker>();
  const stopMarkers = useRef<globalThis.Map<string, Marker>>(
    new globalThis.Map(),
  );
  const onPlaceRef = useRef(onPlace);
  const onRouteKindRef = useRef(onRouteKind);
  const [currentMapTimeMode, setCurrentMapTimeMode] = useState(() =>
    mapTimeFromDate(),
  );

  useEffect(() => {
    onPlaceRef.current = onPlace;
    onRouteKindRef.current = onRouteKind;
  }, [onPlace, onRouteKind]);

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

  useEffect(() => {
    if (!focus || mapLoading) return;
    flyTo(focus.coordinates, 15);
  }, [focus, flyTo, mapLoading]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;

    const ids: string[] = [];
    const featuresets = ["poi", "landmark-icons"] as const;

    for (const featuresetId of featuresets) {
      const target = { featuresetId, importId: "basemap" };

      const clickId = `${featuresetId}-click`;
      mapInstance.addInteraction(clickId, {
        type: "click",
        target,
        handler: (e) => {
          const place = e.feature ? placeFromFeature(e.feature) : null;
          if (place) {
            onPlaceRef.current(place);
            return true; // stop lower-priority interactions
          }
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
      seen.add(stop.name);
      // seen.add(stop.publicId);
      const existing = stopMarkers.current.get(stop.name);
      // const existing = stopMarkers.current.get(stop.publicId);
      if (existing) {
        existing.setLngLat([stop.coordinates.lng, stop.coordinates.lat]);
        const element = existing.getElement();
        element.textContent = String(index + 1);
        element.style.background = stop.visited ? "#15803d" : "#1d4ed8";
        return;
      }

      const marker = new mapBoxGL.Marker({
        element: stopMarker(index, stop.visited),
      })
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .addTo(mapInstance);
      stopMarkers.current.set(stop.name, marker);
      // stopMarkers.current.set(stop.publicId, marker);
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

  const stopKey = stops
    .map(
      (stop) =>
        `${stop.publicId}:${stop.coordinates.lng}:${stop.coordinates.lat}`,
    )
    .join("|");

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || mapLoading) return;
    let cancelled = false;
    const straight = stops.map(
      (stop) =>
        [stop.coordinates.lng, stop.coordinates.lat] as [number, number],
    );
    drawRoute(mapInstance, straight);
    if (straight.length < 2) {
      onRouteKindRef.current("empty");
      return;
    }

    const timer = window.setTimeout(() => {
      void routeForStops(stops.map((stop) => stop.coordinates)).then(
        (route) => {
          if (cancelled || !map.current) return;
          drawRoute(map.current, route.line);
          onRouteKindRef.current(route.kind);
        },
      );
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mapLoading, stopKey, stops]);

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
        console.log("Error geolocating", error);
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