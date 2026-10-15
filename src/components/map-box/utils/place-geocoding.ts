import type { GeoJSONFeature } from "mapbox-gl";
import {
  Coordinates,
  Place,
  PlaceDetails,
  PlacePhoto,
} from "@/utils/interfaces";

/* Current flows:
 * - Address bar type-ahead: Search Box /suggest + /retrieve (session_token)
 * - Map POI click enrichment: Search Box /reverse (+ /forward fallback)
 * - “See more details”: Places …/places/v1/details/retrieve/{mapbox_id}
 * */

/** UUID v4 for grouping `/suggest` and `/retrieve` into one billed session. */
export const createSearchBoxSessionToken = (): string => crypto.randomUUID();

type MapFeature = GeoJSONFeature & {
  geometry: { type: string; coordinates: number[] };
  properties?: Record<string, unknown> | null;
  id: number;
};

const readFeature = (feature: GeoJSONFeature) => feature as MapFeature;

const getFeatureProperty = (
  feature: GeoJSONFeature,
  key: string,
): string | undefined => {
  const value = readFeature(feature).properties?.[key];
  return value == null ? undefined : String(value);
};

/**
 * Build a partial Place from a Standard-style featureset click (POI/landmark).
 *
 * The featureset only exposes name/class/coordinates — no address, photos, or
 * Search Box `mapbox_id`. Those are filled in afterwards by `enrichPlace()`.
 */
export const placeFromFeature = (feature: GeoJSONFeature): Place | null => {
  const id = readFeature(feature).id;
  const category = getFeatureProperty(feature, "class") ?? "";
  const geometry = readFeature(feature).geometry;
  if (geometry.type !== "Point") return null;
  const lng = geometry.coordinates[0];
  const lat = geometry.coordinates[1];
  if (typeof lng !== "number" || typeof lat !== "number") return null;

  const name =
    getFeatureProperty(feature, "name_en") ||
    getFeatureProperty(feature, "name");
  if (!name) return null;

  return {
    id,
    name,
    category,
    streetAddress: "",
    areaAddress: "",
    coordinates: { lat, lng },
  };
};

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

// Shape of a Search Box search feature (forward/reverse; only the fields we read).
type ForwardMetadata = {
  primary_photo?: string;
  photos?: { url?: string; width?: number | null; height?: number | null }[];
};

type ForwardFeature = {
  properties?: {
    mapbox_id?: string;
    name?: string;
    name_preferred?: string;
    feature_type?: string;
    address?: string;
    place_formatted?: string;
    maki?: string;
    poi_category?: string[];
    coordinates?: { longitude?: number; latitude?: number };
    metadata?: ForwardMetadata;
  } | null;
  geometry?: { coordinates?: number[] };
};

type ForwardResponse = { features?: ForwardFeature[] };

const photosFromMetadata = (metadata?: ForwardMetadata): PlacePhoto[] => {
  if (!metadata) return [];
  const mapped: PlacePhoto[] = (metadata.photos ?? []).flatMap((photo) =>
    photo.url
      ? [{ url: photo.url, width: photo.width, height: photo.height }]
      : [],
  );
  // Surface the primary photo first if it isn't already in the list.
  const primary = metadata.primary_photo;
  if (primary && !mapped.some((photo) => photo.url === primary)) {
    mapped.unshift({ url: primary });
  }
  return mapped;
};

const placeFromForwardFeature = (feature: ForwardFeature): Place | null => {
  const props = feature.properties;
  const lng =
    props?.coordinates?.longitude ?? feature.geometry?.coordinates?.[0];
  const lat =
    props?.coordinates?.latitude ?? feature.geometry?.coordinates?.[1];
  const name = props?.name_preferred ?? props?.name;
  if (!name || typeof lng !== "number" || typeof lat !== "number") return null;

  // Only POI features carry a Places-compatible `mapbox_id` (`urn:mbxpoi:…`) and
  // a real `poi_category`. Address/other feature types use a different id scheme
  // that the Places Details endpoint rejects with 422, and only expose a generic
  // `maki` icon (e.g. "marker") — so don't surface either for non-POIs.
  const isPoi = props?.feature_type === "poi";

  return {
    mapboxId: isPoi ? props?.mapbox_id : undefined,
    name,
    category: props?.poi_category?.[0] ?? "",
    streetAddress: props?.address ?? "",
    areaAddress: props?.place_formatted ?? "",
    coordinates: { lat, lng },
    photos: photosFromMetadata(props?.metadata),
  };
};

