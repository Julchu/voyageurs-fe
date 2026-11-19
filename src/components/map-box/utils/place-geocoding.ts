import type { TargetFeature } from "mapbox-gl";
import type {
  Coordinates,
  Place,
  PlaceDetails,
  PlacePhoto,
} from "@/utils/interfaces";
import { normalizePlaceName } from "@/utils/place-name";
import type {
  MapboxMetadata,
  MapboxPlaceRecord,
  MapboxSearchFeature,
  MapboxSearchResponse,
  MapboxSuggestion,
} from "@/types/mapbox";

/* Mapbox place lookups:
 * - Address bar: Search Box /suggest while typing, then /retrieve on pick.
 * - Map POI click: the click only has a name and coordinates. resolveMapboxPlace
 *   fills in the rest from the Places API (by POI id) or a Search Box /forward
 *   result with the same name nearby.
 */

export type SearchSuggestion = {
  mapboxId: string;
  name: string;
  featureType: string;
  streetAddress: string;
  areaAddress: string;
  category: string;
};

type SearchOptions = {
  limit?: number;
  /** Comma-separated feature types; defaults to broad search. */
  types?: string;
  proximity?: Coordinates;
  signal?: AbortSignal;
};

/** One billed session groups `/suggest` calls with the `/retrieve` that ends it. */
type SessionOptions = { sessionToken: string; signal?: AbortSignal };

// ---------------------------------------------------------------- requests

type Params = Record<string, string | number | undefined>;

const mapboxGet = async <T>(
  path: string,
  params: Params,
  signal?: AbortSignal,
): Promise<T> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error("Mapbox token is missing");

  const url = new URL(path, "https://api.mapbox.com");
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params))
    if (value !== undefined) url.searchParams.set(key, String(value));

  const response = await fetch(url, { signal });
  if (!response.ok)
    throw new Error(`Mapbox request failed (${response.status})`);
  return response.json() as Promise<T>;
};

const searchParams = ({ limit = 5, types, proximity }: SearchOptions) => ({
  limit,
  types,
  proximity: proximity && `${proximity.lng},${proximity.lat}`,
});

// ----------------------------------------------------------------- parsing

const isWebUrl = (url: string) => {
  const lower = url.toLowerCase();
  return lower.startsWith("https://") || lower.startsWith("http://");
};

/** Web photos from Mapbox metadata, primary first, without repeats. */
const photosFrom = (metadata?: MapboxMetadata): PlacePhoto[] => {
  if (!metadata) return [];
  const primary = metadata.primary_photo ?? [];
  const candidates = [
    ...(Array.isArray(primary) ? primary : [primary]),
    ...(metadata.photos ?? []),
  ];

  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const photo =
      typeof candidate === "string" ? { url: candidate } : candidate;
    if (!photo.url || !isWebUrl(photo.url) || seen.has(photo.url)) return [];
    seen.add(photo.url);
    return [{ url: photo.url, width: photo.width, height: photo.height }];
  });
};

const detailsFrom = (metadata?: MapboxMetadata): PlaceDetails | undefined => {
  const { website, phone, opening_hours } = metadata ?? {};
  const openingHours =
    typeof opening_hours === "string" ? opening_hours : undefined;
  if (!website && !phone && openingHours === undefined) return;
  return { website, phone, openingHours, photos: [] };
};

const isCoordinate = (value?: number): value is number =>
  Number.isFinite(value);

/** Joins non-empty parts, skipping repeats that differ only by case. */
const joinAddress = (parts: (string | undefined)[], separator = ", ") => {
  const unique = new Map<string, string>();
  for (const part of parts) {
    const value = part?.trim();
    if (value) unique.set(value.toLowerCase(), value);
  }
  return [...unique.values()].join(separator);
};

const suggestionFrom = (item: MapboxSuggestion): SearchSuggestion | null => {
  if (!item.mapbox_id || !item.name) return null;
  return {
    mapboxId: item.mapbox_id,
    name: item.name_preferred ?? item.name,
    featureType: item.feature_type ?? "",
    streetAddress: item.address ?? "",
    areaAddress: item.place_formatted ?? "",
    category: item.poi_category_ids?.[0] ?? item.poi_category?.[0] ?? "",
  };
};

const placeFromSearch = (feature: MapboxSearchFeature): Place | null => {
  const props = feature.properties;
  const lng =
    props?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const lat =
    props?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const name = props?.name_preferred ?? props?.name;
  if (!name || typeof lng !== "number" || typeof lat !== "number") return null;

  const placeDetails = detailsFrom(props?.metadata);
  return {
    mapboxId: props?.mapbox_id,
    name,
    category:
      props?.poi_category_ids?.[0] ??
      props?.poi_category?.[0] ??
      props?.feature_type ??
      "",
    streetAddress:
      props?.address ??
      props?.context?.address?.name ??
      props?.context?.street?.name ??
      "",
    areaAddress: props?.place_formatted ?? "",
    coordinates: { lat, lng },
    photos: photosFrom(props?.metadata),
    // POIs still need Places API photos and details when opened.
    placeInfoLoaded: !isPoiId(props?.mapbox_id),
    ...(placeDetails && { placeDetails }),
  };
};

