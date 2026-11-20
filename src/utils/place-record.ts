import type { Place } from "./interfaces";

/** Only the fields we keep. Display-only data (photos, details) is dropped. */
export const placeRecord = (place: Place): Place => ({
  id: place.id,
  mapboxId: place.mapboxId,
  name: place.name,
  category: place.category,
  streetAddress: place.streetAddress,
  areaAddress: place.areaAddress,
  coordinates: place.coordinates,
});
