import type { Coordinates } from "@/utils/interfaces";

export type LngLat = [lng: number, lat: number];

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
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || stops.length < 2 || stops.length > MAX_DIRECTION_STOPS)
    return [];

  const path = stops.map(({ lng, lat }) => `${lng},${lat}`).join(";");
  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${path}`,
  );
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const body = (await response.json()) as DirectionsBody;
    const line = body.routes?.[0]?.geometry?.coordinates;
    return body.code === "Ok" && line && line.length >= 2 ? line : [];
  } catch {
    return [];
  }
};
