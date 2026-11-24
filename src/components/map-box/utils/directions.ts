import type { Coordinates } from "@/types/place";
import { mapboxGet } from "./mapbox-api";

type LngLat = [lng: number, lat: number];

const MAX_DIRECTION_STOPS = 25;

type DirectionsBody = {
  code?: string;
  routes?: { geometry?: { coordinates?: LngLat[] } }[];
};

/**
 * The driving route through the stops, in order. Empty when there's nothing to
 * route or directions fail: stops are never joined with straight lines.
 */
export const routeForStops = async (
  stops: Coordinates[],
): Promise<LngLat[]> => {
  if (stops.length < 2 || stops.length > MAX_DIRECTION_STOPS) return [];

  const path = stops.map(({ lng, lat }) => `${lng},${lat}`).join(";");
  try {
    const body = await mapboxGet<DirectionsBody>(
      `/directions/v5/mapbox/driving/${path}`,
      { alternatives: "false", geometries: "geojson", overview: "full" },
    );
    const line = body.routes?.[0]?.geometry?.coordinates;
    return body.code === "Ok" && line && line.length >= 2 ? line : [];
  } catch {
    return [];
  }
};
