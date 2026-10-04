import type { GeoJSONFeature } from "mapbox-gl";
import type { PlaceDraft } from "@/utils/interfaces";

type MapFeature = GeoJSONFeature & {
  geometry: { type: string; coordinates: number[] };
  properties?: Record<string, unknown> | null;
};

const readFeature = (feature: GeoJSONFeature) => feature as MapFeature;

const textProp = (feature: GeoJSONFeature, key: string) => {
  const value = readFeature(feature).properties?.[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

export const placeFromFeature = (feature: GeoJSONFeature): PlaceDraft | null => {
  const geometry = readFeature(feature).geometry;
  if (geometry.type !== "Point") return null;
  const lng = geometry.coordinates[0];
  const lat = geometry.coordinates[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const name = textProp(feature, "name_en") || textProp(feature, "name");
  if (!name) return null;

  return {
    name,
    address: textProp(feature, "address") || textProp(feature, "category_en"),
    coordinates: { lat, lng },
  };
};
