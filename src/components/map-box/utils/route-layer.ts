import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";
import { MapTimeEnum, type MapTimeType } from "@/utils/interfaces";

const SOURCE_ID = "voyageurs-route";
const LINE_ID = "voyageurs-route-line";
const LINE_WIDTH = 4;
const LINE_OPACITY = 0.85;
const FADE_DURATION_MS = 450;
const pendingFades = new WeakMap<MapboxMap, () => void>();

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
  if (map.getLayer(LINE_ID)) {
    map.setPaintProperty(LINE_ID, "line-color", routeColor(map));
    map.setPaintProperty(LINE_ID, "line-width", LINE_WIDTH);
    map.setPaintProperty(LINE_ID, "line-emissive-strength", 0.85);
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
  const existing = map.getSource(SOURCE_ID);
  if (existing && existing.type === "geojson") {
    (existing as GeoJSONSource).setData(data);
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
      "line-emissive-strength": 0.85,
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
