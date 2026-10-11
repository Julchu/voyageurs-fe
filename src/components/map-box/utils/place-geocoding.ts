import type { GeoJSONFeature } from "mapbox-gl";
import {
  Coordinates,
  GeocodeFeatures,
  GeocodeResponse,
  Place,
} from "@/utils/interfaces";

type MapFeature = GeoJSONFeature & {
  geometry: { type: string; coordinates: number[] };
  properties?: Record<string, unknown> | null;
  id: number;
};

const readFeature = (feature: GeoJSONFeature) => feature as MapFeature;

const getFeatureProperty = (
  feature: GeoJSONFeature,
  key: string,
): string | undefined => {
  const value = readFeature(feature).properties?.[key];
  return value == null ? undefined : String(value);
};

export const placeFromFeature = (feature: GeoJSONFeature): Place | null => {
  const id = readFeature(feature).id;
  const category = getFeatureProperty(feature, "class") ?? "";
  const geometry = readFeature(feature).geometry;
  if (geometry.type !== "Point") return null;
  const lng = geometry.coordinates[0];
  const lat = geometry.coordinates[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const name =
    getFeatureProperty(feature, "name_en") ||
    getFeatureProperty(feature, "name");
  if (!name) return null;

  return {
    id,
    name,
    // POI/landmark featuresets don't expose a street address; it's filled in
    // asynchronously via reverseGeocode() from the clicked coordinates.
    category,
    streetAddress: "",
    areaAddress: "",
    coordinates: { lat, lng },
  };
};

/**
 * Resolve a human-readable street streetAddress for a set of coordinates using the
 * Mapbox reverse geocoding endpoint. Returns an empty string on any failure so
 * callers can safely fall back to showing no streetAddress.
 */
export const reverseGeocode = async (
  { lat, lng }: Coordinates,
  signal?: AbortSignal,
): Promise<GeocodeFeatures | undefined> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return;

  // NEW: Geocoding v6 reverse endpoint (current recommended API). Coordinates
  // are passed as separate `longitude`/`latitude` query params. With default
  // settings it returns the most specific feature (the streetAddress) first.
  const url = new URL("https://api.mapbox.com/search/geocode/v6/reverse");
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("access_token", token);
  url.searchParams.set("types", "address");

  try {
    const response = await fetch(url, signal ? { signal } : undefined);
    if (!response.ok) return;
    const body = (await response.json()) as GeocodeResponse;
    return body?.features?.[0]?.properties;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    return;
  }
};