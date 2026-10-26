import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { MapTimeEnum, type MapTimeType } from "@/utils/interfaces";

const SOURCE_ID = "voyageurs-route";
const LINE_ID = "voyageurs-route-line";
const ARROW_ID = "voyageurs-route-arrows";
const ARROW_IMAGE = "voyageurs-arrow";
const LINE_WIDTH = 4;

// Tailwind v4 palette equivalents for Mapbox's color values.
const ROUTE_COLORS: Record<MapTimeType, string> = {
  [MapTimeEnum.DAWN]: "#312c85", // bg-indigo-900
  [MapTimeEnum.DAY]: "#312c85", // bg-cyan-400
  [MapTimeEnum.DUSK]: "#9ae600", // bg-lime-400
  [MapTimeEnum.NIGHT]: "#9ae600",
};

const routeColor = (map: MapboxMap) => {
  const mapTime = map.getConfigProperty(
    "basemap",
    "lightPreset",
  ) as MapTimeType;
  return ROUTE_COLORS[mapTime] ?? ROUTE_COLORS[MapTimeEnum.DAY];
};

const emptyLine = {
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates: [] as [number, number][],
  },
};

export const updateRouteAppearance = (map: MapboxMap) => {
  // // Lighting changes can mark the style as pending; existing layers stay editable.
  // // Clear the previous arrow layer when updating an already mounted map.
  // if (map.getLayer(ARROW_ID)) map.removeLayer(ARROW_ID);
  // if (map.hasImage(ARROW_IMAGE)) map.removeImage(ARROW_IMAGE);
  if (map.getLayer(LINE_ID)) {
    map.setPaintProperty(LINE_ID, "line-color", routeColor(map));
    map.setPaintProperty(LINE_ID, "line-width", LINE_WIDTH);
    map.setPaintProperty(LINE_ID, "line-opacity", 0.85);
    map.setPaintProperty(LINE_ID, "line-emissive-strength", 0.85);
  }
};

export const drawRoute = (map: MapboxMap, coordinates: [number, number][]) => {
  if (!map.isStyleLoaded()) return;
  updateRouteAppearance(map);
  const data = {
    ...emptyLine,
    geometry: { type: "LineString" as const, coordinates },
  };
  const existing = map.getSource(SOURCE_ID);
  if (existing && existing.type === "geojson") {
    (existing as GeoJSONSource).setData(data);
    return;
  }
  if (coordinates.length < 2) return;

  map.addSource(SOURCE_ID, { type: "geojson", data });
  map.addLayer({
    id: LINE_ID,
    type: "line",
    source: SOURCE_ID,
    // top layer for full route line visibility, middle
    // for building occlusion to hide lines depending on tilt
    slot: "top",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": routeColor(map),
      "line-width": LINE_WIDTH,
      "line-opacity": 0.85,
      // Keep route colors visible under Standard's night lighting.
      "line-emissive-strength": 0.85,
    },
  });
};