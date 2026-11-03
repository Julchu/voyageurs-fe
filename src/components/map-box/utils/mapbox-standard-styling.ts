import type {
  LightsSpecification,
  Map as MapboxMap,
  StyleSpecification,
} from "mapbox-gl";
import { mapTimeFromDate } from "@/utils/map-time";

/** Official Mapbox Standard (not Studio forks). */
export const STANDARD_STYLE_URL = "mapbox://styles/mapbox/standard";

/**
 * Standard draws hotels, parks, museums, cafes, restaurants, and the rest of
 * its place set with its own zoom and label density.
 * Indoor mode stays off: the poi-label filter hides outdoor places unless
 * `showIndoor` is false, or the place is on the active indoor floor.
 * Extruded buildings, landmark models, and window facades start on.
 */
const BASEMAP_CONFIG = {
  showPointOfInterestLabels: true,
  show3dObjects: true,
  show3dBuildings: true,
  show3dLandmarks: true,
  show3dFacades: true,
  show3dTrees: false,
  showIndoor: false,
  showHdRoads: true,
  showPlaceLabels: true,
  showRoadLabels: true,
  showTransitLabels: true,
  showLandmarkIcons: true,
  showLandmarkIconLabels: true,
  showIndoorLabels: true,
  showPedestrianRoads: true,
};

export const buildStandardStyle = (): StyleSpecification => ({
  version: 8,
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
  imports: [
    {
      id: "basemap",
      url: STANDARD_STYLE_URL,
      config: {
        ...BASEMAP_CONFIG,
        lightPreset: mapTimeFromDate(),
      },
    },
  ],
});

/**
 * Standard's directional light renders a shadow map of every building.
 * That extra pass is most of the 3D cost. Building shading stays on.
 */
const disableBuildingShadows = (map: MapboxMap) => {
  try {
    const lights = map.getLights();
    if (!lights?.length) return;
    const relaxed: LightsSpecification[] = lights.map((light) => {
      if (light.type !== "directional") return light;
      return {
        ...light,
        properties: {
          ...light.properties,
          "cast-shadows": false,
          "shadow-intensity": 0,
        },
      };
    });
    map.setLights(relaxed);
  } catch {
    // Keep Standard's lighting if this GL JS build rejects the override.
  }
};

export const applyStandardOverrides = (map: MapboxMap) => {
  disableBuildingShadows(map);
  // Config updates can merge the basemap lights back in on the next frame.
  const frame = requestAnimationFrame(() => disableBuildingShadows(map));
  return () => cancelAnimationFrame(frame);
};
