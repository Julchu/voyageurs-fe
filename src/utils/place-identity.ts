import type { Place } from "@/types/place";

/** One key per place, for dedupe and React keys. Prefers Mapbox's id over name and position. */
export const placeIdentity = ({
  mapboxId,
  name,
  coordinates: { lat, lng },
}: Pick<Place, "mapboxId" | "name" | "coordinates">) =>
  mapboxId ?? `${name}:${lat}:${lng}`;
