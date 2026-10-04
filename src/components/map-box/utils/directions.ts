import type { Coordinates } from "@/utils/interfaces";

export type RouteKind = "empty" | "straight" | "directions";

const MAX_DIRECTION_STOPS = 25;

type DirectionsBody = {
  code?: string;
  routes?: { geometry?: { coordinates?: [number, number][] } }[];
};

/**
 * One driving route per stop-order change. Mapbox Directions includes 100,000
 * requests a month before it bills, and this is not called while the map pans.
 * Swap this function when a Google routes client is added.
 */
export const routeForStops = async (
  coordinates: Coordinates[],
): Promise<{ kind: RouteKind; line: [number, number][] }> => {
  const line = coordinates.map((point) => [point.lng, point.lat] as [number, number]);
  if (line.length < 2) return { kind: "empty", line };
  if (line.length > MAX_DIRECTION_STOPS) return { kind: "straight", line };

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return { kind: "straight", line };

  const path = line.map((pair) => pair.join(",")).join(";");
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/driving/${path}`);
  url.searchParams.set("alternatives", "false");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("overview", "full");
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url);
    if (!response.ok) return { kind: "straight", line };
    const body = (await response.json()) as DirectionsBody;
    const routed = body.routes?.[0]?.geometry?.coordinates;
    if (body.code !== "Ok" || !routed || routed.length < 2) return { kind: "straight", line };
    return { kind: "directions", line: routed };
  } catch {
    return { kind: "straight", line };
  }
};
