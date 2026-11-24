import type { Map as MapboxMap } from "mapbox-gl";
import type { Coordinates } from "@/types/place";

export const flyTo = (map: MapboxMap | null, { lat, lng }: Coordinates) =>
  map?.flyTo({ center: [lng, lat], zoom: 15 });