type PlacesDetailsResponse = {
  website?: string;
  phone?: string;
  opening_hours?: string | null;
  permanently_closed?: boolean | null;
  score?: { popularity?: number | null };
  photos?: { url?: string; width?: number | null; height?: number | null }[];
};

/** Rich, on-demand detail fields from the Places API Details endpoint. */
export type { PlaceDetails } from "@/utils/interfaces";

/**
 * Lazily fetch the full Places API record for a place.
 *
 * Called on demand (e.g. a "See more" action), not during search, so its
 * preview-tier quota isn't spent on every result. Requires a Places-compatible
 * `mapbox_id` — which `enrichPlace` / `searchBoxForward` already provide.
 */
export const fetchPlaceDetails = async (
  mapboxId: string,
  signal?: AbortSignal,
): Promise<PlaceDetails | undefined> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || !mapboxId) return;

  const url = new URL(
    `https://api.mapbox.com/places/v1/details/retrieve/${encodeURIComponent(mapboxId)}`,
  );
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(url, signal ? { signal } : undefined);
    if (!response.ok) return;
    const body = (await response.json()) as PlacesDetailsResponse;
    return {
      website: body.website,
      phone: body.phone,
      openingHours: body.opening_hours ?? undefined,
      popularity: body.score?.popularity ?? null,
      permanentlyClosed: body.permanently_closed ?? null,
      photos: (body.photos ?? []).flatMap((photo) =>
        photo.url
          ? [{ url: photo.url, width: photo.width, height: photo.height }]
          : [],
      ),
    };
  } catch (error) {
    if (isAbort(error)) return;
    return;
  }
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

type SuggestItem = {
  mapbox_id?: string;
  name?: string;
  name_preferred?: string;
  feature_type?: string;
  address?: string;
  place_formatted?: string;
  poi_category?: string[];
};

type SuggestResponse = { suggestions?: SuggestItem[] };

const suggestionFromApi = (item: SuggestItem): SearchSuggestion | null => {
  if (!item.mapbox_id || !item.name) return null;
  return {
    mapboxId: item.mapbox_id,
    name: item.name_preferred ?? item.name,
    featureType: item.feature_type ?? "",
    streetAddress: item.address ?? "",
    areaAddress: item.place_formatted ?? "",
    category: item.poi_category?.[0] ?? "",
  };
};

export type SuggestOptions = {
  sessionToken: string;
  proximity?: Coordinates;
  limit?: number;
  types?: string;
  signal?: AbortSignal;
};

/** Autocomplete dropdown: Search Box `/suggest` (no coordinates until `/retrieve`). */
export const searchBoxSuggest = async (
  query: string,
  options: SuggestOptions,
): Promise<SearchSuggestion[]> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const trimmed = query.trim();
  if (!token || trimmed.length < 1 || !options.sessionToken) return [];

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("session_token", options.sessionToken);
  url.searchParams.set("limit", String(options.limit ?? 5));
  if (options.types) url.searchParams.set("types", options.types);
  if (options.proximity) {
    url.searchParams.set(
      "proximity",
      `${options.proximity.lng},${options.proximity.lat}`,
    );
  }
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(
      url,
      options.signal ? { signal: options.signal } : undefined,
    );
    if (!response.ok) return [];
    const body = (await response.json()) as SuggestResponse;
    return (body.suggestions ?? []).flatMap((item) => {
      const suggestion = suggestionFromApi(item);
      return suggestion ? [suggestion] : [];
    });
  } catch (error) {
    if (isAbort(error)) return [];
    return [];
  }
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
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token || !mapboxId || !options.sessionToken) return null;

  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
  );
  url.searchParams.set("session_token", options.sessionToken);
  if (options.attributeSets?.length) {
    url.searchParams.set("attribute_sets", options.attributeSets.join(","));
  }
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(
      url,
      options.signal ? { signal: options.signal } : undefined,
    );
    if (!response.ok) return null;
    const body = (await response.json()) as ForwardResponse;
    console.log("test retrieving photos", body);
    const feature = body.features?.[0];
    if (!feature) return null;
    return placeFromForwardFeature(feature);
  } catch (error) {
    if (isAbort(error)) return null;
    return null;
  }
};

