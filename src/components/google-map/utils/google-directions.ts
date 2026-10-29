import type { Coordinates } from "@/utils/interfaces";
import type { RouteKind } from "@/components/map-box/utils/directions";

/* Google Routes API adapter — a drop-in mirror of `directions.ts`.
 *
 * Same signature and `{ kind, line }` output as `routeForStops`, where `line`
 * is `[lng, lat][]` ready for the existing `drawRoute` GeoJSON layer. The route
 * geometry is just data for Mapbox GL to draw; the renderer is unchanged.
 */

// Routes API allows up to 25 intermediate waypoints; match the Mapbox cap.
const GOOGLE_MAX_DIRECTION_STOPS = 25;

type GoogleComputeRoutesResponse = {
  routes?: { polyline?: { encodedPolyline?: string } }[];
};

/** Decode a Google encoded polyline (precision 5) to `[lat, lng]` pairs. */
const googleDecodePolyline = (encoded: string): [number, number][] => {
  const coordinates: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }
  return coordinates;
};

const googleRouteWaypoint = (point: Coordinates) => ({
  location: { latLng: { latitude: point.lat, longitude: point.lng } },
});

/**
 * One driving route per stop-order change (not called while the map pans).
 * Falls back to straight segments on any error or when over the waypoint cap,
 * exactly like the Mapbox adapter.
 */
export const googleRouteForStops = async (
  coordinates: Coordinates[],
  signal?: AbortSignal,
): Promise<{ kind: RouteKind; line: [number, number][] }> => {
  const line = coordinates.map(
    (point) => [point.lng, point.lat] as [number, number],
  );
  if (line.length < 2) return { kind: "empty", line };
  if (line.length > GOOGLE_MAX_DIRECTION_STOPS)
    return { kind: "straight", line };

  const payload = {
    origin: googleRouteWaypoint(coordinates[0]),
    destination: googleRouteWaypoint(coordinates[coordinates.length - 1]),
    ...(coordinates.length > 2
      ? { intermediates: coordinates.slice(1, -1).map(googleRouteWaypoint) }
      : {}),
    travelMode: "DRIVE",
    polylineQuality: "OVERVIEW",
  };

  try {
    const response = await fetch("/api/google/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!response.ok) return { kind: "straight", line };
    const body = (await response.json()) as GoogleComputeRoutesResponse;
    const encoded = body.routes?.[0]?.polyline?.encodedPolyline;
    if (!encoded) return { kind: "straight", line };

    // Google returns [lat, lng]; flip to [lng, lat] for GeoJSON / Mapbox.
    const routed = googleDecodePolyline(encoded).map(
      ([lat, lng]) => [lng, lat] as [number, number],
    );
    if (routed.length < 2) return { kind: "straight", line };
    return { kind: "directions", line: routed };
  } catch {
    return { kind: "straight", line };
  }
};
