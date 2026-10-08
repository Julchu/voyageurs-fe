import type { GeoJSONFeature } from "mapbox-gl";
import type { Place } from "@/utils/interfaces";

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
    // TODO: doesn't work, fix address
    address: textProp(feature, "address") || textProp(feature, "category_en"),
    coordinates: { lat, lng },
  };
};