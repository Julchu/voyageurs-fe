import type { TargetFeature } from "mapbox-gl";
import type { Coordinates, Place, PlacePhoto } from "@/utils/interfaces";
import type {
  MapboxMetadata,
  MapboxPlaceRecord,
  MapboxSearchFeature,
  MapboxSearchResponse,
  MapboxSuggestion,
} from "@/types/mapbox";

export type { PlaceDetails } from "@/utils/interfaces";

/* Current flows:
 * - Address bar type-ahead: Search Box /suggest + /retrieve (session_token)
 * - Map POI click enrichment: Search Box /forward (+ address-only /reverse fallback)
 * - Selected POI enrichment: Places API /places/v1/details/retrieve/{mapbox_id}
 * - Photos: /retrieve attribute_sets=photos, or metadata returned by /forward
 * */

/** UUID v4 for grouping `/suggest` and `/retrieve` into one billed session. */
export const createSearchBoxSessionToken = (): string => crypto.randomUUID();

/**
 * Build a partial Place from a Standard-style featureset click (POI/landmark).
 *
 * The featureset only exposes name/class/coordinates — no address, photos, or
 * Search Box `mapbox_id`. Those are filled in afterwards by `enrichPlace()`.
 */
export const placeFromFeature = (feature: TargetFeature): Place | null => {
  const { id, geometry, properties } = feature;
  if (geometry.type !== "Point") return null;
  const lng = geometry.coordinates[0];
  const lat = geometry.coordinates[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const name = properties?.name_en || properties?.name;
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

const mapboxRequest = async <T>(
  path: string,
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<T> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error("Mapbox token is missing");
  const url = new URL(path, "https://api.mapbox.com");
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok)
    throw new Error(`Mapbox request failed (${response.status})`);
  return response.json() as Promise<T>;
};

const photosFromMetadata = (metadata?: MapboxMetadata): PlacePhoto[] => {
  if (!metadata) return [];
  const primary = metadata.primary_photo;
  const candidates = [
    ...(Array.isArray(primary) ? primary : primary ? [primary] : []),
    ...(metadata.photos ?? []),
  ];
  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const photo =
      typeof candidate === "string" ? { url: candidate } : candidate;
    if (!photo.url || !/^https?:\/\//i.test(photo.url) || seen.has(photo.url))
      return [];
    seen.add(photo.url);
    return [{ url: photo.url, width: photo.width, height: photo.height }];
  });
};

const placeFromForwardFeature = (
  feature: MapboxSearchFeature,
): Place | null => {
  const props = feature.properties;
  const lng =
    props?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const lat =
    props?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const name = props?.name_preferred ?? props?.name;
  if (!name || typeof lng !== "number" || typeof lat !== "number") return null;

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
    photos: photosFromMetadata(props?.metadata),
    // POI previews still need Places API photos and details when opened.
    placeInfoLoaded: !isPlacesPoiId(props?.mapbox_id),
    ...(props?.metadata?.website ||
    props?.metadata?.phone ||
    typeof props?.metadata?.opening_hours === "string"
      ? {
          placeDetails: {
            website: props.metadata.website,
            phone: props.metadata.phone,
            openingHours:
              typeof props.metadata.opening_hours === "string"
                ? props.metadata.opening_hours
                : undefined,
            photos: [],
          },
        }
      : {}),
  };
};

export type BaseForwardOptions = {
  limit?: number;
  /** Comma-separated feature types; defaults to broad search. */
  types?: string;
  signal?: AbortSignal;
};

export type ForwardOptions = BaseForwardOptions & {
  proximity?: Coordinates;
  /** Enable fuzzy/partial matches for type-ahead search. */
  autocomplete?: boolean;
};

export type SearchSuggestion = {
  mapboxId: string;
  name: string;
  featureType: string;
  streetAddress: string;
  areaAddress: string;
  category: string;
};

