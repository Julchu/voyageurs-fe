import type { Coordinates, Place, PlacePhoto } from "@/utils/interfaces";
import type {
  ForwardOptions,
  PlaceDetails,
  RetrieveOptions,
  SearchSuggestion,
  SuggestOptions,
} from "@/components/map-box/utils/place-geocoding";

/* Google Maps Platform adapter — a drop-in mirror of `place-geocoding.ts`.
 *
 * Same inputs/outputs as the Mapbox adapter (`Place`, `SearchSuggestion`,
 * `PlaceDetails`), so components can swap imports without other changes. The
 * Google `placeId` is carried in the existing `mapboxId` field as an opaque
 * provider id. All network calls go through `/api/google/*` so the key and the
 * cost-controlling field masks stay server-side.
 *
 * Flows:
 * - Address bar type-ahead: Autocomplete (New) + Details (shared sessionToken)
 * - Map POI click enrichment: Text Search (New) biased to the clicked point
 * - "See more details": Details (New) with the richer field-mask tier
 */

/** Billed Autocomplete session; reuse the same token on the matching retrieve. */
export const createGoogleSessionToken = (): string => crypto.randomUUID();

const isAbort = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

const circleBias = (center: Coordinates, radius: number) => ({
  circle: {
    center: { latitude: center.lat, longitude: center.lng },
    radius,
  },
});

/** Photo SKU is billed per upstream fetch — never mint more URLs than the card shows. */
const MAX_PHOTOS = 6;

/** Our photo proxy URL — pass it to `next/image` as `src`. */
const photoUrl = (name: string, width = 800): string =>
  `/api/google/photo?name=${encodeURIComponent(name)}&w=${width}`;

// --- Google response shapes (only the fields the field masks return) ---------

type GooglePhoto = { name?: string; widthPx?: number; heightPx?: number };
type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};
type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  addressComponents?: GoogleAddressComponent[];
  types?: string[];
  primaryTypeDisplayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  photos?: GooglePhoto[];
};

const photosFrom = (photos?: GooglePhoto[]): PlacePhoto[] =>
  (photos ?? [])
    .flatMap((photo) =>
      photo.name
        ? [
            {
              url: photoUrl(photo.name),
              width: photo.widthPx,
              height: photo.heightPx,
            },
          ]
        : [],
    )
    .slice(0, MAX_PHOTOS);

const componentText = (
  components: GoogleAddressComponent[] | undefined,
  type: string,
): string | undefined =>
  components?.find((component) => component.types?.includes(type))?.longText;

/**
 * Split a Google place into the app's street vs area address lines, mirroring
 * Mapbox's `address` / `place_formatted` split.
 */
const splitAddress = (
  place: GooglePlace,
): { streetAddress: string; areaAddress: string } => {
  const components = place.addressComponents;
  const number = componentText(components, "street_number");
  const route = componentText(components, "route");
  const street = [number, route].filter(Boolean).join(" ");

  const area = [
    componentText(components, "locality") ??
      componentText(components, "postal_town") ??
      componentText(components, "administrative_area_level_2"),
    componentText(components, "administrative_area_level_1"),
    componentText(components, "country"),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    streetAddress:
      street || place.shortFormattedAddress || place.formattedAddress || "",
    areaAddress: area || "",
  };
};

const placeFromGoogle = (place: GooglePlace): Place | null => {
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lng = place.location?.longitude;
  if (!name || typeof lat !== "number" || typeof lng !== "number") return null;

  const { streetAddress, areaAddress } = splitAddress(place);
  return {
    mapboxId: place.id,
    name,
    category: place.primaryTypeDisplayName?.text ?? place.types?.[0] ?? "",
    streetAddress,
    areaAddress,
    coordinates: { lat, lng },
    photos: photosFrom(place.photos),
    placeInfoLoaded: true,
  };
};

// --- Autocomplete (type-ahead) ----------------------------------------------

type AutocompleteResponse = {
  suggestions?: {
    placePrediction?: {
      placeId?: string;
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
      types?: string[];
    };
  }[];
};

