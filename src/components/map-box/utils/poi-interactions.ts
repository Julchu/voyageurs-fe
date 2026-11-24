import type { Map as MapboxMap } from "mapbox-gl";
import { placeFromFeature } from "@/components/map-box/utils/poi-click-place";
import { placeIdentity } from "@/utils/place-identity";
import { openPlacePopup } from "@/components/place-info-card/utils/place-popup-handle";

type Interaction = Parameters<MapboxMap["addInteraction"]>[1];

const FEATURESETS = ["poi", "landmark-icons"] as const;

/** Click a POI or landmark to open its place card. Returns the cleanup. */
export const addPoiInteractions = (map: MapboxMap) => {
  let openedKey = "";
  const setCursor = (cursor: string) => {
    map.getCanvas().style.cursor = cursor;
  };

  const interactions: Pick<Interaction, "type" | "handler">[] = [
    {
      type: "click",
      handler: ({ feature }) => {
        const place = feature ? placeFromFeature(feature) : null;
        if (!place) return;
        const key = placeIdentity(place);
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
    },
    { type: "mouseenter", handler: () => setCursor("pointer") },
    { type: "mouseleave", handler: () => setCursor("") },
  ];

  const ids = FEATURESETS.flatMap((featuresetId) =>
    interactions.map((interaction) => {
      const id = `${featuresetId}-${interaction.type}`;
      map.addInteraction(id, {
        ...interaction,
        target: { featuresetId, importId: "basemap" },
      });
      return id;
    }),
  );

  return () => {
    for (const id of ids) map.removeInteraction(id);
  };
};