const suggestionFromApi = (item: MapboxSuggestion): SearchSuggestion | null => {
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

export type SuggestOptions = BaseForwardOptions & {
  sessionToken: string;
  proximity?: Coordinates;
};

/** Autocomplete dropdown: Search Box `/suggest` (no coordinates until `/retrieve`). */
export const searchBoxSuggest = async (
  query: string,
  options: SuggestOptions,
): Promise<SearchSuggestion[]> => {
  const trimmed = query.trim();
  if (!trimmed || !options.sessionToken) return [];
  const body = await mapboxRequest<{ suggestions?: MapboxSuggestion[] }>(
    "/search/searchbox/v1/suggest",
    {
      q: trimmed,
      session_token: options.sessionToken,
      ...searchParams(options),
    },
    options.signal,
  );
  return (body.suggestions ?? []).flatMap((item) => {
    const suggestion = suggestionFromApi(item);
    return suggestion ? [suggestion] : [];
  });
};

export type RetrieveOptions = {
  sessionToken: string;
  attributeSets?: ("photos" | "visit" | "venue")[];
  signal?: AbortSignal;
};

/**
 * Resolve a `/suggest` hit to a full `Place` (coordinates, photos, etc.).
 * Must use the same `session_token` as the preceding `/suggest` calls in the session.
 */
export const searchBoxRetrieve = async (
  mapboxId: string,
  options: RetrieveOptions,
): Promise<Place | null> => {
  if (!mapboxId || !options.sessionToken) return null;
  try {
    const body = await mapboxRequest<MapboxSearchResponse>(
      `/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
      {
        session_token: options.sessionToken,
        attribute_sets: (options.attributeSets ?? ["photos"]).join(","),
      },
      options.signal,
    );
    const feature = body.features?.[0];
    return feature ? placeFromForwardFeature(feature) : null;
  } catch {
    return null;
  }
};

const searchParams = (options: ForwardOptions) => ({
  limit: options.limit ?? 5,
  types: options.types,
  proximity: options.proximity
    ? `${options.proximity.lng},${options.proximity.lat}`
    : undefined,
});

const searchBoxPlaces = async (
  endpoint: "forward" | "reverse",
  params: Record<string, string | number | undefined>,
  signal?: AbortSignal,
): Promise<Place[]> => {
  try {
    const body = await mapboxRequest<MapboxSearchResponse>(
      `/search/searchbox/v1/${endpoint}`,
      params,
      signal,
    );
    return (body.features ?? []).flatMap((feature) => {
      const place = placeFromForwardFeature(feature);
      return place ? [place] : [];
    });
  } catch {
    return [];
  }
};

/** Text search (address bar): Search Box `/forward`. */
export const searchBoxForward = async (
  query: string,
  options: ForwardOptions = {},
): Promise<Place[]> => {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return searchBoxPlaces(
    "forward",
    {
      q: trimmed,
      exclude_fields: "reviews",
      auto_complete: options.autocomplete ? "true" : undefined,
      ...searchParams(options),
    },
    options.signal,
  );
};

/** Coordinate lookup (map POI click): Search Box `/reverse`. */
export const searchBoxReverse = async (
  coordinates: Coordinates,
  options: BaseForwardOptions = {},
): Promise<Place[]> => {
  return searchBoxPlaces(
    "reverse",
    {
      longitude: coordinates.lng,
      latitude: coordinates.lat,
      ...searchParams(options),
    },
    options.signal,
  );
};

const enrichableFieldsFromMatch = (match: Place): Partial<Place> => ({
  mapboxId: match.mapboxId,
  streetAddress: match.streetAddress,
  areaAddress: match.areaAddress,
  photos: match.photos,
  placeDetails: match.placeDetails,
  ...(match.category ? { category: match.category } : {}),
});

const isPlacesPoiId = (id?: string): id is string =>
  Boolean(
    id && (id.startsWith("urn:mbxpoi:") || id.startsWith("dXJuOm1ieHBvaTo")),
  );

/** New Places API: full POI record, including available photos by default. */
export const fetchMapboxPlace = async (
  mapboxId: string,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  // Address/administrative and Google IDs are not valid Places POI IDs.
  if (!isPlacesPoiId(mapboxId) || signal?.aborted) return;
  const id = mapboxId.startsWith("urn:")
    ? btoa(mapboxId).replace(/=+$/, "")
    : mapboxId;
  try {
    const body = await mapboxRequest<MapboxPlaceRecord>(
      `/places/v1/details/retrieve/${encodeURIComponent(id)}`,
      {},
      signal,
    );

    const lat = body.coordinates?.latitude;
    const lng = body.coordinates?.longitude;
    if (
      !body.name ||
      typeof lat !== "number" ||
      typeof lng !== "number" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      signal?.aborted
    )
      return;

    const address = body.address;
    const streetAddress =
      address?.address_line_1?.trim() ||
      joinAddress([address?.address_number, address?.street_name], " ");
    const areaAddress = joinAddress([
      address?.locality,
      address?.city,
      address?.postcode,
    ]);
    const photos = photosFromMetadata({ photos: body.photos });
    return {
      mapboxId: body.mapbox_id ?? id,
      name: body.name,
      coordinates: { lat, lng },
      streetAddress,
      areaAddress,
      category: body.primary_category || body.categories?.[0] || "",
      photos,
      placeInfoLoaded: true,
      placeDetails: {
        ...(body.website ? { website: body.website } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
        ...(body.opening_hours ? { openingHours: body.opening_hours } : {}),
        permanentlyClosed: body.permanently_closed ?? null,
        popularity: body.score?.popularity ?? null,
        photos,
      },
    };
  } catch {
    // Preview access, quota, and network failures retain the Search Box result.
    return;
  }
};

const joinAddress = (parts: (string | undefined)[], separator = ", ") => {
  const unique = new Map<string, string>();
  for (const part of parts) {
    const value = part?.trim();
    if (value) unique.set(value.toLowerCase(), value);
  }
  return [...unique.values()].join(separator);
};

const withPlacesRecord = (place: Place, record: Partial<Place>): Place => ({
  ...place,
  mapboxId: record.mapboxId ?? place.mapboxId,
  streetAddress: record.streetAddress || place.streetAddress,
  areaAddress: record.areaAddress || place.areaAddress,
  category: record.category || place.category,
  photos: record.photos?.length ? record.photos : place.photos,
  placeDetails: {
    ...place.placeDetails,
    ...record.placeDetails,
    photos: record.photos ?? [],
  },
  placeInfoLoaded: true,
});

/**
 * Enrich a POI/landmark featureset click with address + photos + `mapbox_id`.
 *
 * Match by name and proximity, never by proximity alone. Reverse geocoding is
 * only an address fallback; a neighboring business must not supply its photos.
 */
export const enrichPlace = async (
  place: Pick<Place, "name" | "coordinates" | "mapboxId">,
  signal?: AbortSignal,
): Promise<Partial<Place> | undefined> => {
  const normalize = (name: string) =>
    name
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]/gu, "");
  const target = normalize(place.name);
  const candidates = await searchBoxForward(place.name, {
    proximity: place.coordinates,
    limit: 5,
    signal,
  });
  if (signal?.aborted) return;

  let match: Place | undefined;
  let closestDistance = 1000;
  for (const candidate of candidates) {
    if (place.mapboxId && candidate.mapboxId === place.mapboxId) {
      match = candidate;
      break;
    }
    if (normalize(candidate.name) !== target) continue;
    const distance = distanceMeters(place.coordinates, candidate.coordinates);
    if (distance <= closestDistance) {
      match = candidate;
      closestDistance = distance;
    }
  }
  if (match) return enrichableFieldsFromMatch(match);

  const [address] = await searchBoxReverse(place.coordinates, {
    limit: 1,
    types: "address",
    signal,
  });
  if (signal?.aborted || !address) return;
  return {
    streetAddress: address.streetAddress,
    areaAddress: address.areaAddress,
    photos: [],
  };
};

const distanceMeters = (a: Coordinates, b: Coordinates) => {
  const radians = Math.PI / 180;
  const dLat = (b.lat - a.lat) * radians;
  const dLng = (b.lng - a.lng) * radians;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * radians) *
      Math.cos(b.lat * radians) *
      Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(Math.min(1, h)));
};

/** Strip display-only fields. Persisting the remaining Mapbox data still requires storage rights. */
export const placeRecord = (place: Place): Place => ({
  id: place.id,
  mapboxId: place.mapboxId,
  name: place.name,
  category: place.category,
  streetAddress: place.streetAddress,
  areaAddress: place.areaAddress,
  coordinates: place.coordinates,
});

export const resolveMapboxPlace = async (
  place: Place,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  if (signal?.aborted) return;
  if (place.placeInfoLoaded) return place;
  // Resolve a known POI directly before attempting a name/address fallback.
  if (isPlacesPoiId(place.mapboxId)) {
    const record = await fetchMapboxPlace(place.mapboxId, signal);
    if (signal?.aborted) return;
    if (record) return withPlacesRecord(place, record);
  }
  const fields = await enrichPlace(place, signal);
  if (!fields || signal?.aborted) return;
  const next = withPlacesRecord(place, fields);
  if (!isPlacesPoiId(fields.mapboxId) || fields.mapboxId === place.mapboxId)
    return next;
  const record = await fetchMapboxPlace(fields.mapboxId, signal);
  if (signal?.aborted) return;
  return record ? withPlacesRecord(next, record) : next;
};
