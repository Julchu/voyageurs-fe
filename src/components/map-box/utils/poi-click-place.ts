import type { TargetFeature } from "mapbox-gl";
import type { Place } from "@/types/place";
import { metersBetween } from "@/utils/distance";
import { normalizePlaceName } from "@/utils/place-name";
import { searchParams } from "./mapbox-api";
import { isPoiId } from "./mapbox-place-parsing";
import { fetchPlaceDetails } from "./mapbox-places-api";
import { searchBoxPlaces } from "./mapbox-search-box";

/* Map POI click: the click only has a name and coordinates. resolveMapboxPlace
 * fills in the rest from the Places API (by POI id) or a Search Box /forward
 * result with the same name nearby.
 */

const MAX_MATCH_METERS = 1000;

type ClickedPlace = Pick<Place, "name" | "coordinates" | "mapboxId">;

/** A partial place from a map POI/landmark click. */
export const placeFromFeature = (feature: TargetFeature): Place | null => {
  const { id, geometry, properties } = feature;
  if (geometry.type !== "Point") return null;
  const [lng, lat] = geometry.coordinates;
  const name = properties?.name_en || properties?.name;
  if (typeof lng !== "number" || typeof lat !== "number") return null;
  if (typeof name !== "string" || !name) return null;

  return {
    id: typeof id === "number" ? id : undefined,
    name,
    category: typeof properties?.class === "string" ? properties.class : "",
    streetAddress: "",
    areaAddress: "",
    coordinates: { lat, lng },
  };
};

/** The closest candidate within 1 km with the same name. Never by distance alone. */
const closestWithSameName = (place: ClickedPlace, candidates: Place[]) => {
  const name = normalizePlaceName(place.name);
  return candidates
    .filter((candidate) => normalizePlaceName(candidate.name) === name)
    .map((candidate) => ({
      candidate,
      meters: metersBetween(place.coordinates, candidate.coordinates),
    }))
    .filter(({ meters }) => meters <= MAX_MATCH_METERS)
    .sort((a, b) => a.meters - b.meters)[0]?.candidate;
};

/** Just the street address at the click. */
const addressAt = async (
  place: ClickedPlace,
  signal?: AbortSignal,
): Promise<Partial<Place> | undefined> => {
  const [address] = await searchBoxPlaces(
    "reverse",
    {
      longitude: place.coordinates.lng,
      latitude: place.coordinates.lat,
      ...searchParams({ limit: 1, types: "address" }),
    },
    signal,
  );
  if (signal?.aborted || !address) return;
  return {
    streetAddress: address.streetAddress,
    areaAddress: address.areaAddress,
    photos: [],
  };
};

/**
 * The Search Box result for a clicked POI: the same id, or else the closest one
 * with the same name, so a neighbouring business can't lend its photos. Falls
 * back to just the address.
 */
const findClickedPlace = async (
  place: ClickedPlace,
  signal?: AbortSignal,
): Promise<Partial<Place> | undefined> => {
  const q = place.name.trim();
  const candidates = q
    ? await searchBoxPlaces(
        "forward",
        {
          q,
          exclude_fields: "reviews",
          ...searchParams({ proximity: place.coordinates }),
        },
        signal,
      )
    : [];
  if (signal?.aborted) return;

  const sameId = candidates.find(
    ({ mapboxId }) => place.mapboxId && mapboxId === place.mapboxId,
  );
  return (
    sameId ??
    closestWithSameName(place, candidates) ??
    (await addressAt(place, signal))
  );
};

/** Lookup results win over the click's own fields, but never blank them. */
const mergePlace = (place: Place, found: Partial<Place>): Place => ({
  ...place,
  mapboxId: found.mapboxId ?? place.mapboxId,
  streetAddress: found.streetAddress || place.streetAddress,
  areaAddress: found.areaAddress || place.areaAddress,
  category: found.category || place.category,
  photos: found.photos?.length ? found.photos : place.photos,
  placeDetails: {
    ...place.placeDetails,
    ...found.placeDetails,
    photos: found.photos ?? [],
  },
  placeInfoLoaded: true,
});

/** Address, photos and details for a clicked place. Undefined when nothing was found. */
export const resolveMapboxPlace = async (
  place: Place,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  if (signal?.aborted) return;
  if (place.placeInfoLoaded) return place;

  // 1. A known POI: read its Places record directly.
  if (isPoiId(place.mapboxId)) {
    const details = await fetchPlaceDetails(place.mapboxId, signal);
    if (signal?.aborted) return;
    if (details) return mergePlace(place, details);
  }

  // 2. Otherwise find it by name near the click.
  const found = await findClickedPlace(place, signal);
  if (!found || signal?.aborted) return;
  const merged = mergePlace(place, found);

  // 3. The match may be a POI with a fuller Places record.
  if (!isPoiId(found.mapboxId) || found.mapboxId === place.mapboxId)
    return merged;
  const details = await fetchPlaceDetails(found.mapboxId, signal);
  if (signal?.aborted) return;
  return details ? mergePlace(merged, details) : merged;
};
