import type { GeoJSONFeature } from "mapbox-gl";
import type { Coordinates, Place } from "@/utils/interfaces";

type MapFeature = GeoJSONFeature & {
  geometry: { type: string; coordinates: number[] };
  properties?: Record<string, unknown> | null;
  id: number;
};

const readFeature = (feature: GeoJSONFeature) => feature as MapFeature;

const textProp = (feature: GeoJSONFeature, key: string) => {
  const value = readFeature(feature).properties?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

export const placeFromFeature = (feature: GeoJSONFeature): Place | null => {
  const geometry = readFeature(feature).geometry;
  const id = readFeature(feature).id;
  if (geometry.type !== "Point") return null;
  const lng = geometry.coordinates[0];
  const lat = geometry.coordinates[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const name = textProp(feature, "name_en") || textProp(feature, "name");
  if (!name) return null;

  return {
    id,
    name,
    // POI/landmark featuresets don't expose a street address; it's filled in
    // asynchronously via reverseGeocode() from the clicked coordinates.
    address: "",
    coordinates: { lat, lng },
  };
};

// Geocoding v6 reverse response: each feature carries a formatted address in
// `properties`. `full_address` = name + place context; `name` is the bare
// street line. See https://docs.mapbox.com/api/search/geocoding/#reverse-geocoding
type GeocodeResponse = {
  features?: {
    properties?: {
      full_address?: string;
      name?: string;
    };
  }[];
};

/**
 * Resolve a human-readable street address for a set of coordinates using the
 * Mapbox reverse geocoding endpoint. Returns an empty string on any failure so
 * callers can safely fall back to showing no address.
 */
export const reverseGeocode = async (
  { lat, lng }: Coordinates,
  signal?: AbortSignal,
): Promise<string> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return "";

  // OLD: Geocoding v5 (`mapbox.places`) is deprecated and is disabled on
  // newer Mapbox accounts, so this request failed and no address ever showed.
  // const url = new URL(
  //   `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json`,
  // );
  // url.searchParams.set("access_token", token);
  // url.searchParams.set("types", "address,poi");
  // url.searchParams.set("limit", "1");

  // NEW: Geocoding v6 reverse endpoint (current recommended API). Coordinates
  // are passed as separate `longitude`/`latitude` query params. With default
  // settings it returns the most specific feature (the address) first.
  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url, signal ? { signal } : undefined);
    if (!response.ok) return "";
    const body = (await response.json()) as GeocodeResponse;
    const properties = body.features?.[0]?.properties;
    return properties?.full_address ?? properties?.name ?? "";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "";
    return "";
  }
};