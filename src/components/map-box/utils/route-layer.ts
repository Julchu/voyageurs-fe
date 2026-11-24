import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { MapTimeEnum, MapTimeValues, type MapTimeType } from "@/utils/map-time";

const SOURCE_ID = "voyageurs-route";
const LINE_ID = "voyageurs-route-line";
const LINE_WIDTH = 4;
const LINE_OPACITY = 0.85;
const EMISSIVE_STRENGTH = 0.85;
const FADE_DURATION_MS = 450;
const pendingFades = new WeakMap<MapboxMap, () => void>();

// Tailwind v4 palette equivalents for Mapbox's color values.
const ROUTE_COLORS: Record<MapTimeType, string> = {
  [MapTimeEnum.DAWN]: "#312c85", // bg-indigo-900
  [MapTimeEnum.DAY]: "#312c85", // bg-indigo-900
  [MapTimeEnum.DUSK]: "#9ae600", // bg-lime-400
  [MapTimeEnum.NIGHT]: "#9ae600", // bg-lime-400
};

const routeColor = (map: MapboxMap) => {
  const preset: unknown = map.getConfigProperty("basemap", "lightPreset");
  const mapTime = MapTimeValues.find((time) => time === preset);
  return ROUTE_COLORS[mapTime ?? MapTimeEnum.DAY];
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
  if (map.getLayer(LINE_ID)) {
    map.setPaintProperty(LINE_ID, "line-color", routeColor(map));
    map.setPaintProperty(LINE_ID, "line-width", LINE_WIDTH);
    map.setPaintProperty(LINE_ID, "line-emissive-strength", EMISSIVE_STRENGTH);
  }
};

export const drawRoute = (map: MapboxMap, coordinates: [number, number][]) => {
  const pendingFade = pendingFades.get(map);
  if (pendingFade) {
    map.off("idle", pendingFade);
    pendingFades.delete(map);
  }
  if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
  const data = {
    ...emptyLine,
    geometry: { type: "LineString" as const, coordinates },
  };
  const existing = map.getSource<GeoJSONSource>(SOURCE_ID);
  if (existing) {
    existing.setData(data);
  } else if (coordinates.length >= 2) {
    if (!map.isStyleLoaded()) return;
    map.addSource(SOURCE_ID, { type: "geojson", data });
  }
  if (coordinates.length < 2) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
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
      "line-opacity": reduceMotion ? LINE_OPACITY : 0,
      "line-opacity-transition": {
        duration: reduceMotion ? 0 : FADE_DURATION_MS,
        delay: 0,
      },
      // Keep route colors visible under Standard's night lighting.
      "line-emissive-strength": EMISSIVE_STRENGTH,
    },
  });
  if (reduceMotion) return;

  // Wait for the new source geometry to render before starting the fade.
  const fadeIn = () => {
    pendingFades.delete(map);
    if (map.getLayer(LINE_ID))
      map.setPaintProperty(LINE_ID, "line-opacity", LINE_OPACITY);
  };
  pendingFades.set(map, fadeIn);
  map.once("idle", fadeIn);
};
