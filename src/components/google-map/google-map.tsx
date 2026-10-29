"use client";

import { googleLoadLibrary } from "@/components/google-map/utils/google-loader";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Coordinates, TripStop } from "@/utils/interfaces";
import type { MapFocus } from "@/components/map-box/map";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";
import { googleRouteForStops } from "@/components/google-map/utils/google-directions";
import { TripDrawer } from "@/components/trips-drawer/trip-drawer";
import { useTripStore } from "@/providers/trip-store-provider";
import { googleRetrieve } from "@/components/google-map/utils/google-places";

let googleLibraries:
  | Promise<[google.maps.Maps3DLibrary, google.maps.MarkerLibrary]>
  | undefined;

const googleLoadMaps = (key: string) => {
  if (!googleLibraries) {
    googleLibraries = Promise.all([
      googleLoadLibrary(key, "maps3d"),
      googleLoadLibrary(key, "marker"),
    ]);
  }
  return googleLibraries;
};

/** Experimental 3D ROADMAP: stylized buildings with Google's native camera UI. */
export const GoogleMap = ({
  initialCoords,
  focus,
  stops,
}: {
  initialCoords: Coordinates;
  focus: MapFocus | null;
  stops: TripStop[];
}) => {
  const container = useRef<HTMLDivElement>(null);
  const origin = useRef(initialCoords);
  const [map, setMap] = useState<google.maps.maps3d.Map3DElement | null>(null);
  const [error, setError] = useState(false);
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const googleRememberPlace = useTripStore(
    (state) => state.googleRememberPlace,
  );
  const pendingPlaces = useRef(new Map<string, AbortController>());

  // Rehydrate saved IDs into temporary display state, never browser storage.
  const missingIds = JSON.stringify([
    ...new Set(
      stops
        .filter(
          (stop) =>
            stop.mapboxId?.startsWith("google:") && stop.name === "Saved place",
        )
        .map((stop) => stop.mapboxId!),
    ),
  ]);
  useEffect(() => {
    const ids = JSON.parse(missingIds) as string[];
    for (const [id, controller] of pendingPlaces.current) {
      if (!ids.includes(id)) {
        controller.abort();
        pendingPlaces.current.delete(id);
      }
    }
    for (const id of ids) {
      if (pendingPlaces.current.has(id)) continue;
      const controller = new AbortController();
      pendingPlaces.current.set(id, controller);
      void googleRetrieve(id, { signal: controller.signal }).then((place) => {
        if (pendingPlaces.current.get(id) !== controller) return;
        pendingPlaces.current.delete(id);
        if (place && !controller.signal.aborted) googleRememberPlace(place);
      });
    }
  }, [missingIds, googleRememberPlace]);
  useEffect(() => {
    const pending = pendingPlaces.current;
    return () => {
      pending.forEach((controller) => controller.abort());
      pending.clear();
    };
  }, []);

  useEffect(() => {
    if (!key || !container.current) return;
    const element = container.current;
    let cancelled = false;
    let instance: google.maps.maps3d.Map3DElement | undefined;
    const events = new AbortController();
    void googleLoadMaps(key)
      .then(([{ Map3DElement }]) => {
        if (cancelled) return;
        instance = new Map3DElement({
          center: { ...origin.current, altitude: 0 },
          range: 1800,
          tilt: 65,
          heading: 20,
          mode: "ROADMAP",
          colorScheme: "LIGHT",
          defaultUIHidden: false,
          ...(process.env.NEXT_PUBLIC_GOOGLE_MAP_ID
            ? { mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID }
            : {}),
        });
        instance.className = "h-full w-full";
        instance.addEventListener("gmp-error", () => setError(true), {
          signal: events.signal,
        });
        instance.addEventListener("gmp-map-id-error", () => setError(true), {
          signal: events.signal,
        });
        instance.addEventListener(
          "gmp-click",
          (event) => {
            if (!("placeId" in event)) return;
            event.preventDefault();
            openPlacePopup.openWithPayload({
              mapboxId: `google:${event.placeId}`,
              name: "Loading place…",
              streetAddress: "",
              areaAddress: "",
              category: "",
              coordinates: event.position
                ? { lat: event.position.lat, lng: event.position.lng }
                : origin.current,
            });
          },
          { signal: events.signal },
        );
        element.append(instance);
        setMap(instance);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
      events.abort();
      instance?.stopCameraAnimation();
      instance?.remove();
    };
  }, [key]);

  const googleFlyTo = useCallback(
    (coordinates: Coordinates, zoom = 17) => {
      if (!map) return;
      map.flyCameraTo({
        endCamera: {
          center: { ...coordinates, altitude: 0 },
          range: 1800 * 2 ** (17 - zoom),
          tilt: map.tilt ?? 65,
          heading: map.heading ?? 20,
        },
        durationMillis: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches
          ? 0
          : 1000,
      });
    },
    [map],
  );

  useEffect(() => {
    if (focus) googleFlyTo(focus.coordinates);
  }, [focus, googleFlyTo]);

  useEffect(() => {
    if (!map) return;
    const markers = stops.flatMap((stop, index) => {
      if (stop.mapboxId?.startsWith("google:") && stop.name === "Saved place")
        return [];
      const marker = new google.maps.maps3d.Marker3DInteractiveElement({
        position: stop.coordinates,
        title: `Open stop ${index + 1}: ${stop.name}`,
        drawsWhenOccluded: true,
        sizePreserved: true,
      });
      const pin = new google.maps.marker.PinElement({
        glyphText: String(index + 1),
        glyphColor: "#ffffff",
        background: "#2563eb",
        borderColor: "#ffffff",
      });
      marker.append(pin);
      marker.addEventListener("gmp-click", (event) => {
        event.stopPropagation();
        openPlacePopup.openWithPayload(stop);
      });
      map.append(marker);
      return [marker];
    });
    return () =>
      markers.forEach((marker) => {
        marker.remove();
      });
  }, [map, stops]);

  // Metadata changes and panning never trigger another billed route request.
  const routeCoordinates = JSON.stringify(
    stops.some(
      (stop) =>
        stop.name === "Saved place" && stop.mapboxId?.startsWith("google:"),
    )
      ? []
      : stops.map((stop) => stop.coordinates),
  );
  useEffect(() => {
    if (!map) return;
    const coordinates = JSON.parse(routeCoordinates) as Coordinates[];
    if (coordinates.length < 2) return;
    const controller = new AbortController();
    const line = new google.maps.maps3d.Polyline3DElement({
      coordinates,
      strokeColor: "#2563ebcc",
      strokeWidth: 5,
      altitudeMode: "CLAMP_TO_GROUND",
      drawsOccludedSegments: true,
    });
    map.append(line);
    const timeout = window.setTimeout(() => {
      void googleRouteForStops(coordinates, controller.signal).then((route) => {
        if (!controller.signal.aborted)
          line.coordinates = route.line.map(([lng, lat]) => ({ lat, lng }));
      });
    }, 400);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
      line.remove();
    };
  }, [map, routeCoordinates]);

  return (
    <>
      <div ref={container} className="h-full w-full" aria-label="Google map" />
      {!key || error ? (
        <div
          role="status"
          className="absolute inset-0 flex items-center justify-center bg-neutral-100 p-8 text-center text-sm text-neutral-600"
        >
          {!key
            ? "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to load the map."
            : "Couldn’t load Google Maps. Check the browser key and Maps JavaScript API access, then reload."}
        </div>
      ) : null}
      {/* onFlyTo={googleFlyTo} */}
      <TripDrawer />
    </>
  );
};