const placeFromRecord = (
  record: MapboxPlaceRecord,
  id: string,
): Place | undefined => {
  const lat = record.coordinates?.latitude;
  const lng = record.coordinates?.longitude;
  if (!record.name || !isCoordinate(lat) || !isCoordinate(lng)) return;

  const { address } = record;
  const photos = photosFrom({ photos: record.photos });
  return {
    mapboxId: record.mapbox_id ?? id,
    name: record.name,
    coordinates: { lat, lng },
    streetAddress:
      address?.address_line_1?.trim() ||
      joinAddress([address?.address_number, address?.street_name], " "),
    areaAddress: joinAddress([
      address?.locality,
      address?.city,
      address?.postcode,
    ]),
    category: record.primary_category || record.categories?.[0] || "",
    photos,
    placeInfoLoaded: true,
    placeDetails: {
      ...(record.website && { website: record.website }),
      ...(record.phone && { phone: record.phone }),
      ...(record.opening_hours && { openingHours: record.opening_hours }),
      permanentlyClosed: record.permanently_closed ?? null,
      popularity: record.score?.popularity ?? null,
      photos,
    },
  };
};

// -------------------------------------------------------------- Search Box

export const createSearchBoxSessionToken = (): string => crypto.randomUUID();

/** Address bar type-ahead. Suggestions have no coordinates until retrieved. */
export const searchBoxSuggest = async (
  query: string,
  { sessionToken, signal, ...options }: SessionOptions & SearchOptions,
): Promise<SearchSuggestion[]> => {
  const q = query.trim();
  if (!q || !sessionToken) return [];
  const body = await mapboxGet<{ suggestions?: MapboxSuggestion[] }>(
    "/search/searchbox/v1/suggest",
    { q, session_token: sessionToken, ...searchParams(options) },
    signal,
  );
  return (body.suggestions ?? []).flatMap((item) => suggestionFrom(item) ?? []);
};

/** The full place for a suggestion, in the same session as its `/suggest` calls. */
export const searchBoxRetrieve = async (
  mapboxId: string,
  {
    sessionToken,
    signal,
    attributeSets = ["photos"],
  }: SessionOptions & { attributeSets?: ("photos" | "visit" | "venue")[] },
): Promise<Place | null> => {
  if (!mapboxId || !sessionToken) return null;
  try {
    const body = await mapboxGet<MapboxSearchResponse>(
      `/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
      { session_token: sessionToken, attribute_sets: attributeSets.join(",") },
      signal,
    );
    const feature = body.features?.[0];
    return feature ? placeFromSearch(feature) : null;
  } catch {
    return null;
  }
};

/** `/forward` (text) or `/reverse` (coordinates). Empty on any failure. */
const searchBoxPlaces = async (
  endpoint: "forward" | "reverse",
  params: Params,
  signal?: AbortSignal,
): Promise<Place[]> => {
  try {
    const body = await mapboxGet<MapboxSearchResponse>(
      `/search/searchbox/v1/${endpoint}`,
      params,
      signal,
    );
    return (body.features ?? []).flatMap(
      (feature) => placeFromSearch(feature) ?? [],
    );
  } catch {
    return [];
  }
};

// -------------------------------------------------------------- Places API

/** Places API POI ids: "urn:mbxpoi:…", or that urn in base64 ("dXJuOm1ieHBvaTo…"). */
const isPoiId = (id?: string): id is string =>
  !!id && (id.startsWith("urn:mbxpoi:") || id.startsWith("dXJuOm1ieHBvaTo"));

/** The full POI record. Undefined for other ids or on any failure (preview access, quota, network). */
const fetchPlaceDetails = async (
  mapboxId: string,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  if (!isPoiId(mapboxId) || signal?.aborted) return;
  // The endpoint takes the base64 form, without "=" padding.
  const id = mapboxId.startsWith("urn:")
    ? btoa(mapboxId).replaceAll("=", "")
    : mapboxId;
  try {
    const record = await mapboxGet<MapboxPlaceRecord>(
      `/places/v1/details/retrieve/${encodeURIComponent(id)}`,
      {},
      signal,
    );
    return signal?.aborted ? undefined : placeFromRecord(record, id);
  } catch {
    return;
  }
};

// -------------------------------------------------------------- POI clicks

/**
 * A partial place from a map POI/landmark click. The click only has a name,
 * class and coordinates; resolveMapboxPlace fills in the rest.
 */
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

const metersBetween = (a: Coordinates, b: Coordinates) => {
  const toRadians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRadians;
  const dLng = (b.lng - a.lng) * toRadians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRadians) *
      Math.cos(b.lat * toRadians) *
      Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
};

/**
 * The Search Box result for a clicked POI: the same id, or else the closest
 * one within 1 km with the same name. Never by distance alone, so a
 * neighbouring business can't lend its photos. Falls back to just the address.
 */
const findClickedPlace = async (
  place: Pick<Place, "name" | "coordinates" | "mapboxId">,
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
  if (sameId) return sameId;

  const name = normalizePlaceName(place.name);
  const closest = candidates
    .filter((candidate) => normalizePlaceName(candidate.name) === name)
    .map((candidate) => ({
      candidate,
      meters: metersBetween(place.coordinates, candidate.coordinates),
    }))
    .filter(({ meters }) => meters <= 1000)
    .sort((a, b) => a.meters - b.meters)[0];
  if (closest) return closest.candidate;

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
