import type { Map as MapboxMap } from "mapbox-gl";
import { placeFromFeature } from "@/components/map-box/utils/place-geocoding";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";

export const addPoiInteractions = (map: MapboxMap) => {
  const ids: string[] = [];
  const featuresets = ["poi", "landmark-icons"] as const;
  let openedKey = "";

  for (const featuresetId of featuresets) {
    const target = { featuresetId, importId: "basemap" };

    const clickId = `${featuresetId}-click`;
    map.addInteraction(clickId, {
      type: "click",
      target,
      handler: (e) => {
        const place = e.feature ? placeFromFeature(e.feature) : null;
        if (!place) return;
        const key = `${place.name}:${place.coordinates.lat}:${place.coordinates.lng}`;
        // poi and landmark-icons can both report one click. Ignore the
        // duplicate in this turn, then allow the place to be opened again.
        if (openedKey === key) return true;
        openedKey = key;
        queueMicrotask(() => {
          if (openedKey === key) openedKey = "";
        });
        // The popup looks up address, photos, and category when the click
        // doesn't already carry a saved place id.
        openPlacePopup.openWithPayload(place);
        return true; // stop lower-priority interactions
      },
    });
    ids.push(clickId);

    const enterId = `${featuresetId}-enter`;
    map.addInteraction(enterId, {
      type: "mouseenter",
      target,
      handler: () => {
        map.getCanvas().style.cursor = "pointer";
      },
    });
    ids.push(enterId);

    const leaveId = `${featuresetId}-leave`;
    map.addInteraction(leaveId, {
      type: "mouseleave",
      target,
      handler: () => {
        map.getCanvas().style.cursor = "";
      },
    });
    ids.push(leaveId);
  }

  return () => {
    for (const id of ids) map.removeInteraction(id);
  };
};