/** Autocomplete dropdown: Places Autocomplete (New). */
export const googleSuggest = async (
  query: string,
  options: SuggestOptions,
): Promise<SearchSuggestion[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 1 || !options.sessionToken) return [];

  const payload = {
    input: trimmed,
    sessionToken: options.sessionToken,
    ...(options.proximity
      ? { locationBias: circleBias(options.proximity, 50000) }
      : {}),
  };

  try {
    const response = await fetch("/api/google/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: options.signal,
    });
    if (!response.ok) return [];
    const body = (await response.json()) as AutocompleteResponse;
    const limit = options.limit ?? 5;
    return (body.suggestions ?? [])
      .flatMap((item) => {
        const prediction = item.placePrediction;
        if (!prediction?.placeId) return [];
        const main = prediction.structuredFormat?.mainText?.text;
        const name = main ?? prediction.text?.text;
        if (!name) return [];
        return [
          {
            mapboxId: prediction.placeId,
            name,
            featureType: prediction.types?.[0] ?? "",
            streetAddress: "",
            areaAddress: prediction.structuredFormat?.secondaryText?.text ?? "",
            category: prediction.types?.[0] ?? "",
          } satisfies SearchSuggestion,
        ];
      })
      .slice(0, limit);
  } catch (error) {
    if (isAbort(error)) return [];
    return [];
  }
};

// --- Retrieve a suggestion / fetch a place by id ----------------------------

const fetchGooglePlace = async (
  placeId: string,
  params: { tier?: "basic" | "full"; sessionToken?: string },
  signal?: AbortSignal,
): Promise<GooglePlace | null> => {
  const query = new URLSearchParams();
  if (params.tier) query.set("tier", params.tier);
  if (params.sessionToken) query.set("sessionToken", params.sessionToken);
  const suffix = query.toString() ? `?${query}` : "";

  const response = await fetch(
    `/api/google/details/${encodeURIComponent(placeId)}${suffix}`,
    { signal },
  );
  if (!response.ok) return null;
  return (await response.json()) as GooglePlace;
};

/**
 * Resolve a `googleSuggest` hit to a full `Place`. Pass the same `sessionToken`
 * used for the autocomplete calls so Google bills it as one session.
 */
export const googleRetrieve = async (
  placeId: string,
  options: Partial<RetrieveOptions> = {},
): Promise<Place | null> => {
  if (!placeId) return null;
  try {
    const place = await fetchGooglePlace(
      placeId,
      { tier: "basic", sessionToken: options.sessionToken },
      options.signal,
    );
    return place ? placeFromGoogle(place) : null;
  } catch (error) {
    if (isAbort(error)) return null;
    return null;
  }
};

// --- Text search (address bar forward) --------------------------------------

type TextSearchResponse = { places?: GooglePlace[] };

/** Meters between two points; enough to rank nearby Text Search hits. */
const metersBetween = (a: Coordinates, b: Coordinates) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const lat = toRad(b.lat - a.lat);
  const lng = toRad(b.lng - a.lng) * Math.cos(toRad((a.lat + b.lat) / 2));
  return Math.hypot(lat, lng) * 6_371_000;
};

const textSearch = async (
  textQuery: string,
  params: {
    proximity?: Coordinates;
    radius?: number;
    maxResultCount?: number;
    signal?: AbortSignal;
  },
): Promise<Place[]> => {
  const trimmed = textQuery.trim();
  if (trimmed.length < 1) return [];

  const payload = {
    textQuery: trimmed,
    maxResultCount: params.maxResultCount ?? 5,
    ...(params.proximity
      ? { locationBias: circleBias(params.proximity, params.radius ?? 50000) }
      : {}),
  };

  try {
    const response = await fetch("/api/google/text-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: params.signal,
    });
    if (!response.ok) return [];
    const body = (await response.json()) as TextSearchResponse;
    return (body.places ?? []).flatMap((place) => {
      const mapped = placeFromGoogle(place);
      return mapped ? [mapped] : [];
    });
  } catch (error) {
    if (isAbort(error)) return [];
    return [];
  }
};

