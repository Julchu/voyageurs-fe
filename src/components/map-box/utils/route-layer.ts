import type { GeoJSONSource, Map as MapboxMap } from "mapbox-gl";

const SOURCE_ID = "voyageurs-route";
const LINE_ID = "voyageurs-route-line";
const ARROW_ID = "voyageurs-route-arrows";
const ARROW_IMAGE = "voyageurs-arrow";

const emptyLine = {
  type: "Feature" as const,
  properties: {},
  geometry: { type: "LineString" as const, coordinates: [] as [number, number][] },
};

const ensureArrow = (map: MapboxMap) => {
  if (map.hasImage(ARROW_IMAGE)) return;
  const size = 24;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = "#1d4ed8";
  context.beginPath();
  context.moveTo(12, 3);
  context.lineTo(21, 20);
  context.lineTo(12, 15);
  context.lineTo(3, 20);
  context.closePath();
  context.fill();
  const image = context.getImageData(0, 0, size, size);
  map.addImage(ARROW_IMAGE, image, { pixelRatio: 2 });
};

export const drawRoute = (map: MapboxMap, coordinates: [number, number][]) => {
  if (!map.isStyleLoaded()) return;
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

  ensureArrow(map);
  map.addSource(SOURCE_ID, { type: "geojson", data });
  map.addLayer({
    id: LINE_ID,
    type: "line",
    source: SOURCE_ID,
    slot: "top",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#1d4ed8", "line-width": 4, "line-opacity": 0.85 },
  });
  map.addLayer({
    id: ARROW_ID,
    type: "symbol",
    source: SOURCE_ID,
    slot: "top",
    layout: {
      "symbol-placement": "line",
      "symbol-spacing": 80,
      "icon-image": ARROW_IMAGE,
      "icon-size": 0.75,
      "icon-rotation-alignment": "map",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });
};