/** Text search (address bar): Search Box `/forward`. */
export const searchBoxForward = async (
  query: string,
  options: ForwardOptions = {},
): Promise<Place[]> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const trimmed = query.trim();
  if (!token || trimmed.length < 1) return [];

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/forward");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", String(options.limit ?? 5));
  if (options.autocomplete) url.searchParams.set("auto_complete", "true");
  if (options.types) url.searchParams.set("types", options.types);
  if (options.proximity) {
    url.searchParams.set(
      "proximity",
      `${options.proximity.lng},${options.proximity.lat}`,
    );
  }
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(
      url,
      options.signal ? { signal: options.signal } : undefined,
    );
    if (!response.ok) return [];
    const body = (await response.json()) as ForwardResponse;
    return (body.features ?? []).flatMap((feature) => {
      const place = placeFromForwardFeature(feature);
      return place ? [place] : [];
    });
  } catch (error) {
    if (isAbort(error)) return [];
    return [];
  }
};

/** Coordinate lookup (map POI click): Search Box `/reverse`. */
export const searchBoxReverse = async (
  coordinates: Coordinates,
  options: BaseForwardOptions = {},
): Promise<Place[]> => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return [];

  const url = new URL("https://api.mapbox.com/search/searchbox/v1/reverse");
  url.searchParams.set("longitude", String(coordinates.lng));
  url.searchParams.set("latitude", String(coordinates.lat));

  url.searchParams.set("limit", String(options.limit ?? 5));
  if (options.types) url.searchParams.set("types", options.types);
  url.searchParams.set("access_token", token);

  try {
    const response = await fetch(
      url,
      options.signal ? { signal: options.signal } : undefined,
    );
    if (!response.ok) return [];
    const body = (await response.json()) as ForwardResponse;
    return (body.features ?? []).flatMap((feature) => {
      const place = placeFromForwardFeature(feature);
      return place ? [place] : [];
    });
  } catch (error) {
    if (isAbort(error)) return [];
    return [];
  }
};

const enrichableFieldsFromMatch = (match: Place): Partial<Place> => ({
  mapboxId: match.mapboxId,
  streetAddress: match.streetAddress,
  areaAddress: match.areaAddress,
  photos: match.photos,
  ...(match.category ? { category: match.category } : {}),
});

/**
 * Enrich a POI/landmark featureset click with address + photos + `mapbox_id`.
 *
 * `/reverse` returns the features at the click point ordered with the enclosing
 * address first, so a `limit: 1` lookup yields an address (wrong category, and a
 * `mapbox_id` the Places Details endpoint rejects with 422). Request several
 * results and keep the POI that matches the clicked feature, falling back to a
 * name + proximity `/forward` search when reverse surfaces no POI.
 */
export const enrichPlace = async (
  place: Pick<Place, "name" | "coordinates">,
  signal?: AbortSignal,
): Promise<Partial<Place> | undefined> => {
  const target = place.name.trim().toLowerCase();
  // Only POI matches carry a `mapboxId` (see `placeFromForwardFeature`); prefer
  // the one whose name matches the clicked feature, else any POI in the results.
  const pickPoi = (candidates: Place[]): Place | undefined =>
    candidates.find(
      (candidate) =>
        candidate.mapboxId && candidate.name.trim().toLowerCase() === target,
    ) ?? candidates.find((candidate) => candidate.mapboxId);

  let match = pickPoi(
    await searchBoxReverse(place.coordinates, {
      limit: 10,
      types: "poi",
      signal,
    }),
  );
  match ??= pickPoi(
    await searchBoxForward(place.name, {
      proximity: place.coordinates,
      limit: 5,
      types: "poi",
      signal,
    }),
  );

  if (!match) return;
  return enrichableFieldsFromMatch(match);
};