/** Text search (address bar): Text Search (New). */
export const googleForward = async (
  query: string,
  options: ForwardOptions = {},
): Promise<Place[]> =>
  textSearch(query, {
    proximity: options.proximity,
    maxResultCount: options.limit ?? 5,
    signal: options.signal,
  });

/**
 * Enrich a map POI/landmark click (name + coordinates from the Mapbox
 * featureset) with a Google place id, address, and photos.
 *
 * Text Search only allows a circle on `locationBias` (preference), not on
 * `locationRestriction` (hard box, rectangle only). Bias the name search, then
 * keep the hit closest to the click. Name/category stay on the Mapbox featureset.
 */
export const googleEnrichPlace = async (
  place: Pick<Place, "name" | "coordinates">,
  signal?: AbortSignal,
): Promise<Partial<Place> | undefined> => {
  const matches = await textSearch(place.name, {
    proximity: place.coordinates,
    radius: 500,
    maxResultCount: 5,
    signal,
  });
  const match = matches.reduce<Place | undefined>((closest, candidate) => {
    if (!closest) return candidate;
    return metersBetween(place.coordinates, candidate.coordinates) <
      metersBetween(place.coordinates, closest.coordinates)
      ? candidate
      : closest;
  }, undefined);
  if (!match) return;
  return {
    mapboxId: match.mapboxId,
    streetAddress: match.streetAddress,
    areaAddress: match.areaAddress,
    category: match.category,
    photos: match.photos,
    placeInfoLoaded: true,
  };
};

const hasGooglePlaceId = (place: Place) =>
  Boolean(place.mapboxId && !place.mapboxId.startsWith("urn:"));

export const needsGooglePlaceLookup = (place: Place): boolean =>
  !hasGooglePlaceId(place) ||
  !(
    place.placeInfoLoaded ||
    (place.streetAddress && place.category && place.photos !== undefined)
  );

/** Resolve legacy Mapbox records by name; a Google id alone isn't cached data. */
export const googleResolvePlace = async (
  place: Place,
  signal?: AbortSignal,
): Promise<Place | undefined> => {
  const enriched = hasGooglePlaceId(place)
    ? await googleRetrieve(place.mapboxId!, { signal })
    : await googleEnrichPlace(place, signal);
  if (!enriched?.mapboxId || signal?.aborted) return;
  return {
    ...place,
    mapboxId: enriched.mapboxId,
    streetAddress: enriched.streetAddress || place.streetAddress,
    areaAddress: enriched.areaAddress || place.areaAddress,
    category: enriched.category || place.category,
    photos: enriched.photos ?? place.photos,
    placeInfoLoaded: true,
  };
};

// --- Lazy "see more" details ------------------------------------------------

type GoogleDetailsResponse = GooglePlace & {
  websiteUri?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  businessStatus?: string;
};

/**
 * Lazily fetch the richer Places Details record (contact, hours, status).
 * Called on demand (e.g. a "See more" action), not during search, so the
 * pricier field-mask tier isn't spent on every result.
 */
export const fetchGooglePlaceDetails = async (
  placeId: string,
  signal?: AbortSignal,
): Promise<PlaceDetails | undefined> => {
  if (!placeId) return;
  try {
    const place = (await fetchGooglePlace(
      placeId,
      { tier: "full" },
      signal,
    )) as GoogleDetailsResponse | null;
    if (!place) return;
    return {
      website: place.websiteUri,
      phone: place.nationalPhoneNumber ?? place.internationalPhoneNumber,
      openingHours: place.regularOpeningHours?.weekdayDescriptions?.join("\n"),
      popularity: null,
      permanentlyClosed: place.businessStatus === "CLOSED_PERMANENTLY",
      photos: photosFrom(place.photos),
    };
  } catch (error) {
    if (isAbort(error)) return;
    return;
  }
};
